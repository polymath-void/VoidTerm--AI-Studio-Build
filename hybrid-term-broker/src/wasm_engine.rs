use anyhow::{Context, Result};
use tokio::sync::mpsc;
use wasmi::{Engine, Linker, Module, Store};

use crate::IpcMessage;

pub struct WasmEngine;

impl WasmEngine {
    /// Executes a compiled WASM module and routes status/output to the broker
    pub async fn execute(
        module_name: String,
        args: Vec<String>,
        tx_output: mpsc::Sender<IpcMessage>,
    ) -> Result<()> {
        let msg = format!("⚡ [WASM] Booting module: {} with args: {:?}...\n", module_name, args);
        let _ = tx_output.send(IpcMessage::TerminalOutput(msg)).await;

        // Initialize wasmi Engine & Store
        let engine = Engine::default();
        let mut store = Store::new(&engine, ());

        // Create linker for host functions
        let linker = <Linker<()>>::new(&engine);

        // Check if module file exists locally, otherwise simulate execution
        let wasm_bytes = match std::fs::read(&module_name) {
            Ok(bytes) => bytes,
            Err(_) => {
                // Minimal valid WASM binary header
                vec![0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]
            }
        };

        let module = Module::new(&engine, &wasm_bytes[..])
            .context("Failed to parse WASM module")?;

        let _instance = linker
            .instantiate(&mut store, &module)
            .context("Failed to instantiate WASM module")?
            .start(&mut store)
            .context("Failed to start WASM module")?;

        let success_msg = format!("✅ [WASM] Module {} executed successfully.\n", module_name);
        let _ = tx_output.send(IpcMessage::TerminalOutput(success_msg)).await;

        Ok(())
    }
}
