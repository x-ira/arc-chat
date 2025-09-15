import { createResource } from "solid-js";
import { m_io, me } from '../comps/ChatHelper';
import { rmk, room, room_id } from "../stores/chat";
import { u8_b64 } from "../utils/app";
import { get as find } from "idb-keyval";
import { msg_room } from "../utils/main";

const MediaMsg = ({m,blob_urls}) => { //inner component, for img & voi
  let audio_el;
  const [data] = createResource(async () => {
    let cont = rmk().dec_u8(m.cont);
    let data;
    let type; //cont-type
    let file_name;
    
    if(room().type == 0) {
      let [url, cont_type] = cont.split('|');
      let rsp = await fetch(url);
      file_name = url.split('/')[2]; // res/{res_type}/<file_name>
      if(!rsp.ok) { return Promise.reject("Load file failed"); }
      // let data_u8 = await rsp.bytes(); //simple than arrayBuffer, but too new for old device
      data = await rsp.arrayBuffer();
      type = cont_type;
    }else{ //priv-chat
      let msg_rm = msg_room(room_id(), m.kid);
      let key = [msg_rm, cont];
      let media = await find(key);
      data = media.data;
      type = media.cont_type;
      file_name = media.id;
    }
    let file = rmk().dec_blob(data, file_name, type);
    let src = URL.createObjectURL(file);
    blob_urls.push(src); //need manually release blob when change room
    return Promise.resolve({src, file_name}); // download={data()?.file_name}
  });
  return (
    <>
      <Switch>
        <Match when={m.kind == 'Img'} >
          <a href={data()?.src} target='_blank' class={m_io(m)}>
          { me(m) && m.state>0 && <span>{m.state==1?'❗':'🚫'}</span>} &nbsp;
          <img src={data()?.src} class="msg_img m_cont"/>
          </a>
        </Match>
        <Match when={m.kind == 'File'} >
          <div class={`${m_io(m)} txt`}>
          { me(m) && m.state>0 && <span>{m.state==1?'❗':'🚫'}</span>} &nbsp;
          <a href={data()?.src} download={data()?.file_name} class="download-link m_cont">
            <i class="i-download"></i> {data()?.file_name.slice(8)}
          </a>
          </div>
        </Match>
        <Match when={m.kind == 'Voi'} >
          <div class={`${m_io(m)} voi`} >
          { me(m) && m.state>0 && <span>{m.state==1?'❗':'🚫'}</span>} &nbsp;
            <audio src={data()?.src} ref={audio_el}/>
            <i class="i-play msg_audio m_cont" onclick={()=>audio_el.play()}></i>
          </div>
        </Match>
      </Switch>
    </>
  )
}
export default MediaMsg;
