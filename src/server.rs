use std::sync::Arc;
use air::conf::{cfg, cfg_or};
use axum::{extract::State, routing::get, Json, Router};
use dashmap::DashMap;
use tower_http::services::{ServeDir, ServeFile};
use base::db::Store;

use crate::{err::AppResult, model::PubRoom, router::{self, api::PUB_ROOMS_KEY, AppCtx, AppState}, NodeMeta};

pub async fn start_chat_server(app: &str, port:u16, store: Arc<Store>) -> AppResult<()>{
    let listen_on: String = format!("0.0.0.0:{port}"); 

    let state = Arc::new(AppCtx{
        store,
        txs: DashMap::new(), 
        caches: DashMap::new(),
        rm_users: DashMap::new(),
        user_txs: DashMap::new(),
    });

    log::info!("[{app}] stated. listening on <{listen_on}>");
    let dist_dir = ServeDir::new("dist").fallback(ServeFile::new("dist/index.html")); // fallback for cliet router!
    let res_dir = ServeDir::new("res").fallback(ServeFile::new("res/default.png"));

    let app = Router::new()
        .nest("/api", router::api::router())
        .route("/meta", get(node_meta))
        .nest_service("/res", res_dir)
        .route_service("/", dist_dir.clone()).fallback_service(dist_dir) //fallback_svc for assets
        .nest("/ws", router::ws::router()) //only dec content of msg
        .with_state(state);

    match tokio::net::TcpListener::bind(listen_on).await {
        Ok(listener) => {
            if let Err(e) = axum::serve(listener, app).await{
                log::error!("{e:?}");
            }
        }
        Err(e) => {
            log::error!("{e:?}");
        },
    }
    Ok(())
}
async fn node_meta(State(state): AppState) -> Json<NodeMeta> {
    let domain_url = cfg_or::<Option<String>>("meta.domain_url", None);
    let name = cfg::<String>("meta.name");
    let desc = cfg::<String>("meta.desc");
    let tot_rooms =
        if let Ok(rooms)  = state.store.find::<Vec<PubRoom>>(PUB_ROOMS_KEY) {
            rooms.len()
        }else {
            0
        };
    Json(NodeMeta { name, domain_url, desc, tot_rooms, onlines: state.txs.len()})
}
