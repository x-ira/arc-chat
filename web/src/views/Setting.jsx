import { createResource, createSignal, Show } from "solid-js";
import {get,post} from '../utils/app';
import { Locker, nick_name } from '../utils/main';
import { Txt, Pwd, Btn } from "../comps/Form";
import { clear, del } from "idb-keyval";

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
        <label>Web Notification:</label>
        <Btn name="Enable" bind={()=>{
          if(notify.isSupported()) {
            notify.requestPermission();
            $msg('done');
          }else{
            $msg('not supported');
          }
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
          del('locker', meta).then(r=>$msg('done'));
        }} />
      </div>

      <div>
        <label>Privacy:</label>
        <Btn name="Clear Joined Rooms" bind={()=>{
          if(confirm('Are you sure to clear joined rooms?')) {
            del('joined_rooms', meta).then(r=>$msg('done'));
          }
        }} />
        <Btn name="Clear Priv-Chats" bind={()=>{
          if(confirm('All priv-chats history will be erased, Continue?')) {
            clear();
            del('priv_chats', meta).then(r=>$msg('done'));
          }
        }} />
        <Btn name="Expire Priv-Chat Invitations" bind={()=>{
          if(confirm('All priv-chat invitations will be expired, Continue?')) {
            clear();
            del('ecdhs', meta).then(r=>$msg('done'));
          }
        }} />
      </div>
      {msg() && <div class="act_msg">{msg}</div>}
      </form>
    </div>
  )  
}
export default Setting; 
