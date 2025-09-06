// use std::time::{SystemTime, UNIX_EPOCH};

//re-exports
pub use base64ct::{Base64Url, Encoding};

use crate::err::{AppErr, AppResult};

// pub fn now() -> i64{
//     SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64
// }
/// u8->b64 : Base64::encode_string(data: &[u8])
// pub fn b64_u8(b64: &str) -> AppResult<Vec<u8>> {
//     Base64::decode_vec(b64).map_err(|e| AppErr::EncodingErr(e.to_string()))
// }
pub fn b64_url_u8_32(safe_b64: &str) -> AppResult<[u8;32]> {
    let mut buf = [0u8;32];
    Base64Url::decode(safe_b64, &mut buf).map_err(|e| AppErr::EncodingErr(e.to_string()))?;
    Ok(buf)
}
