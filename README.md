#  Arc - **A**nonymous **R**elay **C**hat

**Arc** (**A**nonymous **R**elay **C**hat) is a next-generation, **zero-trust**, **peer-to-peer** communication platform that puts your **privacy**, **security**, and **performance** first. Built with Rust's memory-safe architecture and powered by decentralized relay networks, Arc delivers military-grade anonymity through intelligent message routing.

>  **Mission**: Anonymous communication through secure relay networks - no servers, no logs, no compromise.
> 
>  **How it works**: Your messages are relayed through multiple encrypted hops across our peer-to-peer network, ensuring complete anonymity and censorship resistance.

## 🚀 Why Choose Arc?

### 🔐 **Uncompromising Anonymity**
- ** Smart Relay Network**: Messages routed through multiple encrypted relay nodes
- ** Zero Central Authority**: No servers, no single points of failure or surveillance
- ** Cryptographic Identity**: Anonymous KID system - your real identity stays hidden
- ** Traffic Obfuscation**: Connection patterns masked through intelligent relay routing
- ** DHT Discovery**: Find relay nodes without exposing your location or identity
- ** No Registration**: Start relaying and chatting instantly - zero personal data required

### 🛡️ **Military-Grade Security**
- ** End-to-End Encryption**: AES-GCM & ChaCha20-Poly1305 with perfect forward secrecy
- ** ECDH Key Exchange**: Quantum-resistant elliptic curve cryptography
- ** Digital Signatures**: ECDSA ensures message integrity and authenticity
- ** Encrypted Storage**: Local data protected with ReDB encryption
- ** Memory Safety**: Rust prevents buffer overflows and memory vulnerabilities
- ** Anti-Replay**: HMAC timestamps prevent message replay attacks

### ⚡ **Blazing Fast Performance**
- ** Rust-Powered**: Zero-cost abstractions and native performance
- ** Async Architecture**: Tokio-based for handling thousands of connections
- ** Instant Messaging**: WebSocket for real-time, low-latency communication
- ** Lightweight**: Minimal resource usage, runs smoothly on any device
- ** Efficient P2P**: Optimized DHT routing for fast peer discovery

### 🎯 **Effortless User Experience**
- ** One-Click Start**: Single command deployment with zero configuration
- ** Modern Web UI**: Responsive SolidJS interface works on any device
- ** No Setup Required**: Works out-of-the-box with sensible defaults
- ** Drag & Drop**: Seamless file sharing up to 20MB per file
- ** Intuitive Design**: Clean, distraction-free interface focused on conversation

## 🌟 Core Features

### 💬 **Anonymous Communication Modes**
- **🏛️ Public Relay Rooms**: Join community discussions through encrypted relay networks
- **💬 Private Relay Chat**: Anonymous 1-on-1 conversations routed through multiple relays
- **🤫 Whisper Relay**: Send private messages within rooms via secure relay routing
- **📎 Anonymous Media Relay**: Share files through encrypted relay chains (up to 20MB)
- **🔇 Ghost Mode**: Ultra-anonymous ephemeral sessions with maximum relay hops

### 🌐 **Intelligent Relay Network**
- **🔄 Multi-Hop Routing**: Messages bounce through multiple relay nodes for maximum anonymity
- **🔍 Smart Node Discovery**: Mainline DHT automatically finds the best relay paths
- **🏎️ High-Throughput Relaying**: Each node can relay thousands of messages simultaneously
- **🌍 Global Relay Mesh**: Worldwide network of relay nodes ensures connectivity anywhere
- **📊 Dynamic Load Balancing**: Traffic automatically routes through the fastest available relays
- **🛡️ Censorship Resistance**: Relay network adapts around blocked or compromised nodes

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
- **RAM**: 50MB minimum (incredibly lightweight!)
- **Storage**: ~10MB for the application

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
[app]
name = "Arc"           # Application name
port = 1930           # Listen port

[room]
max_cached_msgs = 100  # Room message cache limit

[log]
level = "info"         # Log level
```

### Advanced Configuration

```toml

# Security settings
default.pass_hash = "your_hash_here"  # Default password hash
access_token_life = 604800000         # Access token lifetime (7 days)
request_timeout = 5000                # Request timeout (milliseconds)
```

## 🏧 High-Performance Architecture

> 🚀 **Built for Speed**: Arc leverages cutting-edge technology for maximum performance and security

### ⚡ **High-Performance Relay Engine**
- **🦀 Rust Core**: Zero-cost abstractions enabling ultra-fast message relay processing
- **🌐 Axum Framework**: Async web framework optimized for high-throughput relay operations
- **🚄 Tokio Runtime**: Handles thousands of concurrent relay connections simultaneously
- **💾 Encrypted ReDB**: Lightning-fast local storage for relay routing tables and message queues
- **🌐 Mainline DHT**: Proven P2P protocol for discovering and maintaining relay node network
- **🎨 MessagePack**: Ultra-efficient serialization minimizes relay bandwidth overhead

### 🚀 **Blazing Frontend**
- **⚡ SolidJS**: Ultra-reactive UI with minimal overhead
- **💻 WebAssembly**: Native-speed cryptography in the browser
- **📎 IndexedDB**: Secure client-side data persistence
- **🔄 WebSocket**: Full-duplex real-time communication with auto-reconnect
- **🎯 Vite**: Lightning-fast development and optimized builds

### 🔒 **Cryptographic Arsenal**
- **🔐 AES-GCM**: Industry-standard authenticated encryption (256-bit keys)
- **⚡ ChaCha20-Poly1305**: High-speed stream cipher for mobile devices
- **🔑 ECDH P-256**: Quantum-resistant key exchange protocol
- **✍️ ECDSA**: Digital signatures for message authenticity
- **🛡️ HMAC-SHA256**: Message authentication and integrity verification
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
1. **🍴 Fork** the project and create your feature branch
2. **✨ Code** with passion - follow Rust best practices
3. **🧪 Test** thoroughly with `cargo test`
4. **🎨 Format** code with `cargo fmt`
5. **📝 Submit PR** with detailed description

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
- ✅ Use Arc for legal communications only
- ✅ Respect local laws and regulations
- ✅ Consider security auditing for critical use cases
- 🚫 This is free software with no warranties

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
