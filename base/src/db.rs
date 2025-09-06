use bincode::config::standard;
use redb::{Database, ReadTransaction, ReadableTable, TableDefinition, TableHandle, WriteTransaction, ReadableDatabase};
use serde::{Serialize, Deserialize};
use std::{fmt::Display, fs};
use Error::*;

const DEFAULT_TABLE: &str = "my_tbl";

type K = &'static str;
type V = &'static [u8];
type Table<'txn> = redb::Table<'txn, K, V>;
type ReadOnlyTable = redb::ReadOnlyTable<K, V>;
pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, Clone)]
pub enum Error {
    InsertErr(String),
    QueryErr(String),
    UpdateErr(String),
    DeleteErr(String),
    SerdeErr(String),
    TxnErr(String),
    UnInitErr(String),
    InitErr(String),
    DBErr(String),
}
impl Display for Error{
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f,"{:?}", self)
    }
}

#[derive(Debug)]
pub struct Store { //default store
    name: String,
    db: Database,
}
impl Store {
    pub fn new(name:&str) -> Self{
        Self::init(name, "./db")
    }
    pub fn init(name:&str, path: &str) -> Self{
        let store = Self{
            name:name.to_string(),
            db:Self::create_db(name, path),
        };
        store.save("db.name", &store.name).unwrap(); //init, if db removed, tbl need init to create
        store
    }
    fn get_tbl_def(tbl:&str)->TableDefinition<'_, K,V>{
        TableDefinition::new(if tbl.is_empty() { DEFAULT_TABLE } else { tbl })
    }
    pub fn save(&self, key: &str, thing: &impl Serializable) -> Result<()>{ //<T:Serializable>
        self.put("", key, thing.to_bytes())
    }
    pub fn save_in(&self, tbl:&str, key: &str, thing: &impl Serializable) -> Result<()>{ //<T:Serializable>
        self.put(tbl, key, thing.to_bytes())
    }
    pub fn find<T:Serializable>(&self, key: &str) -> Result<T>{
        self.get::<T>("", key)  //no need downcast! serde already done that!
    }
    /**
     * find by key in given tbl
     */
    pub fn find_in<T:Serializable>(&self, tbl:&str, key: &str) -> Result<T>{
        self.get::<T>(tbl,key)  //no need downcast! serde already done that!
    }
    fn put(&self, tbl: &str, key: &str, val: Vec<u8>) -> Result<()>{
        let txn = self.begin_write_txn()?;
        {
	        let mut tbl_w = Self::open_w_tbl(&txn, tbl)?;
	        tbl_w.insert(key, &val[..]).map_err(|e| InsertErr(format!("insert into table: {tbl} for {key} failed: {e}")) )?;
	    }
	    self.commit_txn(txn)
    }
    fn get<T:Serializable>(&self, tbl:&str, key: &str)-> Result<T>{
        self._do_in_txn::<_,T>(tbl, |ro_tbl|{
            let opt = ro_tbl.get(key)
                .map_err(|e| QueryErr(format!("get obj from table: {tbl} for {key} failed: {e}")) )?;
            match opt{
                Some(val) => {
                    let try_val = <T>::try_from_bytes(val.value());
                    try_val.map_err(|e| SerdeErr(e.to_string()))
                }
                _ =>{
                    Err(QueryErr(format!("Store::get -> Got None from store for {key}")))
                }
            }
        })
    }
    //make sure open the readonly table
    fn _do_in_txn<F,R>(&self, tbl:&str, f: F) -> Result<R>
    where
        F: Fn(ReadOnlyTable)-> Result<R>,
    {
        let txn= self.begin_read_txn()?;
        let ro_tbl = Self::open_r_tbl(txn, tbl)?;
        f(ro_tbl)
    }
    fn begin_read_txn(&self) -> Result<ReadTransaction>{
        self.db.begin_read().map_err(|e|TxnErr(e.to_string()))
    }
    fn begin_write_txn(&self) -> Result<WriteTransaction>{
        self.db.begin_write().map_err(|e|TxnErr(e.to_string()))
    }
    fn commit_txn(&self, txn: WriteTransaction) -> Result<()>{
        txn.commit().map_err(|e|TxnErr(e.to_string()))
    }
    fn open_r_tbl(txn: ReadTransaction, tbl:&str)-> Result<ReadOnlyTable>{
        txn.open_table(Self::get_tbl_def(tbl)).map_err(|e| DBErr(format!("open table:{tbl} in read-only failed: err:{e}")))
    }
    fn open_w_tbl<'txn>(txn: &'txn WriteTransaction, tbl: &str)-> Result<Table<'txn>>{
        txn.open_table(Self::get_tbl_def(tbl)).map_err(|e| DBErr(format!("open table:{tbl} in writable failed: err:{e}")))
    }
    /**
     * filter key and val by given fn
     * return k,v list which mathec
     */
    pub fn filter<T:Serializable>(&self, kv_filter: impl Fn(&str,&T) -> bool)-> Result<Vec<(String,T)>>{
        self.filter_in("", kv_filter)
    }
    pub fn filter_key<T:Serializable>(&self, k_filter: impl Fn(&str) -> bool)-> Result<Vec<(String,T)>>{
        self.filter_key_in("", k_filter)
    }
    pub fn update_with<T>(&self, key: &str, f: impl FnMut(Option<&mut T>)) -> Result<()>
    where T: Serializable{
        self.update_within("", key, f)
    }
    pub fn update_within<T>(&self, tbl: &str, key: &str, f: impl FnMut(Option<&mut T>)) -> Result<()>
    where T: Serializable {
        self.save_with_def_opt(tbl, key, f, None)
    }
    pub fn save_with<T>(&self, key: &str, f: impl FnMut(Option<&mut T>), def: T) -> Result<()>
    where T: Serializable{
        self.save_with_def_opt("", key, f, Some(def))
    }
    pub fn save_within<T>(&self, tbl: &str, key: &str, f: impl FnMut(Option<&mut T>), def: T) -> Result<()>
    where T: Serializable{
        self.save_with_def_opt(tbl, key, f, Some(def))
    }
    ///with default, if not existed try create one with default opt
    fn save_with_def_opt<T>(&self, tbl:&str, key: &str, mut f: impl FnMut(Option<&mut T>), def_opt: Option<T>) -> Result<()>
    where T: Serializable {
        let txn_w = self.begin_write_txn()?;
        {
            let mut tbl_w = txn_w.open_table(Self::get_tbl_def(tbl))
                .map_err(|e| DBErr(format!("open table:{tbl} in writable failed: err:{e}")))?;
            let mut vo = None;
    		if let Some(byte_val) = tbl_w.get(key).map_err(|e| QueryErr(e.to_string()))? { //Not Found
    		     if let Ok(val) = <T>::try_from_bytes(byte_val.value()){
                     vo = Some(val);
    				 f(vo.as_mut());
    			 }
    		}
            if let Some(val) = vo {
                tbl_w.insert(key, &val.to_bytes()[..])
                    .map_err(|e| UpdateErr(format!("update into table: {tbl} failed: {e}")) )?;
            }else if let Some(def_v) = def_opt {
                tbl_w.insert(key, &def_v.to_bytes()[..])
                    .map_err(|e| InsertErr(format!("insert into table: {tbl} failed: {e}")) )?;
            }
        }
        self.commit_txn(txn_w)
    }
    /**
     * filter by given fn with key and val
     * return k,v list which mathec
     */
    pub fn filter_in<T>(&self, tbl:&str, kv_filter: impl Fn(&str, &T) -> bool)-> Result<Vec<(String,T)>>
    where
        T:Serializable,
    {
        self._do_in_txn::<_,Vec<(String,T)>>(tbl, |r_tbl|{
            let iter = r_tbl.iter().map_err(|e| QueryErr(e.to_string()))?;
            let fl = iter.filter_map(|r| {
                let kv = r.ok()?; //maybe need a log warn
                let key = kv.0.value();
                let try_val = <T>::try_from_bytes(kv.1.value());
                match try_val{
                    Ok(val) => {
                        if kv_filter(key, &val) && !key.is_empty(){
                            return Some((key.to_string(),val)); //不可以返回&ref类型，因为临时变量被丢弃
                        }
                    },
                    Err(e) => {
                        log::warn!("Store::filter_in -> Try deserialize from bytes failed. key: {}, err: {}", key, e);
                    }
                }
                None
            }).collect();
            Ok(fl)
        })
    }
    /**
     * filter by given fn with key only, for effeciency
     * return k,v list which mathec
     */
    pub fn filter_key_in<T>(&self, tbl:&str, key_filter: impl Fn(&str) -> bool)-> Result<Vec<(String,T)>>
    where T:Serializable,
    {
        self._do_in_txn::<_,Vec<(String,T)>>(tbl, |r_tbl|{
            let iter = r_tbl.iter().map_err(|e| QueryErr(e.to_string()))?;
            let fl = iter.filter_map(|r| {
                let kv = r.ok()?;
                let key = kv.0.value();
                if key_filter(key) && !key.is_empty(){
                    match <T>::try_from_bytes(kv.1.value()) {
                        Ok(val) => {
                            return Some((kv.0.value().to_string(),val)); //不可以返回&ref类型，因为临时变量被丢弃
                        },
                        Err(e) => {
                            log::warn!("Store::filter_key_in -> Try deserialize from bytes failed. key: {}, err: {}", key, e);
                        }
                    }
                }
                None
            }).collect();
            Ok(fl)
        })
    }
    pub fn remove(&self, key: &str) -> Result<()>{
        self.remove_in("", key)
    }
    pub fn remove_in(&self, tbl:&str, key: &str) -> Result<()>{
    	let txn = self.begin_write_txn()?;
        {
        	let mut tbl_w = Self::open_w_tbl(&txn, tbl)?;
        	tbl_w.remove(key).map_err(|e| DeleteErr(format!("delete for {key} in table: {tbl} failed, err: {e}")))?;
        }
        self.commit_txn(txn)
    }
    pub fn list_tables(&self) -> Result<Vec<String>> {
        let txn = self.begin_read_txn()?;
        let tbls:Vec<String> = txn.list_tables()
            .map_err(|e| QueryErr(format!("list tables failed, err:{e}")))?
                .map(|t| t.name().into()).collect();
        Ok(tbls)
    }
    pub fn delete_table(&self, tbl:&str) -> Result<bool> {
        let txn = self.begin_write_txn()?;
        let tbl_existed = txn.delete_table(Self::get_tbl_def(tbl))
            .map_err(|e| DeleteErr(format!("delete table:{tbl} failed, err:{e}")))?;
        self.commit_txn(txn)?;
        Ok(tbl_existed)
    }
    fn create_db(name:&str, path: &str) -> Database{
        if let Err(e) = fs::create_dir_all(path){
            panic!("create `{path}` folder fail: {e}") //fatal err should panic
        };
		let ret = Database::create(format!("{path}/{name}.redb"));
    	match ret {
	        Ok(db) => db,
	        Err(e) => {
               panic!("create db fail: {e}") //fatal err should panic
          }
    	}
    }
}
/// We can now implement Clone manually by forwarding to clone_box.
pub trait Serializable: for<'a> Deserialize<'a> + Serialize {
    fn to_bytes(&self) -> Vec<u8>;
    fn from_bytes(encoded: &[u8]) -> Self;
    fn try_from_bytes(encoded: &[u8]) -> std::result::Result<Self, bincode::error::DecodeError>;

    fn to_json(&self) -> String;
    fn from_json(json_str: &str) -> Self;
    fn try_from_json(json_str: &str) -> std::result::Result<Self,serde_json::Error>;
}
impl<T: Serialize + for<'a> Deserialize<'a>> Serializable for T {
    fn to_bytes(&self) -> Vec<u8> {
        bincode::serde::encode_to_vec(self,standard()).unwrap()
    }
    /// 避免使用, 替换为 try_from_bytes, 不要 panic, 否则会崩溃, 且看不到log 信息
    fn from_bytes(encoded: &[u8]) -> Self {
        T::try_from_bytes(encoded).expect("decode from bytes failed")
    }
    fn try_from_bytes(encoded: &[u8]) -> std::result::Result<Self, bincode::error::DecodeError> {
        let (ret, _bytes_read) = bincode::serde::decode_from_slice(encoded, standard())?;
        Ok(ret)
    }
    fn to_json(&self) -> String{
        serde_json::to_string(self).unwrap()
    }
    fn from_json(json_str: &str) -> Self { //deprecated, using try_from_json
        serde_json::from_str(json_str).unwrap()
    }
    fn try_from_json(json_str: &str) -> std::result::Result<Self, serde_json::Error> {
        serde_json::from_str(json_str)
    }
}
