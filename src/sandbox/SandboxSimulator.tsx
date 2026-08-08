import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Cpu, 
  Info,
  Copy,
  Check,
  Terminal as TermIcon,
  Sparkles,
  Smartphone,
  RefreshCw,
  Clock,
  Play
} from 'lucide-react';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'system' | 'ai' | 'error';
}

interface SandboxSimulatorProps {
  onClose: () => void;
}

export default function SandboxSimulator({ onClose }: SandboxSimulatorProps) {
  // Terminal list state - starting with standard boot and greeting lines
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { text: "\u001b[90m[SYSTEM]\u001b[0m Booting AVF pKVM core virtual service...", type: 'system' },
    { text: "\u001b[90m[SYSTEM]\u001b[0m Loading host vsock dispatcher CID 2...", type: 'system' },
    { text: "\u001b[1;32m✔ System: Virtualization bridge online.\u001b[0m", type: 'system' },
    { text: "\u001b[1;36mVoidTerm Terminal Emulator — v1.0.0 (API 34 Virtualization Space)\u001b[0m", type: 'output' },
    { text: "Type \u001b[1;33mhelp\u001b[0m to view standard command suites or run dynamic diagnostics.", type: 'output' },
    { text: "────────────────────────────────────────────────────────────────────────", type: 'output' },
  ]);

  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [theme, setTheme] = useState<'monochrome' | 'solarized' | 'retro'>('monochrome');
  
  // Real-time systems polling state
  const [cpuLoad, setCpuLoad] = useState<number>(8.2);
  const [ramUsage, setRamUsage] = useState<number>(38.4);
  const [uptime, setUptime] = useState<number>(0);

  // Command history states
  const [commandHistory, setCommandHistory] = useState<string[]>([
    'help',
    'ansi chart',
    'avf boot'
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');

  // UI state toggles
  const [copiedAll, setCopiedAll] = useState(false);
  const [blinkVisible, setBlinkVisible] = useState(true);

  // Debian simulation states
  const [isDebianMode, setIsDebianMode] = useState(false);
  const [debianStatus, setDebianStatus] = useState<'none' | 'downloaded' | 'extracted' | 'booted'>('none');
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Theme Definitions with explicit ANSI-to-HEX maps
  const themeStyles = {
    monochrome: {
      bg: 'bg-[#060606]',
      text: 'text-[#E0E0E0]',
      border: 'border-[#1E1E1E]',
      promptColor: 'text-[#BA68C8]',
      ansiDefault: '#E0E0E0',
      terminalInnerBg: 'bg-[#030303]',
      terminalInnerGlow: 'shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]',
      ansiMap: {
        30: '#1C1C1C', 31: '#F44336', 32: '#4CAF50', 33: '#FFC107', 
        34: '#2196F3', 35: '#9C27B0', 36: '#00BCD4', 37: '#E0E0E0',
        90: '#757575', 91: '#FF8A80', 92: '#B9F6CA', 93: '#FFE082',
        94: '#82B1FF', 95: '#F8BBD0', 96: '#A7FFEB', 97: '#FFFFFF'
      }
    },
    solarized: {
      bg: 'bg-[#00212B]',
      text: 'text-[#839496]',
      border: 'border-[#073642]',
      promptColor: 'text-[#268BD2]',
      ansiDefault: '#839496',
      terminalInnerBg: 'bg-[#001D26]',
      terminalInnerGlow: 'shadow-[inset_0_0_30px_rgba(38,139,210,0.05)]',
      ansiMap: {
        30: '#073642', 31: '#DC322F', 32: '#859900', 33: '#B58900', 
        34: '#268BD2', 35: '#D33682', 36: '#2AA198', 37: '#EEE8D5',
        90: '#586E75', 91: '#CB4B16', 92: '#859900', 93: '#B58900',
        94: '#268BD2', 95: '#D33682', 96: '#2AA198', 97: '#FDF6E3'
      }
    },
    retro: {
      bg: 'bg-[#0C0600]',
      text: 'text-[#FF9F00]',
      border: 'border-[#2D1600]',
      promptColor: 'text-[#FF6600]',
      ansiDefault: '#FF9F00',
      terminalInnerBg: 'bg-[#070300]',
      terminalInnerGlow: 'shadow-[inset_0_0_25px_rgba(255,102,0,0.08)]',
      ansiMap: {
        30: '#210B00', 31: '#FF3D00', 32: '#FFB300', 33: '#FFE082', 
        34: '#FF8F00', 35: '#E65100', 36: '#FFA000', 37: '#FFE082',
        90: '#4E2500', 91: '#FF6E40', 92: '#FFE082', 93: '#FFD54F',
        94: '#FFA000', 95: '#FFAB40', 96: '#FFB300', 97: '#FFF8E1'
      }
    }
  };

  // Keep terminal scrolled to absolute bottom on any print output
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  // Focus terminal input automatically on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // System status pollers
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setCpuLoad(prev => {
        const delta = (Math.random() - 0.5) * 3;
        return Math.min(100, Math.max(1, +(prev + delta).toFixed(1)));
      });
      setRamUsage(prev => {
        const delta = (Math.random() - 0.5) * 0.8;
        return Math.min(100, Math.max(10, +(prev + delta).toFixed(1)));
      });
      setUptime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(statusInterval);
  }, []);

  // Blinking cursor cycle timer
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkVisible(prev => !prev);
    }, 500);
    return () => clearInterval(blinkInterval);
  }, []);

  // SGR escape codes parser - converting standard terminal ANSI into styled HTML spans
  const renderAnsiString = (raw: string) => {
    const spans: React.ReactNode[] = [];
    let clean = raw.replace(/\\u001b/g, '\u001b').replace(/\\e/g, '\u001b');
    
    const activeTheme = themeStyles[theme];
    let currentColor = activeTheme.ansiDefault;
    let isBold = false;
    let isBlink = false;
    
    let i = 0;
    let currentText = '';
    
    const pushCurrent = () => {
      if (currentText) {
        const style: React.CSSProperties = {
          color: currentColor,
          fontWeight: isBold ? 'bold' : 'normal',
          textShadow: theme === 'retro' ? `0 0 4px ${currentColor}55` : 'none',
          opacity: isBlink ? (blinkVisible ? 1 : 0.2) : 1,
          transition: isBlink ? 'opacity 100ms ease-in-out' : 'none'
        };
        spans.push(
          <span key={spans.length} style={style}>
            {currentText}
          </span>
        );
        currentText = '';
      }
    };
    
    while (i < clean.length) {
      if (clean[i] === '\u001b' && clean[i+1] === '[') {
        pushCurrent();
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
              currentColor = activeTheme.ansiDefault;
              isBold = false;
              isBlink = false;
            } else if (code === 1) {
              isBold = true;
            } else if (code === 5) {
              isBlink = true;
            } else if (code === 22) {
              isBold = false;
            } else if (code === 25) {
              isBlink = false;
            } else {
              const mappedColor = (activeTheme.ansiMap as any)[code];
              if (mappedColor) {
                currentColor = mappedColor;
              }
            }
          }
        }
      } else {
        currentText += clean[i];
      }
      i++;
    }
    pushCurrent();
    return spans;
  };

  const copySessionBuffer = () => {
    const rawBuffer = terminalLines.map(line => line.text).join('\n');
    navigator.clipboard.writeText(rawBuffer);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  // Keyboard navigation through command history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isProcessing) return;

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

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    const command = currentInput.trim();
    if (!command) return;

    // Add to command history
    setCommandHistory(prev => {
      const filtered = prev.filter(c => c !== command);
      return [...filtered, command];
    });
    setHistoryIndex(-1);
    setSavedInput('');

    // Append user input line to log buffer depending on mode
    const promptString = isDebianMode ? `root@debian:~# ${command}` : `user@voidterm:~$ ${command}`;
    const newLines = [...terminalLines, { text: promptString, type: 'input' as const }];
    setTerminalLines(newLines);
    setCurrentInput('');

    // Trigger asynchronous execution handler
    if (isDebianMode) {
      processDebianCommandLine(command, newLines);
    } else {
      processCommandLine(command, newLines);
    }
  };

  // Async processor of interactive commands mimicking terminal speed
  const processCommandLine = async (fullCommand: string, currentLogs: TerminalLine[]) => {
    setIsProcessing(true);
    const parts = fullCommand.split(' ');
    const baseCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const appendLine = (text: string, type: 'input' | 'output' | 'system' | 'ai' | 'error' = 'output') => {
      setTerminalLines(prev => [...prev, { text, type }]);
    };

    switch (baseCmd) {
      case 'help':
        setTimeout(() => {
          appendLine("📂 \u001b[1;36mVoidTerm Core Interactive Command Suite:\u001b[0m", 'system');
          appendLine("  help                - Display this system command directory");
          appendLine("  debian download     - Download a minimal Debian arm64 rootfs archive");
          appendLine("  debian extract      - Extract rootfs tarball to virtual disk space");
          appendLine("  debian boot         - Boot guest AVF pKVM with Debian root drive");
          appendLine("  avf boot            - Run secure pKVM bootloader & vsock handshakes");
          appendLine("  wasm run            - Execute capability-gated host sandbox target");
          appendLine("  ai status           - Query active background diagnostic process");
          appendLine("  ai diagnose         - Intercept current buffer and query Gemini");
          appendLine("  lifecycle bg        - Send Activity.onPause() sleep directives");
          appendLine("  lifecycle fg        - Send Activity.onResume() wakeup signals");
          appendLine("  theme [type]        - Switch themes: monochrome | solarized | retro");
          appendLine("  ansi chart          - Print 16-color SGR graphic rendition panel");
          appendLine("  trigger-error       - Inject native JNI crash to test diagnostics");
          appendLine("  clear               - Flush the terminal view buffer");
          setIsProcessing(false);
        }, 100);
        break;

      case 'clear':
        setTerminalLines([]);
        setIsProcessing(false);
        break;

      case 'theme':
        const selectedTheme = args[0]?.toLowerCase();
        if (selectedTheme === 'monochrome' || selectedTheme === 'solarized' || selectedTheme === 'retro') {
          setTheme(selectedTheme as any);
          setTimeout(() => {
            appendLine(`\u001b[32m✔ Terminal theme successfully switched to: ${selectedTheme}\u001b[0m`, 'system');
            setIsProcessing(false);
          }, 150);
        } else {
          appendLine("Usage: theme [monochrome | solarized | retro]", 'error');
          setIsProcessing(false);
        }
        break;

      case 'debian':
        const debSub = args[0]?.toLowerCase();
        if (debSub === 'download') {
          appendLine("\u001b[33m⚡ Debian OS:\u001b[0m Requesting repository signature keys...", 'system');
          
          setTimeout(() => {
            appendLine("\u001b[33m⚡ Debian OS:\u001b[0m Sourcing minimal Debian arm64 core rootfs (Bookworm release)...", 'system');
          }, 400);

          setTimeout(() => {
            appendLine("Connecting to debian-images.voidterm.org (185.190.140.12)... connected.");
            appendLine("HTTP request sent, awaiting response... 200 OK");
            appendLine("Length: 85921840 (82 MB) [application/octet-stream]");
            appendLine("Saving to: 'debian-minimal-arm64.tar.gz'");
            appendLine(" ");
          }, 900);

          // Simulated progress bar loading increments
          const barWidth = 20;
          for (let i = 1; i <= 4; i++) {
            const pct = i * 25;
            const filledCount = Math.round((pct / 100) * barWidth);
            const bar = "█".repeat(filledCount) + "░".repeat(barWidth - filledCount);
            setTimeout(() => {
              const speed = (30 + Math.random() * 20).toFixed(1);
              appendLine(`debian-minimal-arm64.tar.gz   [${bar}] ${pct}% (${speed} MB/s)`);
            }, 1000 + i * 400);
          }

          setTimeout(() => {
            appendLine(" ");
            appendLine("debian-minimal-arm64.tar.gz saved [85921840/85921840]");
            appendLine("\u001b[1;32m✔ Success:\u001b[0m Download complete! Archive saved. Next step: \u001b[1;33mdebian extract\u001b[0m", 'system');
            setDebianStatus('downloaded');
            setIsProcessing(false);
          }, 3000);

        } else if (debSub === 'extract') {
          if (debianStatus === 'none') {
            appendLine("E: File 'debian-minimal-arm64.tar.gz' not found. Run 'debian download' first.", 'error');
            setIsProcessing(false);
            break;
          }

          appendLine("tar -xzvf debian-minimal-arm64.tar.gz -C /data/data/com.termux/files/home/debian_rootfs/", 'output');
          
          const filesToExtract = [
            "./",
            "./bin/",
            "./bin/bash",
            "./bin/cat",
            "./bin/ls",
            "./etc/",
            "./etc/hostname",
            "./etc/issue",
            "./etc/apt/",
            "./etc/apt/sources.list",
            "./usr/",
            "./usr/bin/",
            "./var/",
            "./var/lib/dpkg/",
            "./var/log/"
          ];

          filesToExtract.forEach((file, index) => {
            setTimeout(() => {
              appendLine(`x ${file}`);
            }, 100 + index * 80);
          });

          setTimeout(() => {
            appendLine(" ");
            appendLine("\u001b[1;32m✔ Success:\u001b[0m Debian arm64 rootfs extracted successfully!", 'system');
            appendLine("Total files extracted: 12,410 inodes in 1.28s.", 'system');
            appendLine("Drive status: Mounted dynamically inside AVF directory.", 'system');
            appendLine("Ready to boot! Next step: \u001b[1;33mdebian boot\u001b[0m", 'system');
            setDebianStatus('extracted');
            setIsProcessing(false);
          }, 150 * filesToExtract.length);

        } else if (debSub === 'boot') {
          if (debianStatus === 'none' || debianStatus === 'downloaded') {
            appendLine("E: Debian root filesystem has not been extracted yet. Run 'debian extract' first.", 'error');
            setIsProcessing(false);
            break;
          }

          appendLine("\u001b[33m⚡ AVF:\u001b[0m Mounting overlayfs loopback device with rootfs...", 'system');
          
          setTimeout(() => {
            appendLine("\u001b[33m⚡ AVF:\u001b[0m Initializing isolated VM with ARM64 virtualization capabilities...", 'system');
          }, 300);

          setTimeout(() => {
            appendLine("[    0.000000] Booting Linux on physical CPU 0x0000000000 [0x410fd412]");
            appendLine("[    0.000000] Linux version 6.1.0-23-arm64 (debian-kernel@lists.debian.org)");
            appendLine("[    0.054320] CPU0: Spectre v2, Spectre v4 mitigations enabled.");
          }, 800);

          setTimeout(() => {
            appendLine("[    0.124500] virtio-pci: registered modern driver.");
            appendLine("[    0.412000] SCSI subsystem initialized.");
            appendLine("[    0.635000] ext4-fs (vda): mounted filesystem with ordered data mode.");
          }, 1400);

          setTimeout(() => {
            appendLine("[    0.980000] Run /sbin/init as init process.");
            appendLine("[    1.240000] systemd[1]: Inserted module 'autofs4'");
            appendLine("[    1.450000] systemd[1]: Started Journal Service.");
            appendLine("[    1.820000] systemd[1]: Reached target Local File Systems.");
            appendLine("[    2.150000] systemd[1]: Started Serial Getty on ttyS0.");
          }, 2100);

          setTimeout(() => {
            appendLine(" ");
            appendLine("Debian GNU/Linux 12 voidterm-debian-microvm ttyS0");
            appendLine("voidterm-debian-microvm login: root (automatic login)");
            appendLine(" ");
            appendLine("Welcome to Debian GNU/Linux 12 (bookworm) inside VoidTerm Isolated pKVM!");
            appendLine("* Documentation: https://www.debian.org/doc/");
            appendLine("* Forum: https://forums.debian.net/");
            appendLine(" ");
            appendLine("Type 'help' to see simulated Debian bash utilities or 'exit' to return.");
            
            setDebianStatus('booted');
            setIsDebianMode(true);
            setIsProcessing(false);
          }, 3000);

        } else {
          appendLine("Usage: debian [download | extract | boot]", 'error');
          setIsProcessing(false);
        }
        break;

      case 'avf':
        if (args[0] === 'boot') {
          // Dynamic step-by-step loading simulation
          appendLine("\u001b[33m⚡ AVF:\u001b[0m Loading VirtualMachineService platform handles...", 'system');
          
          setTimeout(() => {
            appendLine("\u001b[33m⚡ AVF:\u001b[0m Bypass SEPolicy constraints using JNI reflective loader...", 'system');
          }, 600);

          setTimeout(() => {
            appendLine("\u001b[92m✔ AVF:\u001b[0m Mapped Class loader VirtualMachineConfig$Builder successfully.", 'system');
          }, 1300);

          setTimeout(() => {
            appendLine("\u001b[33m⚡ AVF:\u001b[0m Initializing virtio-vsock listener socket on host CID 2...", 'system');
          }, 2100);

          setTimeout(() => {
            appendLine("\u001b[92m✔ AVF:\u001b[0m Spawned isolated crosvm guest core. Guest CID 3 is online.", 'system');
          }, 2900);

          setTimeout(() => {
            appendLine("\u001b[33m⚡ AVF:\u001b[0m Attaching guest Init Daemon to Tokio multi-channel multiplexer...", 'system');
          }, 3600);

          setTimeout(() => {
            appendLine("\u001b[1;32m✅ AVF Success: Guest VM isolated kernel boot complete in 4.2s!\u001b[0m", 'system');
            setIsProcessing(false);
          }, 4200);
        } else {
          appendLine("Usage: avf boot", 'error');
          setIsProcessing(false);
        }
        break;

      case 'wasm':
        if (args[0] === 'run') {
          appendLine("\u001b[33m🚀 WasmEdge:\u001b[0m Compiling bytecode target payload...", 'system');
          
          setTimeout(() => {
            appendLine("\u001b[33m🚀 WasmEdge:\u001b[0m Performing local permission checks inside isolated sandbox...", 'system');
          }, 500);

          setTimeout(() => {
            appendLine("\u001b[33m🚀 WasmEdge:\u001b[0m Permissions validated (Battery API: ALLOWED, File System: DENIED).", 'system');
          }, 1000);

          setTimeout(() => {
            appendLine("\u001b[94m[EXECUTION]\u001b[0m wasm_core::exec_sensor_matrix  [████████████████████] 100%", 'system');
          }, 1600);

          setTimeout(() => {
            appendLine("\u001b[1;32m✔ Execution Complete:\u001b[0m Core returned response: \u001b[1;36m42\u001b[0m (Execution latency: 2.15ms)", 'system');
            setIsProcessing(false);
          }, 2100);
        } else {
          appendLine("Usage: wasm run", 'error');
          setIsProcessing(false);
        }
        break;

      case 'ai':
        if (args[0] === 'status') {
          setTimeout(() => {
            appendLine("\u001b[1;35m🧠 AI Orchestrator Daemon Status:\u001b[0m", 'system');
            appendLine("  Listener context: \u001b[32mACTIVE\u001b[0m (Intercepting JNI stderr/stdout buffers)");
            appendLine("  Gemini API core:  \u001b[36mgemini-2.5-flash\u001b[0m");
            appendLine("  Quiet buffer:     1200ms debounce window active");
            appendLine("  Current buffer:   Last 15 terminal outputs queued");
            appendLine("  Overall health:   \u001b[32mREADY TO DIAGNOSE\u001b[0m");
            setIsProcessing(false);
          }, 200);
        } else if (args[0] === 'diagnose') {
          // Intercept last error printed in logs
          const lastErrorLine = [...currentLogs]
            .reverse()
            .find(line => line.type === 'error' || line.text.toLowerCase().includes('error') || line.text.toLowerCase().includes('exception'));

          if (!lastErrorLine) {
            setTimeout(() => {
              appendLine("\u001b[33m⚠ AI Orchestrator:\u001b[0m No crash trace or compile errors detected in current session buffer.", 'system');
              appendLine("  Tip: You can inject a sample error by typing: \u001b[1;33mtrigger-error\u001b[0m");
              setIsProcessing(false);
            }, 300);
            return;
          }

          appendLine(`\u001b[35m🧠 AI Orchestrator:\u001b[0m Intercepted log trace: \u001b[31m"${lastErrorLine.text.slice(0, 80)}..."\u001b[0m`, 'system');
          appendLine("\u001b[35m🧠 AI Orchestrator:\u001b[0m Querying Gemini diagnostic model for rapid remedy...", 'system');

          try {
            const res = await fetch('/api/diagnose', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ errorOutput: lastErrorLine.text })
            });
            const data = await res.json();
            const solution = data.suggestion || "Please verify JNI bindings, memory bounds, or class descriptors.";
            
            setTimeout(() => {
              appendLine("\u001b[1;32m💡 [VoidTerm AI Suggestion] ──────────────────────────────────────────────\u001b[0m", 'ai');
              appendLine(solution, 'ai');
              appendLine("\u001b[1;32m──────────────────────────────────────────────────────────────────────────\u001b[0m", 'ai');
              setIsProcessing(false);
            }, 800);
          } catch (err) {
            setTimeout(() => {
              appendLine("\u001b[1;32m💡 [VoidTerm AI Suggestion (Offline Mode)] ───────────────────────────────\u001b[0m", 'ai');
              appendLine("Verify library JNI registration, ensure native headers match com_hybridengine_terminal_MainActivity.h", 'ai');
              appendLine("\u001b[1;32m──────────────────────────────────────────────────────────────────────────\u001b[0m", 'ai');
              setIsProcessing(false);
            }, 800);
          }
        } else {
          appendLine("Usage: ai [status | diagnose]", 'error');
          setIsProcessing(false);
        }
        break;

      case 'lifecycle':
        if (args[0] === 'bg') {
          setTimeout(() => {
            appendLine("\u001b[33m🔄 Lifecycle:\u001b[0m Dispatching Activity.onPause() directive...", 'system');
            appendLine("[SYSTEM] Saving active SurfaceView GPU rendering frame context.");
            appendLine("[SYSTEM] Suspension signal SIGSTOP dispatched to native PTY binary.");
            appendLine("[SYSTEM] Persistent terminal service holding microVM state alive in notification tray.");
            appendLine("\u001b[1;31m[STATUS] Rendering thread enters SLEEP mode (0% CPU cycles consumed).\u001b[0m", 'system');
            setIsProcessing(false);
          }, 300);
        } else if (args[0] === 'fg') {
          setTimeout(() => {
            appendLine("\u001b[33m🔄 Lifecycle:\u001b[0m Dispatching Activity.onResume() wake instruction...", 'system');
            appendLine("[SYSTEM] Re-establishing JNI active SurfaceView rendering threads.");
            appendLine("[SYSTEM] Sending resume signal SIGCONT to PTY broker dispatcher.");
            appendLine("\u001b[1;32m[STATUS] Render canvas restored successfully (60 FPS rendering active).\u001b[0m", 'system');
            setIsProcessing(false);
          }, 300);
        } else {
          appendLine("Usage: lifecycle [bg | fg]", 'error');
          setIsProcessing(false);
        }
        break;

      case 'ansi':
        if (args[0] === 'chart') {
          setTimeout(() => {
            appendLine("\u001b[1mVoidTerm Color Grid (Select Graphic Rendition) Test:\u001b[0m");
            appendLine(" ");
            appendLine("  \u001b[30m■ 30 Black  \u001b[31m■ 31 Red    \u001b[32m■ 32 Green  \u001b[33m■ 33 Yellow \u001b[0m");
            appendLine("  \u001b[34m■ 34 Blue   \u001b[35m■ 35 Purple \u001b[36m■ 36 Cyan   \u001b[37m■ 37 White  \u001b[0m");
            appendLine(" ");
            appendLine("  \u001b[90m■ 90 Gray   \u001b[91m■ 91 L-Red  \u001b[92m■ 92 L-Green\u001b[93m■ 93 L-Yellow\u001b[0m");
            appendLine("  \u001b[94m■ 94 L-Blue \u001b[95m■ 95 L-Purp \u001b[96m■ 96 L-Cyan \u001b[97m■ 97 L-White \u001b[0m");
            appendLine(" ");
            appendLine("  \u001b[1mSGR Code 1 (Bold Text) \u001b[0m  \u001b[5mSGR Code 5 (Blinking Alerts)\u001b[0m");
            setIsProcessing(false);
          }, 150);
        } else {
          appendLine("Usage: ansi chart", 'error');
          setIsProcessing(false);
        }
        break;

      case 'trigger-error':
        setTimeout(() => {
          appendLine("FATAL JNI EXCEPTION: ClassNotFoundException in com.hybridengine.terminal.MainActivity", 'error');
          appendLine("  at java.lang.Class.classForName(Native Method)", 'error');
          appendLine("  at java.lang.Class.forName(Class.java:454)", 'error');
          appendLine("  at com.hybridengine.terminal.MainActivity.initBroker(MainActivity.kt:112)", 'error');
          appendLine("Caused by: java.lang.NoClassDefFoundError: Failed resolution of: Lcom/hybridengine/terminal/Broker;", 'error');
          appendLine(" ");
          appendLine("\u001b[35m🧠 AI Orchestrator:\u001b[0m Interactive crash trace captured in buffer! Type \u001b[1;33mai diagnose\u001b[0m to resolve.", 'system');
          setIsProcessing(false);
        }, 400);
        break;

      default:
        setTimeout(() => {
          appendLine(`voidterm: command not found: ${baseCmd}`, 'error');
          appendLine("\u001b[90m[TIP] Type \u001b[33mhelp\u001b[90m to view all available commands in our isolated sandbox.\u001b[0m", 'system');
          setIsProcessing(false);
        }, 150);
        break;
    }
  };

  const processDebianCommandLine = async (fullCommand: string, currentLogs: TerminalLine[]) => {
    setIsProcessing(true);
    const parts = fullCommand.split(' ');
    const baseCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const appendLine = (text: string, type: 'input' | 'output' | 'system' | 'ai' | 'error' = 'output') => {
      setTerminalLines(prev => [...prev, { text, type }]);
    };

    switch (baseCmd) {
      case 'help':
        setTimeout(() => {
          appendLine("🐧 \u001b[1;36mDebian GNU/Linux Guest Bash Utilities:\u001b[0m", 'system');
          appendLine("  help                - Show this guest utility list");
          appendLine("  uname -a            - Print guest kernel architecture and info");
          appendLine("  ls [dir]            - List files and directories in rootfs");
          appendLine("  cat [file]          - Concatenate and display text files");
          appendLine("  apt update          - Synchronize package index repositories");
          appendLine("  apt install [pkg]   - Download and install guest packages");
          appendLine("  neofetch            - Display system hardware & distribution info (requires install)");
          appendLine("  cowsay [msg]        - Render an ASCII cow talking (requires install)");
          appendLine("  sl                  - Show a steam locomotive train (requires install)");
          appendLine("  exit                - Safely exit guest VM and return to voidterm host");
          setIsProcessing(false);
        }, 100);
        break;

      case 'uname':
        setTimeout(() => {
          appendLine("Linux debian 6.1.0-23-arm64 #1 SMP Debian 6.1.99-1 aarch64 GNU/Linux");
          setIsProcessing(false);
        }, 100);
        break;

      case 'ls':
        setTimeout(() => {
          appendLine("drwxr-xr-x  18 root root 4096 Aug  8 15:00 .");
          appendLine("drwxr-xr-x  18 root root 4096 Aug  8 15:00 ..");
          appendLine("drwxr-xr-x   2 root root 4096 Jul 15 12:00 bin");
          appendLine("drwxr-xr-x   2 root root 4096 Jul 15 12:00 boot");
          appendLine("drwxr-xr-x   5 root root  360 Aug  8 15:00 dev");
          appendLine("drwxr-xr-x  42 root root 4096 Aug  8 15:02 etc");
          appendLine("drwxr-xr-x   2 root root 4096 Jul 15 12:00 home");
          appendLine("drwxr-xr-x  12 root root 4096 Jul 15 12:00 lib");
          appendLine("drwxr-xr-x   2 root root 4096 Jul 15 12:00 mnt");
          appendLine("drwxr-xr-x   2 root root 4096 Jul 15 12:00 opt");
          appendLine("dr-xr-xr-x 192 root root    0 Aug  8 15:00 proc");
          appendLine("drwx------   2 root root 4096 Aug  8 15:01 root");
          appendLine("drwxr-xr-x   3 root root 4096 Aug  8 15:00 run");
          appendLine("drwxr-xr-x   2 root root 4096 Jul 15 12:00 sbin");
          appendLine("dr-xr-xr-x  13 root root    0 Aug  8 15:00 sys");
          appendLine("drwxrwxrwt   2 root root 4096 Aug  8 15:00 tmp");
          appendLine("drwxr-xr-x  10 root root 4096 Jul 15 12:00 usr");
          appendLine("drwxr-xr-x  11 root root 4096 Jul 15 12:00 var");
          setIsProcessing(false);
        }, 150);
        break;

      case 'cat':
        const file = args[0]?.toLowerCase();
        if (!file) {
          appendLine("cat: missing operand", "error");
          setIsProcessing(false);
          break;
        }

        setTimeout(() => {
          if (file.includes('hostname')) {
            appendLine("voidterm-debian-microvm");
          } else if (file.includes('issue')) {
            appendLine("Debian GNU/Linux 12 \\n \\l");
          } else if (file.includes('sources.list')) {
            appendLine("deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware");
            appendLine("deb http://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware");
          } else {
            appendLine(`cat: ${args[0]}: No such file or directory`, "error");
          }
          setIsProcessing(false);
        }, 120);
        break;

      case 'apt':
        const aptSub = args[0]?.toLowerCase();
        if (aptSub === 'update') {
          appendLine("Get:1 http://deb.debian.org/debian bookworm InRelease [151 kB]");
          
          setTimeout(() => {
            appendLine("Get:2 http://security.debian.org/debian-security bookworm-security InRelease [48.0 kB]");
          }, 300);

          setTimeout(() => {
            appendLine("Get:3 http://deb.debian.org/debian bookworm/main arm64 Packages [8,685 kB]");
          }, 700);

          setTimeout(() => {
            appendLine("Get:4 http://security.debian.org/debian-security bookworm-security/main arm64 Packages [240 kB]");
          }, 1100);

          setTimeout(() => {
            appendLine("Fetched 9,124 kB in 1.4s (6,517 kB/s)");
            appendLine("Reading package lists... Done");
            appendLine("Building dependency tree... Done");
            appendLine("All packages are up to date.");
            setIsProcessing(false);
          }, 1500);
        } else if (aptSub === 'install') {
          const pkg = args[1]?.toLowerCase();
          if (!pkg) {
            appendLine("E: Please specify a package to install");
            setIsProcessing(false);
            break;
          }

          if (installedPackages.includes(pkg)) {
            appendLine(`Reading package lists... Done`);
            appendLine(`Building dependency tree... Done`);
            appendLine(`${pkg} is already the newest version (1.0.0).`);
            setIsProcessing(false);
            break;
          }

          if (pkg === 'neofetch' || pkg === 'cowsay' || pkg === 'sl') {
            appendLine("Reading package lists... Done");
            appendLine("Building dependency tree... Done");
            appendLine("The following NEW packages will be installed:");
            appendLine(`  \u001b[32m${pkg}\u001b[0m`);
            appendLine("0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.");
            appendLine("Need to get 142 kB of archives.");
            appendLine("After this operation, 412 kB of additional disk space will be used.");

            setTimeout(() => {
              appendLine(`Get:1 http://deb.debian.org/debian bookworm/main arm64 ${pkg} [142 kB]`);
            }, 400);

            setTimeout(() => {
              appendLine(`Selecting previously unselected package ${pkg}.`);
              appendLine(`(Reading database ... 12410 files and directories currently installed.)`);
              appendLine(`Preparing to unpack .../${pkg}_arm64.deb ...`);
              appendLine(`Unpacking ${pkg} ...`);
              appendLine(`Setting up ${pkg} (1.0.0) ...`);
              appendLine("Processing triggers for man-db (2.11.2-2) ...");
              setInstalledPackages(prev => [...prev, pkg]);
              setIsProcessing(false);
            }, 1200);
          } else {
            appendLine(`E: Unable to locate package ${pkg}`, 'error');
            setIsProcessing(false);
          }
        } else {
          appendLine("Usage: apt [update | install]", 'error');
          setIsProcessing(false);
        }
        break;

      case 'neofetch':
        if (!installedPackages.includes('neofetch')) {
          appendLine("bash: neofetch: command not found", "error");
          appendLine("Tip: Try installing it using: \u001b[33mapt install neofetch\u001b[0m");
          setIsProcessing(false);
          break;
        }

        setTimeout(() => {
          appendLine("\u001b[31m       _,met$$$$$gg.          \u001b[33mroot@debian\u001b[0m");
          appendLine("\u001b[31m    ,g$$$$$$$$$$$$$$$P.       \u001b[33m-----------\u001b[0m");
          appendLine("\u001b[31m  ,g$$P\"     \"\"\"Y$$.\".        \u001b[36mOS:\u001b[0m Debian GNU/Linux 12 (bookworm) arm64");
          appendLine("\u001b[31m ,$$P'          `$$$.         \u001b[36mHost:\u001b[0m Android Virtualization Framework (pKVM)");
          appendLine("\u001b[31m',$$P       ,ggs.     `$$b:   \u001b[36mKernel:\u001b[0m 6.1.0-23-arm64");
          appendLine("\u001b[31m`d$$'     ,$P\"   .    $$$     \u001b[36mUptime:\u001b[0m 2 mins");
          appendLine("\u001b[31m $$P      d$'     ,    $$P    \u001b[36mShell:\u001b[0m bash 5.2.15");
          appendLine("\u001b[31m $$:      $$.   -    ,d$$'    \u001b[36mResolution:\u001b[0m 1080x2400");
          appendLine("\u001b[31m $$\\;      Y$b._   _,d$P'     \u001b[36mTerminal:\u001b[0m voidterm-vterm");
          appendLine("\u001b[31m `$$b.      `\"Y$$$$P\"'        \u001b[36mCPU:\u001b[0m ARM Cortex-A78 (8) @ 2.84GHz");
          appendLine("\u001b[31m  `Y$$b.                      \u001b[36mMemory:\u001b[0m 256MiB / 2048MiB (12%)");
          appendLine("\u001b[31m    `Y$$.                     ");
          appendLine("\u001b[31m      `$$b.                   ");
          appendLine("\u001b[31m        `Y$$b.                ");
          appendLine("\u001b[31m          `\"Y$b._             ");
          setIsProcessing(false);
        }, 150);
        break;

      case 'cowsay':
        if (!installedPackages.includes('cowsay')) {
          appendLine("bash: cowsay: command not found", "error");
          appendLine("Tip: Try installing it using: \u001b[33mapt install cowsay\u001b[0m");
          setIsProcessing(false);
          break;
        }

        const msg = args.join(' ') || "hello debian in voidterm";
        setTimeout(() => {
          const dashes = "-".repeat(msg.length + 2);
          const underscores = "_".repeat(msg.length + 2);
          appendLine(`  ${underscores}`);
          appendLine(`  < ${msg} >`);
          appendLine(`  ${dashes}`);
          appendLine("          \\   ^__^");
          appendLine("           \\  (oo)\\_______");
          appendLine("              (__)\\       )\\/\\");
          appendLine("                  ||----w |");
          appendLine("                  ||     ||");
          setIsProcessing(false);
        }, 100);
        break;

      case 'sl':
        if (!installedPackages.includes('sl')) {
          appendLine("bash: sl: command not found", "error");
          appendLine("Tip: Try installing it using: \u001b[33mapt install sl\u001b[0m");
          setIsProcessing(false);
          break;
        }

        setTimeout(() => {
          appendLine("      \u001b[33m====        ___________  ___________  _______________\u001b[0m");
          appendLine("  \u001b[33m_D _|  L_Y_   [            ][           ][               ]\u001b[0m");
          appendLine(" \u001b[33m[__ |__  __  ]  |            ||           ||               |\u001b[0m");
          appendLine(" \u001b[33m| o   o   o  |  |            ||           ||               |\u001b[0m");
          appendLine(" \u001b[33m`---O---O---'   `-O-O-----O-O-`-O-O---O-O-`---O-O-----O-O-'\u001b[0m");
          setIsProcessing(false);
        }, 120);
        break;

      case 'exit':
        setTimeout(() => {
          appendLine("\u001b[90m[SYSTEM]\u001b[0m Connection to Guest VM closed. Returned to host shell.");
          setIsDebianMode(false);
          setIsProcessing(false);
        }, 200);
        break;

      default:
        setTimeout(() => {
          appendLine(`bash: ${baseCmd}: command not found`, 'error');
          setIsProcessing(false);
        }, 120);
        break;
    }
  };

  const activeTheme = themeStyles[theme];

  return (
    <div className="fixed inset-0 bg-[#020202] z-50 flex flex-col justify-center items-center p-2 sm:p-4 select-none overflow-hidden">
      
      {/* Screen Sized Terminal Monitor bezel wrapper */}
      <div className={`w-full h-full max-w-5xl max-h-[720px] rounded-xl border-2 ${activeTheme.border} ${activeTheme.bg} flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] relative transition-all duration-300`}>
        
        {/* Subtle CRT Screen Scanline Overlay Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-10 opacity-40"></div>

        {/* 1. Sleek Hardware Header Bezel */}
        <header className="bg-[#0D0D0D]/90 border-b border-[#1C1C1C] px-4 py-3 flex justify-between items-center z-20 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            {/* Classic window control buttons */}
            <div className="flex gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] cursor-pointer hover:opacity-85" onClick={onClose} title="Close Console"></span>
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></span>
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></span>
            </div>
            
            <TermIcon className="w-4 h-4 text-[#4DD0E1]" />
            <span className="text-white font-bold tracking-tight text-[11px] sm:text-xs">
              VOIDTERM <span className="text-[#81C784] text-[10px] font-normal border border-[#1F3E2B] px-1.5 py-0.5 rounded bg-[#142A1E]/30">SANDBOX</span>
            </span>
          </div>

          {/* Quick HUD Metrics */}
          <div className="hidden sm:flex items-center gap-4 text-[10px] text-[#757575]">
            <div className="flex items-center gap-1.5 bg-[#141414] px-2.5 py-1 rounded border border-[#222]">
              <Cpu className="w-3.5 h-3.5 text-[#4DD0E1]" />
              <span>CPU: <strong className="text-white font-normal">{cpuLoad}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#141414] px-2.5 py-1 rounded border border-[#222]">
              <RefreshCw className={`w-3.5 h-3.5 text-[#81C784] ${isProcessing ? 'animate-spin' : ''}`} />
              <span>RAM: <strong className="text-white font-normal">{ramUsage}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#141414] px-2.5 py-1 rounded border border-[#222]">
              <Clock className="w-3.5 h-3.5 text-[#FFD54F]" />
              <span>UP: <strong className="text-white font-normal">{uptime}s</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copySessionBuffer}
              className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2D2D2D] text-white rounded text-[10px] flex items-center gap-1 transition"
              title="Copy session dump"
            >
              {copiedAll ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedAll ? 'Copied' : 'Dump Log'}</span>
            </button>
            
            <button 
              onClick={onClose}
              className="p-1 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-[#9E9E9E] hover:text-white rounded border border-[#333] transition"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* 2. Sleek Interactive Utility Bar (Theme selection & instructions) */}
        <div className="bg-[#0A0A0A] border-b border-[#141414] px-4 py-2 flex flex-wrap justify-between items-center gap-2 z-20 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#666] text-[10px] uppercase font-bold">Terminal Theme:</span>
            <div className="flex bg-[#141414] rounded p-0.5 border border-[#222]">
              <button
                onClick={() => setTheme('monochrome')}
                className={`px-2.5 py-0.5 rounded transition text-[10px] ${theme === 'monochrome' ? 'bg-[#2E2E2E] text-white font-bold' : 'text-[#666] hover:text-[#999]'}`}
              >
                Monochrome
              </button>
              <button
                onClick={() => setTheme('solarized')}
                className={`px-2.5 py-0.5 rounded transition text-[10px] ${theme === 'solarized' ? 'bg-[#073642] text-[#859900] font-bold' : 'text-[#666] hover:text-[#999]'}`}
              >
                Solarized
              </button>
              <button
                onClick={() => setTheme('retro')}
                className={`px-2.5 py-0.5 rounded transition text-[10px] ${theme === 'retro' ? 'bg-[#3E1F00] text-[#FFB300] font-bold' : 'text-[#666] hover:text-[#999]'}`}
              >
                Retro
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-[10px] text-[#666]">
            <Info className="w-3.5 h-3.5 text-[#4DD0E1]" />
            <span>Interactive console context. All logs output to bottom.</span>
          </div>
        </div>

        {/* 3. Immersive Terminal Screen Area */}
        <section className={`flex-1 p-4 overflow-hidden relative flex flex-col ${activeTheme.terminalInnerBg} ${activeTheme.terminalInnerGlow} transition-colors duration-300`}>
          
          {/* Scroll Viewport ensuring bottom alignment */}
          <div className="flex-1 overflow-y-auto pr-1 select-text scrollbar-thin flex flex-col">
            
            {/* The structural min-h-full bottom aligned flex wrapper */}
            <div className="min-h-full flex flex-col justify-end">
              
              {/* Terminal Logs rendering list */}
              <div className="space-y-1.5 mb-2">
                {terminalLines.map((line, idx) => {
                  return (
                    <div 
                      key={idx} 
                      className="group flex items-start justify-between py-0.5 rounded px-1 hover:bg-white/5 transition"
                    >
                      <div className="font-mono text-xs sm:text-[13px] leading-relaxed break-all flex-1 whitespace-pre-wrap">
                        {renderAnsiString(line.text)}
                      </div>
                      
                      {/* Copy specific line trigger helper */}
                      <button
                        onClick={() => {
                          const cleanText = line.text.replace(/^(user@voidterm:~\$|root@debian:~#)\s*/, '');
                          navigator.clipboard.writeText(cleanText);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition p-1 bg-white/10 hover:bg-white/20 text-white rounded text-[9px] flex items-center gap-1 ml-2 font-sans select-none"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Loader indicator when process is executing */}
              {isProcessing && (
                <div className="flex items-center gap-2 pl-1 py-1 text-[11px] font-mono text-[#81C784]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#81C784] animate-ping"></span>
                  <span>VoidTerm core processing inline instructions...</span>
                </div>
              )}

              {/* Prompt form pinned right below logs */}
              <form onSubmit={handleCommandSubmit} className="border-t border-[#1C1C1C]/60 pt-3.5 pb-1.5 flex items-center gap-2">
                <span className={`${isDebianMode ? 'text-red-400' : activeTheme.promptColor} font-bold text-xs sm:text-[13px]`}>
                  {isDebianMode ? 'root@debian:~#' : 'user@voidterm:~$'}
                </span>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isProcessing}
                  placeholder={isProcessing ? 'Process running...' : "type 'help' or execute commands..."}
                  className={`flex-1 bg-transparent border-none ${activeTheme.text} placeholder-[#444] focus:outline-none text-xs sm:text-[13px] font-mono`}
                  autoFocus
                />
                
                {/* Visual cursor block at the end of input if focused */}
                <div 
                  className="w-2 h-4" 
                  style={{ 
                    backgroundColor: blinkVisible ? activeTheme.ansiMap[32] : 'transparent',
                    display: isProcessing ? 'none' : 'block'
                  }}
                ></div>

                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="bg-[#141414] hover:bg-[#202020] border border-[#222] text-[10px] sm:text-xs font-mono px-3 py-1 rounded text-white transition disabled:opacity-40"
                >
                  Enter
                </button>
              </form>

            </div>
          </div>

        </section>

        {/* 4. Console Bottom Bezel Bar */}
        <footer className="bg-[#090909] border-t border-[#141414] px-4 py-2 flex justify-between items-center font-mono text-[9px] text-[#555] z-20">
          <span>Target Platform: aarch64-linux-android (Termux Native)</span>
          <span>PTY Stream: Multiplexed Tokio IPC Connection</span>
        </footer>

      </div>
    </div>
  );
}
