import { createSignal, createEffect, createResource, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Pwd, Btn } from '../comps/Form';
import { Locker} from '../utils/main';
import {Header, Footer} from '../comps/Base';

function Lock() {
  const [locker] = createResource(async () =>await Locker.load()); 
  let [pin, $pin] = createSignal('');
  let [unlocked, $unlocked] = createSignal(false);
  let navi = useNavigate();
  createEffect(()=>{
    if(locker() && !locker().locked) {
      Locker.set_lock(locker(), true);
    }
  });
  createEffect(()=>{
    if(unlocked()) {
      navi('/');
    }
  });

  const unlock = async ()=>{
    if(locker() && Locker.verify(locker(), pin())) {
      Locker.set_lock(locker(), false);
      $unlocked(true);
    }
  };
  return (
    <>
    <Header />
    <div class="page_block">
      <form>
      <Pwd name="PIN" bind={$pin}  on_enter={unlock} />
      <Btn name="Unlock" bind={unlock} />  &nbsp; 
      </form>
    </div>
    <Footer/>
    </>
  )
}
export default Lock;
