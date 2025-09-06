use std::str::FromStr;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::fmt;
use crate::conf::cfg_or;

pub fn def_init() -> WorkerGuard{
    let log_level = cfg_or::<String>("log.level", "info".into());
    init("app.log", &log_level)
}
pub fn create(app_name: &str) -> WorkerGuard{
    let log_level = cfg_or::<String>("log.level", "info".into());
    init(app_name, &log_level)
}
/**
 * https://rust-book.junmajinlong.com/ch102/tracing.html
 */
pub fn init(file_name:&str, level:&str) -> WorkerGuard{
    let file_appender = tracing_appender::rolling::never("./log", file_name); // rolling::never -> single file, ::daily
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    // Ref: https://docs.rs/tracing-subscriber/0.3.3/tracing_subscriber/fmt/struct.SubscriberBuilder.html#method.with_timer
    // let format = tracing_subscriber::fmt::format()
    //     .with_level(true)
    //     .with_target(true)
    //     .compact();

    let builder = fmt()
    .with_target(true)
    .with_max_level(tracing::Level::from_str(&level.to_uppercase()).unwrap());//TRACE

    //only one writer
    match cfg_or::<String>("log.output", "console".into()).as_str() {
        "console" => {
            builder.with_writer(std::io::stdout).init();
        }
        _ => { //file
            builder.with_writer(non_blocking).with_ansi(false).init(); // .event_format(format)
        }
    }
    guard
}
