pub mod time;
pub mod rand;

use std::sync::atomic::{AtomicUsize, Ordering};
static COUNTER:AtomicUsize = AtomicUsize::new(1);
pub fn uid() -> usize {
    COUNTER.fetch_add(1, Ordering::Relaxed)
}
pub fn cap(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
}
