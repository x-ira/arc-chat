use axum::{extract::multipart::MultipartError, http::StatusCode, response::IntoResponse};

pub type AppResult<T> = Result<T, AppErr>;

#[derive(Debug)]
pub enum AppErr {
    UploadFail(String),
    StoreAccessErr(String),
    DuplicatedRoom(String),
    JoinRoomFail(String),
    RoomNotFound(String),
    EncodingErr(String),
    AdminTokenVerifyFail(String),
    UnexpectedErr(String),
}
impl IntoResponse for AppErr {
    fn into_response(self) -> axum::response::Response {
        let code = StatusCode::INTERNAL_SERVER_ERROR;
        let msg = match self{
            AppErr::StoreAccessErr(e) => e,
            AppErr::UploadFail(e) => e,
            AppErr::DuplicatedRoom(e) => e,
            AppErr::JoinRoomFail(e) => e,
            AppErr::EncodingErr(e) => e,
            AppErr::RoomNotFound(e) => e,
            AppErr::AdminTokenVerifyFail(e) => e,
            AppErr::UnexpectedErr(e) => e,
        };
        (code, msg).into_response()
    }
}
impl From<base::db::Error> for AppErr{
    fn from(err: base::db::Error) -> Self {
        Self::StoreAccessErr(err.to_string())    
    }
}
impl From<MultipartError> for AppErr {
    fn from(err: MultipartError) -> Self {
        Self::UploadFail(err.to_string())
    }
}
impl From<std::io::Error> for AppErr{
    fn from(err: std::io::Error) -> Self {
      Self::UploadFail(err.to_string())
    }
}
