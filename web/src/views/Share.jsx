import { createSignal, createEffect } from 'solid-js';
import {Btn, Txt, Pwd, Lnk} from '../comps/Form';
import { Footer, Header } from '../comps/Base';

function Share() {
  let [pin, $pin] = createSignal('');

  const join = async ()=>{
  };
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
      <div class="box">
        share
      </div>
      <form>
      <Pwd name="PIN" bind={$pin}  on_enter={join} />
      <Btn name="Join" bind={join} />  &nbsp; 
      </form>
    </div>
    <Footer/>
    </>
  );
}
export default Share;
