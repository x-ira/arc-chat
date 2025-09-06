use std::{fmt::Display, sync::Mutex};
use air::conf::cfg;
use tokio::sync::Semaphore;
use serde::{Deserialize,Serialize};
use reqwest::{header, Client};
use url::{ParseError, Url};
use scraper::Html;

#[cfg(feature = "db")]
use crate::db::{Store,Serializable};

pub type WrResult<T> = std::result::Result<T, WebReqErr>;
pub use reqwest::header::HeaderMap;

#[derive(Debug)]
pub enum WebReqErr {
	ReqFail(String),
	RspErr(String), // StatusCode
	UrlParseErr(String),
	DbErr(String),
	SyncErr(String),
}
impl Display for WebReqErr{
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f,"{:?}", self)
    }
}

#[cfg(feature = "db")]
impl From<crate::db::Error> for WebReqErr {
    fn from(e: crate::db::Error) -> Self {
    	WebReqErr::DbErr(e.to_string())
    }
}
impl From<reqwest::Error> for WebReqErr{
    fn from(e: reqwest::Error) -> Self {
    	WebReqErr::ReqFail(e.to_string())
    }
}
impl From<ParseError> for WebReqErr{
	fn from(e: ParseError) -> Self{
		WebReqErr::UrlParseErr(e.to_string())
	}
}
impl From<tokio::sync::AcquireError> for WebReqErr {
    fn from(e: tokio::sync::AcquireError) -> Self {
        WebReqErr::SyncErr(e.to_string())
    }
}
#[derive(Debug)]
pub struct WebReq {
	pub client: Client,
	pub cookies: Mutex<Vec<Cookie>>,
	pub req_limit: Semaphore,  
}

#[derive(Debug,Clone,Deserialize,Serialize)]
pub struct Cookie {
    pub domain: String,
    pub cookies: String,
}

/**
 * https://docs.rs/reqwest/0.12.12/reqwest/
 */
impl WebReq{
    pub fn new(max_reqs:usize) -> WrResult<Self>{
        Self::create(max_reqs, false, None)
    }
	pub fn create(max_reqs:usize, enable_proxy: bool, client_headers_opt: Option<Vec<(&'static str, &'static str)>>) -> WrResult<Self>{
		let mut headers = header::HeaderMap::new();
		headers.insert("User-Agent", header::HeaderValue::from_static("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"));
		headers.insert("Accept-Encoding", header::HeaderValue::from_static("gzip, br"));
		headers.insert("accept", header::HeaderValue::from_static("application/json, text/plain, */*"));
		if let Some(client_headers) = client_headers_opt{
            for (head_k, head_v) in client_headers{
                headers.insert(head_k, header::HeaderValue::from_static(head_v));
            }
		}

		let mut client_builder = Client::builder()
			// .cookie_store(true)
			.danger_accept_invalid_certs(true) //if cert invaid
			.default_headers(headers)
			.gzip(true)
			.brotli(true);
		if enable_proxy {
		   client_builder = client_builder.proxy(reqwest::Proxy::all(cfg::<String>("req.proxy"))?);
		}
		Ok(Self {
			req_limit: Semaphore::new(max_reqs),
			client: client_builder.build()?,
			cookies: Mutex::new(Vec::new()),
		})
	}

	// if env is running, auto update the cookies without restart env
	#[cfg(feature = "db")]
	pub fn reload_cookies(&self, store: &Store) -> WrResult<()>{
		let key = "domain.cookies";
        let cookies = store.find::<Vec<Cookie>>(key)?; 
        {
			let mut binding = self.cookies.lock().unwrap();
			*binding = cookies; 
		}
		Ok(())
		// log::warn!("WebReq::reload_cookies -> No Cookies reloaded. web request may fail, key: {}, err: {:?}", key,e);
	}
	/**
    * req cookies from url
    */
    #[cfg(feature = "db")]
	pub async fn req_cookies(&self, url: &str) -> WrResult<()>{
        let cookies = self.get_json::<Vec<Cookie>>(url).await?;
        if !cookies.is_empty() {
			let mut binding = self.cookies.lock().unwrap();
			*binding = cookies; 
        }
        Ok(())
	}

	/**
    *  when env start, req fresh cookies to make sure swarm run,
    *  if fail try load 'old' from local store
    */
    #[cfg(feature = "db")]
	pub async fn req_cookies_store(&self, store: &Store, url: &str) -> WrResult<()>{
        let cookies = self.get_json::<Vec<Cookie>>(url).await?;
		// dbg!(&cookies);
		if !cookies.is_empty() {
			let mut binding = self.cookies.lock().unwrap();
			*binding = cookies; 
        }else{
    		self.reload_cookies(store)?; //try load 'old' from local store
        }
        Ok(())
	}
	
	pub fn add_cookies(&self, domain: &str, cookies: &str){
		let mut binding = self.cookies.lock().unwrap();
		binding.push(Cookie {domain:domain.into(), cookies:cookies.into()});
	}

	pub fn update_cookie(&self, domain: &str, cookies: &str) {
		let mut binding = self.cookies.lock().unwrap();
		if let Some(c) = binding.iter_mut().find(|c| c.domain == domain){
			c.cookies = cookies.into();
		}
	}

	/**
    * load cookies fo given req url from self.cookies
    */
	fn load_cookie(&self, dest_url: &str) -> WrResult<String>{
		let target = Url::parse(dest_url)?;
		let mut cookie = String::new();
		if let Some(dest_domain) = target.host_str(){
	  		let binding = self.cookies.lock().unwrap();
	    	for c in binding.iter(){
				// log::debug!("WebReq::load_cookie -> dest_domain: {:?}, c.domain: {}", dest_domain, c.domain);
				if dest_domain.contains(&c.domain) { 
					cookie = c.cookies.clone();
					break;
				}
			}
		}
		// log::debug!("WebReq::load_cookie -> cookie: {:?}", cookie);
		Ok(cookie)
	}

	pub async fn post_form<P:Serialize>(&self, dest_url: &str, params: &P)->WrResult<String> {
		let permit = self.req_limit.acquire().await?;
		let rsp = self.client
			.post(dest_url)
			.header("Cookie", self.load_cookie(dest_url)?)
		    .form(params)
		    .send()
		    .await?;
		drop(permit);

		if !rsp.status().is_success() {
			return Err(WebReqErr::RspErr(rsp.status().to_string()));
		}
		log::debug!("req::post_form -> Rsp Data: {:?}", rsp);
		let result = rsp.text().await?;
		Ok(result)
	}
	pub async fn post_json<P:Serialize>(&self, dest_url: &str, json_params: &P)->WrResult<String> {
		let permit = self.req_limit.acquire().await?;
		let rsp = self.client
			.post(dest_url)
			.header("Cookie", self.load_cookie(dest_url)?)
		    .json(json_params)
		    .send()
		    .await?;
		drop(permit);
		
		if !rsp.status().is_success() {
			return Err(WebReqErr::RspErr(rsp.status().to_string()));
		}
		
		log::debug!("req::post_json -> Rsp Data: {:?}", rsp);
		let result = rsp.text().await?;
		Ok(result)
	}

	#[cfg(feature = "db")]
	pub async fn post_json_data<P, R>(&self, dest_url: &str, json_params: &P)->WrResult<R>
	where
      P: Serialize,
      R: Serializable,
   {
		let permit = self.req_limit.acquire().await?;
		let rsp = self.client
			.post(dest_url)
			.header("Cookie", self.load_cookie(dest_url)?)
		    .json(json_params)
		    .send()
		    .await?;
		drop(permit);
		if !rsp.status().is_success() {
			return Err(WebReqErr::RspErr(rsp.status().to_string()));
		}
		log::debug!("req::post_json_data -> Rsp Data: {:?}", rsp);
		let result = rsp.json::<R>().await?;
		Ok(result)
	}

	/**
    * get text rsp
    */
	pub async fn get_text(&self, dest_url: &str)-> WrResult<String>{
		log::debug!("WebReq::get_text -> dest_url: {:?}", dest_url);
		let permit = self.req_limit.acquire().await?;
		let rsp = self.client
		.get(dest_url)
		.header("Cookie", self.load_cookie(dest_url)?)
		.send().await?;
		drop(permit);
		
		if rsp.status().is_success() {
			let data = rsp.text().await?; // .text_with_charset("utf-8")
			log::debug!("WebReq::get_text -> rsp: {:?}",data);
			Ok(data)
		}else{
			Err(WebReqErr::RspErr(rsp.status().to_string()))
		}
	}

	pub async fn get_html(&self, dest_url: &str)-> WrResult<Html>{
		// self.get_text::<T>(dest_url).await; //hack in for debug
		log::debug!("WebReq::get_html -> dest_url: {:?}", dest_url);
		let permit = self.req_limit.acquire().await?;
		let rsp = self.client
			.get(dest_url)
			.header("Cookie", self.load_cookie(dest_url)?)
			.send().await?;

		drop(permit);
		
		if rsp.status().is_success() {
			let data = rsp.text().await?;
			Ok(Html::parse_fragment(&data))
		}else{
			Err(WebReqErr::RspErr(rsp.status().to_string()))
		}
	}
	#[cfg(feature = "db")]
	pub async fn get_json<T:Serializable>(&self, dest_url: &str)->WrResult<T>{
	   self.get_json_with_headers::<T>(dest_url, HeaderMap::default()).await
	}
	#[cfg(feature = "db")]
	pub async fn get_json_with_headers<T:Serializable>(&self, dest_url: &str, headers: HeaderMap)->WrResult<T>{
		let permit = self.req_limit.acquire().await?;
		let rsp = self.client
			.get(dest_url)
			.header("Cookie", self.load_cookie(dest_url)?)
			.headers(headers)
			.send().await?;

		drop(permit);
		if rsp.status().is_success() {
			Ok(rsp.json::<T>().await?)
		}else{
			Err(WebReqErr::RspErr(rsp.status().to_string()))
		}
	}
}
