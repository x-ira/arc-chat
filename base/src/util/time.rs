use chrono::{Datelike, Duration, FixedOffset, Local, MappedLocalTime, Months, NaiveDateTime, NaiveTime, TimeZone, Timelike, Utc, Weekday}; //Utc
const A_DAY_IN_MILLIS: i64 = 86_400_000;
pub use chrono::NaiveDate; //re-export

// Utc::now and Local::now() has same timestamp() !
pub fn now() -> i64{ //in milli secs
    Utc::now().timestamp_millis()   
}
pub fn ts() -> i64{ //in secs
    Utc::now().timestamp()
}

pub fn today() -> i64{
    let now = Local::now();
    (now.timestamp() - now.num_seconds_from_midnight() as i64) * 1000
}
/**
    * default format("%y-%m-%d %H:%M:%S")
    */
pub fn ts_to_str(ts:i64) -> String {
    ts_format_to(ts,"%y-%m-%d %H:%M:%S")
}

/// fmt ts-in-milli !
pub fn ts_format_to(ts_in_milli_secs:i64, fmt: &str) -> String { 
    Local.timestamp_millis_opt(ts_in_milli_secs).unwrap().format(fmt).to_string()
}
/// fmt ts-in-sec ! 
pub fn ts_fmt_to(ts_in_secs:i64, fmt: &str) -> String { //in secs !
    Local.timestamp_opt(ts_in_secs, 0).unwrap().format(fmt).to_string()
}

/// "%Y-%m-%d %H:%M:%S",   "%b %d  %Y, %a"    %B, %A
/// https://docs.rs/chrono/latest/chrono/format/strftime/index.html
pub fn convert_fmt(date_str: &str, input_fmt: &str, output_fmt: &str) -> Option<String>{
    if let Ok(naive_dt) = NaiveDateTime::parse_from_str(date_str, input_fmt){
       return Some(naive_dt.format(output_fmt).to_string());
    }
    None
}

/**
 *  start from: at_hours, at_mins,
 *  days, offset day from today
 */
pub fn ts_from_today(days:i64, at_hours: u8, at_mins: u8) -> i64{
    today() + (at_hours as i64 * 60 + at_mins as i64) * 60 * 1000 + A_DAY_IN_MILLIS * days
}

/**
  * work ts from today
  */
pub fn wkts_from_today(work_days:i64, at_hours: u8, at_mins: u8) -> i64{
    let mut adjust = 0; //unit:day
    let today = Local::now(); //+ Duration::days(0)
    // log::debug!("Time::wkts_from_today -> today: {:?}, work_days: {}", today.weekday(), work_days);
    let today_ts = (today.timestamp() - today.num_seconds_from_midnight() as i64) * 1000;
    let mut work_day_num:i64 = today.weekday().num_days_from_monday().into();

    match today.weekday() {
        Weekday::Sat => {
            if work_days >= 0 {  work_day_num = 4; adjust = -1;  } //include: work_days==0
            else {  work_day_num = 0; adjust = 2;  }
        },
        Weekday::Sun => {
            if work_days >= 0 {  work_day_num = 4; adjust = -2;  }
            else {  work_day_num = 0; adjust = 1;  }
        },
        _ => {}
    }

    if work_day_num + work_days % 5 < 0 || work_day_num + work_days % 5  > 4 { //不足一周，但跨越了周末
        adjust += 2 * work_days.signum();
    }

    adjust += (work_days)/5 * 2; //每5个workday,补充2天周末
    // log::debug!("Time::wkts_from_today -> work_day_num: {:?}, tot_adjust: {}", work_day_num, adjust);

    today_ts +
    (at_hours as i64 * 60 + at_mins as i64) * 60 * 1000 +
    A_DAY_IN_MILLIS * (work_days + adjust)
}
/// offset days from now
pub fn ts_from_now(days:i64) -> i64{
    (Local::now() + Duration::days(days)).timestamp_millis()
}
pub fn ts_from_now_sec(days:i64) -> i64{
    (Local::now() + Duration::days(days)).timestamp()
}
/// offset_hours: [-23, 23]
pub fn ts_from_tz_now(days:i64, offset_hours: i64) -> i64{
    let tz_offset = offset_hours * 3600 * 1000;
    (Utc::now() + Duration::days(days)).timestamp_millis() + tz_offset
}
/// offset_hours: [-23, 23], eg, NewYork: -5
pub fn ts_from_tz_now_sec(days:i64, offset_hours: i64) -> i64{
    let tz_offset = offset_hours * 3600;
    (Utc::now() + Duration::days(days)).timestamp() + tz_offset
}
/// ret in millis or secs, timezone using offeset hours[-23,23], eg, -5 for NewYork
pub fn ts_from_opt(year: i32, month: u32, day: u32, offset_hours: i32, is_millis: bool) -> Option<i64> {
    if let Some(date) = NaiveDate::from_ymd_opt(year, month, day) {
        if offset_hours < -23 || offset_hours > 23 { return None }
        let tz = FixedOffset::east_opt(offset_hours * 3600).unwrap(); 
        let dt_tz_r = date.and_time(NaiveTime::MIN).and_local_timezone(tz);  //.and_utc()
        if let MappedLocalTime::Single(tz_dt) = dt_tz_r{
            let ts = if is_millis {
                tz_dt.timestamp_millis()
            }else{
                tz_dt.timestamp()
            };
            return Some(ts)
        }
    }
    None
}
pub fn offset(days:i64, ts: &i64) -> i64{  //in secs
    ts + days * 24 * 60 * 60
}

pub fn diff(days:i64, ts: &i64) -> i64{  //in milli secs
    ts + days * 24 * 60 * 60 * 1000
}

pub fn diff_months(months: i32, ts: &i64) -> i64{
    let compare_dt = Local.timestamp_millis_opt(*ts).unwrap();
    if months >= 0 {
        compare_dt.checked_add_months(Months::new(months as u32)).unwrap().timestamp_millis()
    }else {
        compare_dt.checked_sub_months(Months::new(-months as u32)).unwrap().timestamp_millis()
    }
}

pub fn date_since_1900(days_since_1900: i64, fmt: &str) -> String {  //excel only
    if let Some(date) = navive_date_since_1900(days_since_1900){
        date.format(fmt).to_string()
    }else{
        "".into()
    }
}

pub fn navive_date_since_1900(days_since_1900: i64) -> Option<NaiveDate> {  //excel only
    let d1900 = NaiveDate::from_ymd_opt(1900, 1, 1).unwrap(); // NOT 1970!!
    if days_since_1900 == 0 {None} else {Some(d1900 + Duration::days(days_since_1900 - 2))}
}
