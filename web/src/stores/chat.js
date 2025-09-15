import { createStore, produce, reconcile, unwrap } from 'solid-js/store';
import { Cipher, Locker, PrivChat, Room } from '../utils/main';

const [chat_ctx, $chat_ctx] = createStore({
  curr_room: {},
  rmk_cache: {},
  joind_rooms: await Room.list(),
  priv_chats: await PrivChat.list(),
});
const [sys_ctx, $sys_ctx] = createStore({
  is_open: true, // sidebar
  is_mobile: false,
});

export const is_open = () => sys_ctx.is_open;
export const set_open = (val) => $sys_ctx('is_open', val);
export const is_mobile = () => sys_ctx.is_mobile;
export const set_mobile = (val) => $sys_ctx('is_mobile', val);

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
  if(state == 2 || state == 3 || state == 4) { //decline
    $chat_ctx('priv_chats', chats=>chats.filter(c=>c.kid != kid)); //remove
  }else{ //agree or other
    $chat_ctx('priv_chats', c=>c.kid == kid, 'state', state);
  }
  let curr_room = chat_ctx.curr_room;
  if(curr_room.type == 1 && curr_room.kid == kid) { // when curr_room is priv_chat, should refresh room
    if(state == 2 || state == 3 || state == 4) { // decline
      $chat_ctx('curr_room', first_chat()); 
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
export const joined_rooms = () => {
  return chat_ctx.joind_rooms;
}
export const joined_room = (id) => {
  return chat_ctx.joind_rooms.find(rm => rm.id == id);
}
export const has_chats = () => {
  return joined_rooms().length > 0 || priv_chats().length > 0
}
export const first_chat = () => {
  return joined_rooms()[0] ?? priv_chats()[0]
}
export function load_room(type, id_b64) { 
  return type==1?priv_chat(id_b64) : joined_room(id_b64);
}
//type: 0 for pub-room, 1 for priv-chats
export function chg_room(rm) { 
  $chat_ctx('curr_room', reconcile(rm)); 
}
export const rmk = (rm) => {
  rm = rm || unwrap(chat_ctx.curr_room); //stop tracking
  if(!rm.rmk) return ;
  let rm_id = room_id(rm);
  if(!chat_ctx.rmk_cache[rm_id]){
    $chat_ctx('rmk_cache', rc=>({...rc, [rm_id]:new Cipher(rm.rmk) }) );
  }
  return chat_ctx.rmk_cache[rm_id];
}
