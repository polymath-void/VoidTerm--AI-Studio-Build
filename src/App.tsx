import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Cpu, 
  Activity, 
  Play, 
  Smartphone, 
  Wand2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Palette
} from 'lucide-react';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'system' | 'ai' | 'error';
}

export default function App() {
  // Terminal simulator state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { text: "⚡ System: Booting AVF MicroVM sandbox...", type: 'system' },
    { text: "✅ System: Guest Linux VM is online (CID 3).", type: 'system' },
    { text: "VoidTerm Android Shell Terminal - v1.0.0-production", type: 'output' },
    { text: "Type 'help' to view system command suites or trigger a demo.", type: 'output' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Architecture panel active tab
  const [activeTab, setActiveTab] = useState<'ansi' | 'avf' | 'ai' | 'lifecycle'>('ansi');

  // Theme support
  const [theme, setTheme] = useState<'monochrome' | 'solarized' | 'retro'>('monochrome');

  // Command history support
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');

  // Real-time systems polling state
  const [cpuLoad, setCpuLoad] = useState<number>(14.5);
  const [ramUsage, setRamUsage] = useState<number>(42.1);
  const [statsSource, setStatsSource] = useState<string>('guest-vm-ipc-broker');

  // Interval-based opacity toggle for blink animation
  const [blinkVisible, setBlinkVisible] = useState(true);

  // Line copy confirmation hooks
  const [copiedLineIdx, setCopiedLineIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // ANSI Demo interactive state
  const [ansiText, setAnsiText] = useState('\\u001b[32m[SUCCESS]\\u001b[0m App built in \\u001b[1;33m1200ms\\u001b[0m or test SGR 5 blink \\u001b[5;31m[CRITICAL ATTEMPT]\\u001b[0m');
  const [parsedSpans, setParsedSpans] = useState<{ text: string; color: string; isBold: boolean; isBlink?: boolean }[]>([]);

  // AVF Interactive boot steps
  const [avfBooting, setAvfBooting] = useState(false);
  const [avfStep, setAvfStep] = useState(0);

  // AI sandbox state
  const [aiInputError, setAiInputError] = useState('java.lang.NullPointerException: Attempt to invoke virtual method on a null object reference at com.hybridengine.terminal.MainActivity.kt:42');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // PTY process simulation state
  const [ptyConnected] = useState(true);
  const [backgroundPaused, setBackgroundPaused] = useState(false);

  // Theme specific style variables
  const themeStyles = {
    monochrome: {
      bg: 'bg-[#0E0E0E]',
      text: 'text-[#E0E0E0]',
      inputText: 'text-[#FFFFFF]',
      border: 'border-[#1C1C1C]',
      promptColor: 'text-[#BA68C8]',
      inputBg: 'bg-transparent',
      ansiDefault: '#E0E0E0',
      terminalInnerBg: '#0E0E0E',
      ansiMap: {
        30: '#1C1C1C', 31: '#E57373', 32: '#81C784', 33: '#FFD54F', 
        34: '#64B5F6', 35: '#BA68C8', 36: '#4DD0E1', 37: '#E0E0E0',
        90: '#757575', 91: '#FF8A80', 92: '#B9F6CA', 93: '#FFE082',
        94: '#82B1FF', 95: '#F8BBD0', 96: '#A7FFEB', 97: '#FFFFFF'
      }
    },
    solarized: {
      bg: 'bg-[#002B36]',
      text: 'text-[#839496]',
      inputText: 'text-[#93A1A1]',
      border: 'border-[#073642]',
      promptColor: 'text-[#268BD2]',
      inputBg: 'bg-[#073642]/40',
      ansiDefault: '#839496',
      terminalInnerBg: '#002B36',
      ansiMap: {
        30: '#073642', 31: '#DC322F', 32: '#859900', 33: '#B58900', 
        34: '#268BD2', 35: '#D33682', 36: '#2AA198', 37: '#EEE8D5',
        90: '#586E75', 91: '#CB4B16', 92: '#859900', 93: '#B58900',
        94: '#268BD2', 95: '#D33682', 96: '#2AA198', 97: '#FDF6E3'
      }
    },
    retro: {
      bg: 'bg-[#120900]',
      text: 'text-[#FFB300]',
      inputText: 'text-[#FFD54F]',
      border: 'border-[#3E1F00]',
      promptColor: 'text-[#FF8F00]',
      inputBg: 'bg-[#211100]/50',
      ansiDefault: '#FFB300',
      terminalInnerBg: '#120900',
      ansiMap: {
        30: '#2A1400', 31: '#FF3D00', 32: '#FFD54F', 33: '#FFE082', 
        34: '#FFB300', 35: '#FF8F00', 36: '#FFC107', 37: '#FFE082',
        90: '#5D3300', 91: '#FF5722', 92: '#FFE082', 93: '#FFD54F',
        94: '#FFB300', 95: '#FF9100', 96: '#FFA000', 97: '#FFF8E1'
      }
    }
  };

  // Scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  // Parse ANSI codes on current ansiText or theme change
  useEffect(() => {
    parseAnsi(ansiText);
  }, [ansiText, theme]);

  // Poll CPU and RAM stats from Node.js backend (/api/vm-stats)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/vm-stats');
        const data = await res.json();
        if (data && typeof data.cpu === 'number') setCpuLoad(data.cpu);
        if (data && typeof data.ram === 'number') setRamUsage(data.ram);
        if (data && data.source) setStatsSource(data.source);
      } catch (err) {
        // dynamic local simulation fallback
        setCpuLoad(prev => Math.min(99, Math.max(5, +(prev + (Math.random() - 0.5) * 4).toFixed(1))));
        setRamUsage(prev => Math.min(99, Math.max(10, +(prev + (Math.random() - 0.5) * 1).toFixed(1))));
      }
    };

    fetchStats();
    const statsInterval = setInterval(fetchStats, 2000);
    return () => clearInterval(statsInterval);
  }, []);

  // Set interval for SGR 5 blink text toggle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkVisible(prev => !prev);
    }, 600);
    return () => clearInterval(blinkInterval);
  }, []);

  // Helper to parse ANSI simulation in React, supporting SGR 5 (blink) and 25 (blink off)
  const parseAnsi = (raw: string) => {
    const result: { text: string; color: string; isBold: boolean; isBlink?: boolean }[] = [];
    let clean = raw.replace(/\\u001b/g, '\u001b').replace(/\\e/g, '\u001b');
    
    const activeThemeStyles = themeStyles[theme];
    let activeColor = activeThemeStyles.ansiDefault;
    let activeBold = false;
    let activeBlink = false;
    
    let i = 0;
    let currentChunk = '';
    
    while (i < clean.length) {
      if (clean[i] === '\u001b' && clean[i+1] === '[') {
        if (currentChunk) {
          result.push({ text: currentChunk, color: activeColor, isBold: activeBold, isBlink: activeBlink });
          currentChunk = '';
        }
        i += 2;
        let csiParams = '';
        while (i < clean.length && !(clean[i] >= 'a' && clean[i] <= 'z' || clean[i] >= 'A' && clean[i] <= 'Z')) {
          csiParams += clean[i];
          i++;
        }
        const cmd = clean[i];
        if (cmd === 'm') {
          const codes = csiParams.split(';');
          for (const codeStr of codes) {
            const code = parseInt(codeStr) || 0;
            if (code === 0) {
              activeColor = activeThemeStyles.ansiDefault;
              activeBold = false;
              activeBlink = false;
            } else if (code === 1) {
              activeBold = true;
            } else if (code === 5) {
              activeBlink = true;
            } else if (code === 22) {
              activeBold = false;
            } else if (code === 25) {
              activeBlink = false;
            } else {
              const mappedColor = (activeThemeStyles.ansiMap as any)[code];
              if (mappedColor) {
                activeColor = mappedColor;
              }
            }
          }
        }
      } else {
        currentChunk += clean[i];
      }
      i++;
    }
    if (currentChunk) {
      result.push({ text: currentChunk, color: activeColor, isBold: activeBold, isBlink: activeBlink });
    }
    setParsedSpans(result);
  };

  // Clipboard copy handlers
  const copyLineToClipboard = (text: string, idx: number) => {
    const cleanText = text.replace(/^user@voidterm:~\$\s*/, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedLineIdx(idx);
    setTimeout(() => setCopiedLineIdx(null), 1500);
  };

  const copyAllLines = () => {
    const allText = terminalLines.map(line => line.text).join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  // Handles commands in the simulated terminal
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const command = currentInput.trim();
    if (!command) return;

    // Record in history, ignoring exact consecutive repeats
    setCommandHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === command) return prev;
      return [...prev, command];
    });
    setHistoryIndex(-1);
    setSavedInput('');

    const newLines = [...terminalLines, { text: `user@voidterm:~$ ${command}`, type: 'input' as const }];
    setTerminalLines(newLines);
    setCurrentInput('');

    // Simulate different terminal commands
    setTimeout(() => {
      processCommand(command, newLines);
    }, 150);
  };

  // Arrow up and down navigation inside terminal input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      
      let nextIdx = historyIndex;
      if (historyIndex === -1) {
        setSavedInput(currentInput);
        nextIdx = commandHistory.length - 1;
      } else if (historyIndex > 0) {
        nextIdx = historyIndex - 1;
      }
      
      setHistoryIndex(nextIdx);
      setCurrentInput(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      
      if (historyIndex === commandHistory.length - 1) {
        setHistoryIndex(-1);
        setCurrentInput(savedInput);
      } else {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setCurrentInput(commandHistory[nextIdx]);
      }
    }
  };

  const processCommand = async (cmd: string, current: TerminalLine[]) => {
    const parts = cmd.toLowerCase().split(' ');
    const baseCmd = parts[0];

    let output: TerminalLine[] = [];

    switch (baseCmd) {
      case 'help':
        output = [
          { text: "📂 Available VoidTerm Developer CLI Commands:", type: 'system' },
          { text: "  help          - View this contextual command reference", type: 'output' },
          { text: "  avf boot      - Trigger reflection-based pKVM boot cycle", type: 'output' },
          { text: "  wasm run      - Execute standard WebAssembly container task", type: 'output' },
          { text: "  pty status    - Display stateful /system/bin/sh shell bounds", type: 'output' },
          { text: "  ai status     - Query AI error daemon pipeline buffer", type: 'output' },
          { text: "  trigger-error - Inject crash log to test the AI Orchestrator", type: 'output' },
          { text: "  clear         - Wipe standard rendering screen", type: 'output' },
        ];
        break;

      case 'clear':
        setTerminalLines([]);
        return;

      case 'avf':
        if (parts[1] === 'boot') {
          setTerminalLines(prev => [
            ...prev,
            { text: "⚡ AVF: Initializing android.system.virtualmachine reflection loader...", type: 'system' },
            { text: "⚡ AVF: Loading build config payload: 'guest_daemon'...", type: 'system' },
            { text: "✅ AVF Success: Guest microVM is online at CID 3 over vsock hypervisor.", type: 'system' },
          ]);
          return;
        } else {
          output = [{ text: "Usage: avf boot", type: 'error' }];
        }
        break;

      case 'wasm':
        if (parts[1] === 'run') {
          output = [
            { text: "🚀 WasmEdge: Instantiating zero-latency host sandbox...", type: 'system' },
            { text: "🚀 WasmEdge: Capability checks pass for battery, sensor, & files.", type: 'system' },
            { text: "✨ Result: 42 (Executed in 2ms on bare Android Bionic)", type: 'system' },
          ];
        } else {
          output = [{ text: "Usage: wasm run", type: 'error' }];
        }
        break;

      case 'pty':
        if (parts[1] === 'status') {
          output = [
            { text: "📡 Local PTY Core bounds: STATEFUL", type: 'system' },
            { text: "  Terminal shell: /system/bin/sh (Bionic executable)", type: 'output' },
            { text: `  Daemon bridge: ${ptyConnected ? 'CONNECTED' : 'DISCONNECTED'}`, type: 'output' },
            { text: `  App layout state: ${backgroundPaused ? 'PAUSED (BG)' : 'ACTIVE (FG)'}`, type: 'output' },
            { text: "  ANSI rendering buffer: 60 FPS Canvas thread active", type: 'output' },
          ];
        } else {
          output = [{ text: "Usage: pty status", type: 'error' }];
        }
        break;

      case 'ai':
        if (parts[1] === 'status') {
          output = [
            { text: "🧠 AI Orchestrator Daemon Status:", type: 'system' },
            { text: "  Process listener: Tokio mpsc active", type: 'output' },
            { text: "  Error hooks: Scans stdout/stderr asynchronously", type: 'output' },
            { text: "  Quiet period limit: 1200ms debounce buffer", type: 'output' },
            { text: "  Diagnostic model: gemini-2.5-flash with local fallback", type: 'output' },
          ];
        } else {
          output = [{ text: "Usage: ai status", type: 'error' }];
        }
        break;

      case 'trigger-error':
        setTerminalLines(prev => [
          ...prev,
          { text: "rustc compile error: unresolved import `crate::pty::NativePty`", type: 'error' },
          { text: "--> src/main.rs:18:5", type: 'error' },
          { text: "18 | use crate::pty::NativePty;", type: 'error' },
          { text: "   |     ^^^^^^^^^^^^^^^^^^^^ no `NativePty` in `pty`", type: 'error' },
          { text: "\n🧠 VoidTerm AI: Analyzing error context...", type: 'system' }
        ]);
        
        // Trigger live server-side AI call
        triggerAiSuggestion("rustc compile error: unresolved import `crate::pty::NativePty` in src/main.rs:18:5", true);
        return;

      default:
        // Assume standard bash syntax fallback error
        setTerminalLines(prev => [
          ...prev,
          { text: `sh: command not found: ${cmd}`, type: 'error' },
          { text: "\n🧠 VoidTerm AI: Analyzing error context...", type: 'system' }
        ]);
        triggerAiSuggestion(`sh: command not found: ${cmd}`, true);
        return;
    }

    setTerminalLines(prev => [...prev, ...output]);
  };

  const triggerAiSuggestion = async (errorMsg: string, appendToTerm: boolean) => {
    setAiLoading(true);
    setAiSuggestion(null);

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorOutput: errorMsg })
      });
      const data = await res.json();
      const text = data.suggestion || "Ensure appropriate rust module imports are declared.";
      
      setAiSuggestion(text);
      
      if (appendToTerm) {
        setTerminalLines(prev => [
          ...prev,
          { text: "💡 [VoidTerm AI Suggestion] ───────────────────────────", type: 'ai' },
          { text: text, type: 'ai' },
          { text: "─────────────────────────────────────────────────────────", type: 'ai' }
        ]);
      }
    } catch (err) {
      const offlineSuggestion = "Verify file paths, binary target, or package exports.";
      setAiSuggestion(offlineSuggestion);
      if (appendToTerm) {
        setTerminalLines(prev => [
          ...prev,
          { text: "💡 [VoidTerm AI Suggestion] ───────────────────────────", type: 'ai' },
          { text: offlineSuggestion, type: 'ai' },
          { text: "─────────────────────────────────────────────────────────", type: 'ai' }
        ]);
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Run AVF reflection simulation step by step
  const runAvfSimulation = () => {
    setAvfBooting(true);
    setAvfStep(1);

    const timer1 = setTimeout(() => setAvfStep(2), 1000);
    const timer2 = setTimeout(() => setAvfStep(3), 2200);
    const timer3 = setTimeout(() => setAvfStep(4), 3500);
    const timer4 = setTimeout(() => {
      setAvfStep(5);
      setAvfBooting(false);
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* 1. Header Bar with precise alignment and no slop features */}
      <header className="border-b border-[#1C1C1C] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-[#141414] border border-[#222] rounded-md text-[#4DD0E1]">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#FFFFFF] font-mono">
                VOIDTERM <span className="text-[#81C784] text-sm font-normal">SHELL ENGINE</span>
              </h1>
              <p className="text-xs text-[#757575] font-mono mt-0.5">
                Target: Android API 34 (pKVM Hardware Isolated)
              </p>
            </div>
          </div>
        </div>

        {/* Real-time systems checklist */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 bg-[#141414] border border-[#222] rounded flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#81C784] animate-pulse"></span>
            <span className="text-[#9E9E9E]">PTY Daemon:</span>
            <span className="text-[#E0E0E0]">Online (CID 2)</span>
          </div>
          <div className="px-3 py-1.5 bg-[#141414] border border-[#222] rounded flex items-center gap-2" title={`Polled from guest VM /proc/stat via IPC broker. Source: ${statsSource}`}>
            <span className="w-2 h-2 rounded-full bg-[#4DD0E1] animate-pulse"></span>
            <span className="text-[#9E9E9E]">VM CPU:</span>
            <span className="text-[#E0E0E0]">{cpuLoad}%</span>
          </div>
          <div className="px-3 py-1.5 bg-[#141414] border border-[#222] rounded flex items-center gap-2" title={`Polled from guest VM /proc/meminfo via IPC broker. Source: ${statsSource}`}>
            <span className="w-2 h-2 rounded-full bg-[#BA68C8] animate-pulse"></span>
            <span className="text-[#9E9E9E]">VM RAM:</span>
            <span className="text-[#E0E0E0]">{ramUsage}%</span>
          </div>
          <div className="px-3 py-1.5 bg-[#141414] border border-[#222] rounded flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#81C784]"></span>
            <span className="text-[#9E9E9E]">JNI Thread:</span>
            <span className="text-[#E0E0E0]">Active (16ms)</span>
          </div>
        </div>
      </header>

      {/* 2. Primary layout grid splitting terminal and priority modules */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Simulated Android Device with Terminal Canvas */}
        <section className={`lg:col-span-7 flex flex-col border ${themeStyles[theme].border} ${themeStyles[theme].bg} rounded-xl overflow-hidden shadow-2xl h-[580px] transition-colors duration-300`}>
          {/* Simulated Mobile Frame Header */}
          <div className="bg-[#141414] border-b border-[#1C1C1C] px-4 py-3 flex justify-between items-center text-xs font-mono">
            <div className="flex items-center gap-2 text-[#757575]">
              <Smartphone className="w-4 h-4 text-[#4DD0E1]" />
              <span>Pixel 8 Pro — Terminal SurfaceView Thread</span>
            </div>
            <div className="flex items-center gap-3 text-[#757575]">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${backgroundPaused ? 'bg-[#FF8A80]' : 'bg-[#81C784]'}`}></span>
                {backgroundPaused ? 'Background' : '60 FPS'}
              </span>
              <span>100% Battery</span>
            </div>
          </div>

          {/* Theme & Session Control Bar */}
          <div className="bg-[#101010] border-b border-[#1C1C1C] px-4 py-2 flex flex-wrap justify-between items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#757575] flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                Theme:
              </span>
              <div className="flex bg-[#1A1A1A] rounded p-0.5 border border-[#2A2A2A]">
                <button
                  onClick={() => setTheme('monochrome')}
                  className={`px-2.5 py-1 rounded transition text-[10px] ${theme === 'monochrome' ? 'bg-[#2E2E2E] text-[#FFFFFF] font-bold' : 'text-[#757575] hover:text-[#E0E0E0]'}`}
                >
                  Monochrome
                </button>
                <button
                  onClick={() => setTheme('solarized')}
                  className={`px-2.5 py-1 rounded transition text-[10px] ${theme === 'solarized' ? 'bg-[#073642] text-[#859900] font-bold' : 'text-[#757575] hover:text-[#E0E0E0]'}`}
                >
                  Solarized
                </button>
                <button
                  onClick={() => setTheme('retro')}
                  className={`px-2.5 py-1 rounded transition text-[10px] ${theme === 'retro' ? 'bg-[#3E1F00] text-[#FFB300] font-bold' : 'text-[#757575] hover:text-[#E0E0E0]'}`}
                >
                  Retro Amber
                </button>
              </div>
            </div>

            <button
              onClick={copyAllLines}
              className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2D2D2D] text-white rounded text-[10px] flex items-center gap-1.5 transition"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">All Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Session</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Terminal Screen */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed flex flex-col justify-between">
            <div className="space-y-2">
              {terminalLines.map((line, idx) => {
                let textClasses = '';
                if (line.type === 'input') {
                  textClasses = themeStyles[theme].inputText;
                } else if (line.type === 'output') {
                  textClasses = themeStyles[theme].text;
                } else if (line.type === 'system') {
                  textClasses = 'text-[#4DD0E1]';
                } else if (line.type === 'error') {
                  textClasses = 'text-[#E57373]';
                } else if (line.type === 'ai') {
                  textClasses = 'text-[#81C784] bg-[#142A1E]/30 px-2 py-1 rounded border-l-2 border-[#81C784]';
                }

                // Apply custom colors overrides for specific themes
                if (theme === 'retro') {
                  if (line.type === 'input') textClasses = 'text-[#FFD54F]';
                  else if (line.type === 'output') textClasses = 'text-[#FFB300]';
                  else if (line.type === 'system') textClasses = 'text-[#FF8F00]';
                  else if (line.type === 'error') textClasses = 'text-[#FF3D00]';
                  else if (line.type === 'ai') textClasses = 'text-[#FFD54F] bg-[#3E1F00]/40 px-2 py-1 rounded border-l-2 border-[#FFB300]';
                } else if (theme === 'solarized') {
                  if (line.type === 'input') textClasses = 'text-[#93A1A1]';
                  else if (line.type === 'output') textClasses = 'text-[#839496]';
                  else if (line.type === 'system') textClasses = 'text-[#268BD2]';
                  else if (line.type === 'error') textClasses = 'text-[#DC322F]';
                  else if (line.type === 'ai') textClasses = 'text-[#859900] bg-[#073642]/60 px-2 py-1 rounded border-l-2 border-[#859900]';
                }

                return (
                  <div 
                    key={idx} 
                    className="group relative flex items-start justify-between py-0.5 rounded px-1 hover:bg-white/5 transition duration-150"
                  >
                    <div className={`font-mono text-sm leading-relaxed flex-1 ${textClasses}`}>
                      {line.text}
                    </div>
                    <button
                      onClick={() => copyLineToClipboard(line.text, idx)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition duration-150 p-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] flex items-center gap-1 font-sans ml-2"
                      title="Copy line"
                    >
                      {copiedLineIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-green-400" />
                          <span className="text-green-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>

            {/* Prompt Form */}
            <form onSubmit={handleCommandSubmit} className="mt-4 border-t border-[#1C1C1C] pt-3 flex items-center gap-2">
              <span className={`${themeStyles[theme].promptColor} font-bold`}>user@voidterm:~$</span>
              <input 
                type="text" 
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="type 'help' or traverse history using up/down keys..."
                className={`flex-1 bg-transparent border-none ${themeStyles[theme].inputText} placeholder-[#444444] focus:outline-none focus:ring-0 text-sm font-mono`}
              />
              <button 
                type="submit" 
                className="bg-[#1C1C1C] hover:bg-[#2A2A2A] text-xs font-mono px-3 py-1.5 rounded border border-[#333] transition text-white"
              >
                Execute
              </button>
            </form>
          </div>
        </section>

        {/* RIGHT COLUMN: Interactive Feature Architecture Tabs */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Tab Selector - Monochrome Minimalist Style */}
          <div className="bg-[#141414] border border-[#1C1C1C] p-1 rounded-lg flex text-xs font-mono">
            <button 
              onClick={() => setActiveTab('ansi')}
              className={`flex-1 py-2 text-center rounded transition ${activeTab === 'ansi' ? 'bg-[#1F1F1F] text-[#4DD0E1] border border-[#2D2D2D]' : 'text-[#757575] hover:text-[#E0E0E0]'}`}
            >
              1. ANSI Parser
            </button>
            <button 
              onClick={() => setActiveTab('avf')}
              className={`flex-1 py-2 text-center rounded transition ${activeTab === 'avf' ? 'bg-[#1F1F1F] text-[#4DD0E1] border border-[#2D2D2D]' : 'text-[#757575] hover:text-[#E0E0E0]'}`}
            >
              2. AVF Boot
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 text-center rounded transition ${activeTab === 'ai' ? 'bg-[#1F1F1F] text-[#4DD0E1] border border-[#2D2D2D]' : 'text-[#757575] hover:text-[#E0E0E0]'}`}
            >
              3. AI Orchestrator
            </button>
            <button 
              onClick={() => setActiveTab('lifecycle')}
              className={`flex-1 py-2 text-center rounded transition ${activeTab === 'lifecycle' ? 'bg-[#1F1F1F] text-[#4DD0E1] border border-[#2D2D2D]' : 'text-[#757575] hover:text-[#E0E0E0]'}`}
            >
              4. Lifecycle
            </button>
          </div>

          {/* Tab Content Display Area */}
          <div className="border border-[#1C1C1C] bg-[#0E0E0E] rounded-xl p-5 flex-1 flex flex-col justify-between min-h-[460px]">
            
            {/* TAB 1: ANSI SGR Parser Details */}
            {activeTab === 'ansi' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#FFFFFF] font-mono flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#4DD0E1]" />
                    ANSI SGR Parser Testbed
                  </h3>
                  <span className="text-[10px] bg-[#142A1E] text-[#81C784] border border-[#1F3E2B] px-2 py-0.5 rounded font-mono">
                    Kotlin Canvas
                  </span>
                </div>
                <p className="text-xs text-[#9E9E9E] leading-relaxed">
                  The terminal emulator parses ANSI escape sequences directly in the SurfaceView thread, transforming codes like <code className="text-xs text-[#FFE082] bg-[#1A1A1A] px-1 py-0.5 rounded">\u001b[32m</code> into custom color-mapped paint objects dynamically.
                </p>

                {/* Live Sandbox Input */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono text-[#757575]">Type escape code (try SGR 5 blink or bold colors):</label>
                    <span className="text-[10px] text-[#4DD0E1] font-mono animate-pulse">Supports SGR 5 (blink)</span>
                  </div>
                  <input 
                    type="text" 
                    value={ansiText}
                    onChange={(e) => setAnsiText(e.target.value)}
                    className="w-full bg-[#141414] border border-[#222] rounded p-2.5 text-xs text-[#81C784] font-mono focus:outline-none focus:border-[#4DD0E1]"
                  />
                </div>

                {/* Preset Fast Actions */}
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => setAnsiText('\\u001b[31m[CRITICAL ERROR] \\u001b[0mSegmentation Fault')}
                    className="text-[10px] font-mono px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded text-[#E57373] transition"
                  >
                    Error Code
                  </button>
                  <button 
                    onClick={() => setAnsiText('\\u001b[32m✔ cargo test \\u001b[1;36m[8 passed]')}
                    className="text-[10px] font-mono px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded text-[#81C784] transition"
                  >
                    Rust Build
                  </button>
                  <button 
                    onClick={() => setAnsiText('\\u001b[34m-> Connecting vsock \\u001b[1;35mHost CID 2')}
                    className="text-[10px] font-mono px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded text-[#64B5F6] transition"
                  >
                    Host Connection
                  </button>
                  <button 
                    onClick={() => setAnsiText('\\u001b[5;91m[ALERT BLINK] \\u001b[0;33mCore temperature high!')}
                    className="text-[10px] font-mono px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded text-[#FFD54F] transition font-bold"
                  >
                    Blink Sequence
                  </button>
                </div>

                {/* SurfaceView Line Parser Simulation Render Box */}
                <div className="space-y-1.5 mt-4">
                  <span className="text-[10px] font-mono text-[#757575]">SurfaceView Renderer Output:</span>
                  <div className="bg-[#050505] border border-[#181818] p-4 rounded min-h-[50px] font-mono text-sm flex items-center overflow-x-auto gap-0.5">
                    {parsedSpans.length === 0 ? (
                      <span className="text-[#444]">Buffer empty</span>
                    ) : (
                      parsedSpans.map((span, sIdx) => (
                        <span 
                          key={sIdx} 
                          style={{ 
                            color: span.color, 
                            fontWeight: span.isBold ? 'bold' : 'normal',
                            opacity: span.isBlink ? (blinkVisible ? 1 : 0.15) : 1,
                            transition: span.isBlink ? 'opacity 120ms ease-in-out' : 'none'
                          }}
                          className="whitespace-nowrap"
                        >
                          {span.text}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AVF MicroVM Provisioning */}
            {activeTab === 'avf' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#FFFFFF] font-mono flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#4DD0E1]" />
                    AVF Reflection Bootloader
                  </h3>
                  <span className="text-[10px] bg-[#142A1E] text-[#81C784] border border-[#1F3E2B] px-2 py-0.5 rounded font-mono">
                    VirtualizationService
                  </span>
                </div>
                <p className="text-xs text-[#9E9E9E] leading-relaxed">
                  We built a fully reflective loader in Kotlin <code className="text-xs text-[#FFE082] bg-[#1A1A1A] px-1 py-0.5 rounded">AvfVmProvisioner.kt</code>. Because the standard Virtualization API is flagged as a hidden <code className="text-[#FF8A80]">@SystemApi</code>, standard SDK compilers deny compilation. Reflection allows VoidTerm to bypass compiler blocks seamlessly.
                </p>

                {/* Reflection Timeline Simulator */}
                <div className="bg-[#141414] border border-[#1F1F1F] p-4 rounded space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222]">
                    <span className="text-[#81C784]">Boot Sequencer Logs:</span>
                    <button 
                      onClick={runAvfSimulation} 
                      disabled={avfBooting}
                      className="px-2.5 py-1 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333] rounded text-[10px] text-[#4DD0E1] flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      Trigger Boot
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${avfStep >= 1 ? 'bg-[#81C784]' : 'bg-[#333]'}`}></span>
                      <span className={avfStep >= 1 ? 'text-[#E0E0E0]' : 'text-[#444]'}>Get service: context.getSystemService("virtualization")</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${avfStep >= 2 ? 'bg-[#81C784]' : 'bg-[#333]'}`}></span>
                      <span className={avfStep >= 2 ? 'text-[#E0E0E0]' : 'text-[#444]'}>Reflect VirtualMachineConfig$Builder class and construct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${avfStep >= 3 ? 'bg-[#81C784]' : 'bg-[#333]'}`}></span>
                      <span className={avfStep >= 3 ? 'text-[#E0E0E0]' : 'text-[#444]'}>Invoke payload binary assignment: "guest_daemon"</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${avfStep >= 4 ? 'bg-[#81C784]' : 'bg-[#333]'}`}></span>
                      <span className={avfStep >= 4 ? 'text-[#E0E0E0]' : 'text-[#444]'}>Acquire VirtualMachine, register callback, execute run()</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      {avfStep === 5 ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#81C784]"></span>
                          <span className="text-[#81C784]">✅ VM Successfully Booted inside pKVM (CID 3)</span>
                        </>
                      ) : avfBooting ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FFE082] animate-ping"></span>
                          <span className="text-[#FFE082]">Executing boot stage...</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#333]"></span>
                          <span className="text-[#444]">Idle</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AI Orchestrator Daemon */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#FFFFFF] font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#81C784]" />
                    AI Orchestrator Diagnostic Sandbox
                  </h3>
                  <span className="text-[10px] bg-[#142630] text-[#4DD0E1] border border-[#1E3A49] px-2 py-0.5 rounded font-mono">
                    Tokio Thread
                  </span>
                </div>
                <p className="text-xs text-[#9E9E9E] leading-relaxed">
                  The Rust daemon listens continuously. When compilation or runtime command pipelines crash, it extracts the backtrace context, sends it to the server-side Gemini gateway, and injects actionable code-level resolutions back into the terminal.
                </p>

                {/* AI Diagnostic Sandbox */}
                <div className="space-y-2 mt-2">
                  <label className="text-[10px] font-mono text-[#757575]">Crash Log / Compile Error:</label>
                  <textarea 
                    value={aiInputError}
                    onChange={(e) => setAiInputError(e.target.value)}
                    rows={3}
                    className="w-full bg-[#141414] border border-[#222] rounded p-2 text-xs font-mono text-[#E57373] focus:outline-none focus:border-[#81C784]"
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => triggerAiSuggestion(aiInputError, false)}
                    disabled={aiLoading}
                    className="flex-1 py-2 bg-[#1A1A1A] hover:bg-[#222] border border-[#333] text-[#81C784] rounded font-mono text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    Generate AI Suggestion
                  </button>
                  <button 
                    onClick={() => setAiInputError('AttributeError: module \'torch\' has no attribute \'select_device\' at train.py:12')}
                    className="px-3 py-2 bg-[#141414] hover:bg-[#1A1A1A] border border-[#222] text-[#9E9E9E] rounded font-mono text-xs transition"
                  >
                    Try Python Preset
                  </button>
                </div>

                {/* AI Result View */}
                {aiSuggestion && (
                  <div className="bg-[#142A1E]/30 border border-[#1F3E2B] p-3 rounded text-xs font-mono space-y-1">
                    <span className="text-[#81C784] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      VoidTerm AI Suggestion:
                    </span>
                    <p className="text-[#E0E0E0] leading-relaxed">
                      {aiSuggestion}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Android Lifecycle States */}
            {activeTab === 'lifecycle' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#FFFFFF] font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#4DD0E1]" />
                    Lifecycle & PTY Persistence
                  </h3>
                  <span className="text-[10px] bg-[#2E161C] text-[#FF8A80] border border-[#44232B] px-2 py-0.5 rounded font-mono">
                    Activity Lifecycle
                  </span>
                </div>
                <p className="text-xs text-[#9E9E9E] leading-relaxed">
                  When the Android process is backgrounded, system resources must be saved without losing the PTY state. This prevents shell crashes.
                </p>

                {/* Simulated Switcher */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={() => {
                      setBackgroundPaused(false);
                      setTerminalLines(prev => [...prev, { text: "🔄 Lifecycle: App resumed. Connecting thread to active SurfaceView.", type: 'system' }]);
                    }}
                    className={`p-3 border rounded flex flex-col items-center gap-1.5 transition text-xs font-mono ${!backgroundPaused ? 'bg-[#142A1E]/30 border-[#81C784] text-[#81C784]' : 'bg-[#141414] border-[#222] text-[#757575] hover:text-[#E0E0E0]'}`}
                  >
                    <span>onResume()</span>
                    <span className="text-[10px] opacity-80">60 FPS Render ON</span>
                  </button>
                  <button 
                    onClick={() => {
                      setBackgroundPaused(true);
                      setTerminalLines(prev => [...prev, { text: "💤 Lifecycle: App paused. SurfaceView renderer sleeping (0% CPU). PTY state persisted.", type: 'system' }]);
                    }}
                    className={`p-3 border rounded flex flex-col items-center gap-1.5 transition text-xs font-mono ${backgroundPaused ? 'bg-[#2E161C]/30 border-[#FF8A80] text-[#FF8A80]' : 'bg-[#141414] border-[#222] text-[#757575] hover:text-[#E0E0E0]'}`}
                  >
                    <span>onPause()</span>
                    <span className="text-[10px] opacity-80">Thread Sleeping</span>
                  </button>
                </div>

                <div className="bg-[#141414] border border-[#222] p-3 rounded font-mono text-xs text-[#9E9E9E] space-y-1.5">
                  <span className="text-[#E0E0E0]">Persistence Invariants:</span>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded bg-[#81C784]"></span>
                    <span>PTY File descriptor is owned directly by background thread block</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded bg-[#81C784]"></span>
                    <span>Android Activity pauses the surface without detaching Tokio IPC broker</span>
                  </div>
                </div>
              </div>
            )}

            {/* Solid footer bar with branding details */}
            <div className="pt-4 border-t border-[#1C1C1C] mt-4 flex items-center justify-between text-[10px] font-mono text-[#757575]">
              <span>VOIDTERM SHELL v1.0 — ENGINE ONLINE</span>
              <span>ESTABLISHED 2026</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
