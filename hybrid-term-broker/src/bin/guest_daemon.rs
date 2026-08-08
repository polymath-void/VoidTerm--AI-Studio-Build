use anyhow::{Context, Result};
use std::net::Shutdown;
use std::process::Stdio;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::process::Command;
use tokio_vsock::{VsockAddr, VsockListener, VMADDR_CID_ANY};

const VM_VSOCK_PORT: u32 = 8000;

#[tokio::main]
async fn main() -> Result<()> {
    println!("🐧 [Guest Daemon] Booting inside AVF microVM...");
    
    // Bind the listener to all available CIDs on the guest side
    let addr = VsockAddr::new(VMADDR_CID_ANY, VM_VSOCK_PORT);
    let listener = VsockListener::bind(addr)
        .context("Failed to bind vsock listener")?;

    println!("🎧 [Guest Daemon] Listening on vsock port {}...", VM_VSOCK_PORT);

    loop {
        // Accept incoming connections from the Android Host Broker
        let (mut stream, peer_addr) = match listener.accept().await {
            Ok(connection) => connection,
            Err(e) => {
                eprintln!("⚠️ [Guest Daemon] Connection failed: {}", e);
                continue;
            }
        };

        println!("🔗 [Guest Daemon] Connection accepted from CID: {}", peer_addr.cid());

        tokio::spawn(async move {
            let mut command_buffer = [0u8; 1024];
            
            // 1. Read the command payload from the hypervisor bus
            let bytes_read = match stream.read(&mut command_buffer).await {
                Ok(n) if n == 0 => return,
                Ok(n) => n,
                Err(_) => return,
            };

            let command_str = String::from_utf8_lossy(&command_buffer[..bytes_read])
                .trim()
                .to_string();
                
            println!("⚙️ [Guest Daemon] Executing: {}", command_str);

            // 2. Execute the command natively in the Linux shell
            let mut child = Command::new("sh")
                .arg("-c")
                .arg(command_str)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .expect("Failed to spawn shell process");

            // 3. Capture the output streams
            let mut stdout = child.stdout.take().expect("Failed to capture stdout");
            let mut stderr = child.stderr.take().expect("Failed to capture stderr");

            let mut stdout_buffer = [0u8; 1024];
            let mut stderr_buffer = [0u8; 1024];

            // 4. Stream the stdout back over vsock to the Host Broker
            loop {
                tokio::select! {
                    Ok(n) = stdout.read(&mut stdout_buffer) => {
                        if n == 0 { break; }
                        let _ = stream.write_all(&stdout_buffer[..n]).await;
                    }
                    Ok(n) = stderr.read(&mut stderr_buffer) => {
                        if n == 0 { break; }
                        let _ = stream.write_all(&stderr_buffer[..n]).await;
                    }
                    else => break,
                }
            }
            
            let _ = stream.shutdown(Shutdown::Both);
            println!("✅ [Guest Daemon] Execution complete. Stream closed.");
        });
    }
}
