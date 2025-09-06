import { Router, Route, A, useNavigate } from "@solidjs/router";
import { createEffect, createResource, createSignal } from "solid-js";
import Chat from './Chat';
import Setting from './Setting';
import {Header,Footer} from '../comps/Base';
import { Locker } from "../utils/main";

function Guard(props){
  let [chat_type, $chat_type] = createSignal('g');
  let [locker] = createResource(async () =>await Locker.load());
  const navi = useNavigate();
  createEffect(()=>{
    if(locker() && locker().locked) {
      navi('/lock');
    }
  });
  const Layout = (props) => {
    return (
      <>
        <Header/>
        {props.children} 
        <Footer/>
      </>
    );
  };
  return (
    <Router root={Layout}>
      <Route path={['/','/chat']} component={Chat} />
      <Route path="/chat/setting" component={Setting} />
      <Route path="*404" component={()=> <div class="page_block">Oops! Page not found. <A href='/' target="_self">Go Home</A></div>} />
    </Router>
  )
}
export default Guard;
