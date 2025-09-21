import { createEffect, createSignal, onCleanup, onMount, Switch, Match } from 'solid-js';
import  './Voice.css';
import { Lnk } from '../comps/Form';
function update_animation(dist_state) {
  const animations = document.querySelectorAll('.point');
  animations.forEach(animation => {
    const curr_state = animation.style.animationPlayState || 'running';
    if(!dist_state){
      dist_state = (curr_state === 'running' ? 'paused' : 'running');
    }
    animation.style.animationPlayState = dist_state;
  });
}
function createPoint(index) {
  const point = document.createElement('span');
  point.className = 'point';

  // Apply keyframe animation
  point.style.animationPlayState = 'paused';

  // Calculate delay based on index
  const delay = (index % 10) * 0.2 + Math.floor(index / 10) * 0.1;
  point.style.animationDelay = `${delay}s`;

  return point;
}
function init_points(flow_cont) {
  let pointCount = 152;
  for (let i = 0; i < pointCount; i++) {
    const point = createPoint(i);
    flow_cont.appendChild(point);
  }
}
async function init_media($v){
  let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  let options = {};
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    options.mimeType = 'audio/webm;codecs=opus';
  } else if (MediaRecorder.isTypeSupported('audio/webm')) { //chrome & firefox
    options.mimeType = 'audio/webm';
  } else if (MediaRecorder.isTypeSupported('audio/mp4')) {  // ios
    options.mimeType = 'audio/mp4';
  }
  const recorder = new MediaRecorder(stream, options);
  
  // Log the actual format being used for debugging
  console.log('Recording with mimeType:', recorder.mimeType);

  //invoked when .stop() is called 
  recorder.ondataavailable = async e => $v(e.data);

  recorder.onstop = ()=>{
    stream.getTracks().forEach(track => track.stop()); // release res
    console.log("recorder stopped");  
  };
  return recorder;
}
function Voice(props){
  //0: stoppted, 1: recording, 2: paused, 3: unsupported
  let [state, $state] = createSignal(0);
  let [cnt, $cnt] = createSignal(0);
  let [time, $time] = createSignal('');
  let [cmd, $cmd] = createSignal('Start');
  let [v, $v] = props.bind;
  let flow_container;
  let timer;
  let recorder;
  
  const clear_timer = () => {
    if (timer) { clearInterval(timer); $cnt(0); }
  }
  createEffect(()=>{
     let s = cnt() % 60;
     let m = parseInt(cnt() / 60) % 60;
     let [ps, pm] = ['', ''];
     if(s<10)  ps = '0';
     if(m<10)  pm = '0';
     $time(` ${pm}${m}:${ps}${s} `);
  })
  createEffect(()=>{
    if(!v()) {
      clear_timer();
    }
  })
  createEffect(()=>{
    if(state() == 0) {
      $cmd('Start');
      update_animation('paused');
    } else if(state() == 1){ 
      $cmd('Stop');
      update_animation('running');
    } else if(state() == 2){ 
      $cmd('Stop');
      update_animation('paused');
    }
  });
  const start_timer = () => {
    clear_timer();
    timer = setInterval(()=>{
      if(state() == 1) {
        $cnt(v=>v+1);
      }
    }, 1000);
  };
  const pause_resume_rec = () => {
   if(state() == 1 || state() == 2){
      $state(3-state()); 
   }
  }
  const rec_voice = async () => {
    if(state() == 0){
      $state(1); //start
      start_timer();
      recorder = await init_media($v);
      recorder.start();//should check last record if exist?
    }else { // 1,2
      recorder.stop();
      $state(0); //stop
    }
  }
  onMount(()=>{
    if(!navigator.mediaDevices) {
      $state(3); //unsupported
    }
    init_points(flow_container);
  });
  onCleanup(() => {
    clear_timer();
  });
  return (
    <>
    <div class="voi_container">
      <Switch>
        <Match when={state() < 3} >
          <span onclick={pause_resume_rec} ><div class='flow-container' ref={flow_container} ></div></span>
          <div class="control"><span>{time()}<Lnk bind={rec_voice} name={cmd()} /></span></div>
        </Match>
        <Match when={state() == 3} >
          <div class="voice_bar">Oopts, Media device not supported.</div>
        </Match>
      </Switch>
    </div>
    </>
  )
}
export default Voice;
