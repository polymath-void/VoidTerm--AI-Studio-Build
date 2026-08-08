use anyhow::{bail, Context, Result};
use std::fs::File;
use std::io::{Read, Write};
use std::os::unix::io::FromRawFd;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;

use crate::IpcMessage;

pub struct LocalPty {
    writer: Arc<Mutex<File>>,
}

impl LocalPty {
    /// Spawns a persistent Android shell using native POSIX PTY and pipes output to the UI
    pub fn start(tx_output: mpsc::Sender<IpcMessage>) -> Result<Self> {
        let mut master_fd: libc::c_int = -1;
        let mut slave_fd: libc::c_int = -1;

        let mut ws = libc::winsize {
            ws_row: 24,
            ws_col: 80,
            ws_xpixel: 0,
            ws_ypixel: 0,
        };

        // Open native master/slave pseudo-terminal pair
        let res = unsafe {
            libc::openpty(
                &mut master_fd,
                &mut slave_fd,
                std::ptr::null_mut(),
                std::ptr::null_mut(),
                &mut ws as *mut libc::winsize,
            )
        };

        if res != 0 {
            bail!("Failed to open native PTY: errno {}", std::io::Error::last_os_error());
        }

        // Convert file descriptors to safe Rust File handles
        let slave_in = unsafe { File::from_raw_fd(slave_fd) };
        let slave_out = slave_in.try_clone().context("Failed to clone slave stdout")?;
        let slave_err = slave_in.try_clone().context("Failed to clone slave stderr")?;

        let master_reader_file = unsafe { File::from_raw_fd(master_fd) };
        let master_writer_file = master_reader_file.try_clone().context("Failed to clone master PTY")?;

        // Determine shell binary (/system/bin/sh with Termux / fallback)
        let shell_path = if std::path::Path::new("/system/bin/sh").exists() {
            "/system/bin/sh"
        } else if std::path::Path::new("/data/data/com.termux/files/usr/bin/sh").exists() {
            "/data/data/com.termux/files/usr/bin/sh"
        } else {
            "sh"
        };

        let mut cmd = Command::new(shell_path);
        cmd.stdin(Stdio::from(slave_in));
        cmd.stdout(Stdio::from(slave_out));
        cmd.stderr(Stdio::from(slave_err));
        cmd.env("TERM", "xterm-256color");
        if let Ok(home) = std::env::var("HOME") {
            cmd.env("HOME", home);
        }

        let _child = cmd.spawn().context("Failed to spawn Android shell process")?;

        let safe_writer = Arc::new(Mutex::new(master_writer_file));

        // Spawn a background blocking thread to constantly read the PTY stream
        // and push the standard output back to our Tokio multiplexer.
        tokio::task::spawn_blocking(move || {
            let mut reader = master_reader_file;
            let mut buf = [0u8; 1024];
            while let Ok(bytes_read) = reader.read(&mut buf) {
                if bytes_read == 0 {
                    break; // Shell closed
                }

                let output = String::from_utf8_lossy(&buf[..bytes_read]).to_string();
                // Send the shell output to the UI rendering channel
                let _ = tx_output.blocking_send(IpcMessage::TerminalOutput(output));
            }
        });

        Ok(Self {
            writer: safe_writer,
        })
    }

    /// Writes a command directly into the running shell session
    pub fn write_command(&self, input: &str) -> Result<()> {
        let mut w = self.writer.lock().unwrap();
        // We append \r to simulate hitting the physical "Enter" key in a real terminal
        write!(w, "{}\r", input)?;
        w.flush()?;
        Ok(())
    }
}
