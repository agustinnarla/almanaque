export const PEAK_WINDOW_MIN_RATE = 0.065
export const TRUNK_MIN_SHARE = 0.1
export const TRUNK_MAX_CONGESTION = 0.05
export const TRUNK_MAX_BUSY = 0.31
export const AMD_RATIO = 4.0
export const BEST_DAY_MIN_CALLS = 50
export const BEST_HOUR_MIN_CALLS = 50
export const BEST_DEVICE_MIN_CALLS = 50
export const POSITIVE_DRIVERS_MAX = 5
export const NEGATIVE_DRIVERS_MAX = 5
// Spec 050: a day under this share of the range's median daily volume is
// "low volume" (its AA is noisy); with fewer days the median means little.
export const LOW_VOLUME_DAY_SHARE = 0.5
export const LOW_VOLUME_MIN_DAYS = 3
