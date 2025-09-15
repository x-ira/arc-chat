import crypto from './crypto.js';

export class Time{
  static ts(strDate){ //in millis
    if(!strDate) return Date.now();
    var datum = Date.parse(strDate);
    return datum;
  }
  static now() {
    return Date.now();
  }
  static iso(ts) {//in millis
    return new Date(ts).toISOString().slice(0, 19).replace('T', ' ');
  }
  static today() {
    return new Date().toISOString().substring(0, 10);
  }
  static iso_now() {
    return new Date().toISOString().substring(0, 19).replace('T',' ');
  }
}
export class Num{
  static _round(num,prec) {
    return Math.round(+num + 'e' + prec) / Math.pow(10, prec); //OR: Number(Math.round(+num + 'e' + prec) + 'e-' + prec)
  }
  static _min_prec(num) {
    return (String(num).match(/\.{1}0*/g) || [''])[0].length; //最小精度, 对于 num:0.003615, prec:2, 期望:0.004, ret: 3
  }
  static round(n, p){ //to float
    if(!n) return n;
    p = p!=null?p:2;
    let min_p = Num._min_prec(n);
    p = p<min_p?min_p:p;
    return Num._round(n,p);
  }
  static rounds(n,p){  //to string
    return Num.round(n,p).toFixed(p);
  }
  static clean(v){
    if(v ==undefined) v = null;
    if(v!=null) v = parseFloat(v);
    if(isNaN(v)) v = null;
    return v;
  }
}
export function uid(len){
  len = len || 5;
  return Math.floor(Math.random() * 10 ** len);
}
export function capitalize(str) {
  if(!str) return str;
  else return str.charAt(0).toUpperCase() + str.slice(1)
}
export function json2tbl(items) {
  if(!items || !Array.isArray(items) || items.length == 0) {
    return {header:[], rows:[]};
  }
  const header = Object.keys(items[0]);
  // handle null or undefined values here
  const fix_val = (val) => {
    if(!val) return '';
    if(typeof val === 'number'){
        return val.toFixed(2);
    }
    return val;
  }
  const rows = items.map((row) =>
    header
      .map((fieldName) => fix_val(row[fieldName])) //.join(',')
  );
  return {header, rows};
}

// Parse HTML table element to JSON array of objects
export function tbl2json(tableEl) {
    const columns = Array.from(tableEl.querySelectorAll('th')).map(it => it.textContent)
    const rows = tableEl.querySelectorAll('tbody > tr')
    return Array.from(rows).map(row => {
        const cells = Array.from(row.querySelectorAll('td'))
        return columns.reduce((obj, col, idx) => {
            obj[col] = cells[idx].textContent
            return obj
        }, {})
    })
}
// only run in un-sec case
export async function upload_files(url, files, file_cb) {
  let data = new FormData();
  for (let file of files) {
    if(file_cb) file = await file_cb(file); //async cb
    data.append('files',file,file.name)
  }
  return fetch(url, {
    method: 'post',
    body: data
  });
}
export async function get(url, params, opt) {
    return await get_req(url, params, opt, false);
}
export async function gets(url, params, opt) { 
    opt = opt || {};
    opt.auth = true;
    return await get_req(url, params, opt, false);
}
export async function get_tls(url, params, opt) { //with TOTP likely security
    opt = opt || {};
    opt.headers['x-data'] = 'y'; //notify server for tls
    return await get_req(url, params, opt, true);
}
async function get_req(url, params, opt, is_tls) { 
	console.log(url + '?' + new URLSearchParams(params));
  opt = opt || {};
  opt.method = 'get'; //overwrite to make sure!
  if(!await add_auth_header(opt)){ return null; }
  let param_str = '';
	if(params) param_str += '?' + new URLSearchParams(params);
  return fetch(url + param_str, opt).then(async rsp=>parse_rsp(rsp, is_tls));
}
async function add_auth_header(opt) {
  if(opt.auth) {
    let auth = await sign_req();
    if(!auth){ return false; }
    opt.headers = opt.headers || {}; // Not []
    opt.headers.Authorization = auth; // add
    return true;
  }
  return true;
}
async function sign_req() {
    let now = Time.ts();
    let cached_ac = localStorage.getItem('access_token');
    if(!cached_ac) {
        console.warn('Access token is missing.');
        return null;
    }
    try{
        let t = JSON.parse(cached_ac);
        if(now > t.exp) {
            console.error('Access token has expired.');
            return null;
        }
        let data = `${t.uid}.${t.exp}.${now}`;
        let acc_sign = await crypto.sign(t.key, data);
        return `${data}.${acc_sign}`;
   }catch(e){
        console.error('Access token is damaged.');
        return null;
  }
}
export async function post(url, data, opt) {
  return await post_req(url, data, opt, false);
}
export async function posts(url, data, opt) {
  opt = opt || {};
  opt.auth = true;
  return await post_req(url, data, opt, false);
}
export async function post_tls(url, data, opt) {
  opt = opt || {};
  opt.headers['x-data'] = 'y'; //notify server for tls
  return await post_req(url, data, opt, true);
}
async function post_req(url, data, opt, is_tls) {
  opt = opt || {};
  opt.method = 'post'; //overwrite to make sure!
  // opt.mode = "cors"; // no-cors, *cors, same-origin
  opt.headers = opt.headers || {};
  opt.headers['Content-Type'] = 'application/json; charset=UTF-8';
  opt.body = JSON.stringify(data);
  if(!await add_auth_header(opt)){ return; }
  let full_opt = await compose_req(opt, is_tls);
  return fetch(url, full_opt).then(async rsp=>parse_rsp(rsp, is_tls));
}
async function compose_req(opt, is_tls){
  if(is_tls){ // comment this for dev!!!
    let tls_key = await crypto.load_tls_key();
    if(tls_key){
      opt.body = await crypto.enc_aes_bytes(opt.body, tls_key);
    }
  }
  return opt;
}
async function parse_rsp(rsp, is_tls){
  if(is_tls){ //comment this for dev!!!
      let tls_key = await crypto.load_tls_key();
      if(tls_key) {
         // -- base64 --
         // let r = (await rsp.text()).split('.');
         // let dec_text = await crypto.dec_aes(r[0], r[1], tls_key);
         // -- arrayBuffer --
         let r = await rsp.arrayBuffer();
         let dec_text = await crypto.dec_aes_bytes(r.slice(12), r.slice(0,12), tls_key);

         rsp.json = async ()=> JSON.parse(dec_text);
         rsp.text = async ()=> dec_text;
      }
  }
  return rsp; //plain 
}
export async function post_form(url, data) {
    let form_data = new FormData();
    for (let key in data ) {
        form_data.append(key, data[key]);
    }
    const rsp = await fetch(url, {
        method:"post",
        // mode: "cors", // no-cors, *cors, same-origin
        body:form_data,
    });
    return rsp;
}
// <td innerHTML="${fmt_json(json_obj)}>
export function fmt_json(json) {
    let idx = 0;
    if (typeof json != 'string') {
         json = JSON.stringify(json, (k,v)=>{
            if(v && typeof v === 'number') {
                v=v.toFixed(0);
            }
            if(k && k=='code') {
                v+=`-${idx++}`;
            }
            return v;
         }, 2);
    }
    //去掉括号和引号
    json = json.replace(/\"/g, '');
    json = json.replace(/\,/g, '');
    json = json.replace(/\[/g, '').replace(/\]/g, '').replace(/\]\,/g, '').replace(/\]/g, '');
    json = json.replace(/\{/g, '').replace(/\}/g, '').replace(/\}\,/g, '').replace(/\}/g, '');
    json = json.replace(/\n(\s*)\n/g, '\n');

    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
    json += '\n';
    return json;
}
export async function reg_sw(file_name) {
  if(navigator.serviceWorker ) { //&& location.hostname != "localhost" && location.pathname == '/'
    navigator.serviceWorker.register(file_name, { scope: './' }).then(async reg => {
      let sw = reg.active; //.waiting
      console.log('Service worker state: ', sw.state);
      if(sw && sw.state == 'activated') {
        sw.addEventListener('statechange', e=> {
          console.log(`Svc Worker:`, e.target.state);
        });
      }
    }).catch(err=> {
      console.log('Registration failed with ' + err);
    });
  }
}
//url safe b64,  keep pad: '='
export function b64_url(b64) {
  if(!b64) return null;
  return b64
    .replace(/\+/g, '-') // Replace '+' with '-'
    .replace(/\//g, '_'); // Replace '/' with '_'
}
export function b64_std(b64_url) {
  if(!b64_url) return null;
  return b64_url
    .replace(/\-/g, '+') 
    .replace(/\_/g, '/'); 
}
export function u8_b64_url(u8) {
  let b64 = btoa(String.fromCharCode.apply(null, u8));
  return b64_url(b64);
}
export function u8_b64(u8) {
    return btoa(String.fromCharCode.apply(null, u8));
}
export function b64_url_u8(b64_url) {
  let b64 = b64_std(b64_url);
  return atob(b64).split('').map(function (c) { return c.charCodeAt(0); });
}
export function b64_u8(b64) {
    return atob(b64).split('').map(function (c) { return c.charCodeAt(0); });
}
export function b64_ab(b64) { //to ArrayBuffer
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}
export function ab_b64(ab) { //from ArrayBuffer
  return btoa(new Uint8Array(ab).reduce((data, byte) => data + String.fromCharCode(byte), ''));
}
export function save_subscription(url, appPubkey) {
	navigator.serviceWorker.ready.then((sw_reg) => sw_reg.pushManager.getSubscription()
        .then((subscription) => {
            if (subscription) {
                return subscription;
            }
            console.log(sw_reg)
            return sw_reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(appPubkey)
            });
        })
        .then((subscription) =>
            // console.log(subscription,JSON.stringify(subscription));
            post(url, subscription)));
}
function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i)  {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}
