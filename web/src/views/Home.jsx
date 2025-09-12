import { createSignal, For } from 'solid-js';
import {Btn, Txt, Lnk} from '../comps/Form';
import {Header, Footer} from '../comps/Base';
import { get } from '../utils/app';
import {RoomKind} from '../utils/main';
import Join from "../comps/Join";

function RoomQuery(props) {
  let [kw, $kw] = createSignal('');
  let [msg, $msg] = createSignal();
  let [arr, $arr] = createSignal();
  let [sltRoom, $sltRoom] = createSignal();
  
  const query = async ()=>{ 
    let rsp = await get(`api/query_rooms`, {kw: kw()});
    if(!rsp.ok) {
      $msg(await rsp.text());
    }else{
      $arr(await rsp.json());
    }
  };
  const share_room = async (id) => {
    $msg();
    let url = `${location.href}share?rm=${id}`;
    if (navigator.share) { // 原生分享 API (移动端)
      try{
        await navigator.share({
          title: 'Arc Chat Invitation',
          text: 'From <Anonymouse Relay Chat>',
          url,
        });
      }catch(e) { //fallback
        copyToClipboard(url);
      }
    } else { //fallback
      copyToClipboard(url);
    }
  }
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      $msg('Share link copied to clipboard!');
    });
  }
  return (
    <>
    <Header/>
    <div class="page_block">
    <form>
      <Txt bind={$kw} on_enter={query} tip="keyword" class="keyword"/>
      <Btn name="Search" bind={query} />  &nbsp;
    </form>
    <table>
      <thead><tr>
        <th width="20%">Room</th>
        <th width="11%">Kind</th>
        <th width="11%">Sharing</th>
        <th>Description</th>
      </tr></thead>
      <tbody>
        <For each={arr()}>{(rm, i) =>
        <tr>
          <td><a href="#" title={'Id: '+rm[3]} onclick={()=>$sltRoom(arr()[i()])}>{rm[0]}</a> <br/></td>
          <td>{RoomKind.get(rm[2])}</td>
          <td><a href="#" title="share this room" onclick={()=>share_room(rm[3])}>Share</a></td>
          <td>{rm[1]}</td>
        </tr>
        }</For>
      </tbody>
    </table>
      {sltRoom() && <>
        <Join rm_id={sltRoom()[3]} msg={$msg} />
      </>}
      {msg() && <div class="act_msg">{msg}</div> }
      <p>
          <Lnk to="/room"  name="Create Room" class="navi"/> &nbsp;&nbsp;
          <Lnk to="/roam"  name="Roaming" class="navi"/> &nbsp;
      </p>
    </div>
    <Footer/>
    </>
  );
}

export default RoomQuery;
