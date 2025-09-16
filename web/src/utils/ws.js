import { encode, decode} from "@msgpack/msgpack";

// wsc.on('#connected', ()=>{});
// wsc.on('#reconnecting', ()=>{});
// wsc.on('#reconnect_failed', ()=>{});
class WebSocketClient {
  constructor(url, opt = {}) {
    this.config = {
    	evt_key: opt.evt_key, //if no_dispatcher is true, evt_key is useless, and only @def_evt_name will emit
    	no_dispatcher: opt.no_dispatcher ?? true,
    	def_evt_name: opt.def_evt_name ?? 'msg',
    	binary: opt.binary ?? true,  // Msgpack | JSON
    	binaryType: opt.binaryType || "arraybuffer",  // "blob" | "arraybuffer"
      maxRetries: opt.maxRetries || 5,       // 最大重连次数
      reconnectInterval: opt.reconnectInterval || 5*1000, // 基础重连间隔(ms)
      reconnectExponent: opt.reconnectExponent || 1.7, // 退避指数
      isActiveClose: false                         // 是否主动关闭标记<cite data-id='70002'>70002</cite>
    };
    if (this.config.binary && !["blob", "arraybuffer"].includes(this.config.binaryType)) {
      throw new Error('binaryType must be "blob" or "arraybuffer"');
    }
    
    this.url = url;
    this.reconnectCount = 0;                      // 当前重连计数
    this.evt_listeners = {};
    this.connect();
  }
  on(evt, cb) {
		if(!this.evt_listeners[evt]) this.evt_listeners[evt] = [];
		this.evt_listeners[evt].push(cb);
  }
  emit(evt, data) {
		if (this.ws.readyState !== WebSocket.OPEN) {
			console.warn('WebSocket is not open. Cannot send message.');
			return false;
		}
		try {
			let payload = (typeof data === "undefined" || data == null)?evt:{[evt]:data}; 
			let msg = this.config.binary ? encode(payload) : JSON.stringify(payload);
			this.ws.send(msg);
			return true;
		} catch (error) {
			console.error('Failed to send WebSocket message:', error);
			return false;
		}
  }
  _sys_evt_dispatch(evt,data){
    if(evt && evt.startsWith('#')) {
  		let cbs = this.evt_listeners[evt];
  		if(!cbs) return;
  		cbs.forEach(cb=>{
  			cb(data);
  		});
    }
  }
 	_user_evt_dispatch(evt, data) {
		let cbs = this.evt_listeners[evt];
		if(!cbs || cbs.length == 0) {
			console.error("ws event handler missing for: ", evt); // `#sys_evt` is optional
			return;
		}
		cbs.forEach(cb=>{
			cb(data);
		});
	}
	_dispatch_msg_evt(msg){
	  	if(this.config.no_dispatcher) {
	  	   this._user_evt_dispatch(this.config.def_evt_name, msg);
	  		 return ;
	  	}
	  	//cfg.evt_key == act : {ts, act:{..}}, evt_name: act
	  	//cfg.evt_key == null: {Pos:[..]},  evt_name: Pos
	  	if (typeof msg === 'object' && msg !== null) {
		    let evt_name = this.config.evt_key ? msg[this.config.evt_key] : Object.keys(msg)[0];
		    this._user_evt_dispatch(evt_name, msg);
	  	} else {
	  		console.warn('Received invalid message format:', msg);
	  	}
	}
  connect() {
    if (this.reconnectCount >= this.config.maxRetries) {
      console.error(`Max reconnect attempts (${this.config.maxRetries}) exceeded`);
      this._sys_evt_dispatch('#reconnect_failed');
      return;
    }

    this.ws = new WebSocket(this.url);
    if(this.config.binary) this.ws.binaryType = this.config.binaryType;
    
    this.ws.addEventListener('open', this._handleOpen.bind(this));
    this.ws.addEventListener('message', this._handleMessage.bind(this));
    this.ws.addEventListener('close', this._handleClose.bind(this));
    this.ws.addEventListener('error', this._handleClose.bind(this));
  }

  _handleOpen() {
    this.reconnectCount = 0;                      // 重置重连计数器
    this._sys_evt_dispatch('#connected');
	  console.info("ws connection (re)opened");
  }

  // 处理异常关闭（自动触发重连）
  _handleClose(e) {
    if (this.config.isActiveClose) return;        // 主动关闭不重连
    
    // 指数退避算法：间隔 = 基础间隔 * (指数^当前次数)
    const delay = this.config.reconnectInterval * 
                  Math.pow(this.config.reconnectExponent, this.reconnectCount);
    
    setTimeout(() => {
      this.reconnectCount++;
      this.connect();
    }, delay);
    
    this._sys_evt_dispatch('#reconnecting', { attempt: this.reconnectCount });
    console.warn(`ws connection is closed. Reconnect will be attempted in ${this.config.reconnectInterval} millseconds.`);
  }
  _handleMessage(e) {
		if(e.data instanceof ArrayBuffer) {
				let view = new Uint8Array(e.data);
				let msg = decode(view);
				this._dispatch_msg_evt(msg);
	   }else if(e.data instanceof Blob) {
		  e.data.text().then(data=>{
				this._dispatch_msg_evt(data);
			});
		}else{ // !binary
		    console.debug("ws received message: "+ e.data);
				try {
					let msg = JSON.parse(e.data);
					this._dispatch_msg_evt(msg);
				} catch (error) {
					console.error('Failed to parse JSON message:', error);
				}
		}
  }
  // 手动关闭连接（不触发重连）
  close() {
    this.config.isActiveClose = true;
    this.ws.close();
  }
}

export default WebSocketClient;
