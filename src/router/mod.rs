pub mod api;
pub mod ws;

use std::{collections::VecDeque, sync::Arc};
use axum::extract::State;
use base::db::Store;
use dashmap::DashMap;
use crate::{model::Msg, router::ws::{RoomTxMap, UserTxs}};

pub type AppState = State<Arc<AppCtx>>;

pub struct AppCtx {
  pub store: Arc<Store>,
  pub caches: DashMap<String, VecDeque<Msg>>, //history messages cache
  pub rm_users: DashMap<String, Vec<(String, String)>>, //(nick, kid_b64), for Priv-Chat Invite
  pub user_txs: UserTxs, //for Priv-Chat
  pub txs: RoomTxMap, //onlines
}
