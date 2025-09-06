mod router;
mod model;
mod err;
mod server;
mod util;

use std::{net::Ipv4Addr, str::FromStr, sync::Arc, time::Duration};
use air::conf::cfg_or;
use base::{db::Store, req::WebReq};
use err::AppResult;
use futures::StreamExt;
use mainline::{async_dht::AsyncDht, Dht, Id};
use serde::{Deserialize, Serialize};
use server::start_chat_server;
use tokio::time;

const ARC_DAPP_ID: &str = "xira-arc-dapp"; //Mitrá 
const ARC_DAPP_INFO_HASH: &str = "13cedb3023117985183a6f4e800e6255166fda04";
pub const PEER_NODES_KEY: &str = "peer-nodes"; 

#[tokio::main]
async fn main() -> AppResult<()> {
    let _logger = air::logger::def_init();
    let app = cfg_or("app.name", "Arc");
    let lan_port = cfg_or("app.lan_port", 1934);
    let wan_port = cfg_or("app.wan_port", 2000);
    let store = Arc::new(Store::new(app));

    if cfg_or("peer_mode", true) {
        start_peer_task(wan_port, store.clone()).await; 
    }
    start_chat_server(app, lan_port, store).await
}
async fn start_peer_task(wan_port: u16, store: Arc<Store>) {
    let dht = Dht::client().expect("create Dht client failed.").as_async();
    let info_hash = Id::from_str(ARC_DAPP_INFO_HASH).expect("error info hash");
    tokio::spawn(async move{
        let mut timer_infohash = time::interval(Duration::from_secs(60 * 30));
        let mut timer_check_infohash = time::interval(Duration::from_secs(60 * 60 * 24));
        loop{
            tokio::select! {
                _ = timer_check_infohash.tick() => { // make sure info_hash is existed
                    if let Err(e) = try_get_immutable(&dht, info_hash).await {
                        log::error!("Infohash publish has an err: {e}");
                    }
                }
                _ = timer_infohash.tick() => { // announe ownership, then get peers
                    // println!("=={info_hash}==");
                    if let Err(e) = dht.announce_peer(info_hash, Some(wan_port)).await { //announce this node is arc node
                        log::error!("Announce node has an err: {e}");
                    }
                    let peers = refresh_peers(&dht, &info_hash).await;
                    if let Err(e) = store.save(PEER_NODES_KEY, &peers) {  //save loaded peers into store for roaming use
                        log::error!("Save peer-infos has an err: {e}");
                    }
                }
        
            };
        }
    });
}
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct NodeMeta{
    name: String, 
    domain_url: Option<String>,
    desc: String,
    onlines: usize,
    tot_rooms: usize,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PeerInfo {
    ip: String,
    port: u16,
    meta: NodeMeta,
}

impl PartialEq for PeerInfo {
    fn eq(&self, other: &Self) -> bool {
        self.ip == other.ip //same ip as same peer
    }
}
async fn refresh_peers(dht: &AsyncDht, info_hash: &Id) -> Vec<PeerInfo> {
    let mut peers = Vec::new();
            
    if let Some(found_peers)  = dht.get_peers(*info_hash).next().await{
        // println!("---found peers---{:?}", found_peers);
        //try load metadata from target peer
        for peer in found_peers {
            if let Some(node_meta) = load_meta_data(*peer.ip(), peer.port()).await{
                let peer_info = PeerInfo { ip: peer.ip().to_string(), port: peer.port(), meta: node_meta};
                // println!("{peer_info:?}");
                if !peers.contains(&peer_info) { // one ip as one peer
                    peers.push(peer_info);
                }
            }
        }
    }
    peers
}
/// meta: channels count, online users, etc
async fn load_meta_data(host: Ipv4Addr, port: u16) -> Option<NodeMeta> {
    let url = format!("http://{host}:{port}/meta");
    if let Ok(wr) = WebReq::new(1){
        return wr.get_json::<NodeMeta>(&url).await.ok()
    }
    None
}
async fn try_get_immutable(dht: &AsyncDht, info_hash: Id) ->  Result<(), mainline::errors::PutQueryError> {
    // No need to stream responses, just print the first result, since
    // all immutable data items are guaranteed to be the same.
    if dht.get_immutable(info_hash).await.is_none(){
        dht.put_immutable(ARC_DAPP_ID.as_bytes()).await?;
        log::info!("put info hash to DHT.");
    }
    Ok(())
}
