use std::{collections::{HashSet, VecDeque}, fs::{self, File}, io::Write, sync::Arc};
use air::conf::cfg_or;
use base::{db::Store, util::time::now};
use futures::SinkExt;
use tokio::sync::{broadcast::{self, Sender}, mpsc::{self}};
use futures::stream::{SplitSink, StreamExt};
use axum::{extract::{ws::{Message, WebSocket}, DefaultBodyLimit, Multipart, Path, State, WebSocketUpgrade}, response::Response, routing::{any, get, post}, Json, Router};
use tokio_util::sync::CancellationToken;
use crate::{err::{AppErr, AppResult}, model::Kid, util::{b64_url_u8_32, u8_b64}};
use crate::model::{Msg, PubRoom, WsMsg};
use super::AppCtx;

const ROOM_CH_SIZE: usize = 100;
const USER_CH_SIZE: usize = 100;
pub const INVITATION_TBL: &str = "Invitation";
pub const BLOCKED_TBL: &str = "Blocked";

pub type RoomTxMap = dashmap::DashMap<String, broadcast::Sender<WsMsg>>;
pub type UserTxs = dashmap::DashMap<Kid, mpsc::Sender<WsMsg>>;

pub fn router() -> Router<Arc<AppCtx>> {
    Router::new()
        .route("/hi", get(|| async { "Hello, World!" }))
        .route("/upload", post(upload).layer(DefaultBodyLimit::disable())) // disable req body limit
        .route("/{nick}/k/{kid}", any(ws_handler))
}
async fn upload(mut multipart: Multipart) -> AppResult<Json<Vec<String>>>{ //only for pub-room
    let mut file_urls = Vec::new();
    let max_file_size = cfg_or("room.max_upload_file_size", 20); //unit: MB
    while let Some(field) = multipart.next_field().await? {
        if let Some(f_name) = field.file_name(){
            // println!("{:?}", field.content_type());
            let mut res_type = "other".to_string();
            let cont_type = match field.content_type()  {
                Some(cont_type) => { cont_type.to_string() }
                _ => { continue }
            };
            if let Some((t,_)) = cont_type.split_once('/') {
                res_type = t.to_string();
            }
            let file_name = f_name.to_string();
            let data = field.bytes().await?;
            if data.len() > max_file_size * 1024 * 1024 {
               return Err(AppErr::UploadFail(format!("File is too large, size should less than {max_file_size}MB.")));
            }
            // println!("Length of `{}` is {} bytes", file_name, data.len());
            let path = format!("res/{res_type}");
            let dist_file = format!("{path}/{file_name}");
            fs::create_dir_all(path)?;
            let mut file = File::create(dist_file.clone())?;
            file.write_all(&data)?;
            file_urls.push([dist_file, cont_type].join("|"));
        }
    }
    Ok(Json(file_urls))
} 
async fn ws_handler(ws: WebSocketUpgrade, State(state): State<Arc<AppCtx>>, Path((nick,kid)): Path<(String,String)>) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state, nick, kid))
}
fn check_blocked(store: &Store, kid_loc: &str, blocked_limit: usize, blocked_period:i64) -> Option<(usize,i64)> {
    let now = now();
    if let Ok((cnt, ts)) = store.find_in::<(usize, i64)>(BLOCKED_TBL, kid_loc)
        && cnt >= blocked_limit { //is blocked
            if now < blocked_period + ts {
                return Some((cnt, ts))
            }else { //released from jail. reset
                let _ = store.save_in(BLOCKED_TBL, kid_loc, &(0, now));
            }
        }
    None
}
async fn handle_socket(socket: WebSocket, state: Arc<AppCtx>, nick: String, kid_safe: String) {
    let blocked_limit = cfg_or("room.blocked_limit", 5);
    let blocked_period = cfg_or::<i64>("room.blocked_period", 60 * 60 * 24) * 1000; //one day
    let kid_buf = b64_url_u8_32(&kid_safe)
        .unwrap_or_else(|_| panic!("Invalid KID: {kid_safe} for {nick}"));
    let kid_local = u8_b64(&kid_buf);
    let (mut sender, mut receiver) = socket.split();
    if let Some((cnt, ts)) = check_blocked(&state.store, &kid_local, blocked_limit, blocked_period) {
        send_to_client(&WsMsg::Ban { kid: kid_buf, remaining_time: ts+blocked_period.saturating_sub(now()), blocked_cnt: cnt }, &mut sender).await;
        return 
    }

    let (i_tx, mut i_rx) = mpsc::channel::<WsMsg>(USER_CH_SIZE);
    let token = CancellationToken::new();
    let mut room_set = HashSet::<String>::new();
    let rm_max_cached_msgs = cfg_or("room.max_cached_msgs", 100);
    
    state.user_txs.insert(kid_buf, i_tx.clone());

    //send cached msgs
    if let Ok(cached_inv_msgs) = state.store.find_in::<Vec<WsMsg>>(INVITATION_TBL, &kid_local){
        for ws_msg in cached_inv_msgs {
            send_to_client(&ws_msg, &mut sender).await;
        }
        if let Err(e) = state.store.remove_in(INVITATION_TBL, &kid_local) { //clear
            log::error!("remove cached invitation msgs failed, err: {e:?}");
        } 
    }
    
    let room_listener = |room_tx: Sender<WsMsg>| {
        let mut room_rx = room_tx.subscribe();
        let task_token = token.clone();
        let task_i_tx = i_tx.clone();
        tokio::spawn(async move { // room listener
            tokio::select! {
                _ = task_token.cancelled() => {
                    // println!("ws::task_group aborted. client: {nick}");
                },
                _ = async { //room chat
                    while let Ok(ws_msg) = room_rx.recv().await {
                        // if let WsMsg::Welcome { ref kid, ..} = ws_msg
                        //     && kid == &kid_buf { continue }  // skip self-welcome
                        if let WsMsg::Chat { msg:Msg{wisper:Some(ref w_kid), kid, ..}, .. } = ws_msg
                            && w_kid != &kid_buf && kid != kid_buf  { continue } // only send to wisperers
                        if task_i_tx.send(ws_msg).await.is_err() { break }
                    }
                } => {task_token.cancel();},
            }
        });
    };
    let get_room_tx = |room: &String| {
        match state.txs.get(room){
            Some(v) => v.clone(),
            None => {
                let (tx, _) = broadcast::channel(ROOM_CH_SIZE);
                state.txs.insert(room.clone(), tx.clone());
                tx
            }
        }
    };
    
    // Set up message forwarding
    let task_token = token.clone();
    tokio::spawn(async move { // rendezvous point
        tokio::select! {
            _ = task_token.cancelled() => {
                // println!("ws::task_group aborted");
            },
            _ = async { //self-talks & room chat
                while let Some(msg) = i_rx.recv().await {
                    // println!("sending: {msg:?}");
                    if !send_to_client(&msg, &mut sender).await { break }
                    if let WsMsg::Ban {..} = msg { break }  // This Kid has been blocked
                }
            } => { task_token.cancel(); }, 
        }
    });

    tokio::select! {
        _ = token.cancelled() => {
            // println!("ws::msg_handler aborted");
        },
        _ = async {
            // Handle incoming messages
            'msg_handler: while let Some(Ok(Message::Binary(data))) = receiver.next().await {
                // let mut de = rmp_serde::Deserializer::from_read_ref(&data).with_human_readable();
                // let rmp_msg_result = Deserialize::deserialize(&mut de);
                if let Ok(ws_msg) = rmp_serde::from_slice::<WsMsg>(&data){
                    // println!("recv ws_msg: {ws_msg:?}");
                    match ws_msg {
                        WsMsg::Bye => break,
                        WsMsg::Listen{ref room, ref kind} => {
                            if PubRoom::verify(&state.store, room, kind).is_ok() && !room_set.contains(room) {
                                let room_tx = get_room_tx(room);
                                room_listener(room_tx.clone());
                                // println!("listen to {room:?} for {nick}");
                                let rm_user = (nick.clone(), kid_local.clone()); //for invite
                                if let Some(mut users) = state.rm_users.get_mut(room) {
                                    users.push(rm_user);
                                }else{
                                    state.rm_users.insert(room.into(), vec![rm_user]); //7144336
                                }
                                //notify others in this room
                                // if room_tx.send(WsMsg::Welcome { nick: nick.clone(), kid: kid_local.clone() }).is_err()  { break 'msg_handler }
                                room_set.insert(room.into());
                            }
                        },
                        WsMsg::Media { ref kid,  .. } => { //only for priv-chat
                            // println!("Media Msg:{kid}");
                            if let Some(kid_tx) = state.user_txs.get(kid)
                                && kid_tx.send(ws_msg.clone()).await.is_err() { break }
                        }
                        WsMsg::PrivChat { ref kid,  ref msg, ..  } => {
                            if let Some(kid_tx) = state.user_txs.get(kid)
                                && kid_tx.send(ws_msg.clone()).await.is_ok() { //sent ok
                                if i_tx.send(ws_msg).await.is_err() { break } //send to me
                             }else if i_tx.send(
                                 WsMsg::PrivChat { kid: *kid, state: 1, msg: msg.clone() } //modified if partner is offline
                             ).await.is_err() { break } //fail sent, update state
                        },
                        WsMsg::Chat { ref room, ref msg } => { // room chato
                            if let Some(mut msgs) = state.caches.get_mut(room) {
                                // we only cache 100 msgs for each room by far, you can change it from config file
                                if msgs.len() ==  rm_max_cached_msgs { //ring buffer
                                    msgs.pop_front();
                                }
                                msgs.push_back(msg.clone());
                            }else{ //init
                                let mut msgs = VecDeque::with_capacity(rm_max_cached_msgs); //create ring buffer with config
                                msgs.push_back(msg.clone());
                                state.caches.insert(room.clone(), msgs);
                            }
                            let room_tx = get_room_tx(room);
                            if room_tx.send(ws_msg).is_err()  { break 'msg_handler }
                        },
                        WsMsg::Invite { ref kid, .. } | WsMsg::Reply { ref kid, .. } | WsMsg::InviteTracking { ref kid, .. } | WsMsg::Engagement { ref kid, .. } => {
                            if let Some(kid_tx) = state.user_txs.get(kid){ //online
                                 if kid_tx.send(ws_msg.clone()).await.is_err() { break}
                            }else { //offline, should cached invitation msg for better user experience
                                if cache_invite_msg(&state.store, &u8_b64(kid),  ws_msg).is_err() { break };
                            }
                        },
                        WsMsg::Block { kid, act } => {
                            if kid == kid_buf { continue; } //cannot (un)block self
                            let mut blocked_cnt = 0;
                            let now = now();
                            if state.store.save_within::<(usize, i64)>(BLOCKED_TBL, &u8_b64(kid.as_slice()), |opt| {
                                if let Some((cnt, ts)) = opt {
                                    if act == 0 { //block
                                        *cnt += 1;
                                        *ts = now;
                                    }else { //unblock, no need update ts
                                        *cnt = cnt.saturating_sub(1);
                                    }
                                    blocked_cnt = *cnt;
                                }
                            }, (0, now)).is_err() { break };
                            if blocked_cnt >= blocked_limit
                                && let Some(kid_tx) = state.user_txs.get(&kid)
                                     && kid_tx.send(WsMsg::Ban { kid, remaining_time: blocked_period, blocked_cnt}).await.is_err() { break }
                        }
                        WsMsg::Stat(room) => { // stat online users
                            let room_tx = get_room_tx(&room);
                            let rx_cnt = room_tx.receiver_count();
                            if i_tx.send(WsMsg::Rsp(format!("onlines:{rx_cnt}"))).await.is_err() { break }
                        },
                        _ => {}
                    }
                }
            }
        } => { token.cancel();}
    }

    for room in room_set{ //remove user from all listened rooms
        if let Some(mut users) = state.rm_users.get_mut(&room){
            users.retain(|(_nick, kid_b64)| kid_local != *kid_b64);
        }
    }
    // println!("rm_users: {:?}", state.rm_users);
    state.user_txs.remove(&kid_buf);
    token.cancel();
    println!("{nick} is offline");
}
async fn send_to_client(msg: &WsMsg, sender: &mut SplitSink<WebSocket,Message>) -> bool {
    match rmp_serde::to_vec_named(msg) {
        Ok(enc) => {
            if sender.send(Message::Binary(enc.into())).await.is_err() {
                return false;
            }
        }
        Err(e) => {
            log::error!("try encode msg failed. err: {e}");
        },
    }
    true
}
fn cache_invite_msg(store: &Store, kid_b64: &str, ws_msg: WsMsg) -> AppResult<()>{
    match store.find_in::<Vec<WsMsg>>(INVITATION_TBL, kid_b64) {
        Ok(mut ws_msgs) => {
            if ws_msgs.contains(&ws_msg) { //should replace with new one
                ws_msgs.iter_mut().find(|m| *m == &ws_msg).map(|_| ws_msg);
            }else{
                ws_msgs.push(ws_msg);
                store.save_in(INVITATION_TBL, kid_b64, &ws_msgs)?;
            }
        }
        Err(_) => {
            store.save_in(INVITATION_TBL, kid_b64, &vec![ws_msg])?;
        }
    };
    Ok(())
}
