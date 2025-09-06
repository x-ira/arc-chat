import { createStore, produce, reconcile, unwrap } from 'solid-js/store';
import { Cipher, Locker, PrivChat, Room } from '../utils/main';
import { Ecdh } from 'xira-crypto-wasm';
import { u8_b64 } from '../utils/app';

const [chat_ctx, $chat_ctx] = createStore({
  curr_room: {},
  rmk_cache: {},
  ecdhs: {},
  priv_chats: await PrivChat.list(),
});

export const ecdh = (kid) => {
  let k = u8_b64(kid); //b64 is suit for object prop
  if(!chat_ctx.ecdhs[k]) {  //pub_key may consumed
    $chat_ctx('ecdhs', e=>({...e, [k]:new Ecdh()}));
  }
  return chat_ctx.ecdhs[k];
}
export function ecdh_exchange(kid, rival_pub_key){ //manually recycle after exchange
  let rmk = unwrap(ecdh(kid)).exchange(rival_pub_key);
  $chat_ctx('ecdhs', u8_b64(kid), undefined); //null
  return rmk;
}
export const priv_chats = () => {
  return chat_ctx.priv_chats;
}
export const priv_chat = (kid) => {
  return chat_ctx.priv_chats.find(pc => pc.kid == kid);
}
export function save_priv_chat(chat) {
  let priv_chats = chat_ctx.priv_chats;
  let idx = priv_chats.findIndex(pc => pc.kid == chat.kid);
  if(idx > -1) {
    $chat_ctx('priv_chats', idx, chat);
  }else{
    $chat_ctx('priv_chats', chats=>[...chats, chat]);
  }
  PrivChat.save(chat_ctx.priv_chats);
}
export function update_priv_chat(kid, state) {
  if(state == 2 || state == 4) { //decline
    $chat_ctx('priv_chats', chats=>chats.filter(c=>c.kid != kid)); //remove
  }else{ //agree or other
    $chat_ctx('priv_chats', c=>c.kid == kid, 'state', state);
  }
  let curr_room = chat_ctx.curr_room;
  if(curr_room.type == 1 && curr_room.kid == kid) { // when curr_room == priv_chat, should refresh room
    if(state == 2 || state == 4) { // decline
      $chat_ctx('curr_room', reconcile(Room.get())); 
    }else{ //agree
      $chat_ctx('curr_room', "state", state);  //trigger room() effect!
    }
  }
  PrivChat.save(chat_ctx.priv_chats);
}
export const room = () => {
  return chat_ctx.curr_room;
}
export function room_id(rm) {
  rm = rm || (chat_ctx.curr_room); //stop tracking
  return rm.type == 0 ? rm.id : rm.kid;
}
export function load_room(type, id_b64) { 
  return type==0?Room.get(id_b64) : priv_chat(id_b64);
}
//type: 0 for pub-room, 1 for priv-room
export function chg_room(rm) { 
  $chat_ctx('curr_room', reconcile(rm)); 
}
export const rmk = (rm) => {
  rm = rm || unwrap(chat_ctx.curr_room); //stop tracking
  if(!rm.rmk) return ;
  let rm_id = room_id(rm);
  if(!chat_ctx.rmk_cache[rm_id]){
    // $chat_store('rmk_cache', produce(rc=>{rc[rm_id] = new Cipher(rm.rmk)}) );
    $chat_ctx('rmk_cache', rc=>({...rc, [rm_id]:new Cipher(rm.rmk) }) );
  }
  return chat_ctx.rmk_cache[rm_id];
}
