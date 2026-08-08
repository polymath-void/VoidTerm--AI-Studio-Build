use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;
use tokio::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use crate::IpcMessage;

// Configuration and thread-safe singleton state
lazy_static::lazy_static! {
    static ref BUFFER: Arc<Mutex<String>> = Arc::new(Mutex::new(String::new()));
    static ref LAST_ERROR_DETECTED: Arc<Mutex<Option<Instant>>> = Arc::new(Mutex::new(None));
    static ref AI_RUNNING: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

#[derive(Serialize, Deserialize)]
struct GeminiPart {
    text: String,
}

#[derive(Serialize, Deserialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Serialize, Deserialize)]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
}

#[derive(Serialize, Deserialize)]
struct GeminiCandidatePart {
    text: String,
}

#[derive(Serialize, Deserialize)]
struct GeminiCandidateContent {
    parts: Vec<GeminiCandidatePart>,
}

#[derive(Serialize, Deserialize)]
struct GeminiCandidate {
    content: GeminiCandidateContent,
}

#[derive(Serialize, Deserialize)]
struct GeminiResponse {
    candidates: Option<Vec<GeminiCandidate>>,
}

pub struct AiOrchestrator;

impl AiOrchestrator {
    /// Feeds stdout/stderr chunk into the AI buffer and scans for failures
    pub fn feed_output(text: &str, tx_output: mpsc::Sender<IpcMessage>) {
        let mut buffer = BUFFER.lock().unwrap();
        buffer.push_str(text);

        // Cap buffer to last 4000 chars to avoid memory bloat
        if buffer.len() > 4000 {
            let drain_idx = buffer.len() - 4000;
            *buffer = buffer[drain_idx..].to_string();
        }

        // Detect potential terminal run errors / panics / exceptions
        let lower = text.to_lowercase();
        let error_indicators = [
            "error:",
            "panic!",
            "exception",
            "failed",
            "traceback (most recent call last)",
            "command not found",
            "unhandled rejection",
        ];

        let has_error = error_indicators.iter().any(|&ind| lower.contains(ind));
        if has_error {
            let mut last_err = LAST_ERROR_DETECTED.lock().unwrap();
            let now = Instant::now();
            let is_first_trigger = last_err.is_none();
            *last_err = Some(now);

            if is_first_trigger {
                // Spawn a task to monitor quiet period (no new error or output for 1200ms)
                // this indicates the tool finished printing and is idle
                let tx_clone = tx_output.clone();
                tokio::spawn(async move {
                    tokio::time::sleep(Duration::from_millis(1200)).await;
                    
                    let should_trigger = {
                        let last_err_time = LAST_ERROR_DETECTED.lock().unwrap();
                        match *last_err_time {
                            Some(t) => t.elapsed() >= Duration::from_millis(1200),
                            None => false,
                        }
                    };

                    if should_trigger {
                        // Reset last error
                        {
                            let mut last_err_time = LAST_ERROR_DETECTED.lock().unwrap();
                            *last_err_time = None;
                        }

                        // Check if AI analysis is already running to avoid duplicate triggers
                        let is_running = {
                            let mut running = AI_RUNNING.lock().unwrap();
                            if *running {
                                true
                            } else {
                                *running = true;
                                false
                            }
                        };

                        if !is_running {
                            let error_context = {
                                let buf = BUFFER.lock().unwrap();
                                // Take last 1500 chars for prompt context
                                let len = buf.len();
                                if len > 1500 {
                                    buf[len - 1500..].to_string()
                                } else {
                                    buf.clone()
                                }
                            };

                            // Spawn the async HTTP call to Gemini API
                            let tx_inner = tx_clone.clone();
                            tokio::spawn(async move {
                                if let Err(e) = Self::analyze_error_and_suggest(&error_context, tx_inner).await {
                                    eprintln!("❌ [AI Orchestrator Error]: {}", e);
                                }
                                let mut running = AI_RUNNING.lock().unwrap();
                                *running = false;
                            });
                        }
                    }
                });
            }
        }
    }

    /// Calls Gemini API to get a high-quality suggestion and streams it back to the UI
    async fn analyze_error_and_suggest(context: &str, tx_output: mpsc::Sender<IpcMessage>) -> anyhow::Result<()> {
        let api_key = match std::env::var("GEMINI_API_KEY") {
            Ok(key) if !key.is_empty() => key,
            _ => {
                // Local static fallback analysis if no internet/API key is present
                tokio::time::sleep(Duration::from_millis(300)).await;
                let fallback = "\n\u001b[36m💡 [VoidTerm Offline AI Suggestion] ──────────────────\u001b[0m\n\u001b[32mPossible solution: Verify command syntax, binary path, or package installation.\u001b[0m\n\u001b[36m─────────────────────────────────────────────────────────\u001b[0m\n";
                let _ = tx_output.send(IpcMessage::TerminalOutput(fallback.to_string())).await;
                return Ok(());
            }
        };

        // Stream initial pending status to terminal UI
        let _ = tx_output.send(IpcMessage::TerminalOutput("\n\u001b[93m🧠 VoidTerm AI: Analyzing error context...\u001b[0m\n".to_string())).await;

        let client = reqwest::Client::new();
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
            api_key
        );

        let system_prompt = "You are VoidTerm AI, a helpful shell assistant. The user's android terminal command has crashed or printed an error. Analyze the error output, diagnose the root cause, and provide a single concise 2-line suggested action in clean text. No markdown formatting. Keep it short and highly actionable.";
        let full_prompt = format!("{}\n\nError output:\n{}", system_prompt, context);

        let req_body = GeminiRequest {
            contents: vec![GeminiContent {
                parts: vec![GeminiPart { text: full_prompt }],
            }],
        };

        let response = client
            .post(&url)
            .json(&req_body)
            .send()
            .await?;

        if !response.status().is_success() {
            let err_text = response.text().await?;
            anyhow::bail!("Gemini API responded with status {}: {}", err_text, err_text);
        }

        let resp_body: GeminiResponse = response.json().await?;
        let suggestion = if let Some(candidates) = resp_body.candidates {
            if let Some(candidate) = candidates.get(0) {
                if let Some(part) = candidate.content.parts.get(0) {
                    part.text.trim().to_string()
                } else {
                    "Unable to extract suggested fix parts.".to_string()
                }
            } else {
                "No suggestion candidates returned.".to_string()
            }
        } else {
            "No candidates found in Gemini response.".to_string()
        };

        // Format suggestion beautifully with ANSI escape codes
        let formatted_suggestion = format!(
            "\n\u001b[36m💡 [VoidTerm AI Suggestion] ───────────────────────────\u001b[0m\n\u001b[32m{}\u001b[0m\n\u001b[36m─────────────────────────────────────────────────────────\u001b[0m\n",
            suggestion
        );

        let _ = tx_output.send(IpcMessage::TerminalOutput(formatted_suggestion)).await;
        Ok(())
    }
}
