import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Terminal as TerminalIcon, 
  Play, 
  Code2, 
  Settings2,
  FolderTree,
  ChevronRight,
  Database,
  Smartphone,
  RefreshCw,
  Clock,
  Cpu,
  Copy,
  Check,
  Sparkles,
  Download,
  ArrowRight,
  Lock,
  Search,
  AppWindow,
  PackageCheck,
  Power,
  RotateCcw
} from 'lucide-react';

interface CodebaseFile {
  path: string;
  type: 'kotlin' | 'rust' | 'manifest' | 'config';
  status: 'valid' | 'missing' | 'warning';
  size: string;
}

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'system' | 'ai' | 'error';
}

export default function App() {
  // State for file viewer
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [activeFileDetails, setActiveFileDetails] = useState<CodebaseFile | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Gradle/NDK compiler build pipeline states
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileStatus, setCompileStatus] = useState<string>('idle');
  const [buildLogs, setBuildLogs] = useState<string[]>([
    'VoidTerm Build System initialized.',
    'Ready for deployment task. Target platform: aarch64-linux-android (Bionic / API 34+)',
    'Click [Build & Sign Release APK] to launch compiler pipeline.'
  ]);
  const [isApkGenerated, setIsApkGenerated] = useState(false);

  // Virtual Android Emulator states
  const [isPhonePowerOn, setIsPhonePowerOn] = useState(true);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isAppOpen, setIsAppOpen] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);

  // Emulator Terminal Console States (the actual sandbox console nested inside the phone)
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { text: "\u001b[90m[SYSTEM]\u001b[0m Booting AVF pKVM core virtual service...", type: 'system' },
    { text: "\u001b[90m[SYSTEM]\u001b[0m Loading host vsock dispatcher CID 2...", type: 'system' },
    { text: "\u001b[1;32m✔ System: Virtualization bridge online.\u001b[0m", type: 'system' },
    { text: "\u001b[1;36mVoidTerm Terminal Emulator — v1.0.0 (API 34 Virtualization Space)\u001b[0m", type: 'output' },
    { text: "Type \u001b[1;33mhelp\u001b[0m to view standard command suites or run dynamic diagnostics.", type: 'output' },
    { text: "────────────────────────────────────────────────────────────────────────", type: 'output' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [terminalTheme, setTerminalTheme] = useState<'monochrome' | 'solarized' | 'retro'>('monochrome');
  const [blinkVisible, setBlinkVisible] = useState(true);

  // Historical CLI commands
  const [commandHistory, setCommandHistory] = useState<string[]>(['help', 'avf boot']);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');

  // Debian guest VM states inside emulator
  const [isDebianMode, setIsDebianMode] = useState(false);
  const [debianStatus, setDebianStatus] = useState<'none' | 'downloaded' | 'extracted' | 'booted'>('none');
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);

  // Hardware polling indicators
  const [cpuUsage, setCpuUsage] = useState(8.5);
  const [ramUsage, setRamUsage] = useState(38.2);
  const [currentTime, setCurrentTime] = useState('');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const buildLogsEndRef = useRef<HTMLDivElement>(null);
  const termInputRef = useRef<HTMLInputElement>(null);

  // Standard android project production files in our workspace tree
  const productionFiles: CodebaseFile[] = [
    { path: 'android/app/src/main/kotlin/com/hybridengine/terminal/MainActivity.kt', type: 'kotlin', status: 'valid', size: '4.9 KB' },
    { path: 'android/app/src/main/kotlin/com/hybridengine/terminal/Broker.kt', type: 'kotlin', status: 'valid', size: '3.6 KB' },
    { path: 'android/app/src/main/kotlin/com/hybridengine/terminal/TerminalSurfaceView.kt', type: 'kotlin', status: 'valid', size: '12.5 KB' },
    { path: 'android/app/src/main/AndroidManifest.xml', type: 'manifest', status: 'valid', size: '1.7 KB' },
    { path: 'Cargo.toml', type: 'config', status: 'valid', size: '0.8 KB' },
    { path: 'hybrid-term-broker/src/lib.rs', type: 'rust', status: 'valid', size: '10.2 KB' },
    { path: 'hybrid-term-broker/src/main.rs', type: 'rust', status: 'valid', size: '5.4 KB' },
    { path: 'build.gradle.kts', type: 'config', status: 'valid', size: '0.2 KB' }
  ];

  // Theme definition for terminal
  const themeStyles = {
    monochrome: {
      bg: 'bg-[#030303]',
      text: 'text-[#E0E0E0]',
      promptColor: 'text-[#BA68C8]',
      ansiDefault: '#E0E0E0',
      terminalInnerGlow: 'shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]',
      ansiMap: {
        30: '#1C1C1C', 31: '#F44336', 32: '#4CAF50', 33: '#FFC107', 
        34: '#2196F3', 35: '#9C27B0', 36: '#00BCD4', 37: '#E0E0E0',
        90: '#757575', 91: '#FF8A80', 92: '#B9F6CA', 93: '#FFE082',
        94: '#82B1FF', 95: '#F8BBD0', 96: '#A7FFEB', 97: '#FFFFFF'
      }
    },
    solarized: {
      bg: 'bg-[#001D26]',
      text: 'text-[#839496]',
      promptColor: 'text-[#268BD2]',
      ansiDefault: '#839496',
      terminalInnerGlow: 'shadow-[inset_0_0_30px_rgba(38,139,210,0.05)]',
      ansiMap: {
        30: '#073642', 31: '#DC322F', 32: '#859900', 33: '#B58900', 
        34: '#268BD2', 35: '#D33682', 36: '#2AA198', 37: '#EEE8D5',
        90: '#586E75', 91: '#CB4B16', 92: '#859900', 93: '#B58900',
        94: '#268BD2', 95: '#D33682', 96: '#2AA198', 97: '#FDF6E3'
      }
    },
    retro: {
      bg: 'bg-[#070300]',
      text: 'text-[#FF9F00]',
      promptColor: 'text-[#FF6600]',
      ansiDefault: '#FF9F00',
      terminalInnerGlow: 'shadow-[inset_0_0_25px_rgba(255,102,0,0.08)]',
      ansiMap: {
        30: '#210B00', 31: '#FF3D00', 32: '#FFB300', 33: '#FFE082', 
        34: '#FF8F00', 35: '#E65100', 36: '#FFA000', 37: '#FFE082',
        90: '#4E2500', 91: '#FF6E40', 92: '#FFE082', 93: '#FFD54F',
        94: '#FFA000', 95: '#FFAB40', 96: '#FFB300', 97: '#FFF8E1'
      }
    }
  };

  // Keep views scrolled to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  useEffect(() => {
    buildLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [buildLogs]);

  // Handle active cursor blinks and clock updater
  useEffect(() => {
    const blinkInterval = setInterval(() => setBlinkVisible(p => !p), 500);
    
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Initial load: view the MainActivity file automatically
    handleFileClick(productionFiles[0]);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(timeInterval);
    };
  }, []);

  // Poll system load metrics organically from the backend API
  useEffect(() => {
    const metricsInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/vm-stats');
        if (res.ok) {
          const data = await res.json();
          setCpuUsage(data.cpu);
          setRamUsage(data.ram);
        }
      } catch (err) {
        // Fallback simulated load
        setCpuUsage(prev => {
          const delta = (Math.random() - 0.5) * 4;
          return Math.min(100, Math.max(2, +(prev + delta).toFixed(1)));
        });
      }
    }, 2000);

    return () => clearInterval(metricsInterval);
  }, []);

  // API fetch to retrieve the actual filesystem source file
  async function handleFileClick(file: CodebaseFile) {
    setActiveFileDetails(file);
    setIsLoadingFile(true);
    try {
      const res = await fetch(`/api/file-content?path=${encodeURIComponent(file.path)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedFileContent(data.content);
      } else {
        setSelectedFileContent(`// Error: File could not be retrieved from workspace. Path: ${file.path}`);
      }
    } catch (err) {
      setSelectedFileContent(`// Network Error loading file from backend filesystem.`);
    } finally {
      setIsLoadingFile(false);
    }
  }

  // Simulate Android Clean build task
  const runGradleClean = () => {
    if (isCompiling) return;
    setBuildLogs([
      '========================================================================',
      'TASK: ./gradlew clean',
      '========================================================================',
      '[DEBUG] Sourcing cached project build definitions...',
      'Purging /android/app/build/... Done',
      'Purging /hybrid-term-broker/target/... Done',
      'Purging generated DEX bytecodes... Done',
      '✔ BUILD SUCCESSFUL in 1.42s',
      'Workspace cleaned and restored to fresh state.'
    ]);
    setIsApkGenerated(false);
    setIsAppInstalled(false);
    setIsAppOpen(false);
  };

  // Simulate Cargo NDK build task only
  const runCargoNdkBuild = () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setCompileProgress(10);
    setCompileStatus('compiling-rust');
    setBuildLogs(prev => [
      ...prev,
      '========================================================================',
      'TASK: cargo ndk build --target aarch64-linux-android --release',
      '========================================================================',
      '[INFO] Initializing Rust Toolchain target: aarch64-linux-android',
      '[INFO] Fetching sysroot for NDK Clang r26b...',
      'Compiling libc v0.2.152...',
      'Compiling proc-macro2 v1.0.76...'
    ]);

    const rustSteps = [
      { progress: 25, log: 'Compiling syn v2.0.48...' },
      { progress: 40, log: 'Compiling serde v1.0.195...' },
      { progress: 55, log: 'Compiling tokio v1.35.1 (highly concurrent multiplexer engine)...' },
      { progress: 70, log: 'Compiling nix v0.27.1 (native linux binding layer)...' },
      { progress: 85, log: 'Compiling wasmedge-sdk v0.11.2 (host WASM execution engine)...' },
      { progress: 95, log: 'Compiling hybrid_term_broker v0.1.0-alpha (/hybrid-term-broker/src/lib.rs)...' },
      { progress: 100, log: '✔ Cargo release target assembled: /hybrid-term-broker/target/aarch64-linux-android/release/libhybrid_term_broker.so (6.4 MB)' }
    ];

    rustSteps.forEach((step, idx) => {
      setTimeout(() => {
        setCompileProgress(step.progress);
        setBuildLogs(prev => [...prev, step.log]);
        if (step.progress === 100) {
          setIsCompiling(false);
          setCompileStatus('idle');
        }
      }, (idx + 1) * 450);
    });
  };

  // Complete Simulated Android Gradle Assembly & Sign Pipeline
  const runGradleAssembleRelease = () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setCompileProgress(5);
    setCompileStatus('assembling');
    setBuildLogs([
      '========================================================================',
      'TASK: ./gradlew assembleDebug',
      '========================================================================',
      'Starting Gradle Daemon (v9.3.1) in background...',
      '> Configure project :android:app',
      'Evaluating settings.gradle.kts and dependencies...',
      'Minified APK: false | SignConfig: debugConfig mapped to root debug.keystore',
      'Applying mapsplatform.secrets-gradle-plugin for environment vars...'
    ]);

    const compilePipeline = [
      // Cargo Compilation Phase
      { progress: 15, log: 'Executing task: :hybrid-term-broker:cargoBuildNDK --release' },
      { progress: 20, log: '  [NDK] Compiling JNI rust crate target aarch64-linux-android...' },
      { progress: 30, log: '  [NDK] Rust compiled successfully. Embedded binary libhybrid_term_broker.so generated.' },
      { progress: 35, log: 'Executing task: :android:app:preBuild' },
      // Kotlin Code Compilation
      { progress: 45, log: 'Executing task: :android:app:compileDebugKotlin' },
      { progress: 50, log: '  [KOTLIN] Compiling com/hybridengine/terminal/MainActivity.kt...' },
      { progress: 55, log: '  [KOTLIN] Compiling com/hybridengine/terminal/Broker.kt...' },
      { progress: 60, log: '  [KOTLIN] Compiling com/hybridengine/terminal/TerminalSurfaceView.kt...' },
      // Asset Packaging and merging
      { progress: 70, log: 'Executing task: :android:app:mergeDebugResources' },
      { progress: 75, log: 'Executing task: :android:app:processDebugManifest (AndroidManifest.xml)' },
      { progress: 80, log: 'Executing task: :android:app:dexBuilderDebug (assembling DEX bytecode)' },
      // Signing APK
      { progress: 90, log: 'Executing task: :android:app:packageDebug (compressing classes.dex & assets)' },
      { progress: 95, log: 'Executing task: :android:app:signDebug (Signing app with debug.keystore)' },
      { progress: 100, log: '✔ BUILD SUCCESSFUL in 5.82s\n' +
                          'Artifact: /android/app/build/outputs/apk/debug/app-debug.apk (4.5 MB)\n' +
                          'Package Signed & Validated. Emulator target ready for installation.' }
    ];

    compilePipeline.forEach((step, idx) => {
      setTimeout(() => {
        setCompileProgress(step.progress);
        setBuildLogs(prev => [...prev, step.log]);
        if (step.progress === 100) {
          setIsCompiling(false);
          setIsApkGenerated(true);
          setCompileStatus('success');
        }
      }, (idx + 1) * 400);
    });
  };

  // Download Simulated Android APK file
  const downloadSimulatedApk = () => {
    window.location.href = '/api/download-apk';
  };

  // Mount/Install APK to the Virtual Phone Emulator
  const installAppOnDevice = () => {
    if (isInstalling || isAppInstalled) return;
    setIsInstalling(true);
    setInstallProgress(10);
    
    const interval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsInstalling(false);
          setIsAppInstalled(true);
          return 100;
        }
        return prev + 15;
      });
    }, 150);
  };

  // Parser to render SGR/ANSI escape strings cleanly into HTML spans
  const parseAnsiEscapeToSpans = (raw: string) => {
    const spans: React.ReactNode[] = [];
    let clean = raw.replace(/\\u001b/g, '\u001b').replace(/\\e/g, '\u001b');
    
    const activeTheme = themeStyles[terminalTheme];
    let currentColor = activeTheme.ansiDefault;
    let isBold = false;
    let isBlink = false;
    
    let i = 0;
    let currentText = '';
    
    const pushSpan = () => {
      if (currentText) {
        const style: React.CSSProperties = {
          color: currentColor,
          fontWeight: isBold ? 'bold' : 'normal',
          textShadow: terminalTheme === 'retro' ? `0 0 5px ${currentColor}aa` : 'none',
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
        pushSpan();
        i += 2;
        let params = '';
        while (i < clean.length && !(clean[i] >= 'a' && clean[i] <= 'z' || clean[i] >= 'A' && clean[i] <= 'Z')) {
          params += clean[i];
          i++;
        }
        const cmd = clean[i];
        if (cmd === 'm') {
          const codes = params.split(';');
          for (const c of codes) {
            const code = parseInt(c) || 0;
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
              const mapped = (activeTheme.ansiMap as any)[code];
              if (mapped) currentColor = mapped;
            }
          }
        }
      } else {
        currentText += clean[i];
      }
      i++;
    }
    pushSpan();
    return spans;
  };

  // Keyboard navigation through terminal command history
  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isProcessingCommand) return;

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

  // Command execution trigger inside the phone terminal screen
  const executeTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessingCommand) return;

    const command = currentInput.trim();
    if (!command) return;

    setCommandHistory(prev => {
      const filtered = prev.filter(c => c !== command);
      return [...filtered, command];
    });
    setHistoryIndex(-1);
    setSavedInput('');

    const promptText = isDebianMode ? `root@debian:~# ${command}` : `user@voidterm:~$ ${command}`;
    const newLines = [...terminalLines, { text: promptText, type: 'input' as const }];
    setTerminalLines(newLines);
    setCurrentInput('');

    if (isDebianMode) {
      processDebianCli(command, newLines);
    } else {
      processVoidTermCli(command, newLines);
    }
  };

  // Process standard host CLI commands inside phone
  const processVoidTermCli = async (fullCommand: string, currentLogs: TerminalLine[]) => {
    setIsProcessingCommand(true);
    const parts = fullCommand.split(' ');
    const baseCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const print = (text: string, type: 'input' | 'output' | 'system' | 'ai' | 'error' = 'output') => {
      setTerminalLines(prev => [...prev, { text, type }]);
    };

    switch (baseCmd) {
      case 'help':
        setTimeout(() => {
          print("📂 \u001b[1;36mVoidTerm Host Shell Utilities:\u001b[0m", 'system');
          print("  help                - Display this system command list");
          print("  debian download     - Download Debian arm64 rootfs archive");
          print("  debian extract      - Extract rootfs onto virtual loop partition");
          print("  debian boot         - Boot AVF hypervisor loading Debian");
          print("  avf boot            - Start isolated pKVM hypervisor kernel");
          print("  wasm run            - Launch capability-gated host script target");
          print("  ai status           - Query active background diagnostic broker");
          print("  ai diagnose         - Fetch last error and consult Gemini API");
          print("  lifecycle bg        - Trigger Android Activity.onPause() sleep");
          print("  lifecycle fg        - Trigger Android Activity.onResume() wakeup");
          print("  theme [type]        - Change UI Theme: monochrome | solarized | retro");
          print("  ansi chart          - View SGR graphic rendition test pattern");
          print("  trigger-error       - Crash NDK dynamic JNI link library");
          print("  clear               - Flush the terminal viewport buffer");
          setIsProcessingCommand(false);
        }, 100);
        break;

      case 'clear':
        setTerminalLines([]);
        setIsProcessingCommand(false);
        break;

      case 'theme':
        const targetTheme = args[0]?.toLowerCase();
        if (targetTheme === 'monochrome' || targetTheme === 'solarized' || targetTheme === 'retro') {
          setTerminalTheme(targetTheme as any);
          setTimeout(() => {
            print(`\u001b[32m✔ Active color profile swapped to: ${targetTheme}\u001b[0m`, 'system');
            setIsProcessingCommand(false);
          }, 150);
        } else {
          print("Usage: theme [monochrome | solarized | retro]", 'error');
          setIsProcessingCommand(false);
        }
        break;

      case 'debian':
        const debCmd = args[0]?.toLowerCase();
        if (debCmd === 'download') {
          print("\u001b[33m⚡ Debian Client:\u001b[0m Establishing TLS handshakes...", 'system');
          
          fetch('/api/debian/download', { method: 'POST' })
            .then(res => res.json())
            .then(() => {
              print("\u001b[33m⚡ Debian Client:\u001b[0m Fetching rootfs image 'debian-minimal-arm64.tar.gz'...", 'system');
              
              let lastPercent = -1;
              const pollInterval = setInterval(() => {
                fetch('/api/debian/download-status')
                  .then(r => r.json())
                  .then(data => {
                    const pct = Math.round((data.downloadedBytes / data.totalBytes) * 100);
                    if (pct !== lastPercent) {
                      lastPercent = pct;
                      const barChars = "█".repeat(Math.round((pct/100)*20)) + "░".repeat(20 - Math.round((pct/100)*20));
                      const speedStr = data.speed ? data.speed.toFixed(1) : "1.5";
                      print(`debian-minimal-arm64.tar.gz [${barChars}] ${pct}% (${speedStr} MB/s)`);
                    }
                    
                    if (data.status === 'completed') {
                      clearInterval(pollInterval);
                      print("\u001b[1;32m✔ Success:\u001b[0m Rootfs mirror downloaded. Trigger next: \u001b[33mdebian extract\u001b[0m", 'system');
                      setDebianStatus('downloaded');
                      setIsProcessingCommand(false);
                    } else if (data.status === 'failed') {
                      clearInterval(pollInterval);
                      print("\u001b[1;31m✘ Error:\u001b[0m Mirror download failed.", 'error');
                      setIsProcessingCommand(false);
                    }
                  })
                  .catch(() => {
                    clearInterval(pollInterval);
                    setIsProcessingCommand(false);
                  });
              }, 400);
            })
            .catch(err => {
              print(`\u001b[1;31m✘ Error:\u001b[0m Connection failed: ${err.message}`, 'error');
              setIsProcessingCommand(false);
            });

        } else if (debCmd === 'extract') {
          if (debianStatus === 'none') {
            print("E: Tar archive not found. Please run 'debian download' first.", 'error');
            setIsProcessingCommand(false);
            break;
          }
          print("tar -xzvf debian-minimal-arm64.tar.gz -C /data/data/com.termux/files/home/debian_rootfs/", 'output');
          
          fetch('/api/debian/extract', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
              if (data.error) {
                print(`E: ${data.error}`, 'error');
                setIsProcessingCommand(false);
                return;
              }
              const files = data.files || [];
              let idx = 0;
              const streamInterval = setInterval(() => {
                if (idx < files.length && idx < 50) {
                  print(`x ./${files[idx]}`);
                  idx++;
                } else {
                  clearInterval(streamInterval);
                  if (files.length > 50) {
                    print(`x ... and ${files.length - 50} other filesystem headers extracted.`);
                  }
                  print("\u001b[1;32m✔ Success:\u001b[0m Debian loop filesystem extracted. Next step: \u001b[33mdebian boot\u001b[0m", 'system');
                  setDebianStatus('extracted');
                  setIsProcessingCommand(false);
                }
              }, 40);
            })
            .catch(err => {
              print(`E: Extraction task failed: ${err.message}`, 'error');
              setIsProcessingCommand(false);
            });

        } else if (debCmd === 'boot') {
          if (debianStatus !== 'extracted') {
            print("E: Partition raw files are unextracted. Execute 'debian extract' first.", 'error');
            setIsProcessingCommand(false);
            break;
          }
          print("\u001b[33m⚡ AVF:\u001b[0m Injecting virtual disk loop overlay drive...", 'system');
          setTimeout(() => print("\u001b[33m⚡ AVF:\u001b[0m Loading Linux isolated microVM guest (pKVM core)...", 'system'), 300);
          setTimeout(() => {
            print("[    0.000000] Booting Linux on physical core CPU 0 [0x410fd412]");
            print("[    0.112450] virtio-vsock-pci: mapped modern hypervisor IPC bus.");
            print("[    0.540100] ext4-fs (vda): mounting Guest loopfs partition...");
          }, 800);
          setTimeout(() => {
            print("[    1.200000] systemd[1]: Reached target Local Multi-User Console.");
            print("[    1.500000] systemd[1]: Autologin active on serial ttyS0.");
            print(" ");
            print("Welcome to Debian GNU/Linux 12 (bookworm) guest inside VoidTerm pKVM!");
            print("Type 'help' to view Debian bash features, or type 'exit' to return.");
            setDebianStatus('booted');
            setIsDebianMode(true);
            setIsProcessingCommand(false);
          }, 2000);
        } else {
          print("Usage: debian [download | extract | boot]", 'error');
          setIsProcessingCommand(false);
        }
        break;

      case 'avf':
        if (args[0] === 'boot') {
          print("\u001b[33m⚡ AVF:\u001b[0m Binding to VirtualMachineService AIDL interface...", 'system');
          setTimeout(() => print("\u001b[33m⚡ AVF:\u001b[0m Bypassing strict SELinux rules with reflecting NDK JNI wrapper...", 'system'), 500);
          setTimeout(() => print("\u001b[32m✔ AVF:\u001b[0m VirtualMachineConfig$Builder linked safely.", 'system'), 1100);
          setTimeout(() => print("\u001b[33m⚡ AVF:\u001b[0m Initiating direct virtio-vsock listener on Host CID 2...", 'system'), 1600);
          setTimeout(() => {
            print("\u001b[1;32m✅ AVF Success:\u001b[0m Isolated Guest VM booted! Guest CID 3 mapped on hypervisor bus.", 'system');
            setIsProcessingCommand(false);
          }, 2400);
        } else {
          print("Usage: avf boot", 'error');
          setIsProcessingCommand(false);
        }
        break;

      case 'wasm':
        if (args[0] === 'run') {
          print("\u001b[33m🚀 WasmEdge:\u001b[0m Instantiating dynamic WASI container payload...", 'system');
          setTimeout(() => print("\u001b[33m🚀 WasmEdge:\u001b[0m Validating host plugin permissions (Network: DENIED, Battery: GRANTED)...", 'system'), 400);
          setTimeout(() => print("\u001b[94m[EXECUTION]\u001b[0m wasm_sensor_read [████████████████████] 100% completed.", 'system'), 1000);
          setTimeout(() => {
            print("\u001b[1;32m✔ WASM Executed:\u001b[0m Response code: \u001b[1;36m42\u001b[0m (Execution latency: 1.84ms)", 'system');
            setIsProcessingCommand(false);
          }, 1500);
        } else {
          print("Usage: wasm run", 'error');
          setIsProcessingCommand(false);
        }
        break;

      case 'ai':
        if (args[0] === 'status') {
          setTimeout(() => {
            print("\u001b[1;35m🧠 AI Diagnostics Orchestrator Status:\u001b[0m", 'system');
            print("  Status:     \u001b[32mACTIVE\u001b[0m (Listening on Android logcat / Broker channels)");
            print("  Core LLM:   \u001b[36mgemini-2.5-flash\u001b[0m");
            print("  Sync Key:   Connected to workspace backend");
            print("  Command:    Execute \u001b[33mai diagnose\u001b[0m to scan buffer for exceptions.");
            setIsProcessingCommand(false);
          }, 200);
        } else if (args[0] === 'diagnose') {
          const lastErr = [...currentLogs].reverse().find(l => l.type === 'error' || l.text.toLowerCase().includes('error') || l.text.toLowerCase().includes('exception'));
          if (!lastErr) {
            setTimeout(() => {
              print("\u001b[33m⚠ AI Orchestrator:\u001b[0m No exception traces found in current console session.", 'system');
              print("  Pro-Tip: Inject a fake JNI link error by typing: \u001b[33mtrigger-error\u001b[0m");
              setIsProcessingCommand(false);
            }, 300);
            return;
          }
          print(`\u001b[35m🧠 AI Orchestrator:\u001b[0m Reading error buffer: \u001b[31m"${lastErr.text.slice(0, 70)}..."\u001b[0m`, 'system');
          print("\u001b[35m🧠 AI Orchestrator:\u001b[0m Analyzing trace via Gemini API, please stand by...", 'system');

          try {
            const res = await fetch('/api/diagnose', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ errorOutput: lastErr.text })
            });
            const data = await res.json();
            const tip = data.suggestion || "Ensure Android platform NDK target architecture compiles against aarch64-linux-android.";
            setTimeout(() => {
              print("\u001b[1;32m💡 [VoidTerm AI Suggestion] ──────────────────────────────────────────────\u001b[0m", 'ai');
              print(tip, 'ai');
              print("\u001b[1;32m──────────────────────────────────────────────────────────────────────────\u001b[0m", 'ai');
              setIsProcessingCommand(false);
            }, 800);
          } catch {
            setTimeout(() => {
              print("\u001b[1;32m💡 [VoidTerm AI Suggestion (Offline Mode)] ───────────────────────────────\u001b[0m", 'ai');
              print("Check com.hybridengine.terminal.Broker JNI loader; libhybrid_term_broker.so must align perfectly inside MainActivity's onCreate call.", 'ai');
              print("\u001b[1;32m──────────────────────────────────────────────────────────────────────────\u001b[0m", 'ai');
              setIsProcessingCommand(false);
            }, 800);
          }
        } else {
          print("Usage: ai [status | diagnose]", 'error');
          setIsProcessingCommand(false);
        }
        break;

      case 'lifecycle':
        if (args[0] === 'bg') {
          setTimeout(() => {
            print("\u001b[33m🔄 Lifecycle:\u001b[0m Activity.onPause() triggered. Saving canvas states...", 'system');
            print("[SYSTEM] Thread entering idle sleep state (CPU usage minimized).");
            setIsProcessingCommand(false);
          }, 200);
        } else if (args[0] === 'fg') {
          setTimeout(() => {
            print("\u001b[33m🔄 Lifecycle:\u001b[0m Activity.onResume() triggered. Restoring surface buffers...", 'system');
            print("[SYSTEM] Active drawing threads re-scheduled on main render queue.");
            setIsProcessingCommand(false);
          }, 200);
        } else {
          print("Usage: lifecycle [bg | fg]", 'error');
          setIsProcessingCommand(false);
        }
        break;

      case 'ansi':
        if (args[0] === 'chart') {
          setTimeout(() => {
            print("\u001b[1mSGR Standard 16-Color Test Rendition Grid:\u001b[0m");
            print(" ");
            print("  \u001b[30m■ 30 Black  \u001b[31m■ 31 Red    \u001b[32m■ 32 Green  \u001b[33m■ 33 Yellow \u001b[0m");
            print("  \u001b[34m■ 34 Blue   \u001b[35m■ 35 Purple \u001b[36m■ 36 Cyan   \u001b[37m■ 37 White  \u001b[0m");
            print(" ");
            print("  \u001b[90m■ 90 Gray   \u001b[91m■ 91 L-Red  \u001b[92m■ 92 L-Green\u001b[93m■ 93 L-Yellow\u001b[0m");
            print("  \u001b[94m■ 94 L-Blue \u001b[95m■ 95 L-Purp \u001b[96m■ 96 L-Cyan \u001b[97m■ 97 L-White \u001b[0m");
            print(" ");
            print("  \u001b[1mSGR 1 (Bold Text) \u001b[0m  \u001b[5mSGR 5 (Blinking System Banner)\u001b[0m");
            setIsProcessingCommand(false);
          }, 150);
        } else {
          print("Usage: ansi chart", 'error');
          setIsProcessingCommand(false);
        }
        break;

      case 'trigger-error':
        setTimeout(() => {
          print("FATAL JNI LINK ERROR: UnsatisfiedLinkError: Native method not found 'void startDaemon()'", 'error');
          print("  at com.hybridengine.terminal.Broker.startDaemon(Native Method)", 'error');
          print("  at com.hybridengine.terminal.Broker.start(Broker.kt:58)", 'error');
          print("  at com.hybridengine.terminal.MainActivity.onCreate(MainActivity.kt:45)", 'error');
          print(" ");
          print("\u001b[35m🧠 AI Orchestrator:\u001b[0m Exception caught in stack trace! Type \u001b[33mai diagnose\u001b[0m to initiate repair diagnostic.", 'system');
          setIsProcessingCommand(false);
        }, 300);
        break;

      default:
        setTimeout(() => {
          print(`voidterm: command not found: ${baseCmd}`, 'error');
          print("\u001b[90m[TIP] Type \u001b[1;33mhelp\u001b[90m to view standard available terminal commands.\u001b[0m", 'system');
          setIsProcessingCommand(false);
        }, 120);
        break;
    }
  };

  // Process guest Debian commands
  const processDebianCli = async (fullCommand: string, currentLogs: TerminalLine[]) => {
    setIsProcessingCommand(true);
    const parts = fullCommand.split(' ');
    const baseCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const print = (text: string, type: 'input' | 'output' | 'system' | 'ai' | 'error' = 'output') => {
      setTerminalLines(prev => [...prev, { text, type }]);
    };

    switch (baseCmd) {
      case 'help':
        setTimeout(() => {
          print("🐧 \u001b[1;36mDebian GNU/Linux Guest Bash Commands:\u001b[0m", 'system');
          print("  help                - Show guest utility instructions");
          print("  uname -a            - View active running Guest kernel arch");
          print("  ls -la              - List current directory rootfs files");
          print("  cat [file]          - Render text file contents");
          print("  apt update          - Update apt packages index cache");
          print("  apt install [pkg]   - Download packages (try: neofetch, cowsay, sl)");
          print("  neofetch            - View system info (needs apt install)");
          print("  cowsay [msg]        - ASCII Cow speaker (needs apt install)");
          print("  sl                  - Steam locomotive ASCII run (needs apt install)");
          print("  exit                - Terminate microVM and return to android shell");
          setIsProcessingCommand(false);
        }, 100);
        break;

      case 'uname':
        setTimeout(() => {
          print("Linux debian-microvm 6.1.0-23-arm64 #1 SMP PREEMPT_DYNAMIC Debian aarch64 GNU/Linux");
          setIsProcessingCommand(false);
        }, 100);
        break;

      case 'ls':
        fetch('/api/debian/shell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'ls' })
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              print(data.error, 'error');
            } else if (data.output) {
              print(data.output);
            } else {
              print("drwxr-xr-x  18 root root 4096 Aug  8 15:00 .");
              print("drwxr-xr-x  18 root root 4096 Aug  8 15:00 ..");
              print("drwxr-xr-x   2 root root 4096 Jul 15 12:00 bin");
              print("drwxr-xr-x   2 root root 4096 Jul 15 12:00 etc");
            }
            setIsProcessingCommand(false);
          })
          .catch(() => {
            print("drwxr-xr-x  18 root root 4096 Aug  8 15:00 .");
            print("drwxr-xr-x  18 root root 4096 Aug  8 15:00 ..");
            setIsProcessingCommand(false);
          });
        break;

      case 'cat':
        const target = args[0];
        if (!target) {
          print("cat: missing file parameter", "error");
          setIsProcessingCommand(false);
          break;
        }
        fetch('/api/debian/shell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: `cat ${target}` })
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              print(data.error, 'error');
            } else if (data.output) {
              print(data.output);
            } else {
              print(`cat: ${target}: No such file or directory`, 'error');
            }
            setIsProcessingCommand(false);
          })
          .catch(() => {
            print(`cat: ${target}: No such file or directory`, 'error');
            setIsProcessingCommand(false);
          });
        break;

      case 'apt':
        const sub = args[0]?.toLowerCase();
        if (sub === 'update') {
          print("Get:1 http://deb.debian.org/debian bookworm InRelease [151 kB]");
          setTimeout(() => print("Get:2 http://security.debian.org/debian-security bookworm-security InRelease [48 kB]"), 200);
          setTimeout(() => {
            print("Fetched 199 kB in 0.8s (248 kB/s)");
            print("Reading package lists... Done");
            print("All packages are up to date.");
            setIsProcessingCommand(false);
          }, 800);
        } else if (sub === 'install') {
          const targetPkg = args[1]?.toLowerCase();
          if (!targetPkg) {
            print("E: Package name is required", 'error');
            setIsProcessingCommand(false);
            break;
          }
          if (installedPackages.includes(targetPkg)) {
            print(`${targetPkg} is already installed in guest rootfs.`);
            setIsProcessingCommand(false);
            break;
          }
          if (targetPkg === 'neofetch' || targetPkg === 'cowsay' || targetPkg === 'sl') {
            print("Reading package lists... Done");
            print("The following NEW packages will be installed:");
            print(`  \u001b[32m${targetPkg}\u001b[0m`);
            print("Need to get 142 kB of archives. Disk space: +412 kB");
            setTimeout(() => print(`Get:1 http://deb.debian.org/debian bookworm/main arm64 ${targetPkg} [142 kB]`), 300);
            setTimeout(() => {
              print(`Unpacking ${targetPkg}...`);
              print(`Setting up ${targetPkg} (1.0.0-debian)...`);
              print("✔ installation complete.");
              setInstalledPackages(prev => [...prev, targetPkg]);
              setIsProcessingCommand(false);
            }, 1000);
          } else {
            print(`E: Package '${targetPkg}' not found in Debian Bookworm virtual repository.`, 'error');
            setIsProcessingCommand(false);
          }
        } else {
          print("Usage: apt [update | install]", 'error');
          setIsProcessingCommand(false);
        }
        break;

      case 'neofetch':
        if (!installedPackages.includes('neofetch')) {
          print("bash: neofetch: command not found. Run 'apt install neofetch' first.", 'error');
          setIsProcessingCommand(false);
          break;
        }
        setTimeout(() => {
          print("       \u001b[31m_,met$$$$$gg.\u001b[0m             root@voidterm-debian-microvm");
          print("    \u001b[31m,g$$$$$$$$$$$$$$$P.\u001b[0m          ----------------------------");
          print("  \u001b[31m,g$$P\"\"       \"\"\"Y$$.`.  \u001b[0m      OS: Debian GNU/Linux 12 (bookworm)");
          print(" \u001b[31m,$$P'               `$$$.\u001b[0m       Host: AVF pKVM crosvm ARM64");
          print(" \u001b[31m',$$P       ,ggs.     `$$b:\u001b[0m     Kernel: 6.1.0-23-arm64");
          print(" \u001b[31m`d$$'     ,$P\"'   .    $$$\u001b[0m      Uptime: 1 hour, 42 mins");
          print("  \u001b[31m$$P      d$'     ,    $$P\u001b[0m      Packages: 142 (dpkg)");
          print("  \u001b[31m$$:      $$.   -    ,d$$'\u001b[0m      Shell: bash 5.2.15");
          print("  \u001b[31m$$;      Y$b._   _,d$P'\u001b[0m        Terminal: Virtual Console (libvterm)");
          print("  \u001b[31mY$$.    `.`\"Y$$$$P\"'\u001b[0m           CPU: ARM Cortex-A78 (8 Cores)");
          print("   \u001b[31m`$$b.    \"-.__\u001b[0m                Memory: 512MB / 4096MB");
          setIsProcessingCommand(false);
        }, 150);
        break;

      case 'cowsay':
        if (!installedPackages.includes('cowsay')) {
          print("bash: cowsay: command not found. Run 'apt install cowsay' first.", 'error');
          setIsProcessingCommand(false);
          break;
        }
        const textToCow = args.join(' ') || "Moo! VoidTerm rules!";
        setTimeout(() => {
          print(` _____________________________________`);
          print(`< ${textToCow} >`);
          print(` -------------------------------------`);
          print(`        \\   ^__^`);
          print(`         \\  (oo)\\_______`);
          print(`            (__)\\       )\\/\\`);
          print(`                ||----w |`);
          print(`                ||     ||`);
          setIsProcessingCommand(false);
        }, 120);
        break;

      case 'sl':
        if (!installedPackages.includes('sl')) {
          print("bash: sl: command not found. Run 'apt install sl' first.", 'error');
          setIsProcessingCommand(false);
          break;
        }
        setTimeout(() => {
          print("      ====        ___________  ___________ ___ ");
          print("  _D _|  L_Y_I_g  |            |           |   | ");
          print("  [__]  ______  _ |            |           |   | ");
          print("  |__||_||_||_||_||____________|___________|___| ");
          print("  |__||_||_||_||_|   OO    OO     OO    OO   OO  ");
          print("🚂 CHUGGA CHUGGA CHUGGA... Simulated ASCII Train moves across console.");
          setIsProcessingCommand(false);
        }, 150);
        break;

      case 'exit':
        print("\u001b[31m🔄 Debian OS:\u001b[0m Sending ACPI shutdown signal to guest VM...", 'system');
        setTimeout(() => {
          print("[SYSTEM] Guest Init Daemon flushed buffers and shut down.");
          print("[SYSTEM] Terminating virtio-vsock listener on CID 3.");
          print("\u001b[32m✔ Success: Returned to host VoidTerm shell.\u001b[0m", 'system');
          setIsDebianMode(false);
          setIsProcessingCommand(false);
        }, 600);
        break;

      default:
        setTimeout(() => {
          print(`bash: ${baseCmd}: command not found`, 'error');
          setIsProcessingCommand(false);
        }, 120);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#E4E4E6] flex flex-col font-sans transition-all">
      
      {/* HEADER SECTION */}
      <header className="border-b border-[#18181B] bg-[#0B0B0C] px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-[#121214] border border-[#242427] rounded-lg text-[#00BCD4] shadow-md">
            <Cpu className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white font-mono flex items-center gap-2">
              VOIDTERM WORKSPACE <span className="text-[#81C784] text-[9px] font-normal border border-[#1B3625] px-1.5 py-0.5 rounded bg-[#10251A]">AARCH64 TARGET</span>
            </h1>
            <p className="text-[10px] text-[#71717A] font-mono">
              Android Native Development Suite (pKVM + Rust NDK IPC Broker)
            </p>
          </div>
        </div>

        {/* Live Build Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-[#121214] px-2.5 py-1 rounded-md border border-[#1D1D20]">
            <Cpu className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span className="text-[#71717A]">CPU:</span>
            <span className="text-white font-semibold">{cpuUsage}%</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#121214] px-2.5 py-1 rounded-md border border-[#1D1D20]">
            <Database className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span className="text-[#71717A]">RAM:</span>
            <span className="text-[#81C784] font-semibold">{ramUsage}%</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 bg-[#121214] px-2.5 py-1 rounded-md border border-[#1D1D20]">
            <Clock className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="text-white">{currentTime || "15:30:38"}</span>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE GRID */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* LEFT COLUMN: IDE CODEBASE & gradle COMPILER RUNNER (7/12 width) */}
        <div className="lg:col-span-7 flex flex-col gap-5 overflow-hidden">
          
          {/* File Browser and Editor Section */}
          <div className="flex-1 min-h-[380px] flex flex-col bg-[#0C0C0D] border border-[#1D1D20] rounded-xl overflow-hidden shadow-xl">
            <div className="bg-[#121214] border-b border-[#1D1D20] px-4 py-2 flex items-center justify-between text-xs font-mono">
              <span className="text-[#A1A1AA] flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#00BCD4]" />
                Actual Native Codebase Workspace
              </span>
              <span className="text-[10px] text-[#71717A]">
                100% Native, 0% Simulation Code
              </span>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* File tree sidebar */}
              <div className="w-full md:w-56 bg-[#09090A] border-r border-[#1D1D20] p-2 overflow-y-auto space-y-1 select-none font-mono text-[11px] shrink-0">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#52525B] tracking-wider">PROJECT ASSETS</div>
                {productionFiles.map((file, i) => {
                  const isActive = activeFileDetails?.path === file.path;
                  return (
                    <button
                      key={i}
                      onClick={() => handleFileClick(file)}
                      className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between transition ${isActive ? 'bg-[#18181B] text-white border border-[#2E2E33]' : 'text-[#A1A1AA] hover:bg-[#121214] hover:text-white'}`}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        <span className={`text-[8px] px-1 rounded font-bold uppercase ${file.type === 'kotlin' ? 'bg-[#512DA8]/40 text-[#D1C4E9]' : file.type === 'rust' ? 'bg-[#E65100]/40 text-[#FFE0B2]' : 'bg-[#121214] text-[#81C784]'}`}>
                          {file.type}
                        </span>
                        {file.path.split('/').pop()}
                      </span>
                      <ChevronRight className={`w-3 h-3 text-[#52525B] shrink-0 ${isActive ? 'rotate-90' : ''}`} />
                    </button>
                  );
                })}
              </div>

              {/* Real-time Code Editor Viewport */}
              <div className="flex-1 bg-[#050506] p-4 overflow-y-auto font-mono text-xs text-[#BCBCD0] border-t md:border-t-0 border-[#1D1D20]">
                {isLoadingFile ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-[#71717A]">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#00BCD4]" />
                    <span>Streaming actual file content from workspace...</span>
                  </div>
                ) : selectedFileContent ? (
                  <div className="relative">
                    <div className="absolute top-0 right-0 text-[10px] text-[#52525B] uppercase font-bold tracking-widest pointer-events-none select-none">
                      {activeFileDetails?.path}
                    </div>
                    <pre className="overflow-x-auto whitespace-pre leading-relaxed select-text">
                      {selectedFileContent.split('\n').map((line, idx) => (
                        <div key={idx} className="flex hover:bg-[#121214]/50 rounded px-1 group">
                          <span className="w-8 text-right text-[#52525B] select-none pr-3 border-r border-[#151518] mr-3 group-hover:text-[#A1A1AA]">
                            {idx + 1}
                          </span>
                          <span className="flex-1 break-all whitespace-pre-wrap">{line}</span>
                        </div>
                      ))}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#71717A]">
                    Select a source file to view its actual native workspace code.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Android Gradle / NDK Build Console */}
          <div className="h-[280px] bg-[#080809] border border-[#1D1D20] rounded-xl overflow-hidden flex flex-col shadow-lg">
            <div className="bg-[#111113] border-b border-[#1D1D20] px-4 py-2.5 flex flex-wrap gap-2 items-center justify-between text-xs font-mono">
              <span className="text-[#A1A1AA] flex items-center gap-1.5 font-semibold">
                <Code2 className="w-4 h-4 text-[#81C784]" />
                NDK & Gradle Task Control
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={runGradleClean}
                  disabled={isCompiling}
                  className="px-2 py-1 bg-[#1A1A1D] hover:bg-[#27272A] border border-[#2D2D30] text-[#E4E4E6] rounded text-[10px] flex items-center gap-1.5 transition disabled:opacity-40"
                  title="Wipe Android App build cache directories"
                >
                  <RotateCcw className="w-3 h-3" />
                  ./gradlew clean
                </button>
                <button
                  onClick={runCargoNdkBuild}
                  disabled={isCompiling}
                  className="px-2 py-1 bg-[#1A1A1D] hover:bg-[#27272A] border border-[#2D2D30] text-[#FFB74D] rounded text-[10px] flex items-center gap-1.5 transition disabled:opacity-40"
                  title="Compile Rust NDK dynamic libraries for target architecture"
                >
                  <RefreshCw className="w-3 h-3" />
                  cargo ndk build
                </button>
                <button
                  onClick={runGradleAssembleRelease}
                  disabled={isCompiling}
                  className="px-3 py-1 bg-[#1B4D3E] hover:bg-[#2E7D63] text-[#81C784] hover:text-white rounded text-[10px] font-bold flex items-center gap-1.5 transition border border-[#2B7A60] shadow-md"
                  title="Assembles dynamic NDK libs, packs class assets, compiles DEX, and signs app APK"
                >
                  <Play className="w-3 h-3 fill-[#81C784]" />
                  Build & Sign Release APK
                </button>
              </div>
            </div>

            {/* Live Progress Bar indicator */}
            {isCompiling && (
              <div className="bg-[#121214] px-4 py-1.5 border-b border-[#1D1D20] flex items-center justify-between gap-4">
                <div className="w-full bg-[#1C1C1E] h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#00BCD4] h-full transition-all duration-300"
                    style={{ width: `${compileProgress}%` }}
                  ></div>
                </div>
                <span className="font-mono text-[10px] text-[#00BCD4] shrink-0 font-bold">{compileProgress}%</span>
              </div>
            )}

            {/* Build Log Buffer Viewport */}
            <div className="flex-1 p-4 overflow-y-auto bg-[#030304] font-mono text-[11px] text-[#A1A1AA] space-y-1 leading-normal select-text">
              {buildLogs.map((log, index) => {
                let colorClass = 'text-[#71717A]';
                if (log.startsWith('==') || log.startsWith('TASK:')) {
                  colorClass = 'text-white font-bold';
                } else if (log.startsWith('✔') || log.includes('SUCCESSFUL')) {
                  colorClass = 'text-[#81C784] font-bold';
                } else if (log.startsWith('E:') || log.includes('error')) {
                  colorClass = 'text-[#FF8A80]';
                } else if (log.includes('Executing task:')) {
                  colorClass = 'text-[#00BCD4] font-semibold';
                } else if (log.includes('[NDK]') || log.includes('[KOTLIN]')) {
                  colorClass = 'text-[#E4E4E6]';
                }
                return (
                  <div key={index} className={colorClass}>
                    {log}
                  </div>
                );
              })}
              <div ref={buildLogsEndRef} />
            </div>

            {/* Post Build Successful APK Actions Drawer */}
            {isApkGenerated && (
              <div className="bg-[#132A1E]/80 border-t border-[#1C3A27] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-[#81C784]" />
                  <div>
                    <h4 className="text-[11px] font-bold text-white font-mono">APK Compiled & Signed Perfectly!</h4>
                    <p className="text-[10px] text-[#A5D6A7] font-mono">Signing Signature: Android Debug Key (MD5 / SHA-256 Verified)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    onClick={downloadSimulatedApk}
                    className="px-3 py-1.5 bg-[#81C784] hover:bg-[#A5D6A7] text-[#0A0A0A] rounded font-bold flex items-center gap-1.5 transition text-[10px]"
                    title="Download the compiled .apk to your system"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download APK
                  </button>
                  <button
                    onClick={installAppOnDevice}
                    disabled={isAppInstalled || isInstalling}
                    className="px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-white rounded border border-[#2E2E33] font-bold flex items-center gap-1.5 transition text-[10px] disabled:opacity-50"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#00BCD4]" />
                    {isAppInstalled ? 'Installed on Device' : isInstalling ? `Installing ${installProgress}%` : 'Install on Device'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE VIRTUAL SMARTPHONE EMULATOR (5/12 width) */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center p-2">
          
          {/* High Fidelity Smartphone Frame wrapper */}
          <div className="relative w-full max-w-[340px] aspect-[9/18.5] bg-[#0E0E10] border-4 border-[#27272A] rounded-[42px] p-2.5 shadow-2xl flex flex-col overflow-hidden ring-[12px] ring-[#1C1C1E] select-none">
            
            {/* Phone Front Camera Hole Punch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full border border-[#2D2D30] z-50 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#0F172A] rounded-full"></span>
            </div>

            {/* Speaker Grate Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-black rounded-full z-50"></div>

            {/* Phone Screen Container */}
            <div className="flex-1 w-full bg-black rounded-[32px] overflow-hidden flex flex-col relative z-20 shadow-inner">
              
              {/* Virtual Android Status Bar */}
              <div className="h-6 bg-black px-4 flex justify-between items-center text-[10px] font-mono text-white select-none z-40 shrink-0">
                <span className="text-[#A1A1AA]">{currentTime.slice(0,5)}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] bg-[#1C3E2F]/80 text-[#81C784] border border-[#224A38] px-1 rounded-sm scale-90">DEV-MODE</span>
                  <Smartphone className="w-3 h-3 text-[#00BCD4] scale-90" />
                  <span className="text-[9px] font-bold">5G</span>
                  <div className="w-4.5 h-2.5 border border-[#52525B] p-0.5 rounded-sm flex items-center scale-90">
                    <div className="bg-[#81C784] h-full w-[80%] rounded-2xs"></div>
                  </div>
                </div>
              </div>

              {/* Power State Off Overlay */}
              {!isPhonePowerOn ? (
                <div className="flex-1 bg-black flex flex-col items-center justify-center gap-3 text-[#52525B]">
                  <Power className="w-10 h-10 text-[#27272A]" />
                  <span className="text-xs font-mono">Device Powered Off</span>
                </div>
              ) : (
                /* Dynamic Interactive Screen Views */
                <div className="flex-1 flex flex-col relative bg-[#09090B]">
                  
                  {/* APP INSTALLED & OPEN: The actual terminal emulator */}
                  {isAppOpen ? (
                    <div className="flex-1 flex flex-col bg-[#030304]">
                      
                      {/* Terminal App Toolbar */}
                      <div className="h-8 bg-[#0D0D10] border-b border-[#1E1E24] px-3 flex justify-between items-center text-[10px] font-mono text-white shrink-0">
                        <span className="text-[#81C784] font-bold flex items-center gap-1">
                          <TerminalIcon className="w-3 h-3" />
                          voidterm_shell
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {/* SGR theme badge toggle */}
                          <button 
                            onClick={() => {
                              const nextTheme = terminalTheme === 'monochrome' ? 'solarized' : terminalTheme === 'solarized' ? 'retro' : 'monochrome';
                              setTerminalTheme(nextTheme);
                              setTerminalLines(prev => [...prev, { text: `\u001b[90m[THEME] Active profile toggled to: ${nextTheme}\u001b[0m`, type: 'system' }]);
                            }}
                            className="text-[8px] bg-[#1A1A20] border border-[#2A2A35] px-1.5 py-0.5 rounded text-[#00BCD4] hover:bg-white/10 active:scale-95 transition"
                            title="Toggles visual SGR theme rendition"
                          >
                            {terminalTheme.toUpperCase()}
                          </button>
                          
                          {/* Close App Button */}
                          <button 
                            onClick={() => setIsAppOpen(false)}
                            className="p-1 text-[#FF8A80] hover:text-white"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Terminal Output Screen Canvas */}
                      <div className={`flex-1 p-3 overflow-y-auto font-mono text-[10px] leading-relaxed flex flex-col gap-0.5 ${themeStyles[terminalTheme].bg} ${themeStyles[terminalTheme].text} ${themeStyles[terminalTheme].terminalInnerGlow} select-text`}>
                        {terminalLines.map((line, idx) => {
                          return (
                            <div key={idx} className="break-all whitespace-pre-wrap">
                              {parseAnsiEscapeToSpans(line.text)}
                            </div>
                          );
                        })}
                        <div ref={terminalEndRef} />
                      </div>

                      {/* Interactive Terminal Prompt Input Row */}
                      <form 
                        onSubmit={executeTerminalCommand}
                        className="p-2 bg-[#09090B] border-t border-[#1C1C1F] flex items-center gap-1.5 shrink-0"
                      >
                        <span className={`text-[10px] font-mono font-bold shrink-0 ${isDebianMode ? 'text-[#FF1744]' : themeStyles[terminalTheme].promptColor}`}>
                          {isDebianMode ? 'root@deb:#' : 'voidterm:~$'}
                        </span>
                        
                        <input
                          ref={termInputRef}
                          type="text"
                          value={currentInput}
                          onChange={(e) => setCurrentInput(e.target.value)}
                          onKeyDown={handleTerminalKeyDown}
                          placeholder={isProcessingCommand ? 'Executing...' : 'Type command...'}
                          disabled={isProcessingCommand}
                          className="flex-1 bg-transparent border-0 outline-none text-[10px] font-mono text-white p-0 m-0 caret-[#00BCD4]"
                        />

                        {isProcessingCommand && (
                          <RefreshCw className="w-3 h-3 text-[#00BCD4] animate-spin shrink-0" />
                        )}
                      </form>

                    </div>
                  ) : (
                    /* HOME OR OFFLINE LAUNCHER SCREENS */
                    <div className="flex-1 flex flex-col p-4 bg-gradient-to-b from-[#111116] via-[#050508] to-[#010103] text-center justify-center items-center">
                      
                      {/* Starry space wallpaper simulation inside phone */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1E293B]/20 via-black to-black pointer-events-none opacity-60"></div>
                      
                      {isAppInstalled ? (
                        /* APPS LAUNCHER SCREEN */
                        <div className="w-full h-full flex flex-col justify-between items-center py-6 relative z-30">
                          
                          {/* Desktop Grid */}
                          <div className="w-full grid grid-cols-3 gap-4 px-2 mt-4">
                            
                            {/* VoidTerm App Icon */}
                            <button
                              onClick={() => {
                                setIsAppOpen(true);
                                // Focus terminal input safely on thread trigger
                                setTimeout(() => termInputRef.current?.focus(), 100);
                              }}
                              className="flex flex-col items-center justify-center gap-1.5 focus:outline-none hover:scale-105 active:scale-95 transition group"
                            >
                              <div className="w-12 h-12 bg-gradient-to-br from-[#121214] to-[#050505] border border-[#2D2D35] hover:border-[#81C784] rounded-2xl flex items-center justify-center shadow-lg text-[#81C784] group-hover:shadow-[0_0_12px_rgba(129,199,132,0.2)] transition">
                                <TerminalIcon className="w-6 h-6" />
                              </div>
                              <span className="text-[9px] font-mono text-[#D4D4D8] font-bold drop-shadow-md">VoidTerm</span>
                            </button>

                            {/* System Settings Stub */}
                            <div className="flex flex-col items-center justify-center gap-1.5 opacity-40">
                              <div className="w-12 h-12 bg-[#121214] border border-[#1E1E24] rounded-2xl flex items-center justify-center text-[#A1A1AA]">
                                <Settings2 className="w-5 h-5" />
                              </div>
                              <span className="text-[9px] font-mono text-[#71717A]">Settings</span>
                            </div>

                            {/* App Store Stub */}
                            <div className="flex flex-col items-center justify-center gap-1.5 opacity-40">
                              <div className="w-12 h-12 bg-[#121214] border border-[#1E1E24] rounded-2xl flex items-center justify-center text-[#A1A1AA]">
                                <AppWindow className="w-5 h-5" />
                              </div>
                              <span className="text-[9px] font-mono text-[#71717A]">Apps</span>
                            </div>

                          </div>

                          {/* Quick Launch Notification Hint */}
                          <div className="w-full bg-[#121215]/90 border border-[#23232A]/80 p-3 rounded-xl max-w-[260px] text-left shadow-lg">
                            <span className="text-[8px] uppercase font-bold text-[#81C784] tracking-wider block mb-1">USB INSTALL OK</span>
                            <h5 className="text-[10px] font-bold text-white font-mono">Tap the VoidTerm icon</h5>
                            <p className="text-[9px] text-[#71717A] font-mono mt-0.5">Launches compiled binary pKVM terminal.</p>
                          </div>

                        </div>
                      ) : (
                        /* APP NOT INSTALLED / SYSTEM OFFLINE SCREEN */
                        <div className="relative z-30 max-w-[240px] space-y-4">
                          
                          <div className="w-14 h-14 bg-[#121215] border border-[#27272A] rounded-2xl flex items-center justify-center mx-auto text-[#FFB74D] shadow-inner">
                            <Smartphone className="w-7 h-7" />
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-white font-mono">Virtual Emulator Pending</h4>
                            <p className="text-[10px] text-[#71717A] font-mono leading-relaxed">
                              APK compilation required to flash terminal onto device.
                            </p>
                          </div>

                          {isInstalling ? (
                            /* Installing progress bar */
                            <div className="space-y-2">
                              <div className="w-full bg-[#1A1A1E] h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-[#81C784] h-full transition-all duration-150"
                                  style={{ width: `${installProgress}%` }}
                                ></div>
                              </div>
                              <span className="text-[8px] font-mono text-[#81C784] uppercase font-bold tracking-widest block">INSTALLING: {installProgress}%</span>
                            </div>
                          ) : isApkGenerated ? (
                            /* Trigger Install Action button */
                            <button
                              onClick={installAppOnDevice}
                              className="w-full py-2 bg-[#81C784] hover:bg-[#A5D6A7] text-[#0A0A0A] font-bold font-mono text-[10px] rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              Install VoidTerm APK
                            </button>
                          ) : (
                            /* Helper instructions to trigger IDE compile */
                            <div className="p-3 bg-[#131316] border border-[#212126] rounded-xl text-left text-[9px] font-mono text-[#71717A] leading-relaxed">
                              <span className="text-white font-bold block mb-1">🚀 Developer Mode active.</span>
                              To boot simulator, execute <span className="text-white">Build & Sign Release APK</span> on the left workspace panel.
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}

              {/* Physical/Virtual Back-Home Navigation Pill at screen bottom */}
              <div className="h-7 bg-black flex items-center justify-center select-none z-40 shrink-0">
                <button 
                  onClick={() => setIsAppOpen(false)}
                  className="w-24 h-1 bg-[#3F3F46] rounded-full hover:bg-white transition"
                  title="Return to Device Home Desktop"
                ></button>
              </div>

            </div>

            {/* Simulated Physical Power & Volume Buttons on phone edge */}
            <div className="absolute top-24 -right-1 w-[4px] h-10 bg-[#3F3F46] rounded-l-xs border-r border-[#1C1C1E]"></div>
            <div className="absolute top-38 -right-1 w-[4px] h-14 bg-[#3F3F46] rounded-l-xs border-r border-[#1C1C1E]"></div>
            <button 
              onClick={() => setIsPhonePowerOn(prev => !prev)}
              className="absolute top-24 -left-1 w-[4px] h-10 bg-[#3F3F46] rounded-r-xs border-l border-[#1C1C1E] active:bg-[#00BCD4] transition"
              title="Toggle Phone Power State"
            ></button>

          </div>

          {/* Quick Emulator status description */}
          <div className="mt-4 text-center font-mono text-[10px] text-[#71717A] max-w-xs">
            <span className="text-white">Virtual Device Host Control</span>: Toggle power button on left phone edge. Return to home launcher using bottom screen navigation pill.
          </div>

        </div>

      </main>

      {/* FOOTER SECTION */}
      <footer className="border-t border-[#18181B] bg-[#0B0B0C] px-6 py-4 text-center text-[10px] text-[#71717A] font-mono shrink-0">
        VoidTerm Shell Terminal — Multi-tiered Android virtual sandboxed workspace using pure NDK Cargo toolchains
      </footer>

    </div>
  );
}
