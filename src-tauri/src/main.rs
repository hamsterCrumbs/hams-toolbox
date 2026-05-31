// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::UdpSocket;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::Emitter;
use tauri::Window;

struct UdpListenerState(Mutex<Option<Arc<AtomicBool>>>);

// This is our new native OS command that our Svelte frontend will call!
#[tauri::command]
fn start_udp_listener(
    window: Window,
    state: tauri::State<'_, UdpListenerState>,
    iphone_ip: String,
    vts_port: u16,
    listen_port: u16,
) {
    let mut state_guard = state.0.lock().unwrap();

    // 1. If there's an existing listener, signal it to stop
    if let Some(flag) = state_guard.take() {
        flag.store(false, Ordering::Relaxed);
    }

    // 2. Create a new running flag for the new thread
    let run_flag = Arc::new(AtomicBool::new(true));
    *state_guard = Some(run_flag.clone());
    let flag_clone = run_flag.clone();

    // Spawn a background thread so we don't freeze the UI
    thread::spawn(move || {
        // Brief delay to ensure any previous thread's socket is fully dropped 
        // after being flagged to stop, avoiding "Address already in use" errors.
        thread::sleep(Duration::from_millis(150));

        let bind_addr = format!("0.0.0.0:{}", listen_port);
        let target_addr = format!("{}:{}", iphone_ip, vts_port);
        
        let socket = match UdpSocket::bind(&bind_addr) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("Failed to bind to port {}: {}", listen_port, e);
                return;
            }
        };
        
        // Set a small read timeout so the loop doesn't block forever and can send heartbeats
        socket.set_read_timeout(Some(Duration::from_millis(100))).unwrap();

        let mut last_heartbeat = std::time::Instant::now();
        let mut buf = [0; 65536];

        loop {
            // Check if we've been instructed to shut down (due to a reconnect or disconnect)
            if !flag_clone.load(Ordering::Relaxed) {
                break;
            }

            // 1. Send the heartbeat every 1 second
            if last_heartbeat.elapsed().as_secs() >= 1 {
                let payload = format!(
                    r#"{{"messageType":"iOSTrackingDataRequest","time":2.5,"sentBy":"HamsToolbox","ports":[{}]}}"#,
                    listen_port
                );
                let _ = socket.send_to(payload.as_bytes(), &target_addr);
                last_heartbeat = std::time::Instant::now();
            }

            // 2. Listen for incoming VTS data and send it directly to Svelte
            if let Ok((amt, _src)) = socket.recv_from(&mut buf) {
                if let Ok(msg) = std::str::from_utf8(&buf[..amt]) {
                    // Emit the raw JSON string to the frontend using Tauri's event system
                    let _ = window.emit("VTS_DATA", msg);
                }
            }
        }
    });
}

fn main() {
    tauri::Builder::default()
        .manage(UdpListenerState(Mutex::new(None)))
        // Register our custom command here
        .invoke_handler(tauri::generate_handler![start_udp_listener])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
