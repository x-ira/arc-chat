import RoomChat from './RoomChat';
import {Btn, Txt, Pwd, Lnk} from '../comps/Form';
import { createSignal, createEffect } from 'solid-js';
import {Sidebar} from '../comps/Sidebar';
function Chat() {
  const [isShow, $isShow] = createSignal(); //if the sidebar is fully hide
  return (
    <div class="box">
      <Sidebar 
        isOpen={true}
        onToggle={(isOpen) => {}}
        // onItemClick={rm => {}}
      />
      <div class="box_r">
         <RoomChat />
      </div>
    </div>
  );
}
export default Chat;
