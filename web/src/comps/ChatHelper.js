import { hash, Ecdh, Ecdsa } from "xira-crypto-wasm";
import { Time, u8_b64 } from "../utils/app";
import { ecdh } from "../stores/chat";

export const me = (m) => u8_b64(m.kid) == dsa.skid; 
export const m_io = (m) => {
  let cls = me(m) ? 'm_out':'m_in';
  if(m.wisper) {
    cls += ' wisper';
  }
  return cls;
};
export const inv_sign = async (kid, by_nick, greeting) => {
  let by_kid = dsa.vk;
  let i = {ts: Time.ts(), by_kid, by_nick, greeting};
  i.pub_key = ecdh(kid).pub_key; 
  let inv_hash = hash([i.pub_key, kid, by_kid, new TextEncoder().encode(i.ts)]); //no need to sort
  i.sign = await dsa.sign(inv_hash);
  return {kid, inv: i};
}
//verify msg_hash & sign
export const inv_verify = (i) => {
  let inv_hash = hash([i.pub_key, dsa.vk, i.by_kid, new TextEncoder().encode(i.ts)]);
  return Ecdsa.verify(i.by_kid, inv_hash, i.sign); // different device time may have a deviation, Time.ts() > i.ts
}
export const inv_track_sign = async (kid, by_nick, state) => {
  let by_kid = dsa.vk;
  let i = {kid, ts: Time.ts(), by_kid, by_nick, state};
  let inv_hash = hash([kid, by_kid, state, new TextEncoder().encode(i.ts)]); //no need keeping order
  i.sign = await dsa.sign(inv_hash);
  return i;
}
//verify msg_hash & sign for tracking
export const inv_track_verify = (i) => {
  let inv_hash = hash([dsa.vk, i.by_kid, i.state, new TextEncoder().encode(i.ts)]);
  return Ecdsa.verify(i.by_kid, inv_hash, i.sign);
}
