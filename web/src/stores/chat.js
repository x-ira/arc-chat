import { createStore, produce, reconcile, unwrap } from 'solid-js/store';
import { adapt_b64, Cipher, Locker, PrivChat, Room } from '../utils/main';

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
export async function save_priv_chat(chat) {
  let priv_chats = chat_ctx.priv_chats;
  let idx = priv_chats.findIndex(pc => pc.kid == chat.kid);
  if(idx > -1) {
    $chat_ctx('priv_chats', idx, chat);
  }else{
    $chat_ctx('priv_chats', chats=>[...chats, chat]);
  }
  await PrivChat.save(chat_ctx.priv_chats);
}
export async function update_priv_chat(kid, state) {
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
  await PrivChat.save(chat_ctx.priv_chats);
}
export const remark_priv_chat = async (kid, alias) => {
  let updated_priv_chats = await PrivChat.remark(kid, alias);
  return $chat_ctx('priv_chats', updated_priv_chats);
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
export const quit_joined_room = async (rm_id) => {
  let updated_rooms = await Room.quit(rm_id);
  return $chat_ctx('joind_rooms', updated_rooms);
}
export const remark_joined_room = async (rm_id, alias) => {
  let updated_rooms = await Room.remark(rm_id, alias);
  return $chat_ctx('joind_rooms', updated_rooms);
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
export const rmk = (rm_id = room_id(), type = room().type) => {
  let _rmk = chat_ctx.rmk_cache[rm_id];
  if(!_rmk){
    let rm = load_room(type, rm_id);
    if(rm && rm.rmk) {
      _rmk = new Cipher(rm.rmk);
      $chat_ctx('rmk_cache', rc=>({...rc, [rm_id]:_rmk}) );
    }
  }
  return _rmk;
}
