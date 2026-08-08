use anyhow::{Context, Result};
use std::os::unix::io::FromRawFd;
use std::os::unix::net::UnixStream as StdUnixStream;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::UnixStream as TokioUnixStream;
use tokio::sync::mpsc;
use std::sync::Mutex;
use std::sync::OnceLock;

use crate::IpcMessage;

static ATTACHED_FD: OnceLock<Mutex<Option<i32>>> = OnceLock::new();

pub struct VmBridge;

impl VmBridge {
    /// Sets the raw File Descriptor passed from the JNI layer.
    pub fn set_attached_fd(fd: i32) {
        let lock = ATTACHED_FD.get_or_init(|| Mutex::new(None));
        if let Ok(mut guard) = lock.lock() {
            *guard = Some(fd);
        }
    }

    /// Wraps the raw FD into a Tokio UnixStream and dispatches the command.
    pub async fn dispatch_command(
        command: String,
        _guest_cid: u32,
        _port: u32,
        tx_output: mpsc::Sender<IpcMessage>,
    ) -> Result<()> {
        let init_msg = format!("🌀 [AVF Guest VM] Executing command: {}\n", command);
        let _ = tx_output.send(IpcMessage::TerminalOutput(init_msg)).await;

        // Take the attached FD out to avoid reuse/collision
        let fd_opt = ATTACHED_FD.get().and_then(|lock| {
            if let Ok(mut guard) = lock.lock() {
                guard.take()
            } else {
                None
            }
        });

        let raw_fd = match fd_opt {
            Some(fd) => fd,
            None => {
                let err_msg = "❌ [VM Vsock Error]: No active vsock file descriptor attached. Please try running the command again.\n".to_string();
                let _ = tx_output.send(IpcMessage::TerminalOutput(err_msg)).await;
                return Err(anyhow::anyhow!("No vsock FD attached"));
            }
        };

        // 1. Wrap the raw vsock FD (which is just a SOCK_STREAM) into a standard Unix socket
        let std_stream = unsafe { StdUnixStream::from_raw_fd(raw_fd) };
        
        // 2. Make it non-blocking for Tokio
        std_stream.set_nonblocking(true)
            .context("Failed to set standard UnixStream non-blocking")?;
        
        // 3. Convert it into a Tokio Async Stream!
        let mut async_stream = TokioUnixStream::from_std(std_stream)
            .context("Failed to convert std UnixStream to Tokio UnixStream")?;

        // Write command payload to the hypervisor stream
        let payload = format!("{}\n", command);
        async_stream
            .write_all(payload.as_bytes())
            .await
            .context("Failed to write command payload over vsock")?;

        // Read output back from the VM guest daemon chunk-by-chunk
        let mut buffer = [0u8; 1024];
        loop {
            let bytes_read = async_stream.read(&mut buffer).await?;
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
