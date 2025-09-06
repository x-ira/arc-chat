import { createResource, createSignal, Show } from "solid-js";
import {get,post} from '../utils/app';
import { Locker, nick_name } from '../utils/main';
import { Txt, Pwd, Btn } from "../comps/Form";
import { del } from "idb-keyval";

function Setting(){
  let [lock_pin, $lock_pin] = createSignal('');
  let [nick_now, $nick_now] = createSignal(nick_name());
  let [nick_new, $nick_new] = createSignal('');
  let [msg, $msg] = createSignal('');
  
  return (
    <div class="page_block">
      <p>Your nick name: &nbsp; {nick_now()} </p>
      <form>
      
      <div>
        <Txt name="New nick name" bind={[nick_new, $nick_new]} tip="Nick name for all chats" />
        <Btn name="Set" bind={()=>{
            localStorage.setItem('nick', nick_new());
            $nick_now(nick_new());
            $nick_new('');
            $msg('done');
        }} /> 
      </div>
    
      <div>
        <Pwd name="Set lock PIN" bind={$lock_pin} tip="PIN for app"/>
        <Btn name="Set" bind={()=>{
          if(Locker.init(lock_pin())){
            $msg('done');
          }
        }} /> 
        <Btn name="Clear" bind={()=>{
          del(Locker.key(), meta).then(r=>$msg('done'));
        }} />
      </div>

      <div>
        <label>Privacy:</label>
        <Btn name="Clear Joined Rooms" bind={()=>{
          del('joined_rooms', meta).then(r=>$msg('done'));
        }} />
        <Btn name="Clear Priv-Chats" bind={()=>{
          del('priv_chats', meta).then(r=>$msg('done'));
        }} />
      </div>
    
      </form>
      <div>{msg()}</div>
    </div>
  )  
}
export default Setting; 
