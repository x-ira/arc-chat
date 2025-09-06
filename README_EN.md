# Arc - Anonymous Secure Chat Application 🛡️

Arc is a distributed, anonymous, end-to-end encrypted chat application built with Rust. It provides ultimate privacy protection and communication security through advanced cryptographic techniques and P2P networking.

## 🔒 Core Security Features

### End-to-End Encryption (E2EE)
- **Multiple Encryption Algorithms**: Supports AES-GCM and ChaCha20-Poly1305 stream ciphers
- **Key Exchange**: Secure key exchange using Elliptic Curve Diffie-Hellman (ECDH) protocol
- **Digital Signatures**: ECDSA digital signatures ensure message integrity and identity authentication
- **Forward Secrecy**: Independent keys for each session ensure historical message security

### Anonymity Protection
- **Serverless Architecture**: P2P architecture based on DHT (Distributed Hash Table)
- **Identity Privacy**: Users identified through encrypted public key identifiers (KID)
- **Network Anonymity**: Decentralized node discovery without exposing real identity
- **Metadata Protection**: Minimizes trackable communication metadata

### Data Security
- **Encrypted Local Storage**: All sensitive data encrypted locally (ReDB)
- **Memory Safety**: Rust language features provide memory safety guarantees
- **Zero-Log Policy**: Server doesn't record user communication content
- **Secure Authentication**: HMAC-based timestamp signatures prevent replay attacks

## ⚡ Key Features

### 💬 Multiple Communication Modes
- **Public Rooms**: Multi-user group chat with real-time message synchronization
- **Private Chat**: Peer-to-peer encrypted communication, completely anonymous
- **Whisper**: Targeted private messages within rooms
- **Multimedia Support**: Secure image and voice file transmission

### 🌐 Distributed Architecture
- **P2P Network**: No central server required, strong censorship resistance
- **Automatic Node Discovery**: Automatic discovery of online nodes through DHT network
- **Load Balancing**: Distributed architecture naturally supports high concurrency
- **Fault Tolerance**: Single point failures don't affect overall network operation

### 🛠️ User-Friendly Design
- **One-Click Launch**: Simple command-line startup with no complex configuration
- **Modern Web Interface**: Responsive frontend based on SolidJS
- **Cross-Platform Support**: Supports Windows, macOS, Linux and other mainstream operating systems
- **Real-Time Communication**: Real-time message push based on WebSocket

## 🚀 Quick Start

### System Requirements
- Rust 1.70+ 
- Node.js 18+ (for frontend build)
- Operating System: Windows, macOS, Linux

### Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/arc.git
cd arc

# 2. Build Rust backend
cargo build --release

# 3. Build frontend (optional, if customizing interface)
cd web
npm install
npm run build
cd ..

# 4. Start the application
./target/release/arc

# Application will start at http://localhost:1930
```

### Docker Deployment

```bash
# Build image
docker build -t arc-chat .

# Run container
docker run -p 1930:1930 arc-chat
```

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
# Enable user initialization (development environment only)
init_users = false

# Security settings
default.pass_hash = "your_hash_here"  # Default password hash
access_token_life = 604800000         # Access token lifetime (7 days)
request_timeout = 5000                # Request timeout (milliseconds)
```

## 🔧 Technical Architecture

### Backend Tech Stack
- **Rust** - System-level security and performance
- **Axum** - Modern async Web framework  
- **Tokio** - High-performance async runtime
- **ReDB** - Embedded database for secure storage
- **Mainline DHT** - Distributed network discovery

### Frontend Tech Stack
- **SolidJS** - Reactive Web framework
- **WebAssembly** - Client-side cryptographic operations
- **IndexedDB** - Browser local storage
- **WebSocket** - Real-time bidirectional communication

### Cryptographic Components
- **AES-GCM / ChaCha20-Poly1305** - Symmetric encryption
- **ECDH P-256** - Key exchange
- **ECDSA** - Digital signatures
- **HMAC-SHA256** - Message authentication

## 🛡️ Security Guarantees

### Threat Model Protection
- ✅ **Network Eavesdropping**: End-to-end encryption prevents transmission interception
- ✅ **Server Compromise**: Decentralized architecture eliminates single point of risk  
- ✅ **Identity Tracking**: Anonymous identifiers protect real identity
- ✅ **Replay Attacks**: Timestamp signatures prevent message replay
- ✅ **Man-in-the-Middle Attacks**: Digital signatures verify identity authenticity

### Privacy Protection
- **Zero-Knowledge Principle**: Server cannot decrypt user message content
- **Minimal Data Collection**: Only collects necessary network routing information
- **Local Key Management**: Private keys never leave user devices
- **Ephemeral Sessions**: Supports incognito chat mode

## 📖 User Guide

### Creating Rooms
1. Access the Web interface after starting the application
2. Click the "Create Room" button
3. Set room name and access permissions
4. Share room link with other users

### Private Chat
1. Obtain the other party's public key identifier (KID)
2. Send encrypted invitation
3. After confirmation, establish end-to-end encrypted channel
4. Begin anonymous secure communication

### File Sharing
- Image support: PNG, JPG, GIF and other formats
- Voice support: Automatic compression and encrypted transmission
- File size limit: Single file not exceeding 20MB
- Automatic virus scanning and security checks

## 🤝 Contributing

We welcome community contributions! Please follow these steps:

1. **Fork the project** and create a feature branch
2. **Write tests** to ensure code quality
3. **Follow code standards** using `cargo fmt` formatting
4. **Submit Pull Request** with detailed change descriptions

### Development Environment Setup

```bash
# Install development dependencies
rustup component add clippy rustfmt

# Run tests
cargo test

# Code checking
cargo clippy

# Format code  
cargo fmt
```

## 📄 License

This project is licensed under the [MIT License](LICENSE), allowing free use, modification, and distribution.

## ⚠️ Disclaimer

- This software is for learning and legal use only
- Users must comply with local laws and regulations
- Developers assume no liability for usage risks or legal consequences
- Security auditing is strongly recommended before important communications

## 🔗 Related Resources

- [Project Homepage](https://github.com/yourusername/arc)
- [Technical Documentation](./docs/technical.md)
- [Security Audit Report](./docs/security-audit.md)
- [Issue Reporting](https://github.com/yourusername/arc/issues)

---

**Arc** - Bringing privacy communication back to its essence 🚀

*Built with ❤️ by the Arc Team*
