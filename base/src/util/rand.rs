use rand::Rng;

//re-exports
pub use rand::rng;
pub use rand::random as rnd;

pub fn rnd_in(len: usize) -> usize{
    if len == 0 { return 0 };
    let mut rng = rng();
    rng.random_range(0..len)
}
pub fn rnd_slt<T>(list: &[T]) -> &T{
   &list[rnd_in(list.len())]
}
pub fn rnd_idx(from: usize, to:usize) -> usize{
    let mut rng = rng();
    rng.random_range(from..to)
}
pub fn rnd_rng(min: f32, max: f32) -> f32 {
    assert!(min<=max);
    let mut rng = rng();
    rng.random_range(min..max)
}
/**
    * if more than 2 inputs, should using Alias Method algorithm
    * a: 3, b: 5
    * return winer pos
    */
pub fn pct_pick_from(a: f32, b: f32) -> Option<usize> {
    let mut rng = rng();
    let tot = a + b;
    if a < 0. || b < 0. || tot == 0. {
        None
    }else{
        let r = if rng.random_range(0.0..1.0) < a/tot {
            0 //a win b loss
        }else{
            1 //a loss b win
        };
        Some(r)
    }
}

