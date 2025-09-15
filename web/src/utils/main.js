import {b64_ab, ab_b64, capitalize, u8_b64, b64_u8} from './app';
import {gen_key_b64, hash_b64, Ecdsa, StaticEcdh, Cipher as Chacha} from 'xira-crypto-wasm';
import { nanoid } from 'nanoid';
import { createStore, get as find, set } from 'idb-keyval';
import { unwrap } from 'solid-js/store';

window.meta = createStore('meta_store', 'meta');
find(0,meta); //init

export const nick_name = () => {
  let _nick = localStorage.getItem('nick');
  if(!_nick) {
    _nick = 'Avenger-' + Math.floor(Math.random() * 1000);
    localStorage.setItem('nick', _nick);
  }
  return _nick;
}
export const ecdsa = async () => {
  let sk = await find('sk', meta);
  let ecdsa = sk? new Ecdsa(sk): new Ecdsa(); //init
  if(!sk) {
    set('sk', ecdsa.sk, meta);
  }
  ecdsa.kid = ecdsa.vk;
  ecdsa.skid = ecdsa.verify_key; //b64 
  return ecdsa;
}
window.dsa = await ecdsa();
// non-find-mode: if not found create new one
export const get_ecdh = async (k, find_mode = false) => {
  let ecdhs = await find('ecdhs', meta);
  let ecdh;
  if(find_mode) {
    if(ecdhs && k) {
      ecdh = deserialize_ecdh(ecdhs, k);
      await set('ecdhs', ecdhs, meta);
      return ecdh;
    }
    return null;
  }
  if(!ecdhs) {
    ecdhs = {};
  }
  if(!k) {
     ecdh = new StaticEcdh();
     k = u8_b64(ecdh.pub_key); 
     ecdhs[k] = ecdh.to_bytes();
  }else if(!ecdhs[k]) {  //pub_key may consumed
     ecdh = new StaticEcdh(); 
     ecdhs[k] = ecdh.to_bytes(); // serialized for persistence
  }else{
    ecdh = deserialize_ecdh(ecdhs, k);
  }
  await set('ecdhs', ecdhs, meta);
  return ecdh;
}
function deserialize_ecdh(ecdhs, k) {
  let ecdh = StaticEcdh.from_bytes(ecdhs[k]);
  //should recycle after exchange for security
  delete ecdhs[k]; //always moved
  return ecdh;
}
export const expire_ecdh = async (k) => {
  let ecdhs = await find('ecdhs', meta);
  if(ecdhs && ecdhs[k]) delete ecdhs[k]; 
  await set('ecdhs', ecdhs, meta);
}
export async function ecdh_exchange(kid, rival_pub_key, find_mode){
  let k = adapt_b64(kid);
  let ecdh = await get_ecdh(k, find_mode);
  if(!ecdh) return null;
  let rmk = ecdh.exchange(rival_pub_key);
  return rmk;
}
/// type: 1,
// state: 0: pending, 1: waitting, 2: declined, 3: expired, 4. cancelled, 5. engaged  9. accepted
export class PrivChat{
  static async save(priv_chats) {
    await set('priv_chats', unwrap(priv_chats), meta);
  }
  static async list(){ //reverse for latest joined
    let chats = await find("priv_chats", meta);
    return chats ? chats.reverse() : [];
  }
  static async get(kid) {
    let list = await this.list();
    return list.find(chat => chat.kid == kid);
  }
}
export class Room{
  static async join(room) {
    let joined_rooms = await this.list();
    let idx = joined_rooms.findIndex(rm => rm.id == room.id);
    if(idx > -1) {
      joined_rooms[idx] = room; //update it to latest
    }else{
      joined_rooms.push(room);
    }
    await set("joined_rooms", joined_rooms, meta);
    return true;
  }
  static async list(){ //reverse for latest joined
    let rooms = await find("joined_rooms", meta);
    return rooms ? rooms.reverse() : [];
  }
  static async get(room_id) {
    const joined_rooms = await this.list();
    if(!room_id) return joined_rooms[0];
    return joined_rooms.find(rm => rm.id == room_id);
  }
}
export const PUB_ROOM_STATE = [ 
  [0, 'Inactived'],
  [1, 'Actived'],
];
export const PUB_ROOM_KINDS = [ // vs: private chat
  ['o', 'Open Group'],
  ['e', 'Secured Group'], //Guarded
];
export class RoomKind{
  static list() {
    return PUB_ROOM_KINDS;
  }
  static val(kind) {
    if(kind.hasOwnProperty('EncryptedGroup')) {
      return 'e';
    }else {
      return 'o';
    }
  }
  static to_kind(val, pin) {
    if(val == 'e') {
      let pin_hash = hash_b64(pin);
      return {EncryptedGroup: pin_hash};
    }else{
      return 'OpenGroup';
    }
  }
  static get(k) {
    let kind = PUB_ROOM_KINDS.find(e=> e[0] == k);
    if(kind) {
      return kind[1];
    }else{
      return '';
    }
  }
}
export class Cipher{
  constructor(key_b64) {
    this._key_32_u8 = b64_ab(key_b64);
    this.cipher = new Chacha(this._key_32_u8);
  }
  enc_u8(plain_txt) {
    if(!plain_txt) return '';
    return this._enc(utf8_u8(plain_txt));
  }
  dec_u8(data_u8) {
    if(!data_u8) return ''; //common array -> Unit8Array
    return u8_utf8(this._dec(data_u8));
  }
  _enc(data_u8){
    // return this.chacha.encrypt(data_u8); //with nonce concated
    return this.cipher.encrypt(data_u8); //with nonce concated
  }
  _dec(data_u8) {
    let enc_u8 = data_u8 instanceof Uint8Array ? data_u8 : new Uint8Array(data_u8);
    // return this.chacha.decrypt(enc_u8);
    return this.cipher.decrypt(enc_u8, 24);
  }
  enc_b64(plain_txt) {
    return ab_b64(this.enc_u8(plain_txt));
  }
  dec_b64(data_b64) {
    if(!data_b64) return '';
    return this.dec_u8(b64_ab(data_b64));
  }
  async enc_file_u8(lb) { //loc_blob which have not .bytes()
    let data_ab = await lb.arrayBuffer(); //no bytes() fn
    let data_u8 = new Uint8Array(data_ab);
    let enc_u8 = this._enc(data_u8);
    return enc_u8; 
  }
  //enc local Blob to File
  async enc_blob(lb) { //loc_blob which have not .bytes()
    let enc_u8 = await this.enc_file_u8(lb);
    let file_name = `${nanoid(7)}-${lb.name}`; //unique id 
    return new File([enc_u8], file_name, {type: lb.type}); 
  }
  dec_blob(data_u8, file_name, type) {
    let dec_u8 = this._dec(data_u8);
    return new File([dec_u8], file_name, {type}); //or blob
  }
  // b64 key for Cipher
  static gen_key(pass, salt) {
    return gen_key_b64(pass,salt);
  }
}
export class Locker{
  constructor(locked, pin_hash){
    this.locked = locked;
    this.pin_hash = pin_hash;
  }
  static init(pin) {
    let pin_hash = hash_b64(pin);
    let locker = new Locker(false, pin_hash);
    set('locker', locker, meta);
    return true;
  }
  static async load() {
    let lk = await find('locker', meta);
    return lk;
  }
  static verify(locker, pin){
    return hash_b64(pin) ==  locker.pin_hash;
  }
  static set_lock(locker, state) {
    locker.locked = state;
    set('locker', locker, meta);
  }
}
export function break_time(curr_ts, curr_i, msgs){
  if(curr_i + 1 < msgs.length){ //has next
    let next_ts = msgs[curr_i+1].ts;
    return (next_ts - curr_ts) > 1000 * 60 * 10  // 10 minutes
  }
  return true;
}
export function adapt_b64(o) {
  if(!o) return o;
  if(o instanceof Uint8Array || o instanceof Array) {
    return u8_b64(o);
  }else if(typeof o == 'string'){
    return o;
  }
}
export function adapt_u8(o) {
  if(!o) return o;
  if(typeof o == 'string') {
    return b64_u8(o);
  }else if(o instanceof Uint8Array || o instanceof Array) {
    return o;
  }
}
// return priv-chat room id with b64
export const msg_room = (kid, by_kid) => {
  kid = adapt_b64(kid);
  by_kid = adapt_b64(by_kid)
  return kid == dsa.skid ? by_kid : kid;
}
export function utf8_u8(str) {
  if (typeof str !== 'string') throw new Error('string expected');
  return new Uint8Array(new TextEncoder().encode(str)); 
}
export function u8_utf8(bytes){
  return new TextDecoder().decode(bytes);
}
export function url_params() {
  return new URLSearchParams(window.location.search);
}
