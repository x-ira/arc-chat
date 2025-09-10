import { A, useNavigate } from "@solidjs/router";
import { Match, Show,Switch,createEffect,createResource,createSignal } from "solid-js";
import { Locker } from "../utils/main";
import { is_open, is_mobile, has_chats } from "../stores/chat";
import { hash_b64 } from "xira-crypto-wasm";

function Header(){
  let [show_lock, $show_lock] = createSignal(false);
  let [locker] = createResource(async () =>await Locker.load());
  const navi = useNavigate();
  createEffect(()=>{
    if(locker()) {
      if(locker().locked) {
        navi('/lock');
      }else{
        $show_lock(true);
      }
    }
  });
  return (
    <>
    <header class="header">Mitrá - मित्र</header>
    <nav>
      <A href="/" target="_self">Home</A> |&nbsp;
      
    <Switch>
      <Match when={has_chats() && (!is_mobile() || is_open())} >
        <A href="/chat" target="_self">Chats</A> |&nbsp;
      </Match>
      <Match when={has_chats() && is_mobile() && !is_open()} >
        <a onclick={()=>document.getElementsByClassName('sidebar-toggle')[0].click()}>Chats</a> |&nbsp;
      </Match>
    </Switch>
      <A href="/chat/setting" target="_self">Settings</A> |&nbsp;
      <Show when={show_lock()} >
      <A href="/lock" target="_self">Lock</A> |&nbsp;
      </Show>
    </nav>
   </>
  )
}
function Footer(){
  //ms-ac-cc-rev
  return ( 
    <footer><i class="i-bolt"></i> --. --.. -- -.-. .--- -.- -. ..-. -..- --- .. -....- --... -....- .---- .----</footer>
  )
}
export {Header, Footer}
