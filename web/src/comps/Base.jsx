import { A, useNavigate } from "@solidjs/router";
import { Show,createEffect,createResource,createSignal } from "solid-js";
import { Locker } from "../utils/main";

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
      <A href="/chat" target="_self">Chats</A> |&nbsp;
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
    <footer><i class="i-bolt"></i>--. --.. -- -.-. .--- -.- -. ..-. -..- --- .. -....- --... -....- .---- .----</footer>
  )
}
export {Header, Footer}
