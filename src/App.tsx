import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Cpu, 
  Layers, 
  Activity, 
  FileCode, 
  HelpCircle, 
  Play, 
  AlertCircle, 
  RotateCcw, 
  Smartphone, 
  Wand2,
  Sparkles,
  RefreshCw,
  Eye
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

  // ANSI Demo interactive state
  const [ansiText, setAnsiText] = useState('\\u001b[32m[SUCCESS]\\u001b[0m App built in \\u001b[1;33m1200ms\\u001b[0m');
  const [parsedSpans, setParsedSpans] = useState<{ text: string; color: string; isBold: boolean }[]>([]);

  // AVF Interactive boot steps
  const [avfBooting, setAvfBooting] = useState(false);
  const [avfStep, setAvfStep] = useState(0);

  // AI sandbox state
  const [aiInputError, setAiInputError] = useState('java.lang.NullPointerException: Attempt to invoke virtual method on a null object reference at com.hybridengine.terminal.MainActivity.kt:42');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // PTY process simulation state
  const [ptyConnected, setPtyConnected] = useState(true);
  const [backgroundPaused, setBackgroundPaused] = useState(false);

  // Scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  // Parse ANSI codes on current ansiText change
  useEffect(() => {
    parseAnsi(ansiText);
  }, [ansiText]);

  // Helper to parse ANSI simulation in React
  const parseAnsi = (raw: string) => {
    // Basic regex-free tokenizer of \u001b or \e style ANSI
    const result: { text: string; color: string; isBold: boolean }[] = [];
    let clean = raw.replace(/\\u001b/g, '\u001b').replace(/\\e/g, '\u001b');
    
    let activeColor = '#E0E0E0';
    let activeBold = false;
    
    let i = 0;
    let currentChunk = '';
    
    while (i < clean.length) {
      if (clean[i] === '\u001b' && clean[i+1] === '[') {
        if (currentChunk) {
          result.push({ text: currentChunk, color: activeColor, isBold: activeBold });
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
              activeColor = '#E0E0E0';
              activeBold = false;
            } else if (code === 1) {
              activeBold = true;
            } else {
              switch(code) {
                case 30: activeColor = '#1C1C1C'; break;
                case 31: activeColor = '#E57373'; break; // Red
                case 32: activeColor = '#81C784'; break; // Green
                case 33: activeColor = '#FFD54F'; break; // Yellow
                case 34: activeColor = '#64B5F6'; break; // Blue
                case 35: activeColor = '#BA68C8'; break; // Magenta
                case 36: activeColor = '#4DD0E1'; break; // Cyan
                case 37: activeColor = '#E0E0E0'; break; // White
                case 90: activeColor = '#757575'; break; // Gray
                case 91: activeColor = '#FF8A80'; break;
                case 92: activeColor = '#B9F6CA'; break;
                case 93: activeColor = '#FFE082'; break;
                case 94: activeColor = '#82B1FF'; break;
                case 95: activeColor = '#F8BBD0'; break;
                case 96: activeColor = '#A7FFEB'; break;
                case 97: activeColor = '#FFFFFF'; break;
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
      result.push({ text: currentChunk, color: activeColor, isBold: activeBold });
    }
    setParsedSpans(result);
  };

  // Handles commands in the simulated terminal
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const command = currentInput.trim();
    if (!command) return;

    const newLines = [...terminalLines, { text: `user@voidterm:~$ ${command}`, type: 'input' as const }];
    setTerminalLines(newLines);
    setCurrentInput('');

    // Simulate different terminal commands
    setTimeout(() => {
      processCommand(command, newLines);
    }, 150);
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
          <div className="px-3 py-1.5 bg-[#141414] border border-[#222] rounded flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#81C784] animate-pulse"></span>
            <span className="text-[#9E9E9E]">AVF MicroVM:</span>
            <span className="text-[#E0E0E0]">CID 3</span>
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
        <section className="lg:col-span-7 flex flex-col border border-[#1C1C1C] bg-[#0E0E0E] rounded-xl overflow-hidden shadow-2xl h-[580px]">
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

          {/* Interactive Terminal Screen */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed flex flex-col justify-between">
            <div className="space-y-2">
              {terminalLines.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`
                    ${line.type === 'input' ? 'text-[#FFFFFF]' : ''}
                    ${line.type === 'output' ? 'text-[#E0E0E0]' : ''}
                    ${line.type === 'system' ? 'text-[#4DD0E1]' : ''}
                    ${line.type === 'error' ? 'text-[#E57373]' : ''}
                    ${line.type === 'ai' ? 'text-[#81C784] bg-[#142A1E]/30 px-2 py-1 rounded border-l-2 border-[#81C784]' : ''}
                  `}
                >
                  {line.text}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Prompt Form */}
            <form onSubmit={handleCommandSubmit} className="mt-4 border-t border-[#1C1C1C] pt-3 flex items-center gap-2">
              <span className="text-[#BA68C8] font-bold">user@voidterm:~$</span>
              <input 
                type="text" 
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="type 'help' or try standard shell commands..."
                className="flex-1 bg-transparent border-none text-[#FFFFFF] placeholder-[#444444] focus:outline-none focus:ring-0 text-sm font-mono"
              />
              <button 
                type="submit" 
                className="bg-[#1C1C1C] hover:bg-[#2A2A2A] text-xs font-mono px-3 py-1.5 rounded border border-[#333] transition"
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
                  <label className="text-xs font-mono text-[#757575]">Type escape code (try \u001b[31m for Red, \u001b[32m for Green, \u001b[1;33m for Bold Yellow):</label>
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
                          style={{ color: span.color, fontWeight: span.isBold ? 'bold' : 'normal' }}
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
