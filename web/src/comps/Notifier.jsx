import { Time } from "../utils/app";
import { Lnk } from "../comps/Form";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { Room, Cipher } from "../utils/main";
import { room, chg_room, rmk, load_room } from "../stores/chat";

export default function Notifier(props){
  const [msg, $msg] = createSignal();
  const [msgFrom, $msgFrom] = createSignal('');
  let im = props.incoming_msg;  // { type, src, msg }
  let interval = props.interval || 5000;
  const maxQueueSize = 100; 
  let queue = [];
  let is_active = false;
  let timer;
  
  createEffect(()=>{
    if(im() && !notify_off()){
      queue.push(im());
      queue = queue.slice(-maxQueueSize); // only keep the last N items
      if(!is_active) {
        is_active = true;
        console.info('start timer only once');
        start_timer();
      }
    }
  });
  onCleanup(() => {
    if (timer) { clearInterval(timer) }
  });
  const notify_off = () => {
    let no_disturb = localStorage.getItem('no_notify_until');
    if(no_disturb) {
      return parseInt(no_disturb) > Time.ts();
    }
    return false;
  }
  
  const start_timer = () => {
    timer = setInterval(notify_msg, interval);
  };
  const notify_msg = () => {
    if (queue.length === 0) {
      $msg(null); //cancel previous
    }else{
      const taked_msg = queue.shift();
      $msg(taked_msg);
    }
  };
  const change_room = () => { 
    let m = msg();
    let rm = load_room(m.type, m.src);
    chg_room(rm); //chg rm
    $msg(); //clear 
    queue = queue.filter(m=>  m.src != room_id()); //update queue. cause user may chg room when user is notified
  }
  const no_disturb = () => {
    if (timer) { clearInterval(timer) }
    localStorage.setItem('no_notify_until', Time.ts() + 1000 * 60 * 10);
    $msg(null);
    is_active = false;
    queue = [];
  }
  
  const updateMsgFrom = async () => {
    let m = msg();
    if (!m) return;
    let at = '';
    if(m.type == 0) {
      let dist_room = await Room.get(m.src);
      at = `@${dist_room.name}`;
    }
    $msgFrom(`${m.msg.nick}${at}`);
  };
  
  createEffect(() => {
    if (msg()) {
      updateMsgFrom();
    }
  });
  const dec_cont = () => {
    let m = msg();
    let rm = load_room(m.type, m.src);
    return rm?rmk(rm).dec_u8(m.msg.cont):'';
  }
 
  return (
    <>
    <Show when={msg()}>
    <div class="notifier">
        <span>
          <Lnk bind={change_room} name={msgFrom} title="Go to the room to view" class="link"/>: &nbsp;
          <Show when={msg().msg.kind == 'Txt'} fallback={<span>&lt; A {msg().msg.kind} Message &gt;</span>} >
            {dec_cont}
          </Show>
        </span> &nbsp;
        <div class="no_notify"><i class="i-bell-o" onclick={no_disturb} title="Do not disturb me in a few minutes"></i></div>
    </div>
    </Show>
    </>
  )
}
