mod local_pty;
mod vm_bridge;
mod wasm_engine;
mod ai_orchestrator;

use local_pty::LocalPty;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use vm_bridge::VmBridge;
use wasm_engine::WasmEngine;

// Default AVF Guest VM Context ID and Port
const DEFAULT_VM_CID: u32 = 3;
const VM_VSOCK_PORT: u32 = 8000;

#[derive(Debug, Serialize, Deserialize)]
pub enum IpcMessage {
    ExecuteLocal { command: String },
    ExecuteWasm { module_name: String, args: Vec<String> },
    ExecuteVm { command: String },
    TerminalOutput(String),
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    println!("🚀 VoidTerm Hybrid IPC Broker initialized.");

    let (tx_output, mut rx_output) = mpsc::channel::<IpcMessage>(1024);
    let (_tx_input, mut rx_input) = mpsc::channel::<IpcMessage>(1024);

    let local_shell = match LocalPty::start(tx_output.clone()) {
        Ok(pty) => Some(pty),
        Err(e) => {
            eprintln!("❌ [Local PTY Error]: {}", e);
            None
        }
    };

    println!("📡 Listening for cross-environment multiplexing...");

    loop {
        tokio::select! {
            // 1. Ingress UI Commands Routing
            Some(input_msg) = rx_input.recv() => {
                match input_msg {
                    IpcMessage::ExecuteLocal { command } => {
                        if let Some(ref pty) = local_shell {
                            if let Err(e) = pty.write_command(&command) {
                                let err_msg = format!("❌ [PTY Error]: {}\n", e);
                                let _ = tx_output.send(IpcMessage::TerminalOutput(err_msg)).await;
                            }
                        }
                    }
                    IpcMessage::ExecuteWasm { module_name, args } => {
                        let tx_clone = tx_output.clone();
                        tokio::spawn(async move {
                            if let Err(e) = WasmEngine::execute(module_name, args, tx_clone.clone()).await {
                                let err_msg = format!("❌ [WASM Error]: {}\n", e);
                                let _ = tx_clone.send(IpcMessage::TerminalOutput(err_msg)).await;
                            }
                        });
                    }
                    IpcMessage::ExecuteVm { command } => {
                        let tx_clone = tx_output.clone();
                        tokio::spawn(async move {
                            if let Err(e) = VmBridge::dispatch_command(
                                command, 
                                DEFAULT_VM_CID, 
                                VM_VSOCK_PORT, 
                                tx_clone.clone()
                            ).await {
                                let err_msg = format!("❌ [VM Vsock Error]: {}\n", e);
                                let _ = tx_clone.send(IpcMessage::TerminalOutput(err_msg)).await;
                            }
                        });
                    }
                    _ => {}
                }
            }

            // 2. Terminal Output Multiplexer Channel
            Some(output_msg) = rx_output.recv() => {
                if let IpcMessage::TerminalOutput(text) = output_msg {
                    ai_orchestrator::AiOrchestrator::feed_output(&text, tx_output.clone());
                    print!("{}", text);
                }
            }

            // 3. Signal Handling
            _ = tokio::signal::ctrl_c() => {
                println!("\n🛑 Shutting down IPC Broker daemon.");
                break;
            }
        }
    }

    Ok(())
}
