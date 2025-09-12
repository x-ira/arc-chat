import { createEffect, createResource, createSignal } from "solid-js";
import {Btn, Txt, Lnk, Pwd} from '../comps/Form';
import { post, get } from "../utils/app";
import { Cipher, RoomKind, Room } from "../utils/main";

function Join(props = {}) {
  let $msg = props.msg;
  let [rm_id, $rm_id] = createSignal();
  let [pin, $pin] = createSignal('');
  const [rm] = createResource(rm_id, async (rm_id) => {
    let rsp = await get(`api/load_room/${rm_id}`, {});
    if(!rsp.ok) return $msg(await rsp.text());
    let room = await rsp.json();
    return room;
  });
  createEffect(()=>{
    if(props.rm_id){
      $rm_id(props.rm_id);
    }
  })
  const join = async ()=>{
    $msg();
    let id = rm()[3];
    let kind = rm()[2];
    if(kind == 'e' && !pin()) return ;
    let rsp = await post('api/join_room', {rm_id: id, rm_kind: RoomKind.to_kind(kind, pin())});
    if(!rsp.ok) {
      $msg(await rsp.text());
    }else{
      let room = await rsp.json();
      let pass = room.id;

      if(room.kind.EncryptedGroup) {
        pass = pin();
      }
      room.rmk = Cipher.gen_key(pass, room.salt);
      room.type = 0; // pub-room, 1 for private-chat
      delete room.salt;
      delete room.token;
      if(await Room.join(room)){
        window.location = '/chat'; //need refresh page 
      }
    }
  };
  return (<>
    { rm() && 
    <>
      <div> <b>Room:</b> {rm()[0]} </div>
      <div> <b>Id:</b> {rm()[3]} </div>
      <div> <b>Kind:</b> {RoomKind.get(rm()[2])} </div>
      <div> <b>Description:</b> {rm()[1]} </div>
      {rm()[2] == 'e' && 
        <Pwd tip="Pass Code"  bind={$pin}  />
      }
      <Btn name="Join" bind={join} /> &nbsp; <Lnk to={`/room/${rm()[3]}`}  name="Admin" class="navi"/> &nbsp;
    </>}
  </>)
}
export default Join;
