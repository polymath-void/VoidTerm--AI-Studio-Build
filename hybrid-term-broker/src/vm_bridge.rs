use anyhow::{Context, Result};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::sync::mpsc;
use tokio_vsock::{VsockAddr, VsockStream};

use crate::IpcMessage;

pub struct VmBridge;

impl VmBridge {
    /// Establishes a zero-copy hypervisor connection to the guest VM daemon
    /// and streams stdout/stderr back to the UI multiplexer.
    pub async fn dispatch_command(
        command: String,
        guest_cid: u32,
        port: u32,
        tx_output: mpsc::Sender<IpcMessage>,
    ) -> Result<()> {
        let init_msg = format!(
            "🌀 [AVF Guest VM] Executing on CID {}: {}\n",
            guest_cid, command
        );
        let _ = tx_output.send(IpcMessage::TerminalOutput(init_msg)).await;

        // Connect to the guest Linux daemon listening on vsock (Port 8000)
        let addr = VsockAddr::new(guest_cid, port);
        let mut stream = VsockStream::connect(addr)
            .await
            .context("Failed to establish vsock connection to AVF guest VM")?;

        // Write command payload to the hypervisor stream
        let payload = format!("{}\n", command);
        stream
            .write_all(payload.as_bytes())
            .await
            .context("Failed to write command payload over vsock")?;

        // Read output back from the VM guest daemon chunk-by-chunk
        let mut buffer = [0u8; 1024];
        loop {
            let bytes_read = stream.read(&mut buffer).await?;
            if bytes_read == 0 {
                break; // VM closed execution stream
            }

            let output_chunk = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();
            let _ = tx_output
                .send(IpcMessage::TerminalOutput(output_chunk))
                .await;
        }

        Ok(())
    }
}
