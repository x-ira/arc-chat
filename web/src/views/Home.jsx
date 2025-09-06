import {Btn, Txt, Pwd, Lnk} from '../comps/Form';
import {Header, Footer} from '../comps/Base';
import { ab_b64, get, post } from '../utils/app';
import { useNavigate } from "@solidjs/router";
import { createSignal, For } from 'solid-js';
import { Room, RoomKind, Cipher } from '../utils/main';
function RoomQuery(props) {
  let [kw, $kw] = createSignal('');
  let [pin, $pin] = createSignal('');
  let [msg, $msg] = createSignal('');
  let [arr, $arr] = createSignal();
  let [sltRoom, $sltRoom] = createSignal();
  const navi = useNavigate();
  const query = async ()=>{ 
    let rsp = await get(`api/query_rooms`, {kw: kw()});
    if(!rsp.ok) {
      $msg(await rsp.text());
    }else{
      $arr(await rsp.json());
    }
  };
  const join = async ()=>{
    if(!pin()) return ;
    let rsp = await post('api/join_room', {rm_id: sltRoom()[3], rm_kind: RoomKind.to_kind(sltRoom()[2], pin())});
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
      await Room.join(room);
      navi('/chat', {replace: true});
    }
  };
  return (
    <>
    <Header/>
    <div class="page_block">
      <form>
      <Txt bind={$kw} on_enter={query} tip="keyword" class="keyword"/>
      <Btn name="Search" bind={query} />  &nbsp; 
      </form>

    <table>
      <thead><tr>
        <th width="20%">Room</th>
        <th width="11%">Kind</th>
        <th>Description</th>
      </tr></thead>
      <tbody>
        <For each={arr()}>{(rm, i) =>
        <tr>
          <td><a href="#" title={'Id: '+rm[3]} onclick={()=>$sltRoom(arr()[i()])}>{rm[0]}</a> <br/></td>
          <td>{RoomKind.get(rm[2])}</td>
          <td>{rm[1]}</td>
        </tr>
        }</For>
      </tbody>
    </table>
      {sltRoom() && <>
        <div> <b>Room:</b> {sltRoom()[0]} </div>
        <div> <b>Id:</b> {sltRoom()[3]} </div>
        <div> <b>Kind:</b> {RoomKind.get(sltRoom()[2])} </div>
        <div> <b>Description:</b> {sltRoom()[1]} </div>
        {sltRoom()[2] == 'e' && 
          <Pwd tip="Pass Code"  bind={$pin}  />
        }
        <Btn name="Join" bind={join} /> &nbsp; <Lnk to={`/room/${sltRoom()[3]}`}  name="Admin" class="navi"/> &nbsp;
        {msg()}
      </>}
      <p>
          <Lnk to="/room"  name="Create Room" class="navi"/> &nbsp;&nbsp;
          <Lnk to="/roam"  name="Roaming" class="navi"/> &nbsp;
      </p>
    </div>
    <Footer/>
    </>
  );
}

export default RoomQuery;
