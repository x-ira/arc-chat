import { hash, Ecdsa } from "xira-crypto-wasm";
import { b64_u8, b64_url_u8, Time, u8_b64 } from "../utils/app";
import { get_ecdh } from "../utils/main";

export const me = (m) => u8_b64(m.kid) == dsa.skid; 
export const m_io = (m) => {
  let cls = me(m) ? 'm_out':'m_in';
  if(m.wisper) {
    cls += ' wisper';
  }
  return cls;
};
export const engagement_sign = async (skid, kid, pub_key, by_nick) => {
  let by_kid = dsa.vk;
  let e = {kid, ts: Time.ts(), by_kid, by_nick, pub_key};
  let ecdh = await get_ecdh(skid);
  e.by_pub_key = ecdh.pub_key; 
  let eng_hash = hash([pub_key, e.by_pub_key, kid, by_kid, new TextEncoder().encode(e.ts)]); //no need to sort
  e.sign = await dsa.sign(eng_hash);
  return e;
}
//verify msg_hash & sign
export const engagement_verify = (e) => {
  let eng_hash = hash([e.pub_key, e.by_pub_key, dsa.vk, e.by_kid, new TextEncoder().encode(e.ts)]);
  return Ecdsa.verify(e.by_kid, eng_hash, e.sign); // different device time may have a deviation, Time.ts() > i.ts
}
export const inv_sign = async (kid, by_nick, greeting) => {
  let by_kid = dsa.vk;
  let i = {ts: Time.ts(), by_kid, by_nick, greeting};
  let ecdh = await get_ecdh(u8_b64(kid));
  i.pub_key = ecdh.pub_key; 
  let inv_hash = hash([i.pub_key, kid, by_kid, new TextEncoder().encode(i.ts)]); //no need to sort
  i.sign = await dsa.sign(inv_hash);
  return {kid, inv: i};
}
//verify msg_hash & sign
export const inv_verify = (i) => {
  let inv_hash = hash([i.pub_key, dsa.vk, i.by_kid, new TextEncoder().encode(i.ts)]);
  return Ecdsa.verify(i.by_kid, inv_hash, i.sign); // different device time may have a deviation, Time.ts() > i.ts
}
export const inv_track_sign = async (kid, by_nick, state, tracker) => {
  let by_kid = dsa.vk;
  let i = {kid, ts: Time.ts(), by_kid, by_nick, state};
  let key_data = [kid, by_kid, state, new TextEncoder().encode(i.ts)];
  if(tracker) {
    key_data.push(tracker);
    i.tracker = tracker;
  }
  let it_hash = hash(key_data); //no need keeping order
  i.sign = await dsa.sign(it_hash);
  return i;
}
//verify msg_hash & sign for tracking
export const inv_track_verify = (i) => {
  let key_data = [dsa.vk, i.by_kid, i.state, new TextEncoder().encode(i.ts)];
  if(i.tracker) {
    key_data.push(i.tracker);
  }
  let inv_hash = hash(key_data);
  return Ecdsa.verify(i.by_kid, inv_hash, i.sign);
}
