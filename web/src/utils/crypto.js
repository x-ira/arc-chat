import {b64_ab, ab_b64, u8_b64 } from './app.js';

async function sign(hmac_key_b64, data){
  let hmac_key = await import_key(hmac_key_b64, {name:"HMAC", hash:'SHA-256'}, ["sign"]);
  const data_u8 = new TextEncoder().encode(data); // encode as (utf-8) Uint8Array
	let sign = await window.crypto.subtle.sign("HMAC", hmac_key, data_u8);
	return ab_b64(sign);
}
async function hash(msg) {
  const msg_u8 = new TextEncoder().encode(msg); // encode as (utf-8) Uint8Array
  const hash_buff = await crypto.subtle.digest("SHA-256", msg_u8); // hash the message
  const hash_arr = Array.from(new Uint8Array(hash_buff)); // convert buffer to byte array
  const hash_hex = hash_arr
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hash_hex;
}
/**
 * algo_type: aes | hmac
 */
async function gen_key(passwd, salt, algo_type) {
  let algo = {name: "AES-GCM", length: 256}; //default
  let usage =  ["encrypt", "decrypt"];//default
  if(algo_type == 'hmac'){
    algo = {name: 'HMAC', hash: 'SHA-256', length: 256};
    usage = ['sign'];
  }
  return derive_key(passwd, salt, algo, usage)
}
async function derive_key(passwd, salt, algo, usage) {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw", encoder.encode(passwd), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 1,
      hash: "SHA-256"
    },
    passwordKey,
    algo,
    true,
    usage,
  );
}
async function load_tls_key(){
  let tls_key = localStorage.getItem('tls_key');
  if(!tls_key) {
    console.error('No tls key found. You need install it first.');
    return ;
  }
  return import_key(tls_key, "AES-GCM", ["encrypt","decrypt"]);
}
// input encode: <base64>
async function import_key(raw_key, algo, usage) {
  return window.crypto.subtle.importKey("raw", b64_ab(raw_key), algo, true, usage);
}
// output encode: <base64>
async function export_key(key){
  const exported_key = await window.crypto.subtle.exportKey("raw",key);
  return ab_b64(exported_key);
}
// -- web crypto api NOT support chacha20 related algorithm yet -- 
async function enc_aes_b64(text, key) { //concat iv with data
  const enc_bytes = await enc_aes_bytes(text, key);
  return u8_b64(enc_bytes);
}
async function enc_aes_bytes(text, key) { //concat iv with data
  const {enc_data,iv} = await enc_aes_raw(text, key);
  return new Uint8Array(Array.from(iv).concat(Array.from(new Uint8Array(enc_data))));
}
async function enc_aes(text, key) {
  const {enc_data,iv} = await enc_aes_raw(text, key);
  return { iv: u8_b64(iv),  data: btoa(String.fromCharCode(...new Uint8Array(enc_data)))  };
}
async function enc_aes_raw(text, key) {
  try{
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const algorithm = { name: 'AES-GCM', iv };
    const enc_data = await window.crypto.subtle.encrypt(algorithm, key, data);
    return {enc_data, iv};
  }catch(err){
    console.error(err);
  }
}
async function dec_aes(b64_enc_data, b64_iv, key) {
  const encryptedData = b64_ab(b64_enc_data);
  const iv = b64_ab(b64_iv);
  return dec_aes_bytes(encryptedData, iv, key);
}
async function dec_aes_b64(data_with_iv, key) {
  const full_data = b64_ab(data_with_iv);
  const iv = full_data.slice(0,12);
  const enc_data = full_data.slice(12);
  return dec_aes_bytes(enc_data, iv, key);
}
async function dec_aes_bytes(ab_enc_data, iv, key) {
  try{
    const algo = { name: 'AES-GCM', iv };
    const decryptedData = await window.crypto.subtle.decrypt(algo, key, ab_enc_data);
    return new TextDecoder().decode(decryptedData);
  }catch(err){
    console.error(err);
  }
}
export default {
  sign, hash,
  enc_aes, enc_aes_bytes, enc_aes_b64, dec_aes_b64, dec_aes, dec_aes_bytes, gen_key, import_key, export_key, load_tls_key
};
//nots: using crypto.sign instead of {sign} cuase export default {}
