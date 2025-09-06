import './Sidebar.css';
import { createSignal, For, onMount, onCleanup, createEffect, createResource } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { PrivChat, Room } from '../utils/main';
import { chg_room, priv_chats, room } from '../stores/chat';

function Sidebar(props) {
  const [isOpen, $isOpen] = createSignal(props.isOpen ?? true);
  const [isMobile, $isMobile] = createSignal(false);
  const [actived, $actived] = createSignal();
  let [joined_rooms] = createResource(async()=>Room.list());
  let mediaQueryList;

  const navigate = useNavigate();
  onMount(() => {
    mediaQueryList = window.matchMedia('(max-width: 768px)');
    $isMobile(mediaQueryList.matches);

    const listener = (event) => $isMobile(event.matches);
    mediaQueryList.addEventListener('change', listener);

    onCleanup(() => {
      mediaQueryList.removeEventListener('change', listener);
    });

  });
  createEffect(()=>{
    if(!joined_rooms.loading) {
      handleItemClick(joined_rooms()[0]); //init 1st room
    }
  });
  createEffect(()=>{
    if(room().rmk != actived()) { //fix for delined priv-chat
      $actived(room().rmk);
    }
  });
  
  const toggleSidebar = () => {
    $isOpen(!isOpen());
    props.onToggle?.(isOpen(), isMobile());
  };

  const handleItemClick = (item) => {
    if(!item) return ;
    $actived(item.rmk);
    if (item.path) {
      navigate(item.path);
    }
    chg_room(item);
    props.onItemClick?.(item);
  };
  const rm_icon = (rm) => {
    if(rm.kind == 'OpenGroup') {
      return '💬';
    }else if(rm.kind && rm.kind.EncryptedGroup){
      return '✻';
    }else{
      return '✻'; //✱
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        class={`sidebar-overlay ${isOpen() ? 'show' : ''}`}
        onClick={toggleSidebar}
      />
      
      {/* Sidebar */}
      <div class={`sidebar ${isOpen() ? 'open' : 'closed'}`}>
        {/* Header */}
        <div class="sidebar-header">
          <span 
            class="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {isOpen() ? '✕' : '☰'}
          </span>
        </div>

        {/* Navigation */}
        <nav class="sidebar-nav">
          <div class="sidebar-brand">Rooms</div>
          <For each={joined_rooms()}>
            {(rm) => (
              <div
                class={`sidebar-item ${rm.rmk == actived() ? 'active' : ''}`}
                onClick={() => handleItemClick(rm)}
                title={rm.desc}
              >
                <span class="sidebar-icon">{()=>rm_icon(rm)}</span>
                <span class="sidebar-label">{rm.name}</span>
              </div>
            )}
          </For>
          <hr/>
          <div class="sidebar-brand">Priv-Chats</div>
          <For each={priv_chats()}>
            {(chat) => (
              <div
                class={`sidebar-item ${chat.rmk == actived() ? 'active' : ''}`}
                onClick={() => handleItemClick(chat)}
                title={chat.nick}
              >
                <span class="sidebar-icon">{()=>rm_icon(chat)}</span>
                <span class="sidebar-label">{chat.nick}</span>
              </div>
            )}
          </For>
        </nav>
      </div>
    </>
  );
}

function SidebarCmd(props){
  return (
    <>
      <Show when={ props.show() }>
       <span on:click={()=>{
         document.getElementsByClassName('sidebar-toggle')[0].click();
       }}>☰ </span>
      </Show>
    </>
  )
}

export {Sidebar, SidebarCmd};
