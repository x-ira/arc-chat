import {Btn, Txt, Lnk} from '../comps/Form';
import { createSignal, createEffect } from 'solid-js';
import {Header, Footer} from '../comps/Base';
import { get } from '../utils/app';

function Roaming() {
  let [kw, $kw] = createSignal('');
  let [list, $list] = createSignal();
  let [msg, $msg] = createSignal('');

  const valid_url = (peer) => {
    let domain_url = peer.meta.domain_url;
    if(!domain_url) {
      return `http://${peer.ip}:${peer.port}/`;
    }
    if(domain_url && !domain_url.startsWith('http')) {
      domain_url = `https://${domain_url}`;
    }
    return domain_url;
  }
  const query = async ()=>{ 
    let rsp = await get(`api/query_peers`, {kw: kw()});
    if(!rsp.ok) {
      $msg(await rsp.text());
    }else{
      $list(await rsp.json());
    }
  };
  return (
    <>
    <Header/>
    <div class="page_block">
      <form>
      <Txt bind={$kw} on_enter={query} tip="keyword" class="keyword"/>
      <Btn name="Search" bind={query} />  &nbsp; 
      </form>

   { list() && 
    <table>
      <thead><tr>
        <th width="20%">Peer</th>
        <th width="11%">Tot-Rooms</th>
        <th width="11%">Onlines</th>
        <th>Description</th>
      </tr></thead>
      <tbody>
        <For each={list()}>{(peer, i) =>
        <tr>
          <td><a href={valid_url(peer)} target='_blank'>{peer.meta.name}</a> <br/></td>
          <td>{peer.meta.tot_rooms}</td>
          <td>{peer.meta.onlines}</td>
          <td>{peer.meta.desc}</td>
        </tr>
        }</For>
      </tbody>
    </table>}
      <p>
        <Lnk to="/"  name="Back to Home"/> &nbsp;
      </p>
    </div>
    <Footer/>
    </>
  );
}
export default Roaming;
