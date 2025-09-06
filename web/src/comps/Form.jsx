import { createEffect, createSignal } from "solid-js";

function _bind(bind) {
  return Array.isArray(bind) ? bind : [()=>null, bind];
}
function _rnd_id(prefix, max) {
  max = max || 1000;
  let rnd = Math.floor(Math.random() * max);
  return `${prefix}_${rnd}`
}
function Txt(props) {
  let [v, $v] = _bind(props.bind);
  let cls = props.class || '';
  return (
    <>
    { props.name && <label>{props.name}:</label> }
    <input type='text' placeholder={props.tip} oninput={e=>$v(e.currentTarget.value)}
      on:keypress={e=> {
        if(props.on_enter && e.key == 'Enter') {
          e.preventDefault();
          props.on_enter(e.currentTarget.value);
        }
      }}
      on:blur={props.onblur}
      value={v()} class={cls}></input>
    <span class="msg">{props.msg}</span>
    </>
  );
}
function ImgSlt(props){
  props.accept = props.accept || 'image/*';
  props.tip = props.tip || 'Select image(s)';
  return File(props);
}
function File(props) {
  let [v, $v] = _bind(props.bind);
  let init_tip = props.tip || 'Select file(s)';
  let [tip, $tip] = createSignal(init_tip);
  let cls = props.class || 'file';
  let accept = props.accept || '';
  let id = _rnd_id('file');
  createEffect(()=>{
    if(!v() || v().length == 0) {
      $tip(init_tip);
    }else{
      $tip(`${v().length} file(s) selected`);
    }
  });
  return (
    <>
    { props.name && <label>{props.name}:</label> }
    <label class={cls} for={id} >{tip()}</label>
    <input type="file" id={id} onchange={e=>$v(e.target.files)} accept={accept} multiple hidden/>
    </>
  );
}
function Cbx(props){
  let [v, $v] = props.bind; //must give a init val
  let init_v = v();
  let is_bool = typeof init_v == 'boolean';
  let [rev_v, chk_v] = is_bool ? [!init_v, init_v]: [null, true];
  let cls = props.class || '';
  return (
    <>
    <input type='checkbox' onchange={e=>$v(_v=>{
      let checked = e.currentTarget.checked;
      return is_bool ? checked : (checked ? init_v : rev_v);
    })} value={v()} checked={chk_v} class={cls}></input>
    <span>{props.tip}</span>
    </>
  );
}
function Pwd(props) {
  let [v, $v] = _bind(props.bind);
  let cls = props.class || '';
  return (
    <>
    { props.name && <label>{props.name}:</label> }
    <input type='password' placeholder={props.tip} oninput={e=>$v(e.currentTarget.value)} autocomplete="on"
      on:keypress={e=> {
        if(props.on_enter && e.key == 'Enter') {
          e.preventDefault();
          props.on_enter(e.currentTarget.value);
        }
      }}
      value={v()} class={cls}></input>
    </>
  );
}
function Btn(props) {
  return (
    <>
    <button type="button" on:click={ props.bind } class={props.class ?? 'main'}>{props.name}</button>
    <span class="msg">{props.msg}</span>
    </>
  );
}
function Slt(props) {
  let [v, $v] = _bind(props.bind);
  let cls = props.class || '';
  let opt_val = props.opt_val || function(opt){opt[0]};  //callback fn
  let opt_disp = props.opt_disp || function(opt){opt[1]}; //callback fn 
  return (
    <>
    { props.name && <label>{props.name}:</label> }
    <select onchange={e=>$v(e.currentTarget.value)} value={v()} class={cls}  disabled={props.disabled}>
      <For each={props.options}>
        { (opt,_i) =>
          <option value={opt_val(opt)}>{opt_disp(opt)}</option>
        }
      </For>    
    </select>
    </>
  );
}
function Lnk(props) {
  let target = props.target || '_self';
  let to = props.to || '#';
  let cls = props.class || '';
  
  return (
    <a href={to} target={target} onclick={props.bind} title={props.title} class={cls}>{props.name}</a>
  );
}
export { Txt, Cbx, Pwd, Btn, Slt, Lnk, File, ImgSlt}
