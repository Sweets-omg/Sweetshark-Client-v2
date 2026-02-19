# Sweetshark Client

A multi-server Sharkord client built with **Tauri 2 + React + TypeScript**.

Instead of re-implementing Sharkord's API, Sweetshark embeds the **real Sharkord web app** (voice, video, text, reactions, file uploads — everything) in a native Tauri WebView per server. The sidebar is a lightweight React shell; each server pane is a live, isolated WebView pointing at that server's URL.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Node.js](https://nodejs.org/) v18+
- Tauri 2 system deps:
  - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools + WebView2

## Setup

```bash
npm install
npm run tauri dev   # development
npm run tauri build # production binary
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Sweetshark Client window  (Tauri, decorations=off)  │
│                                                      │
│  ┌──────┐  ┌──────────────────────────────────────┐  │
│  │      │  │  Tauri WebView  (per server)          │  │
│  │Side  │  │                                      │  │
│  │bar   │  │   ← Real Sharkord UI lives here →    │  │
│  │      │  │   Voice · Video · Text · Files       │  │
│  │React │  │   Loaded directly from server URL    │  │
│  │      │  └──────────────────────────────────────┘  │
│  └──────┘                                            │
└─────────────────────────────────────────────────────┘
```

Each server you add gets its own isolated WebView at `http://yourserver:4991`.
Switching servers instantly shows/hides the appropriate WebView — state is preserved.

## Features

- 🏠 Home + Settings pages (native React)
- ➕ Add multiple Sharkord servers by URL
- 🔄 Instant server switching — each WebView keeps its state
- 🎙️ Full voice/video/screen share via Sharkord's WebRTC
- 🗑️ Remove servers (destroys and cleans up the WebView)
- 🪟 Custom title bar, native window controls
- 🦀 Tauri 2 — not Electron

## Project Structure

```
sweetshark-client/
├── src/
│   ├── lib/
│   │   └── webviewManager.ts   ← creates/shows/hides/destroys WebViews
│   ├── components/
│   │   ├── TitleBar            ← custom frameless title bar
│   │   ├── Sidebar             ← server list + nav
│   │   ├── HomePage            ← home view (React)
│   │   ├── SettingsPage        ← settings view (React)
│   │   ├── ServerLoadingPage   ← loading shimmer while WebView initialises
│   │   └── AddServerDialog     ← add server modal
│   └── App.tsx                 ← root + WebView lifecycle
└── src-tauri/
    ├── src/lib.rs
    ├── capabilities/default.json
    └── tauri.conf.json
```
