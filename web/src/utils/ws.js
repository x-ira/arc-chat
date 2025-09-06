import { encode, decode} from "@msgpack/msgpack";

WebSocket.prototype.evt_listeners = {};
// usage: emit(msg) | emit('evt', data)
WebSocket.prototype.emit = function(evt, data) { 
	let payload = (typeof data === "undefined" || data == null)?evt:{[evt]:data}; 
	let msg = cfg.binary ? encode(payload) : JSON.stringify(payload);
	this.send(msg);
};
WebSocket.prototype.on = function(evt, cb) { //reg listener
	if(!this.evt_listeners[evt]) this.evt_listeners[evt] = [];
	this.evt_listeners[evt].push(cb);
};
WebSocket.prototype.recv_evt_dispatch = function(evt, data) {
	let cbs = this.evt_listeners[evt];
	if(!cbs) {
		if(!evt.startsWith('#')) console.error("ws event handler missing for: ", evt); // `#evt` is optional
		return;
	}
	cbs.forEach(cb=>{
		cb(data);
	});
};

let cfg, ws;

function init_ws() {
	if(ws && (ws.readyState == 0 || ws.readyState == 1)) return ws;// CONNECTING or OPEN, should not create again.
	const websocket = new WebSocket(cfg.endpoint);
	if(cfg.binary) websocket.binaryType = 'arraybuffer'; // arraybuffer | blob

	websocket.onopen = function(_e) {
		websocket.recv_evt_dispatch('#connected', cfg);
	    console.info("ws connection (re)opened");
	}
	websocket.onclose = function(_e) {
		websocket.recv_evt_dispatch('#disconnected', cfg);
		let interval = cfg.interval || 10; //secs, re-connect interval
    console.warn(`ws connection is closed. Reconnect will be attempted in ${interval} second.`);
    setTimeout(()=> { init_ws() }, interval * 1000);
	}
	websocket.onmessage = function(e) {
		if(e.data instanceof ArrayBuffer) {
				let view = new Uint8Array(e.data);
				let msg = decode(view);
				dispatch_evt(msg);
	   }else if(e.data instanceof Blob) {
		  e.data.text().then(data=>{
				dispatch_evt(data);
			});
		}else{
		    console.debug("ws received message: "+ e.data);
				dispatch_evt(JSON.stringify(e.data));
		}
	}
	ws = websocket;
	return ws;
}
function dispatch_evt(msg){
  	if(cfg.no_dispatcher) {
  	   ws.recv_evt_dispatch(cfg.def_evt_name, msg);
  		 return ;
  	}
  	//cfg.evt_key == act : {ts, act:{..}}, evt_name: act
  	//cfg.evt_key == null: {Pos:[..]},  evt_name: Pos
    let evt_name = cfg.evt_key || Object.keys(msg)[0];
    ws.recv_evt_dispatch(evt_name, msg);
}
// config: {
//  endpoint: 'ws://localhost:1024/ws/:client_id',
//  interval: try reconnect interval(sec),
//  evt_key: default 0,
//  binary: true, //using Msgpack, if not using JSON
//  no_dispatcher: default false, if no_dispatcher is true, evt_key is useless, and only @def_evt_name will emit
// }
//
// recv msg should be a json string!
// eg. msg: {ts, act:{..}}, 'act' is evt_key
// Optional Evts, define actions when ws (dis)connected
// ws.on('#connected', ()=>{});
// ws.on('#disconnected', ()=>{});
export default function ws_client(config) {
	if(config) cfg = config;
	if(cfg) cfg.def_evt_name = cfg.def_evt_name || 'event';
	return init_ws();
}
