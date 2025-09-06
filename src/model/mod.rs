use base::db::Store;
use serde::{Deserialize, Serialize};
use serde_bytes::ByteBuf;

use crate::{err::{AppErr, AppResult}, router::api::PUB_ROOMS_KEY};
pub type Kid = [u8;32];

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub enum PubRoomKind {
    OpenGroup,
    EncryptedGroup(String), //pin_hash for verification
}
impl PubRoomKind {
    pub fn val(&self) -> char {
        match self {
            PubRoomKind::OpenGroup => 'o',
            PubRoomKind::EncryptedGroup(_) => 'e',
        }
    }
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PubRoom{
    pub name: String,
    pub state: u8, //0: inactive, 1: active
    #[serde(default = "nano_id")]
    pub id: String,
    pub salt: String,
    pub token: String, //hash for admin verification
    pub kind: PubRoomKind,
    pub desc: String, 
    #[serde(default = "base::util::time::now")]
    pub update_at: i64, //track inactive period
}
impl PubRoom {
    pub fn verify(store: &Store, rm_id: &str, rm_kind: &PubRoomKind) -> AppResult<Self> {
        let rooms = store.find::<Vec<PubRoom>>(PUB_ROOMS_KEY)?;
        rooms.iter().find(|rm| {
            rm.id == rm_id && rm.kind == *rm_kind   //kind is necessary for verification
        }).cloned().ok_or(AppErr::JoinRoomFail("Pass code is invalid.".into()))
    }
}
impl PartialEq for PubRoom {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}
// #[derive(Debug, Clone, Serialize, Deserialize)]
// pub enum PrivChatMsgState {
//     Normal,
//     Offline, //Parter is offline,
//     Rejected,
// }
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WsMsg {
    Bye,
    Listen{ room: String, kind: PubRoomKind }, //for group
    PrivChat{ kid: Kid, state: u8,  msg: Msg}, //state-> 0: normal, 1: offline, 2: rejected
    Media { kid: Kid, by_kid: Kid, id: String, cont_type: String, data: ByteBuf },
    Chat{ room: String, msg: Msg},
    Stat(String), //room-id
    Invite{ kid: Kid, inv: Invitation}, //priv-chat
    Reply{ kid: Kid, inv: Invitation}, //priv-chat
    InviteTracking { kid: Kid, by_kid: Kid, state: u8, sign: ByteBuf, ts:i64 }, //priv-chat
    Welcome { nick: String, kid: Kid },
    Rsp(String),
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invitation{
    pub by_kid: Kid, //sender
    pub by_nick: String, //sender nick as Chat-Name
    pub_key: Kid, // edch pubk of sender
    
    ts: i64,
    sign: ByteBuf, //for verify sender
    greeting: Option<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Msg {
    pub nick: String, //sender
    pub kid: Kid, //sender
    #[serde(with = "serde_bytes")]
    pub cont: ByteBuf,
    pub kind: MsgKind,
    pub ts: i64,
    pub wisper: Option<Kid>, //wisperer kid
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MsgKind {
    Txt,
    Img,
    Voi,
    Aud,
    Vid,
}
pub fn nano_id() -> String {
    nanoid::nanoid!()
}

#[test]
/// cargo t -- --test <fn_name>
fn serde_nanoid() {
    // println!("{}");
}
