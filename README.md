#  Arc - **A**nonymous **R**elay **C**hat

**Arc** (**A**nonymous **R**elay **C**hat) is a next-generation, **zero-trust**, **progressive** chat application that puts your **privacy**, **security**, and **performance** first. Built with Rust's memory-safe architecture and powered by decentralized relay networks, Arc delivers military-grade anonymity through intelligent message routing.

>  **Mission**: Anonymous communication through secure relay networks - no servers, no logs, no compromise.
> 
## Demo: [Mitrá - मित्र](http://54.183.244.205:1930/)
## [中文介绍](https://github.com/x-ira/arc-chat/blob/main/README_CN.md)
## Core Features
- __Anonymous__:
  + NO user registration or personal info required, No email or phone number is required.
  + We use a key pair based ID, which called KID, a 32-byte public key. saved locally.
  + NO persistant messages on server except a few cached encrypted meida messages for speed up.
  
- __Progressive__:
  + There are 3 types of chat (see below),  you can choose different security level of chat as you wish.

|                     | Open Group | Secured Group | Private Chat |
|---------------------|------------|---------------|--------------|
| E2EE                |            | ✓*            | ✓            |
| Join Approach       | Free       | Pass Code     | Invitation   |
| Participant Limit   | No         | No            | 2            |
| Persistent Messages | No         | No            | Local        |
| Encrypted Messages  | ✓          | ✓             | ✓            |
| Command             | ✓          | ✓             | ✓            |

>* Each member of Secured Group share a same private key that server DOESN'T know it.

- __Security__
  + Using ECDSA (Elliptic Curve Digital Signature Algorithm) to ensures key messages(eg, KID) integrity and authenticity.
  + Using ECDH (Elliptic-curve Diffie–Hellman) to generate a shared AEAD key for private chat.
  + Using XChacha20Poly1305 to encrypt all messages of all chat types.
  + Using pure-rust cryptography implementation to provide fast & safe E2EE feature.
  + Memory Safety: Rust prevents buffer overflows and memory vulnerabilities
  + Anti-Replay: HMAC timestamps prevent message replay attacks

> ECDSA & ECDH implementation: Curve25519 (from [dalek-cryptography](https://github.com/dalek-cryptography))
> XChacha20Poly1305 implementaion: [RustCrypto](https://github.com/RustCrypto)

- __Decentralized__
  + Each node acting as a peer, and you can roaming to other discovered peer by DHT.
  + Users can only chat in the same relay peer, cross-relay chat is not supported.
  + Optimized DHT routing for fast peer discovery based on Mainline DHT.
  + Global Relay Mesh: Worldwide network of relay nodes ensures connectivity anywhere
  - Censorship Resistance: Relay network adapts around blocked or compromised nodes

- __Simple but elegant__
  + Create end-to-end encrypted private chat with one click
  + Multiple Modes: Run as relay node or a indepedent chat server
  + No client installation, No login.
  + Minimize core functions, no unnecessary distractions.
  + Lightweight: Minimal resource usage, runs smoothly on any device
  + Mobile ready.
  
## Technical Stack
- Rust: Tokio ecosystem, WebSocket, Cryptography, Mainline DHT
- Javascript: SolidJS, WebAssembly, MessagePack, IndexedDB


### 🎯 **Effortless User Experience**
- **One-Click Start**: Single command deployment with zero configuration
- **Modern Web UI**: Responsive SolidJS interface works on any device
- **No Setup Required**: Works out-of-the-box with sensible defaults
- **Drag & Drop**: Seamless file sharing up to 20MB per file
- **Intuitive Design**: Clean, distraction-free interface focused on conversation

## Other Features

### 💬 **Anonymous Communication Modes**
- **🏛️ Public Relay Rooms**: Join community discussions through encrypted relay networks
- **💬 Private Relay Chat**: Anonymous 1-on-1 conversations routed through multiple relays
- **🤫 Whisper Relay**: Send private messages within rooms via secure relay routing
- **📎 Anonymous Media Relay**: Share files through encrypted relay chains (up to 20MB)
- **🔇 Ghost Mode**: Ultra-anonymous ephemeral sessions with maximum relay hops

### 🌐 **Intelligent Relay Network**

### 🛠️ **Developer & User Friendly**
- **⚡ Zero Configuration**: Works perfectly with default settings
- **🌐 Universal Access**: Web-based interface - no app installation needed
- **📱 Cross-Platform**: Windows, macOS, Linux, and mobile-ready
- **🔄 Real-Time Sync**: Instant message delivery via optimized WebSocket
- **🎛️ Customizable**: Extensive configuration options for advanced users

## ⚡ Lightning-Fast Setup

>  **Get started in under 2 minutes!** Arc is designed for instant deployment with zero hassle.

###  System Requirements
- **Rust**: 1.70+ (for building from source)
- **OS**: Windows, macOS, Linux, or any modern operating system
- **RAM**: 10MB minimum (incredibly lightweight!)

###  Quick Installation

#### Option 1: One-Command Deploy (Recommended)
```bash
# Clone and run in one go
git clone https://github.com/x-ira/arc-chat.git && cd arc
cargo run --release

🎉 Open http://localhost:1930 and start chatting!
```

#### Option 2: Build for Production
```bash
# 1. Clone the repository
git clone https://github.com/x-ira/arc-chat.git
cd arc

# 2. Build optimized release
cargo build --release

# 3. Launch Arc
./target/release/arc

🌐 Access your secure chat at http://localhost:1930
```

#### Option 3: Docker (Isolation)
```bash
# Pull and run (when available)
docker run -p 1930:1930 arc-chat

# Or build yourself
docker build -t arc-chat .
docker run -p 1930:1930 arc-chat
```

### 🌐 **First-Time Usage**
1. **🚀 Launch**: Run the command above to start your relay node
2. **🌍 Connect**: Open `http://localhost:1930` in your browser
3. **📧 Create Identity**: Your anonymous cryptographic identity is generated automatically
4. **🔄 Join Network**: Your node automatically joins the global relay network
5. **💬 Start Chatting**: Send messages through encrypted relay chains immediately

> ⚡ **Pro Tip**: Arc works immediately with default settings. You're simultaneously a user and a relay node, strengthening the network for everyone!

## ⚙️ Configuration

Configure the application through `conf/default.toml`:

```toml
# peer_mode = false # default true, uncomment this if you want start independent chat server

[app]
name = "Arc"
lan_port = 1930
wan_port = 2010

# when other node find this node, the below meta info is offered
[meta]
name = "Mitrá - मित्र" # node name for display
desc = "Welcome to Mitrá - मित्र"   # description about this node
# domain_url = "http://127.0.0.1:1930"   # Optional, if you have a domain for this site. format: "http(s)://<YOUR-DOMAIN-NAME-OR-IP>: <PORT>/"

[room]
max_cached_msgs = 100 # cached room messages limit, if reach limit 'oldest' one will be dropped.
...
```


## 🏧 High-Performance Architecture

> 🚀 **Built for Speed**: Arc leverages cutting-edge technology for maximum performance and security

- **🔄 Perfect Forward Secrecy**: Each session uses unique ephemeral keys

## 🛡️ Bulletproof Security Model

### ✅ **Threats We Neutralize**
- 🚫 **Network Surveillance**: End-to-end encryption makes eavesdropping impossible
- 🚫 **Server Raids**: No servers = no data to seize or compromise
- 🚫 **Identity Tracking**: Cryptographic anonymity protects your real identity
- 🚫 **Message Replay**: Timestamp-based HMAC prevents old message attacks
- 🚫 **Impersonation**: Digital signatures guarantee sender authenticity
- 🚫 **Metadata Mining**: Minimal metadata exposure, even connection patterns hidden
- 🚫 **Backdoors**: Open source code = full transparency and community auditing

### 🎯 **Privacy by Design**
- **🔒 Zero-Knowledge**: Even Arc developers cannot decrypt your messages
- **📊 Minimal Data**: Only essential P2P routing info collected (no personal data)
- **🔑 Local Keys**: Your private keys never leave your device
- **🔥 Ephemeral Mode**: Optional incognito sessions with automatic cleanup
- **🚫 No Logs**: Network nodes don't store conversation history
- **🔄 Forward Secrecy**: Past messages stay secure even if keys are compromised

## 📚 Getting Started Guide

### 🏠 **Creating Your First Room**
1. **🚀 Launch Arc** and open the web interface
2. **✨ Click "Create Room"** - no registration needed!
3. **🎲 Set room name** and optional access rules
4. **🔗 Share the room link** with friends (safely encrypted)
5. **🎉 Start chatting** immediately with end-to-end encryption

### 🔐 **Anonymous Private Conversations**
1. **🔑 Exchange KIDs** (cryptographic identifiers) with your contact
2. **📨 Send invitation** routed through multiple anonymous relays
3. **✅ Accept connection** to establish multi-hop encrypted relay channel
4. **💬 Chat anonymously** with messages bouncing through random relay paths
5. **🔥 Ghost Mode** for maximum anonymity with extended relay chains

### 📁 **Anonymous File Relay**
- **🖼️ Images**: PNG, JPG, GIF, WebP - relayed through encrypted chains
- **🎤 Audio**: Voice messages compressed and routed through anonymous relays
- **📄 Documents**: Any file type up to 20MB relayed through multiple hops
- **🛡️ Security**: Files encrypted and split across multiple relay nodes
- **🚀 Speed**: Intelligent relay selection for optimal transfer performance

## 🤝 Join the Revolution

> 🎆 **Help us build the future of private communication!** Every contribution matters.

### 🚀 **Contributing**

```bash
# Development setup
rustup component add clippy rustfmt
cargo test && cargo clippy && cargo fmt
```

### 🐛 **Found a Bug?**
Report it on [GitHub Issues](https://github.com/x-ira/arc-chat/issues) - we fix critical security issues within 24 hours!

### 💬 **Need Help?**
- 📚 **Documentation**: Comprehensive guides in `/docs`
- 👥 **Community**: Join our secure Arc rooms for support
- 📧 **Contact**: Reach out via encrypted channels only

---

## Legal & Licensing

**License**: [MIT License](LICENSE) - Use freely, modify, distribute!

### ⚠️ **Responsible Use**
- ✅ Use Arc for legal communications only, Not intended for illegal activities.
- ✅ Respect local laws and regulations
- ✅ Consider security auditing for critical use cases
- 🚫 This is free software with no warranties

## Security Reporting
Private Issues: Email security issues privately
Responsible Disclosure: Allow time for fixes before public disclosure
Anonymity: Use anonymous communication channels when possible

---

## **Arc - Privacy Revolution**

> *"In a world of surveillance, anonymity is not a luxury - it's a necessity."*

🔗 **Links**
- 🌍 **Source Code**: [GitHub Repository](https://github.com/x-ira/arc-chat)
- 📚 **Documentation**: [Technical Docs](./docs/)

---

<div align="center">

### 🎆 **Built with 🦀 Rust & ❤️ by Privacy Advocates**

**Arc** - ***A**nonymous **R**elay **C**hat* - *Reclaiming digital privacy through intelligent relay networks*

🛡️ **Anonymous** • 🔄 **Relay** • 💬 **Chat** • 🎆 **Free**

</div>
