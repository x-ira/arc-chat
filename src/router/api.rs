use std::sync::Arc;
use serde::Deserialize;
use axum::{
    extract::{Path, Query, State}, routing::{get, post}, Json, Router
};
use crate::{err::{AppErr, AppResult}, model::{Msg, PubRoom, PubRoomKind}, util::b64_url_u8_32, PeerInfo, PEER_NODES_KEY};
use super::{AppCtx, AppState};

pub const PUB_ROOMS_KEY: &str = "pub_rooms";

// prefix: /api
pub fn router() -> Router<Arc<AppCtx>>{
	Router::new()
    .route("/query_peers", get(query_peers))
    .route("/stat", get(stat_room))
    .route("/create_room",post(create_room))
    .route("/admin_room",post(admin_room))
    .route("/query_rooms", get(query_rooms))
    .route("/join_room", post(join_room))
    .route("/load_room/{rm_id}", get(load_room))
    .route("/room_onlines", get(room_onlines))
    .route("/history_msgs", get(history_msgs))
    .route("/chg_pwd", post(chg_pwd))
}
#[derive(Debug, Deserialize)]
struct ChatQuery{
    room: String,
}
async fn room_onlines(State(state): State<Arc<AppCtx>>, Query(param): Query<ChatQuery>) -> AppResult<Json<Vec<(String, String)>>> {
    let onlines = match state.rm_users.get(&param.room) {
        Some(users) => users.clone(),
        _ => [].into(),
    };
    Ok(Json(onlines))
}
#[derive(Debug, Deserialize)]
struct MsgQuery{
    room: String,
    kid_loc: String, //b64url
    rest: Option<usize>,
}
/// resturn rest msg len & lastest msgs
/// we DO NOT persistent user's msgs. just cache few msgs for convenience
async fn history_msgs(State(state): AppState, Query(MsgQuery{ room, kid_loc, rest }): Query<MsgQuery>) -> AppResult<Json<(usize,Vec<Msg>)>>{
    let kid_req = b64_url_u8_32(&kid_loc)?;
    if let Some(msgs) = state.caches.get(&room) { //be careful the empty case
        let tot = msgs.len();
        let mut taked = 0; 
        let mut skipped = 0; 
        let mut bat = Vec::new();
        let rest = if let Some(r) = rest { r } else { tot };
        for m in msgs.range(..rest).rev() {
            let is_matched = if m.wisper.is_none() { true }
                             else if let Some(w) = m.wisper && (w == kid_req || m.kid == kid_req) { true }
                             else { false };
            if is_matched {
                taked += 1;
                bat.push(m.clone());
            }else{
                skipped += 1;
            }
            if taked == 10 { break }
        }
        bat.reverse();
        Ok(Json((rest.saturating_sub(bat.len() + skipped), bat)))
    }else{
        Ok(Json((0, Vec::new())))
    }
}
async fn create_room(State(state): AppState, Json(room): Json<PubRoom>) -> AppResult<String>{
    let store = &state.store;
    match store.find::<Vec<PubRoom>>(PUB_ROOMS_KEY) {
        Ok(mut rooms) => {
            if rooms.contains(&room) {
                return Err(AppErr::DuplicatedRoom(format!("`{}` already existed.", room.name)))
            }else{
                rooms.push(room);
                store.save(PUB_ROOMS_KEY, &rooms)?;
            }
        }
        Err(_) => {
            store.save(PUB_ROOMS_KEY, &vec![room])?;
        }
    };
    Ok("Done".into())
}
#[derive(Debug, Deserialize)]
struct AdminRoom {
    id: String,
    token: String, //hash
    name: String,
    desc: String,
    state: u8,
    kind: PubRoomKind,
}
async fn admin_room(State(app_state): AppState, Json(AdminRoom { id, token, name, desc, state, kind }): Json<AdminRoom>) -> AppResult<String>{
    let store = &app_state.store;
    if let Ok(mut rooms) = store.find::<Vec<PubRoom>>(PUB_ROOMS_KEY) {
        if let Some(dist_rm) = rooms.iter_mut().find(|rm| rm.id == id && rm.token == token) {
            if dist_rm.kind.val() != kind.val(){
                return Err(AppErr::UnexpectedErr("Room kind cannot be modified".into()))
            }
            dist_rm.name = name;
            dist_rm.desc = desc;
            dist_rm.state = state;
            dist_rm.kind = kind;
            store.save(PUB_ROOMS_KEY, &rooms)?;
        }else{
            return Err(AppErr::AdminTokenVerifyFail(format!("Bad admin token for room: {}", id)))
        }
    }
    Ok("Done".into())
}
#[derive(Debug, Deserialize)]
struct JoinRoomParam {
    rm_id: String,
    rm_kind: PubRoomKind, //for verify 
}

async fn join_room(State(state): AppState, Json(param): Json<JoinRoomParam>) -> AppResult<Json<PubRoom>>{
    let mut jrm = PubRoom::verify(&state.store, &param.rm_id, &param.rm_kind)?;
    jrm.token.clear(); //without token
    Ok(Json(jrm))
}
async fn load_room(State(state): AppState, Path(rm_id): Path<String>) -> AppResult<Json<PubRoom>>{
    let rooms = state.store.find::<Vec<PubRoom>>(PUB_ROOMS_KEY)?;
    if let Some(mut rm) = rooms.iter().find(|rm| rm.id == rm_id). cloned(){
        rm.token.clear();
        rm.salt.clear();
        if let PubRoomKind::EncryptedGroup(ref mut pin) = rm.kind {
            pin.clear();
        }
        return Ok(Json(rm))
    }
    Err(AppErr::RoomNotFound(format!("Room not found with id: {rm_id}")))
}
async fn stat_room(State(state): AppState) -> AppResult<String>{
    println!("{:?}", state.txs);
    Ok("Done".into())
}
#[derive(Debug, Deserialize)]
struct QueryParam{
    kw:String,
}
async fn query_rooms(State(state): AppState, Query(param): Query<QueryParam>) -> AppResult<Json<Vec<(String, String, char, String)>>>{
    let rooms = state.store.find::<Vec<PubRoom>>(PUB_ROOMS_KEY)?;
    let matched_rooms = rooms.iter().filter(|rm| rm.name.contains(&param.kw) || param.kw.is_empty() )
       .cloned() 
       .map(|rm| {  
           (rm.name, rm.desc, rm.kind.val(), rm.id)
        }) 
       .collect(); 
    Ok(Json(matched_rooms))
}
async fn query_peers(State(state): AppState, Query(param): Query<QueryParam>) -> AppResult<Json<Vec<PeerInfo>>>{
    let peers = state.store.find::<Vec<PeerInfo>>(PEER_NODES_KEY)?;
    let matched_peers = peers.iter().filter(|node| node.meta.desc.contains(&param.kw) || param.kw.is_empty() )
       .cloned() 
       .collect(); 
   Ok(Json(matched_peers))
}
#[allow(unused_assignments)]
#[derive(Debug, Deserialize)]
struct ChgPwdParam{
    user:String,
    new_pass:String,
}
async fn chg_pwd(State(state): AppState, Json(param):Json<ChgPwdParam>) -> AppResult<String> {
    state.store.save_in("user", &param.user, &param.new_pass)?;
    Ok("Done".into())
}

#[test]
/// cargo t -- --test <fn_name>
fn enum_compare() {
    let rm_kind = PubRoomKind::EncryptedGroup("pin_hash_1".into());
    let rm_kind_2 = PubRoomKind::EncryptedGroup("pin_hash_1".into());
    assert!(matches!(&rm_kind, PubRoomKind::EncryptedGroup(ph) if ph == "pin_hash_1"));
    assert!(rm_kind == rm_kind_2); //impl PartialEq
}
