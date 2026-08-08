# AGENTS.md - Governance & Operational Rules for Hybrid Engine

## 1. Project Mission & Identity
The **Hybrid Engine** is a high-performance Android execution environment combining:
- **UI / JNI Layer**: Kotlin + C++ `libvterm` terminal emulator.
- **IPC Broker**: Asynchronous Rust (`tokio`) host daemon for command interception & stream multiplexing.
- **Host WASM Engine**: WasmEdge embedded via Android NDK for zero-latency execution & native host API functions.
- **Guest Linux Engine**: AVF (`crosvm`) hardware-isolated microVM for standard `glibc` ELF workloads.
- **Hypervisor Bus**: `virtio-vsock` (Host CID 2 <-> Guest CID) for zero-network-overhead communication.

---

## 2. Core Operational Directives (STRICT ENFORCEMENT)

### Rule 1: Mandatory Context Synchronization (`CONTEXT.md`)
1. **Pre-Task Check**: Every agent session or subagent invocation MUST review [CONTEXT.md](file:///data/data/com.termux/files/home/hybrid-engine/CONTEXT.md) before making modifications.
2. **Atomic Context Updates**: Whenever any subsystem is modified, designed, refactored, or tested, the agent MUST immediately update [CONTEXT.md](file:///data/data/com.termux/files/home/hybrid-engine/CONTEXT.md).
3. **No Phantom State**: Never introduce architectural components, configuration flags, or protocol changes without recording them in [CONTEXT.md](file:///data/data/com.termux/files/home/hybrid-engine/CONTEXT.md).

### Rule 2: Category-Based Event Logging Protocol
Every event, modification, architectural decision, or validation test MUST be appended to the **Event Log** section in [CONTEXT.md](file:///data/data/com.termux/files/home/hybrid-engine/CONTEXT.md) using the following strict category schema:

| Category Tag | Domain / Scope |
| :--- | :--- |
| `[ARCHITECTURE]` | High-level system design, pipeline modifications, AIDL/JNI boundaries. |
| `[BROKER_IPC]` | Rust daemon, Tokio async routing, multiplexer channels, IPC protocol. |
| `[WASM_ENGINE]` | WasmEdge NDK integration, WASM host functions, Termux:API replacements. |
| `[AVF_GUEST]` | Android Virtualization Framework, crosvm, kernel image, guest init daemon. |
| `[VSOCK_BUS]` | `virtio-vsock` configuration, CID routing (Host CID 2 / Guest CID), framing. |
| `[TERMINAL_UI]` | Kotlin UI, C++ `libvterm` bridge, PTY rendering, ANSI/VT escape sequences. |
| `[BUILD_ENV]` | Toolchain setups (Cargo, NDK Clang, CMake, Gradle), Termux environment. |
| `[TEST_BENCH]` | Unit tests, mock vsock benchmarks, WASM execution latency benchmarks. |

#### Event Log Entry Format:
```markdown
- **YYYY-MM-DD HH:MM UTC** `[CATEGORY_TAG]` <Short Summary>
  - **Details**: Specific technical actions taken or decisions made.
  - **Impacted Components**: `path/to/component` or subsystem name.
  - **Outcome / Status**: Verified, Pending, or In Progress.
```

---

## 3. Subsystem Invariants & Technical Rules

### 1. IPC Broker (Rust)
- **Runtime**: Pure asynchronous Rust using `tokio` (multi-thread or current-thread runtime adapted for mobile core affinity).
- **Concurrency & Non-Blocking**: No blocking synchronous syscalls inside Tokio task loops. Use `tokio::select!` for stream multiplexing.
- **Protocol Framing**: Inter-process and vsock messages must use strict length-prefixed binary or lightweight CBOR/Protobuf serialization. Avoid bloated JSON on hot data paths.
- **Graceful Degradation**: If the guest microVM is booting or offline, fast-fail or queue commands with status notifications back to the UI terminal.

### 2. Host WASM Engine (WasmEdge NDK)
- **Zero Hypervisor Overhead**: Run CI automations, lightweight scripts, string parsing, and host utilities in WASM directly on Android Bionic.
- **Host Function Security**: All Android native capabilities (battery, clipboard, network, sensors) registered as WASM host functions must be capability-gated.
- **Zero-Copy Buffers**: When passing byte arrays or strings across WASM memory boundary, use direct memory pointers rather than intermediate allocations.

### 3. Guest Linux VM & AVF
- **Hypervisor Boundary**: The microVM runs under `crosvm` managed by Android's `VirtualizationService` (AIDL).
- **No Emulation Penalties**: VM executes raw ARM64/AArch64 `glibc` ELF binaries natively.
- **Vsock Topology**: Android Host always binds to `CID 2`. The guest VM connects to Host CID 2, and the guest listener daemon binds to `VMADDR_CID_ANY` on designated port.

### 4. Terminal UI / JNI Layer
- **libvterm Integrity**: Render terminal grid states through C++ `libvterm` wrapper.
- **Thread Safety**: Ensure all JNI callbacks to Kotlin UI run on main/render thread or through dedicated thread-safe frame queues.

---

## 4. Environment & Tooling Rules (Android Termux)
- **Path Resolution**: Follow standard Termux paths (`/data/data/com.termux/files/usr/`, `$HOME/`).
- **Toolchain Standard**: Use native compilers (`clang`, `rustc`, `cargo`, `cmake`) configured for `aarch64-linux-android`.
- **Zero Resource Waste**: Maintain clean dependencies and minimize unnecessary runtime overhead.
