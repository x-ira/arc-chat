use config::{Config, File, Source};
use once_cell::sync::Lazy;

static CONFIG: Lazy<Config> = Lazy::new(|| config_at("./conf").expect("load config failed"));

pub fn cfg<'a, T: serde::Deserialize<'a>>(key: &str) -> T {
    CONFIG.get::<T>(key).unwrap()
}
pub fn cfg_or<'a, T: serde::Deserialize<'a>>(key: &str, default: T) -> T {
    CONFIG.get::<T>(key).unwrap_or(default)
}
fn config_at(path:&str) -> Option<Config>{
   let res_def = Config::builder()
   .set_default("env", "prod").expect("set default env failed")
    // vi ~/.zshrc & source,  using `export APP_ENV="dev"`
    // we dont need set `env` var on server!
    // basically we dont need care about the env is prod or dev, cause it's been settled done already
   .add_source(config::Environment::with_prefix("APP"))
   .add_source(File::with_name(&format!("{}/default",path))) //overwrite the sys_env
	.build();
	match res_def {
		Ok(mut cfg) => {
			// "APP_ENV" is converted to: "env"
			let env = cfg.get_string("env").expect("get env config failed");
	  		let opt_src = File::with_name(&format!("{path}/{env}")).required(false);
	  		opt_src.collect_to(&mut cfg.cache).unwrap();

			if let Ok(conf_files) = cfg.get_array("conf"){  //append other conf files
			   for cf in conf_files{
		  		   let opt_src = File::with_name(&format!("{path}/{cf}")).required(false);
			  		opt_src.collect_to(&mut cfg.cache).unwrap();
				}
			}
      	Some(cfg)
		}
		Err(e) => {
			println!("conf::config_at -> load default config files failed. {}", e);
			None
		}
	}
}
