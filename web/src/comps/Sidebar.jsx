import './Sidebar.css';
import { createSignal, For, onMount, onCleanup, createEffect, createResource } from 'solid-js';
import { PrivChat, Room, url_params } from '../utils/main';
import { chg_room, priv_chats, joined_rooms, room, set_mobile, is_mobile, is_open, set_open, first_chat, load_room } from '../stores/chat';
import { b64_std } from '../utils/app';

function Sidebar(props) {
  const [actived, $actived] = createSignal();
  const params = url_params();
  const id = b64_std(params.get('id'));
  const type = params.get('type');
  let mediaQueryList;
  let init_chat;
  const controller = new AbortController();
 
  onMount(() => {
    if(id) {
      init_chat = load_room(type, id);
    }
  
    mediaQueryList = window.matchMedia('(max-width: 768px)');
    set_mobile(mediaQueryList.matches); //init

    const listener = (event) => set_mobile(event.matches);
    mediaQueryList.addEventListener('change', listener, { signal: controller.signal });

    onCleanup(() => {
      controller.abort(); 
    });
  });
  createEffect(()=>{
    if(!room().rmk) {
      chg_room(init_chat ?? first_chat()); //init 1st room
    }
  });
  createEffect(()=>{ //set actived
    if(!room().rmk) {
      $actived();
    }else if(room().rmk != actived()) { 
      $actived(room().rmk);
    }
  });
  const toggleSidebar = () => {
    set_open(!is_open());
    props.onToggle?.(is_open());
  };
  const handleItemClick = (item) => {
    if(!item) return ;
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
        class={`sidebar-overlay ${is_open() ? 'show' : ''}`}
        onClick={toggleSidebar}
      />
      
      {/* Sidebar */}
      <div class={`sidebar ${is_open() ? 'open' : 'closed'}`}>
        {/* Header */}
        <div class="sidebar-header">
          <span 
            class="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {is_open() ? '✕' : '☰'}
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

export {Sidebar};
