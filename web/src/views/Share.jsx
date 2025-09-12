import { createSignal, createEffect } from 'solid-js';
import {Btn, Txt, Pwd, Lnk} from '../comps/Form';
import { Footer, Header } from '../comps/Base';
import Join from '../comps/Join';
import { url_params } from '../utils/main';

function Share() {
  let params = url_params();
  let [msg, $msg] = createSignal();
  return (
    <>
    <Header />
    <meta property="og:title" content="Arc Chat Invitation" />
    <meta property="og:description" content="Anonymous Relay Chat"/>
    <meta property="og:image" content="/preview.jpg"/>
    <meta property="og:url" content=""/>

    <meta name="twitter:card" content="summary"/>
    <meta name="twitter:title" content="Arc Chat Invitation"/>
    <meta name="twitter:description" content="Anonymouse Relay Chat"/>
    <div class="page_block">
      <div>
        <h3>~ Arc Chat Invitation ~</h3>
        <h5>You are invited to join the below room: </h5>
      </div>
      <Join rm_id={params.get('rm')} msg={$msg} />
      {msg() && <div class="act_msg">{msg}</div> }
    </div>
    <Footer/>
    </>
  );
}
export default Share;
