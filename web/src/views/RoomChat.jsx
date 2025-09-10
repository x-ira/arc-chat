import { createEffect, createSignal, For, Match, onCleanup, onMount, Show, Switch} from 'solid-js';
import { createStore } from 'solid-js/store';
import {Time,get,post,upload_files, b64_u8, b64_url, u8_b64} from '../utils/app';
import {Btn, Slt, ImgSlt, Lnk} from '../comps/Form';
import { Cipher, PrivChat, break_time, msg_room, nick_name } from '../utils/main';
import Notifier from '../comps/Notifier';
import Invitation from '../comps/Invitation';
import Voice from '../comps/Voice';
import MediaMsg from '../comps/MediaMsg';
import Command from '../comps/Command';
import { inv_sign, inv_track_verify, inv_verify, m_io, me } from '../comps/ChatHelper';
import { room, rmk, ecdh, save_priv_chat, update_priv_chat, ecdh_exchange, priv_chat, room_id } from '../stores/chat';
import { set, get as find, clear, setMany } from 'idb-keyval';
import { nanoid } from 'nanoid';
import WebSocketClient from '../utils/ws';
import _ from '../utils/notification';

function RoomChat(props) {
  let nick = nick_name();
  let [rest_len, $rest_len] = createSignal(false);
  let [slt_imgs, $slt_imgs] = createSignal();
  let [voi, $voi] = createSignal();
  let [msg_kind, $msg_kind] = createSignal('Txt');
  let [txt_cmd, $txt_cmd] = createSignal(null);
  let [notify_msg, $notify_msg] = createSignal(); 
  let [inv_msg, $inv_msg] = createSignal(); 
  let [conn_state, $conn_state] = createSignal(); 
  let [msgs, $msgs] = createStore([]);
  let blob_urls = [];
  let kid = dsa.kid;
  let skid = dsa.skid;
  let msg_block; //el
  let wsc;
  let endpoint = `/ws/${nick}/k/${b64_url(dsa.verify_key)}`;
  const init_wsc = () =>{
    wsc = new WebSocketClient(endpoint);
    wsc.on('#connected', ()=>{ //refresh room after (re)connected
     $conn_state();
     listen_room();
    });
    wsc.on('#reconnecting', ({attempt}) => {
      $conn_state('Try to connect the server...', attempt);
    });
    wsc.on('#reconnect_failed', () => {
      wsc.close();
      $conn_state('Fail to connect. Refresh the page to start over');
    });
    wsc.on('msg', async ws_msg => { //register once
      // console.log('recv msg', ws_msg);
      if(ws_msg.Chat || ws_msg.PrivChat) {
        let type = ws_msg.Chat ? 0 : 1;
        let priv_src = type == 1 ? u8_b64(ws_msg.PrivChat.msg.kid) : undefined;
        let priv_dist = type == 1 ? u8_b64(ws_msg.PrivChat.kid): undefined;
        let msg = type == 0 ? ws_msg.Chat.msg : ws_msg.PrivChat.msg;
        let src = type == 0 ? ws_msg.Chat.room : priv_src; //for convenience
        if (document.visibilityState === 'hidden' && type == 1) {
           notify.show('Arc-Chat',`A private ${msg.kind} msg from ${msg.nick}`);
        }
        if(type == 1) {
          msg.state = ws_msg.PrivChat.state; //state>0 & isMedia, may need update Media TODO
          let msg_rm = msg_room(priv_dist, priv_src);
          find(msg_rm).then((r = [])=>{
            r.push(msg);
            set(msg_rm, r);
          });
        }
        if(src == room_id() || (priv_src == skid  && priv_dist == room_id())) { 
          $msgs([...msgs, msg]);
        }else if(u8_b64(msg.kid) != skid){  //try notify if not sender, support multiple devices
          $notify_msg({src, msg, type});
        }
      }else if(ws_msg.Media) { // for priv-chat only
        let media = ws_msg.Media;
        let key = [u8_b64(media.by_kid), media.id]; // no need cal msg_room, sender not send the media via ws
        set(key, media).catch(e=>console.error(e));
      }else if(ws_msg.Invite) {
        let inv = ws_msg.Invite.inv; 
        if(!inv_verify(inv)) return; // verify sign
        if (document.visibilityState === 'hidden') {
           notify.show('Arc-Chat',`Priv-Chat invitation from ${inv.by_nick}. ${inv.greeting?'Greeting:'+inv.greeting:''}`);
        }
        let inv_kid_b64 = u8_b64(inv.by_kid);
        let pc = priv_chat(inv_kid_b64);
        if(!pc) {
          let rep = await inv_sign(inv.by_kid, nick);
          let rmk = ecdh_exchange(inv.by_kid,inv.pub_key);
          save_priv_chat({
            kid: inv_kid_b64, nick: inv.by_nick, state: 0, type: 1, rmk:u8_b64(rmk), greeting: inv.greeting, ts: inv.ts
          });
          wsc.emit({Reply: rep}); //reply to inviter
        }else if(pc.state < 2) { //already been invited, treat as agree
          update_priv_chat(inv_kid_b64, 5);
        }
      }else if(ws_msg.Reply) {
        let rep = ws_msg.Reply.inv; 
        if(!inv_verify(rep)) return; // verify sign
        let rmk = ecdh_exchange(rep.by_kid,rep.pub_key);
        save_priv_chat({
          kid: u8_b64(rep.by_kid), nick: rep.by_nick, state: 1, type: 1, rmk:u8_b64(rmk), ts: rep.ts,
        });
      }else if(ws_msg.InviteTracking) {
        let it = ws_msg.InviteTracking;
        if(!inv_track_verify(it)) return; // verify track sign
        let cont;
        if(it.state == 4) cont = `${it.by_nick} has cancelled the Priv-Chat invitaion.`;
        if(it.state == 5) cont = `${it.by_nick} has accepted your Priv-Chat invitaion.`;
        if(it.state == 2) cont = `${it.by_nick} has declined your Priv-Chat invitaion.`;
        if(cont) {
         notify.show('Arc-Chat', cont);
        }
        update_priv_chat(u8_b64(it.by_kid), it.state);
      }
    });
  }
  const history_msgs = () => room().type == 0 ? remote_history() : local_history();
  const local_history = () => { //only for priv-chats
    if(!room_id()) return ; //decline priv-chat case
    find(room_id()).then((his_msgs=[]) =>{
      let rest = rest_len() == undefined ? his_msgs.length:rest_len();
      if(rest == 0) return;
      let bat = his_msgs.slice(Math.max(rest-10, 0), rest);
      $rest_len(rest-bat.length);
      $msgs([...bat, ...msgs]);
    });
  }
  const remote_history = () => {
    let param = { room: room().id, kid_loc: b64_url(dsa.verify_key) };
    if(rest_len()) {
      param.rest = rest_len();
    }
    get('api/history_msgs', param).then(async rsp => { 
      if(!rsp.ok) { return console.error('load history msgs failed: err: ', await rsp.text()) }
      let [rest_cnt, bat] = await rsp.json();
      $rest_len(rest_cnt);
      $msgs([...bat, ...msgs]);
    });
  }
  const listen_room = ()=> {
    if(room() && wsc)
      wsc.emit({Listen: {room:room().id, kind: room().kind}});
  }
  const refresh_room = () => {
    listen_room(); //switch room need a new listener
    $msgs([]); //clear store before load latest msgs
    $rest_len();
    blob_urls.forEach(src=>URL.revokeObjectURL(src)); blob_urls = []; //release blob obj
  }
  const chat_msg = (kind, cont, wisper) => { // parepared, No cont
    let msg = {nick, kind, ts: Time.ts(), kid, cont: rmk().enc_u8(cont), wisper };
    return room().type == 0 ? {Chat: {room: room().id, msg}} : {PrivChat: {kid: b64_u8(room().kid), state: 0, msg}};
  }
  const handle_input_msg = (cmd, params, send_at_once) => {
    $txt_cmd({cmd, params});
    if(send_at_once) { send_msg(); }
  }
  const cmd_msg = async () => {
    if(!txt_cmd()) return [];
    let {cmd, params} = txt_cmd();
    let new_msg;
    switch(cmd) {
      case 'chat':
        new_msg = txt_msg(params);
        break;
      case 'wisper':
        new_msg = txt_msg(params.msg, b64_u8(params.kid));
        break;
      case 'invite':
        let pc = priv_chat(params.kid);
        if(pc && pc.state < 2) { //already been invited, treat as agree
          update_priv_chat(params.kid, 5);
        }
        let inv = await inv_sign(b64_u8(params.kid), nick, params.greeting); //always allow invite
        new_msg = {Invite: inv};
        break;
      case 'leave':
        update_priv_chat(room_id(),4);
        break;
      case 'report':
        new_msg = {Report: params};
        break;
      case 'block':
        new_msg = {Block: params};
        break;
      case 'stat': //TODO
        break;
      case 'help':
      default :
    };
    $txt_cmd(null); //clear
    return [new_msg];
  }
  const txt_msg = (cont, wisper) =>{
    return !cont ? [] : chat_msg('Txt', cont, wisper);
  }
  const blob_srcs = async (blobs) => {
    let srcs = [];
    if(room().type == 0) {
      let rsp = await upload_files('/ws/upload', blobs, async file => await rmk().enc_blob(file));
      if(!rsp.ok) { alert(await rsp.text()); return [] }
      srcs = await rsp.json();
    }else{ //priv-chat
      let medias = [];
      for(const file of blobs) {
        let data = await rmk().enc_file_u8(file);
        let id = nanoid(12);  //hash may reduce duplicate
        let cont_type = file.type;
        let media = { kid: b64_u8(room().kid), by_kid: kid, id, cont_type, data};
        wsc.emit({Media:media});
        srcs.push(id);
        medias.push([[room().kid,id] , media]); //key: []
      }
      setMany(medias).catch(e=> console.err(e)); //store for sender
    }
    return srcs;
  }
  const img_msgs = async () =>{
    if(!slt_imgs()) return;
    let new_msgs = [];
    let urls = await blob_srcs(slt_imgs());
    for(const src of urls) {
      let msg = chat_msg('Img', src);
      new_msgs.push(msg);
    }
    $slt_imgs([]); //reset
    return new_msgs;
  }
  const voi_msg = async () =>{
    if(!voi()) return;
    let src = (await blob_srcs([voi()]))[0]; // Don't make stupid mistakes anymore.   (await fn())[0]
    let msg = chat_msg('Voi',src);
    $voi(null); //reset
    return [msg]; //for consitence
  }
  const send_msg = async () => {
    let new_msgs = [];
    if(msg_kind() == 'Txt') {
      new_msgs = await cmd_msg();
    }else if(msg_kind() == 'Img'){
      new_msgs = await img_msgs();
    }else if(msg_kind() == 'Voi'){
      new_msgs = await voi_msg();
    }
    if(!new_msgs || new_msgs.length == 0) { return }
    new_msgs.forEach(ws_msg=>{
      wsc.emit(ws_msg);
    });
  }
  onMount(()=>{
    init_wsc();
    if(notify.isSupported()) {
      notify.requestPermission();
    }
  });
  onCleanup(() =>{
    wsc.close();
  });
  createEffect(() =>{
    if(room().rmk) { //rmk change means room changed!!
      refresh_room();
    }
  });
  createEffect(() =>{
    if(rest_len() === undefined) {
      history_msgs();
    }
  });
  createEffect(() =>{
    if(msgs && msgs.length > 5) {
      msg_block.scrollTop = msg_block.scrollHeight;
    }
  });
   return (
    <Switch>
      <Match when={room().type == 1 && room().state < 5} >
        <Invitation on_track={it=>wsc.emit(it)}/>
      </Match>
      <Match when={room().type == 0 || room().state >= 5} >
        <Notifier incoming_msg={notify_msg} />
        { conn_state() && 
        <div class="conn_state">{conn_state}</div>
        }
        <div class="msg_block" ref={msg_block}>
        <Show when={rest_len()} >
          <div class="info"><Lnk bind={history_msgs} name={`~ More History (${rest_len()}) ~`} /></div>
        </Show>
        <For each={msgs}>{ (m,i) =>
          <>
            <div class="msg"> 
              <Show when={u8_b64(m.kid) != skid } >{m.nick}: </Show>
              <Switch>
                <Match when={m.kind == 'Txt'} >
                   <div class={`${m_io(m)} txt`} >{me(m) && m.state>0 && <span>{m.state==1?'❗':'🚫'}</span>} <span class="m_cont">{rmk().dec_u8(m.cont)}</span></div>
                </Match>
                <Match when={m.kind != 'Txt'} >
                  <MediaMsg m={m} blob_urls={blob_urls} />
                </Match>
              </Switch>
            </div>
            <div class="info">
              <Show when={break_time(m.ts, i(), msgs)} fallback={<>&nbsp;</>}>
                <span>{Time.iso(m.ts)}</span>
              </Show>
            </div>
          </>
       }</For>
      </div>
      <Switch>
         <Match when={msg_kind() == 'Txt'} >
          <i class="i-chat m_kind" on:click={()=>$msg_kind('Img')}></i> 
          <Command on_ready={handle_input_msg} tip="Say something or start a command with / "  class="texting" txt_cmd={txt_cmd} />
        </Match>
        <Match when={msg_kind() == 'Img'} >
          <i class="i-img m_kind" onclick={()=>$msg_kind('Voi')}></i>
          <ImgSlt bind={[slt_imgs,$slt_imgs]} class="msg_bar"/>
        </Match>
        <Match when={msg_kind() == 'Voi'} >
          <i class="i-voi m_kind" onclick={()=>$msg_kind('Txt')}></i>
          <Voice bind={[voi, $voi]} />
        </Match>
      </Switch>
      <Btn name="Send" bind={send_msg} /> 
    </Match>
  </Switch>
  );
}
export default RoomChat;
