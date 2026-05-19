/**
 * 100 emoji shortcodes commonly used in tech presentations.
 *
 * Selection rationale: covers the top ~80% of GitHub markdown usage in code
 * docs, release notes, slides. Unicode-native (no external font dependency)
 * so the appearance follows the OS emoji font (Apple Color Emoji on macOS,
 * Segoe UI Emoji on Windows, Noto Color Emoji on Linux/Android).
 *
 * Adding entries: keep keys lowercase, kebab/underscore allowed, single Unicode
 * scalar value (sequences like 👨‍💻 are also OK).
 *
 * Twemoji variant: out of scope — `slide/plugins/emoji-twemoji` is a v0.5
 * candidate if demand emerges.
 */
export const EMOJI_MAP: Record<string, string> = {
  // Faces & reactions
  smile: "\u{1F600}",
  grin: "\u{1F601}",
  joy: "\u{1F602}",
  rofl: "\u{1F923}",
  wink: "\u{1F609}",
  sweat_smile: "\u{1F605}",
  blush: "\u{1F60A}",
  thinking: "\u{1F914}",
  neutral_face: "\u{1F610}",
  expressionless: "\u{1F611}",
  no_mouth: "\u{1F636}",
  heart_eyes: "\u{1F60D}",
  sunglasses: "\u{1F60E}",
  cry: "\u{1F622}",
  sob: "\u{1F62D}",
  scream: "\u{1F631}",
  fearful: "\u{1F628}",
  flushed: "\u{1F633}",
  zzz: "\u{1F4A4}",

  // Hand gestures
  thumbsup: "\u{1F44D}",
  thumbs_up: "\u{1F44D}",
  thumbsdown: "\u{1F44E}",
  thumbs_down: "\u{1F44E}",
  ok_hand: "\u{1F44C}",
  clap: "\u{1F44F}",
  wave: "\u{1F44B}",
  raised_hands: "\u{1F64C}",
  pray: "\u{1F64F}",
  muscle: "\u{1F4AA}",
  point_right: "\u{1F449}",
  point_left: "\u{1F448}",
  point_up: "\u{1F446}",
  point_down: "\u{1F447}",

  // Signals & icons
  check: "✅",
  white_check_mark: "✅",
  x: "❌",
  heavy_check_mark: "✔",
  ballot_box_with_check: "☑️",
  warning: "⚠️",
  no_entry: "⛔",
  no_entry_sign: "\u{1F6AB}",
  question: "❓",
  exclamation: "❗",
  bangbang: "‼️",
  information_source: "ℹ️",
  zap: "⚡",
  bell: "\u{1F514}",
  no_bell: "\u{1F515}",

  // Tech
  rocket: "\u{1F680}",
  computer: "\u{1F4BB}",
  desktop_computer: "\u{1F5A5}️",
  keyboard: "⌨️",
  bulb: "\u{1F4A1}",
  hammer: "\u{1F528}",
  wrench: "\u{1F527}",
  gear: "⚙️",
  lock: "\u{1F512}",
  unlock: "\u{1F513}",
  key: "\u{1F511}",
  package: "\u{1F4E6}",
  link: "\u{1F517}",
  paperclip: "\u{1F4CE}",
  scissors: "✂️",
  hourglass: "⏳",
  alarm_clock: "⏰",
  stopwatch: "⏱️",
  hash: "#️⃣",

  // Files & docs
  page_facing_up: "\u{1F4C4}",
  pencil: "✏️",
  memo: "\u{1F4DD}",
  book: "\u{1F4D6}",
  books: "\u{1F4DA}",
  bookmark: "\u{1F516}",
  clipboard: "\u{1F4CB}",
  chart_with_upwards_trend: "\u{1F4C8}",
  chart_with_downwards_trend: "\u{1F4C9}",
  bar_chart: "\u{1F4CA}",

  // Status / energy
  fire: "\u{1F525}",
  sparkles: "✨",
  star: "⭐",
  star2: "\u{1F31F}",
  tada: "\u{1F389}",
  confetti_ball: "\u{1F38A}",
  boom: "\u{1F4A5}",
  rainbow: "\u{1F308}",
  sunny: "☀️",
  cloud: "☁️",
  snowflake: "❄️",
  hot_face: "\u{1F975}",
  cold_face: "\u{1F976}",

  // Affection & symbols
  heart: "❤️",
  broken_heart: "\u{1F494}",
  hearts: "\u{1F495}",
  fist: "✊",
  trophy: "\u{1F3C6}",
  medal: "\u{1F396}️",
  hundred: "\u{1F4AF}",
  eye: "\u{1F441}️",
  eyes: "\u{1F440}",

  // Coffee & food (slide signature)
  coffee: "☕",
  tea: "\u{1F375}",
  beer: "\u{1F37A}",
  pizza: "\u{1F355}",

  // Arrows
  arrow_right: "➡️",
  arrow_left: "⬅️",
  arrow_up: "⬆️",
  arrow_down: "⬇️",
  arrow_upper_right: "↗️",
  arrow_lower_right: "↘️",
};
