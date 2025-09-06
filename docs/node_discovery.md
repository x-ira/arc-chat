# 分布式网络节点发现指南

本文档详细介绍如何在 Arc 聊天应用中实现基于标签的节点发现功能。

## 核心概念

### 节点标签 (Node Tags)
- **作用**: 标识节点的功能、特性或类型
- **格式**: 字符串数组，如 `["arc-chat", "secure", "file-sharing"]`
- **用途**: 其他节点可以根据标签查找具有特定功能的节点

### 节点发现 (Node Discovery)
- **DHT 存储**: 将节点信息发布到 Mainline DHT 网络
- **标签索引**: 为每个标签创建独立的 DHT 记录
- **自动刷新**: 定期重新发布节点信息以保持活跃状态
- **过期清理**: 自动清理超时的节点记录

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chat Node     │    │  File Node      │    │  Voice Node     │
│ ["arc-chat",    │    │ ["arc-chat",    │    │ ["arc-chat",    │
│  "text",        │◄──►│  "file-sharing", │◄──►│  "voice",       │
│  "public"]      │    │  "storage"]     │    │  "webrtc"]      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   DHT Network   │
                    │                 │
                    │ Key-Value Store │
                    │  arc_tag_chat   │
                    │  arc_tag_voice  │
                    │  arc_tag_file   │
                    └─────────────────┘
```

## 快速开始

### 1. 创建节点发现管理器

```rust
use arc::discovery::{NodeDiscovery, TagMatcher};

// 创建节点
let node_id = "chat_node_001";
let endpoint = "127.0.0.1:8080";  
let tags = vec![
    "arc-chat".to_string(),
    "secure".to_string(),
    "public-room".to_string()
];

let discovery = NodeDiscovery::new(
    node_id.to_string(),
    endpoint.to_string(), 
    tags
);
```

### 2. 发布节点到网络

```rust
// 发布当前节点信息
discovery.publish_self().await?;

// 启动后台维护任务
discovery.start_background_tasks().await;
```

### 3. 查询其他节点

```rust
// 查找具有特定标签的节点
let target_tags = vec!["arc-chat".to_string(), "file-sharing".to_string()];
let nodes = discovery.discover_by_tags(&target_tags).await?;

for node in nodes {
    println!("发现节点: {} @ {}", node.node_id, node.endpoint);
    println!("标签: {:?}", node.tags);
    
    // 计算匹配分数
    let score = TagMatcher::match_score(&node, &target_tags);
    println!("匹配分数: {:.2}", score);
}
```

## 高级用法

### 标签匹配策略

```rust
use arc::discovery::TagMatcher;

let node_tags = vec!["chat", "secure", "fast"];
let search_tags = vec!["chat", "voice"];

// 检查是否匹配任一标签
let matches_any = TagMatcher::matches_any(&node, &search_tags);

// 检查是否匹配所有标签  
let matches_all = TagMatcher::matches_all(&node, &search_tags);

// 计算匹配分数 (0.0 - 1.0)
let score = TagMatcher::match_score(&node, &search_tags);
```

### 动态更新标签

```rust
// 更新节点标签
let new_tags = vec![
    "arc-chat".to_string(),
    "file-sharing".to_string(),  // 新增功能
    "high-performance".to_string()
];

discovery.update_tags(new_tags);
discovery.publish_self().await?;  // 重新发布
```

### 复杂查询

```rust
// 获取所有发现的节点
let all_nodes = discovery.get_discovered_nodes();

// 自定义过滤条件
let filtered_nodes: Vec<_> = all_nodes
    .iter()
    .filter(|node| {
        // 必须支持聊天功能
        node.tags.contains(&"arc-chat".to_string()) &&
        // 且支持文件分享或语音
        (node.tags.contains(&"file-sharing".to_string()) ||
         node.tags.contains(&"voice".to_string()))
    })
    .collect();

// 按匹配分数排序
let target_features = vec!["fast", "secure", "reliable"];
let mut scored_nodes: Vec<_> = all_nodes
    .iter()
    .map(|node| (node, TagMatcher::match_score(node, &target_features)))
    .collect();

scored_nodes.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
```

## 标签分类建议

### 功能标签
- `arc-chat` - 支持聊天功能
- `file-sharing` - 文件分享功能  
- `voice` - 语音通话功能
- `video` - 视频通话功能
- `screen-share` - 屏幕分享

### 特性标签
- `secure` - 高安全性
- `anonymous` - 匿名性支持
- `fast` - 高性能
- `reliable` - 高可靠性
- `low-latency` - 低延迟

### 网络标签
- `public-room` - 公开聊天室
- `private-room` - 私密聊天室
- `bridge` - 网络桥接节点
- `gateway` - 网关节点
- `proxy` - 代理节点

### 技术标签
- `webrtc` - WebRTC 支持
- `tor` - Tor 网络支持
- `ipfs` - IPFS 存储
- `blockchain` - 区块链集成

## 运行测试

项目提供了多种测试模式：

### 基础演示
```bash
cargo run --bin discovery_test demo
```

### 创建专门化节点
```bash  
cargo run --bin discovery_test create
```

### 高级查询测试
```bash
cargo run --bin discovery_test query  
```

### 单节点测试
```bash
cargo run --bin discovery_test single
```

### 测试网络
```bash
cargo run --bin discovery_test network
```

## 最佳实践

### 1. 标签设计原则
- **简洁明确**: 使用简短、易理解的标签
- **层次化**: 从通用到具体，如 `arc-chat` → `text` → `emoji-support`
- **标准化**: 团队内统一标签命名规范
- **版本兼容**: 考虑向后兼容性

### 2. 网络优化
- **合理频率**: 不要过于频繁地发布更新
- **错峰操作**: 避免所有节点同时发布
- **本地缓存**: 缓存查询结果以减少网络请求
- **故障转移**: 实现多个发现机制的备用方案

### 3. 安全考虑
- **验证节点**: 连接前验证节点身份
- **限制连接**: 限制同时连接的节点数量
- **监控异常**: 检测恶意节点行为
- **数据加密**: 节点间通信使用加密

### 4. 扩展性设计
- **分层架构**: 支持超级节点和普通节点
- **地理分布**: 考虑网络延迟和地理位置
- **负载均衡**: 分散请求到多个节点
- **动态扩容**: 支持网络规模动态变化

## 与现有系统集成

### Iroh 集成示例
```rust
use iroh::gossip::GossipEvent;

// 结合 Iroh 的 Gossip 协议
let gossip = node.gossip().clone();
let topic = format!("arc_discovery_{}", tag);

// 订阅发现主题
gossip.subscribe(topic.as_bytes().to_vec(), Vec::new()).await?;

// 监听节点加入/离开事件
let mut stream = gossip.subscribe_all().await?;
while let Some(event) = stream.next().await {
    match event? {
        GossipEvent::Joined(joined) => {
            // 新节点加入，更新本地缓存
        }
        GossipEvent::Left(left) => {
            // 节点离开，清理缓存
        }
        // 处理其他事件...
    }
}
```

### pkarr 集成示例
```rust
use pkarr::{PublicKey, SignedPacket};

// 使用 pkarr 发布节点信息
let mut records = HashMap::new();
records.insert("_service".to_string(), "arc-chat".to_string());
records.insert("_tags".to_string(), tags.join(","));
records.insert("_endpoint".to_string(), endpoint.to_string());

let packet = SignedPacket::new(&secret_key, records)?;
dht.put(public_key.to_z32(), packet.as_bytes()).await?;
```

## 故障排除

### 常见问题

1. **节点发现失败**
   - 检查 DHT 网络连接
   - 验证标签格式正确性
   - 确认防火墙设置

2. **节点信息过期**  
   - 检查时间戳同步
   - 调整刷新频率
   - 监控网络连接状态

3. **查询结果为空**
   - 确认目标标签存在
   - 检查网络分区问题
   - 验证查询语法

4. **性能问题**
   - 优化查询频率
   - 使用本地缓存
   - 减少并发查询数

通过以上指南，你可以在 Arc 项目中实现强大的基于标签的节点发现功能，支持灵活的 P2P 网络构建和节点管理。
