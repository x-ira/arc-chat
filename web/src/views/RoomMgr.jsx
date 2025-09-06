import {Btn, Txt, Slt, Pwd, Lnk} from '../comps/Form';
import { hash_b64 } from 'xira-crypto-wasm';
import { createSignal, createEffect, onMount } from 'solid-js';
import {Header, Footer} from '../comps/Base';
import {get,post} from '../utils/app';
import { RoomKind, PUB_ROOM_STATE } from '../utils/main';
import { useParams } from '@solidjs/router';

function RoomMgr() {
  const params = useParams();    
  let [name, $name] = createSignal('');
  let [token, $token] = createSignal('');
  let [state, $state] = createSignal(1);
  let [kind, $kind] = createSignal('o');
  let [pin, $pin] = createSignal('');
  let [desc, $desc] = createSignal('');
  let [msg, $msg] = createSignal('');
  const check_room = () => { //TODO
      console.log(name());
      // get('api/check_room', { room: room() }).then(async rsp => {
      //   if(!rsp.ok) {return console.error(await rsp.text())}
      //   let [rest_cnt, latest_msgs] = await rsp.json();
      // });
  }
  const save_room = async ()=> {
    $msg('saving...');
    if(!name() || !token() || (kind() == 'e' && !pin())) {
      $msg('please input the required fields.');
      return ;
    }
    let rm_kind = RoomKind.to_kind(kind(), pin());
    let token_hash = hash_b64(token());

    let room = { name: name(), token: token_hash, kind:rm_kind, state: parseInt(state()), desc: desc() };
    if(params.id) { //edit
      room.id = params.id;
      post('/api/admin_room', room).then(async rsp=>{
        if(!rsp) { $msg('save failed'); return }
        $msg(await rsp.text());
      });
      
    }else{ //create
      let salt = Math.round(Math.random() * 10 ** 7).toString();
      room.salt = salt;
      post('/api/create_room', room).then(async rsp=>{
        if(!rsp) { $msg('save failed'); return }
        $msg(await rsp.text());
        $name(''); //reset
      });
    }
  };
  onMount(async ()=> {
    if(params.id) {
      let rsp = await get(`/api/load_room/${params.id}`, {});
      if(!rsp) { $msg('load room failed'); return }
      let room = await rsp.json();
      if(room) {
        $name(room.name);
        $kind(RoomKind.val(room.kind));
        $state(room.state);
        $desc(room.desc);
      }
    }
  });
  
  return (
    <>
    <Header/>
    <div class="page_block">
      <form>
      <Txt name="Room Name*" bind={[name,$name]} onblur={check_room}/> 
      <Pwd name="Admin Token*"  bind={$token}  tip="admin code"/> 
      <Slt name="Room Kind*" options={RoomKind.list()} bind={[kind, $kind]} opt_disp={opt=>opt[1]} opt_val={opt=>opt[0]} class="room" disabled={!!params.id}/>
      { kind() == 'e' && <Pwd name="Pass Code*"  bind={$pin}  tip="join room code"/> }
      <Slt name="Room State*" options={PUB_ROOM_STATE} bind={[state, $state]}  opt_disp={opt=>opt[1]}  opt_val={opt=>opt[0]} class="room" />
      <label>Description:</label>
      <textarea rows="5" cols="29" value={desc()} placeholder="description about this chat room, optional" onblur={e=>$desc(e.target.value)}/>
      <br/>
      <Btn name="Save" bind={save_room} />  &nbsp; {msg}
      </form>
      <Lnk to="/"  name="Back to Home"/> &nbsp;
    </div>
    <Footer/>
    </>
  );
}
export default RoomMgr;
