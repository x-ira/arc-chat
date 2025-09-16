import './Command.css';
import { get } from '../utils/app';
import { createSignal, createEffect, For} from 'solid-js';
import { createCmdSugg, defaultCommands, getCurrParamInfo, parse_input } from './CommandHelper';
import { room } from '../stores/chat';

function Command(props = {}) {
  const [txt_val, $txt_val] = createSignal('');
  const [show_sugg, $show_sugg] = createSignal(false);
  const [sugg, $sugg] = createSignal([]);
  const [slt_idx, $slt_idx] = createSignal(-1);
  const [curr_cmd, $curr_cmd] = createSignal(null);
  const [curr_params, $curr_params] = createSignal(null);
  const [rm_onlines, $rm_onlines] = createSignal([]);
  let input_ref;
  
  const commands = () => props.filter ? props.filter(defaultCommands) : defaultCommands;

  const room_onlines = async ()=> {
    let rsp = await get(`api/room_onlines`, {room: room().id}); //.then(async rsp => { 
    if(!rsp.ok) {return console.error(await rsp.text())}
    let rm_users = await rsp.json();
    $rm_onlines(rm_users);
  };
  const opt_param = (input, tot_param, opt_param_name) => {
    const parts = input.trim().slice(1).split(/\s+/);
    if (parts.length > tot_param ) {
      let val = parts.slice(tot_param).join(' ');
      return {[opt_param_name]: val};
    }
    return null;
  }
  // --- call when cmd is ready ---
  const prepared_cmd = (e, send_at_once) => {
    let input = txt_val().trim();
    let cmd = curr_cmd();
    if(!input || (input.startsWith('/') && !cmd) || !props.on_ready) return;
    if(!cmd) {
      props.on_ready('chat', txt_val(), send_at_once);
    }else{
      $curr_params(params=>{ //update optional param
        let last_param = cmd.parameters.at(-1);
        let tot_params = cmd.parameters.length;
        let opt_param_val = last_param ? opt_param(txt_val(), tot_params, last_param.name) : null;
        params = {...params, ...opt_param_val};
        return params;
      });
      props.on_ready(cmd.name, curr_params(), send_at_once);
    }
  }
  // --- generate avaliable suggs --- 
  const gen_suggs = async () => {
    const input = txt_val();
    const parsed = parse_input(input);
    if (!parsed.isCmd) {
      $curr_cmd(null);
      $sugg([]);
      $show_sugg(false);
      return;
    }
    if (!parsed.cmdName) { // show All cmds
      const cmdSuggs = commands().map(createCmdSugg);
      $sugg(cmdSuggs);
      $show_sugg(true);
      $curr_cmd(null);
      return;
    }
    // Find matching commands - prioritize exact matches
    const exactMatch = commands().find(cmd => 
      cmd.name.toLowerCase() === parsed.cmdName.toLowerCase()
    );
    
    let matching_cmds;
    if (exactMatch) {
      matching_cmds = [exactMatch];
    } else {
      // Only use fuzzy matching if no exact match found
      matching_cmds = commands().filter(cmd => 
        cmd.name.toLowerCase().startsWith(parsed.cmdName.toLowerCase())
      );
    }
    if (matching_cmds.length === 1 && matching_cmds[0].name === parsed.cmdName) { // Exact command match, show parameter suggestions
      const cmd = matching_cmds[0];
      $curr_cmd(cmd);
      
      // Parse current parameter status
      const inputParts = input.slice(1).split(' ');
      const { currParamIdx, currInputParam } = getCurrParamInfo(input, inputParts);
      const currParam = cmd.parameters[currParamIdx];

      if (!currParam) {
        $sugg([]);
        $show_sugg(false);
        return;
      }
      const filterTxt = input.endsWith(' ') ? '' : currInputParam;
      const paramSuggs = await get_param_suggs(currParam, currParamIdx, filterTxt, cmd);
      $sugg(paramSuggs);
      $show_sugg(paramSuggs.length > 0);
    } else { // Show matching commands
      const cmdSuggs = matching_cmds.map(createCmdSugg);
      $sugg(cmdSuggs);
      $show_sugg(cmdSuggs.length > 0);
      $curr_cmd(null);
    }
  };

  // Get suggestions based on parameter type
  const get_param_suggs = async (param, param_idx, filterTxt, cmd) => {
    if (param.type === 'user') {
      await room_onlines();
      return rm_onlines()
        .filter(user => user[1] != dsa.verify_key && user[0].toLowerCase().includes(filterTxt.toLowerCase())) // exclude me
        .map(user => (
          {type: 'parameter', name: param.name, val: user[0], desc: `KID: ${user[1]}`, param_idx, opt: { kid: user[1]} }
        ));
    } 
    // For string and number types, only show placeholder when there's no input or just entered a space
    if (filterTxt === '') {
      return [
        {type: 'parameter', name: param.name, val: `<${param.name}>`, desc: param.desc || `input ${param.name}`,
          param_idx, is_placeholder: true }
      ];
    }
    return [];
  };
  // Collect completed parameters
  const collectCompletedParams = (inputParts, isEndWithSpace) => {
    const newParts = [inputParts[0]]; // Keep command name
    const endIndex = isEndWithSpace ? inputParts.length : inputParts.length - 1;
    for (let i = 1; i < endIndex; i++) {
      if (inputParts[i].trim()) {
        newParts.push(inputParts[i]);
      }
    }
    return newParts;
  };
  // -- choose a sugg --
  const slt_sugg = (sugg) => {
    if (sugg.is_placeholder) { return $show_sugg(false); }  // Don't handle placeholder
    const input = txt_val();
    if (sugg.type === 'command') {
      $txt_val(`/${sugg.val} `);
    } else if (sugg.type === 'parameter') {
      const inputParts = input.slice(1).split(/\s+/);
      const newParts = collectCompletedParams(inputParts, input.endsWith(' '));
      
      // Add selected parameter
      newParts.push(sugg.val);
      $curr_params(params=>( // update required param values
        {...params, [sugg.name]:sugg.val, ...sugg.opt}
      ));
      $txt_val(`/${newParts.join(' ')} `); 
    }
    
    $slt_idx(-1);
    if (input_ref) input_ref.focus();
  };

  const handle_key_down = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        $slt_idx(prev => prev < sugg().length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        $slt_idx(prev => prev > 0 ? prev - 1 : sugg().length - 1);
        break;
      case 'Enter':
        if (!show_sugg() || sugg().length === 0) { return prepared_cmd(e, true);  }
        e.preventDefault();
        if (slt_idx() >= 0) {  slt_sugg(sugg()[slt_idx()]); } 
        break;
      case 'Tab':
        e.preventDefault();
        if (sugg().length > 0) { slt_sugg(sugg()[0]); } // choose first candidate
        break;
      case 'Escape':
        $show_sugg(false);
        $slt_idx(-1);
        break;
    }
  };
  const reset = ()=> {
    $txt_val('');
    $curr_cmd(null);
    $curr_params(null);
    $show_sugg(false);
  };
  const handle_blur = e => { 
    setTimeout(()=> $show_sugg(false), 150);
    prepared_cmd(e, false);
  };
  const handle_focus = () => {
    gen_suggs();
  };
  // Listen to input value changes and automatically generate suggestions
  createEffect(() => {
    gen_suggs();
  });
  
  createEffect(() => {
    if(!props.txt_cmd()) {
      reset();
    }
  });
  return (
    <span class="command-autocomplete">
      <input ref={input_ref} type="text" value={txt_val()} class={props.class} placeholder={props.tip}
        onInput={(e) => $txt_val(e.target.value)}
        onKeyDown={handle_key_down}
        onFocus={handle_focus}
        onBlur={handle_blur}
      />
      {show_sugg() && sugg().length > 0 && (
        <div class="suggestions-dropdown">
          <For each={sugg()}>
            {(sugg, idx) => (
              <div class={`suggestion-item ${idx() === slt_idx() ? 'selected' : ''}`}
                onClick={() => slt_sugg(sugg)} >
                <div class="suggestion-value">
                  {sugg.type === 'command' ? `/${sugg.val}` : sugg.val}
                </div>
                {sugg.desc && (
                  <div class="suggestion-description">{sugg.desc}</div>
                )}
              </div>
            )}
          </For>
        </div>
      )}
    </span>
  );
}
export default Command;
