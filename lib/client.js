window.__ModuleLoader__.load({ id: "dsh-task-board", factory: (require) => {
"use strict";
var module = { exports: {} };
var exports = module.exports;
var React = require("react");

//#region src/panel.css (self-injected, removed with the bundle)
(function () {
  var id = "dsh-task-board/panel.css";
  if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(id) + "]") === null) {
    var tag = document.createElement("style");
    tag.dataset.plugin = "dsh-task-board";
    tag.dataset.pluginCss = id;
    tag.textContent = "/* Task board panel. Class names are prefixed `dtb-` (dsh task board).\n\n   The panel fills the `main` panel seat rather than positioning itself over a\n   host workspace, so there is no fixed-position bounds logic; the geometry,\n   colour mixing and responsive rules are the author's own. */\n\n.dtb-panel,\n.dtb-panel * {\n  box-sizing: border-box;\n}\n\n.dtb-panel {\n  /* Inherit the shell's resolved color-scheme, not the OS preference, so text\n     and surfaces stay paired. */\n  color-scheme: inherit;\n  --tb-bg: light-dark(#fff, #181818);\n  --tb-raised: light-dark(#fff, #282828);\n  --tb-soft: light-dark(rgba(0, 0, 0, .025), rgba(255, 255, 255, .032));\n  --tb-hover: light-dark(rgba(0, 0, 0, .055), rgba(255, 255, 255, .052));\n  --tb-border: light-dark(rgba(0, 0, 0, .12), rgba(255, 255, 255, .084));\n  --tb-border-heavy: light-dark(rgba(0, 0, 0, .25), rgba(255, 255, 255, .22));\n  --tb-text: light-dark(#202123, #ededed);\n  --tb-muted: light-dark(#62666d, #b0b0b0);\n  --tb-danger: light-dark(#b42318, #ff8a86);\n  --tb-accent: light-dark(#075ab5, #77b9ff);\n  position: relative;\n  overflow: hidden;\n  container-type: inline-size;\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  height: 100%;\n  min-width: 0;\n  min-height: 0;\n  color: var(--tb-text);\n  background: var(--tb-bg);\n  font-size: 13px;\n  font-weight: 430;\n}\n\n.dtb-header {\n  min-height: 56px;\n  padding: 0 20px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  border-bottom: 1px solid var(--tb-border);\n}\n\n.dtb-heading {\n  min-width: 0;\n  display: flex;\n  align-items: baseline;\n  gap: 10px;\n}\n\n.dtb-heading h1 {\n  margin: 0;\n  font-size: 16px;\n  line-height: 1.3;\n  font-weight: 590;\n  letter-spacing: -.01em;\n}\n\n.dtb-heading span {\n  color: var(--tb-muted);\n  font-size: 11px;\n  white-space: nowrap;\n}\n\n.dtb-actions,\n.dtb-toolbar,\n.dtb-search,\n.dtb-column-title,\n.dtb-card-meta,\n.dtb-picker-head,\n.dtb-picker-project,\n.dtb-toast {\n  display: flex;\n  align-items: center;\n}\n\n.dtb-actions { gap: 6px; }\n\n.dtb-button {\n  height: 30px;\n  padding: 0 10px;\n  border: 1px solid var(--tb-border);\n  border-radius: 8px;\n  color: var(--tb-text);\n  background: transparent;\n  cursor: pointer;\n  font: inherit;\n  font-size: 12px;\n}\n\n.dtb-button:hover { background: var(--tb-hover); }\n\n.dtb-button-primary {\n  border-color: var(--tb-text);\n  color: var(--tb-bg);\n  background: var(--tb-text);\n  font-weight: 560;\n}\n\n.dtb-button-primary:hover { background: color-mix(in srgb, var(--tb-text) 90%, var(--tb-bg)); }\n\n.dtb-button-icon { width: 30px; padding: 0; font-size: 17px; line-height: 1; }\n\n.dtb-toolbar {\n  min-height: 48px;\n  padding: 8px 20px;\n  justify-content: space-between;\n  gap: 12px;\n  border-bottom: 1px solid var(--tb-border);\n}\n\n.dtb-search {\n  width: min(330px, 48%);\n  height: 31px;\n  padding: 0 9px;\n  gap: 7px;\n  border: 1px solid var(--tb-border);\n  border-radius: 8px;\n  background: var(--tb-soft);\n}\n\n.dtb-search:focus-within { border-color: var(--tb-border-heavy); background: transparent; }\n.dtb-search svg { width: 15px; height: 15px; flex: none; color: var(--tb-muted); }\n\n.dtb-search input {\n  width: 100%;\n  min-width: 0;\n  padding: 0;\n  border: 0;\n  outline: 0;\n  color: var(--tb-text);\n  background: transparent;\n  font: inherit;\n  font-size: 12px;\n}\n\n.dtb-search input::placeholder { color: var(--tb-muted); }\n\n.dtb-connection { color: var(--tb-muted); font-size: 11px; white-space: nowrap; }\n.dtb-connection[data-state=\"error\"] { color: var(--tb-danger); }\n\n.dtb-board-scroll { flex: 1; min-height: 0; overflow: auto; }\n\n.dtb-board {\n  min-width: 0;\n  min-height: 100%;\n  display: grid;\n  grid-template-columns: repeat(var(--tb-total-lanes, 3), minmax(0, 1fr));\n  align-content: start;\n  padding: 14px 10px 24px;\n}\n\n.dtb-column {\n  min-width: 0;\n  grid-column: span var(--tb-lanes, 1);\n  padding: 0 8px;\n  border-right: 1px solid var(--tb-border);\n}\n\n.dtb-column:last-child { border-right: 0; }\n\n.dtb-column-head {\n  height: 32px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.dtb-column-title { min-width: 0; gap: 7px; }\n\n.dtb-dot {\n  width: 7px;\n  height: 7px;\n  flex: none;\n  border-radius: 999px;\n  background: var(--tb-color);\n  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tb-color) 14%, transparent);\n}\n\n.dtb-column h2 { margin: 0; font-size: 12px; font-weight: 560; }\n\n.dtb-count {\n  min-width: 18px;\n  height: 18px;\n  padding: 0 5px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 999px;\n  color: var(--tb-muted);\n  background: var(--tb-soft);\n  font-size: 10px;\n}\n\n.dtb-column-hint { margin: 0 0 10px; color: var(--tb-muted); font-size: 10px; }\n\n.dtb-list {\n  display: grid;\n  grid-template-columns: repeat(var(--tb-lanes, 1), minmax(0, 1fr));\n  align-content: start;\n  gap: 7px;\n  min-height: 80px;\n}\n\n.dtb-card {\n  position: relative;\n  isolation: isolate;\n  padding: 11px;\n  overflow: hidden;\n  border: 1px solid var(--tb-border);\n  border-radius: 10px;\n  outline: none;\n  background: var(--tb-soft);\n  cursor: pointer;\n  transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;\n}\n\n.dtb-card:hover,\n.dtb-card:focus-visible {\n  border-color: var(--tb-border-heavy);\n  background: var(--tb-hover);\n  box-shadow: 0 3px 12px light-dark(rgba(0, 0, 0, .09), rgba(0, 0, 0, .24));\n  transform: translateY(-1px);\n}\n\n.dtb-card-title-row { min-width: 0; display: flex; align-items: flex-start; gap: 7px; }\n\n.dtb-unread-dot {\n  width: 8px;\n  height: 8px;\n  flex: none;\n  margin-top: 6px;\n  border-radius: 999px;\n  background: #2f8cff;\n  box-shadow: 0 0 0 3px color-mix(in srgb, #2f8cff 18%, transparent);\n}\n\n.dtb-unread-dot[data-unread=\"false\"] { visibility: hidden; box-shadow: none; }\n\n.dtb-card h3 {\n  margin: 0 26px 9px 0;\n  overflow: hidden;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  color: var(--tb-text);\n  font-size: 12px;\n  line-height: 1.45;\n  font-weight: 560;\n}\n\n.dtb-card-project {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  color: var(--tb-text);\n  font-size: 11px;\n}\n\n.dtb-card-note { margin-top: 9px; color: var(--tb-muted); font-size: 10px; }\n\n.dtb-card-meta {\n  margin-top: 8px;\n  justify-content: space-between;\n  gap: 8px;\n  color: var(--tb-muted);\n  font-size: 9px;\n}\n\n.dtb-card-remove {\n  position: absolute;\n  top: 7px;\n  right: 7px;\n  width: 24px;\n  height: 24px;\n  padding: 0;\n  border: 0;\n  border-radius: 7px;\n  color: var(--tb-muted);\n  background: transparent;\n  cursor: pointer;\n  opacity: .68;\n}\n\n.dtb-card-remove:hover,\n.dtb-card-remove:focus-visible { color: var(--tb-text); background: var(--tb-hover); opacity: 1; }\n\n.dtb-empty {\n  min-height: 74px;\n  grid-column: 1 / -1;\n  padding: 18px 10px;\n  display: grid;\n  place-items: center;\n  border: 1px dashed var(--tb-border);\n  border-radius: 10px;\n  color: var(--tb-muted);\n  text-align: center;\n  font-size: 10px;\n}\n\n.dtb-footer {\n  min-height: 34px;\n  padding: 0 20px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  border-top: 1px solid var(--tb-border);\n  color: var(--tb-muted);\n  font-size: 10px;\n}\n\n.dtb-modal-layer {\n  position: absolute;\n  inset: 0;\n  z-index: 5;\n  display: none;\n  align-items: flex-start;\n  justify-content: center;\n  padding: 72px 18px 24px;\n  background: rgba(0, 0, 0, .38);\n}\n\n.dtb-modal-layer[data-open=\"true\"] { display: flex; }\n\n.dtb-picker {\n  width: min(620px, 100%);\n  max-height: min(650px, calc(100% - 28px));\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n  border: 1px solid var(--tb-border-heavy);\n  border-radius: 13px;\n  background: var(--tb-raised);\n  box-shadow: 0 18px 55px rgba(0, 0, 0, .32);\n}\n\n.dtb-picker-head {\n  min-height: 52px;\n  padding: 0 14px 0 16px;\n  justify-content: space-between;\n  gap: 12px;\n  border-bottom: 1px solid var(--tb-border);\n}\n\n.dtb-picker-head h2 { margin: 0; font-size: 14px; font-weight: 590; }\n.dtb-picker-copy { padding: 11px 16px 8px; color: var(--tb-muted); font-size: 11px; }\n.dtb-picker-search { width: auto; margin: 0 16px 10px; flex: none; }\n.dtb-picker-results { min-height: 160px; overflow: auto; padding: 3px 8px 10px; }\n\n.dtb-picker-row {\n  width: 100%;\n  min-height: 66px;\n  padding: 9px 8px;\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;\n  align-items: center;\n  gap: 12px;\n  border: 0;\n  border-radius: 9px;\n  color: var(--tb-text);\n  background: transparent;\n  text-align: left;\n}\n\n.dtb-picker-row:hover { background: var(--tb-hover); }\n\n.dtb-picker-title {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-size: 12px;\n  font-weight: 560;\n}\n\n.dtb-picker-project {\n  min-width: 0;\n  margin-top: 5px;\n  gap: 6px;\n  color: var(--tb-muted);\n  font-size: 10px;\n}\n\n.dtb-picker-project span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dtb-picker-add { min-width: 58px; }\n.dtb-picker-add[disabled] { cursor: default; opacity: .55; }\n\n.dtb-picker-state {\n  min-height: 130px;\n  display: grid;\n  place-items: center;\n  padding: 22px;\n  color: var(--tb-muted);\n  text-align: center;\n  font-size: 11px;\n}\n\n.dtb-toast {\n  position: absolute;\n  left: 50%;\n  bottom: 48px;\n  z-index: 7;\n  transform: translateX(-50%);\n  gap: 10px;\n  padding: 8px 10px 8px 12px;\n  border: 1px solid var(--tb-border-heavy);\n  border-radius: 9px;\n  color: var(--tb-text);\n  background: var(--tb-raised);\n  box-shadow: 0 8px 28px rgba(0, 0, 0, .25);\n  font-size: 11px;\n}\n\n.dtb-toast button {\n  height: 24px;\n  padding: 0 7px;\n  border: 0;\n  border-radius: 6px;\n  color: var(--tb-accent);\n  background: transparent;\n  cursor: pointer;\n  font: inherit;\n}\n\n.dtb-toast button:hover { background: var(--tb-hover); }\n\n@media (max-width: 920px) {\n  .dtb-heading span,\n  .dtb-footer span:last-child { display: none; }\n  .dtb-header,\n  .dtb-toolbar,\n  .dtb-footer { padding-left: 14px; padding-right: 14px; }\n}\n\n@container (max-width: 900px) {\n  .dtb-heading span,\n  .dtb-footer span:last-child { display: none; }\n}\n\n@container (max-width: 500px) {\n  .dtb-header,\n  .dtb-toolbar,\n  .dtb-footer { padding-left: 10px; padding-right: 10px; gap: 6px; }\n  .dtb-heading h1 { font-size: 14px; white-space: nowrap; }\n  .dtb-search { width: 100%; }\n  .dtb-connection { display: none; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .dtb-card { transition: none; }\n}\n\n/* Native-size override block — must stay last so it wins the cascade. */\n.dtb-panel { font-family: var(--tb-native-font, system-ui); font-size: var(--tb-native-size, 14px); }\n.dtb-heading h1 { font-size: 18px; }\n.dtb-column h2,\n.dtb-card h3,\n.dtb-picker-title { font-size: var(--tb-native-size, 14px); }\n.dtb-heading span,\n.dtb-column-hint,\n.dtb-connection,\n.dtb-count,\n.dtb-footer,\n.dtb-empty,\n.dtb-picker-project,\n.dtb-picker-copy,\n.dtb-picker-state { font-size: 12px; }\n.dtb-button,\n.dtb-search input,\n.dtb-card-project { font-size: 13px; }\n.dtb-card { padding: 10px 12px; border-radius: 8px; }\n.dtb-card h3 { min-width: 0; flex: 1; margin: 0 54px 5px 0; line-height: 1.4; }\n.dtb-card-meta { margin-top: 6px; font-size: 12px; align-items: baseline; }\n.dtb-card-meta > span:last-child { flex: none; }\n\n.dtb-work-duration {\n  margin-top: 5px;\n  color: var(--tb-muted);\n  font-size: 12px;\n  font-variant-numeric: tabular-nums;\n}\n\n.dtb-card-work-row {\n  min-width: 0;\n  margin-top: 5px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n}\n\n.dtb-card-work-row .dtb-work-duration { min-width: 0; margin-top: 0; }\n\n.dtb-board[data-density=\"compact\"] { padding-top: 8px; padding-bottom: 10px; }\n.dtb-board[data-density=\"compact\"] .dtb-column-head { height: 28px; }\n.dtb-board[data-density=\"compact\"] .dtb-column-hint { margin-bottom: 6px; }\n.dtb-board[data-density=\"compact\"] .dtb-card { padding: 6px 8px; }\n.dtb-board[data-density=\"compact\"] .dtb-card h3 { margin-bottom: 2px; }\n.dtb-board[data-density=\"compact\"] .dtb-card-meta { margin-top: 2px; }\n.dtb-board[data-density=\"compact\"] .dtb-card-note { margin-top: 0; }\n.dtb-board[data-density=\"compact\"] .dtb-card-work-row { margin-top: 3px; }\n\n.dtb-task-control {\n  flex: none;\n  height: 24px;\n  padding: 0 8px;\n  border: 1px solid var(--tb-border);\n  border-radius: 6px;\n  color: var(--tb-text);\n  background: transparent;\n  font: inherit;\n  font-size: 11px;\n  cursor: pointer;\n}\n\n.dtb-task-control:hover,\n.dtb-task-control:focus-visible { border-color: var(--tb-border-heavy); background: var(--tb-hover); }\n\n.dtb-task-control[data-paused=\"true\"] {\n  color: var(--tb-accent);\n  border-color: color-mix(in srgb, var(--tb-accent) 48%, var(--tb-border));\n}\n\n.dtb-task-control[disabled] { cursor: wait; opacity: .55; }\n\n.dtb-card-note { margin: 0; font-size: 12px; min-width: 0; }\n.dtb-card-note[data-error=\"true\"] { color: var(--tb-danger); }\n\n.dtb-card-priority {\n  position: absolute;\n  right: 34px;\n  top: 6px;\n  z-index: 2;\n  width: 26px;\n  height: 26px;\n  padding: 0;\n  display: grid;\n  place-items: center;\n  line-height: 1;\n  border: 1px solid transparent;\n  border-radius: 7px;\n  color: var(--tb-muted);\n  background: transparent;\n  font-size: 18px;\n  cursor: pointer;\n  transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;\n}\n\n.dtb-card-priority:hover,\n.dtb-card-priority:focus-visible {\n  background: var(--tb-hover);\n  outline: 2px solid var(--tb-priority-color, #d6af67);\n  box-shadow: 0 2px 8px color-mix(in srgb, var(--tb-priority-color, #d6af67) 16%, transparent);\n}\n\n.dtb-card[data-priority=\"true\"] {\n  border-color: color-mix(in srgb, var(--tb-priority-color) 48%, var(--tb-bg));\n  background:\n    radial-gradient(circle at 92% 8%, color-mix(in srgb, var(--tb-priority-accent) 5%, transparent) 0, transparent 54%),\n    linear-gradient(var(--tb-priority-angle),\n      color-mix(in srgb, var(--tb-priority-color) 10%, var(--tb-bg)) 0%,\n      color-mix(in srgb, var(--tb-priority-color) 6%, var(--tb-bg)) 100%);\n  box-shadow: inset 3px 0 var(--tb-priority-color), 0 1px 2px light-dark(rgba(0, 0, 0, .04), rgba(0, 0, 0, .16));\n}\n\n.dtb-card[data-priority=\"true\"]:hover,\n.dtb-card[data-priority=\"true\"]:focus-visible {\n  border-color: color-mix(in srgb, var(--tb-priority-color) 68%, var(--tb-bg));\n  background:\n    radial-gradient(circle at 92% 8%, color-mix(in srgb, var(--tb-priority-accent) 7%, transparent) 0, transparent 54%),\n    linear-gradient(var(--tb-priority-angle),\n      color-mix(in srgb, var(--tb-priority-color) 13%, var(--tb-bg)) 0%,\n      color-mix(in srgb, var(--tb-priority-color) 9%, var(--tb-bg)) 100%);\n  box-shadow: inset 3px 0 var(--tb-priority-color), 0 4px 12px light-dark(rgba(0, 0, 0, .08), rgba(0, 0, 0, .22));\n}\n\n.dtb-card[data-priority=\"true\"] .dtb-card-priority {\n  color: light-dark(color-mix(in srgb, var(--tb-priority-color) 62%, #202123), var(--tb-priority-accent));\n  border-color: color-mix(in srgb, var(--tb-priority-color) 20%, transparent);\n  background: color-mix(in srgb, var(--tb-priority-color) 9%, var(--tb-bg));\n}\n\n/* The sidebar panel icon, sized by the owner (16 wide / 18 rail). */\n.dtb-panel-icon { display: block; }\n";
    document.head.appendChild(tag);
  }
})();
//#endregion

//#region src/core.mjs
/**
 * Task board core: the pure, framework-free half of the board.
 *
 * Nothing here touches the DOM, React, or a Cordis context, so every rule
 * below — status precedence, ordering, layout arithmetic, colour balancing —
 * is unit-testable in plain Node.
 *
 * The board's rules are carried over from an earlier panel of the author's,
 * re-expressed against the DSH session model:
 *   thread.id / createdAt / cwd / name   → session.id / createdAt / cwd / title
 *   thread.updatedAt                     → session.updatedAt   (epoch ms)
 *   thread.status.type                   → derived from `running` + turn end
 *   thread/turns/list nativeTurn         → session event window turn timings
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOD_ID = 'dsh-task-board'
const MOD_VERSION = '1.0.0'

const PRIORITY_COLORS = {
  gold: '#d6af67', red: '#df7b87', blue: '#77a7e8', green: '#69b28d',
  purple: '#a68bd6', cyan: '#62b8c5', orange: '#dda06f', pink: '#d28ead',
  lime: '#a3b86f', indigo: '#909de0', teal: '#61aaa4', magenta: '#bb85c9',
  coral: '#dc9181', mint: '#79bf9d', azure: '#69a8d0', slate: '#9aaabd',
}
const PRIORITY_ACCENTS = {
  gold: '#e4c591', red: '#e8a0a5', blue: '#a0bfef', green: '#91c5a8',
  purple: '#c0abe5', cyan: '#8dcbd3', orange: '#e8ba96', pink: '#e2adc3',
  lime: '#bdcc99', indigo: '#b1baeb', teal: '#8dc5bf', magenta: '#d2a6dc',
  coral: '#e8b1a2', mint: '#a0d2b6', azure: '#98c2de', slate: '#bcc7d4',
}
const PRIORITY_ANGLES = {
  gold: 118, red: 148, blue: 132, green: 108,
  purple: 144, cyan: 124, orange: 158, pink: 114,
  lime: 138, indigo: 154, teal: 128, magenta: 104,
  coral: 164, mint: 100, azure: 150, slate: 136,
}

/** The one storage key; the profile's own localStorage namespace is the store. */
const STORAGE_KEY = 'dsh-task-board:session-state:v3'

/** Board panel id: the `main` slot key and the `sidebar.panellist` list id. */
const PANEL_ID = 'task-board'

const STATUS = [
  { id: 'todo', name: '待处理', hint: '刚加入、尚未开始', color: '#8b8b8b' },
  { id: 'doing', name: '处理中', hint: 'DSH 正在工作', color: '#339cff' },
  { id: 'review', name: '待审阅', hint: '等待回答、批准或检查', color: '#e5a23c' },
]

/** Palette key for a stored value; unknown values fall back to gold. */
function priorityColor(value) {
  return Object.hasOwn(PRIORITY_COLORS, value) ? value : 'gold'
}

/**
 * Pick the least-used palette colour, breaking ties by palette order and
 * `Math.random()`. Only starred items count toward usage, matching the
 * original balancer.
 * @param excluded - palette keys to avoid.
 * @param items - the other board items.
 * @returns the chosen palette key.
 */
function randomPriorityColor(excluded = [], items = []) {
  const allowed = Object.keys(PRIORITY_COLORS).filter(color => !excluded.includes(color))
  const pool = allowed.length ? allowed : Object.keys(PRIORITY_COLORS)
  const counts = Object.fromEntries(pool.map(color => [
    color,
    items.filter(item => item.priority && priorityColor(item.priorityColor) === color).length,
  ]))
  const least = Math.min(...Object.values(counts))
  const colors = pool.filter(color => counts[color] === least)
  return colors[Math.floor(Math.random() * colors.length)]
}

// ---------------------------------------------------------------------------
// Formatting helpers (injected-board.js 139-219)
// ---------------------------------------------------------------------------

/** Escape a value for HTML interpolation. */
function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

/** Normalize a filesystem path for comparison. */
function normalizePath(value) {
  return String(value || '').replaceAll('/', '\\').replace(/^\\\\\?\\/, '').replace(/\\+$/, '').toLowerCase()
}

/**
 * Project a working directory to its display name.
 * @param cwd - absolute session directory.
 * @param projectLabels - optional root→label overrides (DSH workspaces).
 * @returns the display name, or `未指定项目`.
 */
function projectName(cwd, projectLabels = {}) {
  const normalized = normalizePath(cwd)
  const exact = Object.entries(projectLabels).find(([root]) => normalizePath(root) === normalized)
  if (exact?.[1]) return exact[1]
  const parts = String(cwd || '未指定项目').replaceAll('/', '\\').split('\\').filter(Boolean)
  return parts.at(-1) || '未指定项目'
}

/** Session display title with the original fallback. */
function sessionTitle(session) {
  const title = String(session?.title || session?.displayTitle || '').trim()
  return title || '未命名会话'
}

/**
 * Relative time in the original's exact thresholds.
 * @param timestampMs - epoch milliseconds.
 * @param now - reference clock.
 * @returns the localized relative label.
 */
function relativeTime(timestampMs, now = Date.now()) {
  const timestamp = Number(timestampMs)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '时间未知'
  const delta = timestamp - now
  const abs = Math.abs(delta)
  const formatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })
  if (abs < 60_000) return '刚刚'
  if (abs < 3_600_000) return formatter.format(Math.round(delta / 60_000), 'minute')
  if (abs < 86_400_000) return formatter.format(Math.round(delta / 3_600_000), 'hour')
  if (abs < 604_800_000) return formatter.format(Math.round(delta / 86_400_000), 'day')
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(timestamp)
}

/**
 * Work-duration label from the session's latest turn timing.
 *
 * The original read a native turn record; DSH's equivalent is the timing fold
 * over the session event window (`turn/start` → `turn/end`, both epoch ms).
 * @param item - board item carrying `nativeTurn`.
 * @param now - reference clock for a running turn.
 * @returns the exact label the original rendered.
 */
function workDurationLabel(item, now = Date.now()) {
  const turn = item.nativeTurn
  if (!turn) return item.nativeTimeChecked ? '暂无原生用时' : '正在读取原生用时…'
  const running = turn.status === 'inProgress' && turn.completedAtMs == null
  const elapsed = running
    ? (turn.startedAtMs == null ? null : now - turn.startedAtMs)
    : (turn.durationMs ?? (turn.completedAtMs != null && turn.startedAtMs != null
      ? turn.completedAtMs - turn.startedAtMs
      : null))
  if (elapsed == null) return '暂无原生用时'
  const seconds = Math.floor(Math.max(0, elapsed) / 1000)
  const units = [
    [Math.floor(seconds / 86400), '天'],
    [Math.floor(seconds / 3600) % 24, '小时'],
    [Math.floor(seconds / 60) % 60, '分钟'],
    [seconds % 60, '秒'],
  ]
  const duration = units.filter(([value]) => value > 0)
    .map(([value, unit]) => `${value}${unit}`).join(' ') || '0秒'
  const prefix = running ? '已处理'
    : item.manualPaused ? '暂停前用时'
      : turn.status === 'interrupted' ? '停止前用时' : '用时'
  return `${prefix} ${duration}`
}

/** Unread = never opened from the board, or advanced since it was opened. */
function isUnread(item) {
  const readAt = Number(item?.panelReadAt || 0)
  const updatedAt = Number(item?.updatedAt || 0)
  return readAt <= 0 || readAt < updatedAt
}

// ---------------------------------------------------------------------------
// Status derivation (injected-board.js 289-324)
// ---------------------------------------------------------------------------

/**
 * Derive the board status for one session.
 *
 * DSH exposes no single status enum, so the original's `runtime.type` +
 * `activeFlags` are reconstructed from the facts the client does have:
 * `running` (the host's agent status), `completed` (finished but not yet
 * opened — the host's own "waiting to be reviewed" signal), `pending` (an
 * unanswered interaction), and `error`.
 *
 * @param session - session facts (`running`, `completed`, `pending`, `error`).
 * @param existing - the stored item, when the session is already on the board.
 * @returns `todo` | `doing` | `review`.
 */
function nextBoardStatus(session, existing) {
  const runtimeType = session?.error ? 'systemError'
    : session?.pending ? 'active'
      : session?.running ? 'active'
        : 'idle'
  if (runtimeType === 'systemError') return 'review'
  if (existing?.manualPaused) return 'doing'
  if (runtimeType === 'active' && session?.pending) return 'review'
  if (runtimeType === 'active') return 'doing'
  if (runtimeType === 'idle') {
    // The host already decided this one finished unopened: it is awaiting
    // review, which is the third column's exact meaning.
    if (session?.completed) return 'review'
    if (existing?.lastRuntimeType === 'active' || existing?.status === 'doing') return 'review'
    if (!existing && Number(session?.updatedAt) > Number(session?.createdAt) + 2000) return 'review'
    return existing?.status || 'todo'
  }
  return existing?.status || 'todo'
}

/** The card's status note, in the original's precedence. */
function statusNote(item) {
  if (item.lastRuntimeType === 'systemError') return '运行异常 · 需要检查'
  if (item.manualPaused) return '已暂停 · 可启动'
  if (item.status === 'doing') return 'DSH 正在处理'
  if (item.status === 'review') {
    if (item.activeFlags?.includes('waitingOnApproval')) return '等待你批准操作'
    if (item.activeFlags?.includes('waitingOnUserInput')) return '等待你输入或确认'
    return '已停止运行，等待你检查'
  }
  return '尚未开始'
}

/**
 * Whether a newly seen session joins the board automatically.
 *
 * A blank session (empty log) never joins: DSH reuses one per workspace for
 * the New Session flow, so it is a draft slot rather than a task.
 *
 * @param session - session facts.
 * @param store - the persisted store.
 * @returns true when the session should be added.
 */
function shouldAutoAdd(session, store) {
  const id = String(session?.id || '')
  if (!id || session.blank === true) return false
  const dismissedAt = Number(store.dismissed[id] || 0)
  if (dismissedAt && Number(session.updatedAt || 0) <= dismissedAt + 1000) return false
  const isNew = Number(session.createdAt || 0) >= Number(store.initializedAt || 0) - 2000
  return isNew || session.running === true || session.completed === true || Boolean(session.error)
    || (dismissedAt > 0 && Number(session.updatedAt || 0) > dismissedAt + 1000)
}

/** Build a board item from session facts, preserving stored per-item state. */
function itemFromSession(session, existing = null, store = {}) {
  const id = String(session.id)
  const cwd = String(session.cwd || existing?.cwd || '')
  return {
    id,
    title: sessionTitle(session) || existing?.title || '未命名会话',
    cwd,
    project: projectName(cwd),
    createdAt: Number(session.createdAt || existing?.createdAt || 0),
    updatedAt: Number(session.updatedAt || existing?.updatedAt || 0),
    status: nextBoardStatus(session, existing),
    lastRuntimeType: session.error ? 'systemError' : session.running ? 'active' : 'idle',
    activeFlags: session.pending ? ['waitingOnUserInput'] : [],
    priority: existing?.priority === true,
    priorityColor: Object.hasOwn(PRIORITY_COLORS, existing?.priorityColor)
      ? existing.priorityColor
      : store.threadColors?.[id] || (existing?.priority ? 'gold' : null),
    addedAt: Number(existing?.addedAt || Date.now()),
    nativeTurn: existing?.nativeTurn || null,
    nativeTimeChecked: existing?.nativeTimeChecked === true,
    manualPaused: existing?.manualPaused === true,
    panelReadAt: Number(existing?.panelReadAt || 0),
  }
}

/** Whether two projected items are visually identical (drives store writes). */
function sameItem(a, b) {
  return Boolean(a && b) && a.title === b.title && a.cwd === b.cwd && a.project === b.project
    && a.updatedAt === b.updatedAt && a.status === b.status
    && a.lastRuntimeType === b.lastRuntimeType
    && JSON.stringify(a.activeFlags || []) === JSON.stringify(b.activeFlags || [])
}

// ---------------------------------------------------------------------------
// Ordering (injected-board.js 954-982)
// ---------------------------------------------------------------------------

/**
 * Keep the `doing` column's order stable: drop ids that left the column, keep
 * the survivors' relative order, and append newcomers at the end. On first
 * migration seed from the legacy priority/recency order.
 * @param store - the persisted store (mutated in place).
 * @returns whether the order changed.
 */
function syncDoingOrder(store) {
  const doing = Object.values(store.items).filter(item => item.status === 'doing')
  const previous = Array.isArray(store.doingOrder)
    ? store.doingOrder
    : doing.slice().sort((a, b) =>
      Number(b.priority === true) - Number(a.priority === true)
      || Number(b.updatedAt || 0) - Number(a.updatedAt || 0)).map(item => item.id)
  const activeIds = new Set(doing.map(item => item.id))
  const seen = new Set()
  const next = previous.filter(id => {
    if (!activeIds.has(id) || seen.has(id)) return false
    seen.add(id)
    return true
  })
  for (const item of doing) {
    if (!seen.has(item.id)) { next.push(item.id); seen.add(item.id) }
  }
  const changed = !Array.isArray(store.doingOrder) || next.length !== previous.length
    || next.some((id, index) => id !== previous[index])
  store.doingOrder = next
  return changed
}

/**
 * The board's visible order: priority first, then most-recently-updated, with
 * the `doing` slice replaced in place by the stable `doingOrder` sequence.
 * @param store - the persisted store.
 * @returns ordered items.
 */
function currentItems(store) {
  const items = Object.values(store.items).sort((a, b) =>
    Number(b.priority === true) - Number(a.priority === true)
    || Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
  const doing = store.doingOrder.map(id => store.items[id]).filter(Boolean)
  let position = 0
  return items.map(item => item.status === 'doing' ? doing[position++] : item)
}

// ---------------------------------------------------------------------------
// Adaptive layout (injected-board.js 984-1012)
// ---------------------------------------------------------------------------

/**
 * Distribute the three columns into lanes so the board fits one page.
 *
 * Card rows stay at the native font size; room is gained by adding horizontal
 * lanes to busy columns, never by shrinking text or hiding card detail.
 *
 * @param items - visible items, each with a `status`.
 * @param width - board scroll width in px.
 * @param height - board scroll height in px.
 * @returns lanes per column, total lanes, and the capacity figures.
 */
function adaptiveBoardLayout(items, width, height) {
  const counts = STATUS.map(column => items.filter(item => item.status === column.id).length)
  const rowCapacity = Math.max(2, Math.floor((Math.max(320, height) - 82) / 120))
  const required = counts.map(count => Math.max(1, Math.ceil(count / rowCapacity)))
  const maxLanes = Math.max(3, Math.floor((Math.max(510, width) - 20) / 170))
  let lanes = [...required]
  const requiredTotal = required.reduce((sum, value) => sum + value, 0)
  if (requiredTotal > maxLanes) {
    lanes = STATUS.map(() => 1)
    while (lanes.reduce((sum, value) => sum + value, 0) < maxLanes) {
      let best = -1
      let bestScore = 1
      counts.forEach((count, index) => {
        const score = count / lanes[index]
        if (lanes[index] < required[index] && score > bestScore) { best = index; bestScore = score }
      })
      if (best < 0) break
      lanes[best] += 1
    }
  }
  return {
    lanes,
    totalLanes: lanes.reduce((sum, value) => sum + value, 0),
    rowCapacity,
    maxLanes,
    fits: requiredTotal <= maxLanes,
  }
}

// ---------------------------------------------------------------------------
// Store (injected-board.js 84-129)
// ---------------------------------------------------------------------------

/** A fresh store. */
function emptyStore() {
  return { version: 3, initializedAt: Date.now(), items: {}, dismissed: {}, threadColors: {}, doingOrder: [] }
}

/**
 * Normalize a parsed store: filter the colour registry, migrate `blocked`
 * into `review`, coerce the boolean flags, and re-resolve every item colour.
 * @param parsed - the raw parsed JSON.
 * @returns a usable store, or null when the payload is not a v3 store.
 */
function normalizeStore(parsed) {
  if (parsed?.version !== 3 || !parsed.items || typeof parsed.items !== 'object') return null
  const threadColors = Object.fromEntries(Object.entries(parsed.threadColors || {})
    .filter(([, color]) => Object.hasOwn(PRIORITY_COLORS, color)))
  for (const [id, item] of Object.entries(parsed.items)) {
    if (item.status === 'blocked') { item.status = 'review'; item.lastRuntimeType = 'systemError' }
    item.priority = item.priority === true
    // Preserve every saved assignment, including unstarred sessions; keep the
    // registry when a card is removed so re-adding restores its hue.
    item.priorityColor = Object.hasOwn(PRIORITY_COLORS, item.priorityColor)
      ? item.priorityColor
      : threadColors[id] || (item.priority ? 'gold' : null)
    if (item.priorityColor) threadColors[id] = item.priorityColor
    item.manualPaused = item.manualPaused === true
    for (const key of ['workMs', 'workTracked', 'workRunning', 'workObservedAt']) delete item[key]
  }
  const store = {
    version: 3,
    initializedAt: Number(parsed.initializedAt) || Date.now(),
    items: parsed.items,
    dismissed: parsed.dismissed && typeof parsed.dismissed === 'object' ? parsed.dismissed : {},
    threadColors,
    doingOrder: parsed.doingOrder,
  }
  syncDoingOrder(store)
  return store
}

/**
 * Fold live session facts into the store, adding new sessions the auto-add
 * rule accepts and refreshing the rest.
 * @param store - the store (mutated in place).
 * @param sessions - session facts to fold in.
 * @returns whether anything changed.
 */
function syncSessions(store, sessions) {
  let changed = false
  for (const session of sessions || []) {
    const id = String(session?.id || '')
    if (!id) continue
    const existing = store.items[id] || null
    if (!existing && !shouldAutoAdd(session, store)) continue
    const next = itemFromSession(session, existing, store)
    if (!sameItem(existing, next)) {
      store.items[id] = next
      changed = true
    }
    const dismissedAt = Number(store.dismissed[id] || 0)
    if (dismissedAt && Number(session.updatedAt || 0) > dismissedAt + 1000) {
      delete store.dismissed[id]
      changed = true
    }
  }
  if (changed) syncDoingOrder(store)
  return changed
}

/** Fold one session's latest-turn timing into its item. */
function applyTurnTiming(store, id, turn) {
  const item = store.items[id]
  if (!item) return false
  item.nativeTimeChecked = true
  const previous = item.nativeTurn
  if (previous?.id === turn?.id && previous?.source === 'native-header'
    && (previous.status !== 'inProgress' || turn?.status === 'inProgress')) return false
  if (JSON.stringify(previous) !== JSON.stringify(turn)) {
    item.nativeTurn = turn
    return true
  }
  return false
}

/**
 * Fold one session's event window into a native turn timing.
 *
 * `turn/start` and `turn/end` both carry epoch-ms `time`; a turn with no
 * `turn/end` yet is running. An aborted or interrupted reason maps to the
 * `interrupted` status the card renders as 停止前用时.
 *
 * @param entries - the session event window entries.
 * @returns a `nativeTurn` record, or null when the window has no turn.
 */
function turnTimingFromEvents(entries) {
  let open = null
  let latest = null
  for (const entry of entries || []) {
    const event = entry?.type === 'event' ? entry.event : entry
    if (!event?.type) continue
    if (event.type === 'turn/start') {
      open = { id: `turn-${event.data?.turn}`, startedAtMs: Number(event.time) || null }
      latest = { id: open.id, status: 'inProgress', startedAtMs: open.startedAtMs, completedAtMs: null, durationMs: null, source: 'server' }
      continue
    }
    if (event.type === 'turn/end' && open) {
      const endedAt = Number(event.time) || null
      const reason = event.data?.reason?.kind
      const interrupted = reason === 'aborted' || reason === 'interrupted'
      latest = {
        id: open.id,
        status: interrupted ? 'interrupted' : 'completed',
        startedAtMs: open.startedAtMs,
        completedAtMs: endedAt,
        durationMs: endedAt != null && open.startedAtMs != null ? Math.max(0, endedAt - open.startedAtMs) : null,
        source: 'server',
      }
      open = null
    }
  }
  return latest
}

/**
 * Filter items by the panel search query.
 * @param items - ordered items.
 * @param query - the raw query (case-insensitive substring).
 * @returns matching items.
 */
function filterItems(items, query) {
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return items
  return items.filter(item =>
    `${item.title} ${item.project} ${item.cwd}`.toLowerCase().includes(needle))
}

//#endregion

//#region src/client.mjs
/**
 * Task board, browser half.
 *
 * Registers two contributions against the shipped shell:
 *
 *   `sidebar.panellist` (list) — the nav icon at the sidebar foot; its `id` is
 *   what the sidebar row selects, and what `ctx.layout.selectPanel(id)` targets.
 *   `main` (keyed)          — the panel body, dispatched by that same id.
 *
 * That pair is the shell's own global-panel mechanism (the same one the shipped
 * Schedules page uses), so the board is a first-class destination rather than
 * an overlay: selecting it swaps the centre column, and selecting `null`
 * returns to the Conversation without changing the current Session.
 *
 * The board's copy, geometry and colour mixing are the author's own; the data
 * comes from DSH's `useSessions` feed and the session event windows.
 */



// ---------------------------------------------------------------------------
// Copy (exact strings from the original board)
// ---------------------------------------------------------------------------

const NS = 'dsh-task-board'

const zh = {
  panel: '任务面板',
  heading: '任务面板',
  subheading: '跨项目会话 · 本地保存',
  add: '＋ 添加会话',
  close: '关闭任务面板',
  searchPlaceholder: '搜索面板中的会话…',
  searchLabel: '搜索面板中的会话',
  connecting: '正在连接 DSH…',
  syncing: '正在同步 DSH 会话…',
  connected: '已连接 DSH',
  synced: '已同步',
  failed: '无法读取 DSH 会话。',
  total: '条会话',
  footerNote: '完成后移出面板，不会删除原会话',
  pickerTitle: '添加 DSH 会话',
  pickerCopy: '搜索所有项目中的旧会话，选择后加入任务面板。',
  pickerSearch: '输入会话标题或项目…',
  pickerSearchLabel: '搜索所有 DSH 会话',
  pickerLoading: '正在读取 DSH 会话…',
  pickerEmpty: '没有可显示的最近会话',
  pickerNoMatch: '没有找到匹配的会话',
  join: '加入',
  joined: '已加入',
  rejoin: '重新加入',
  empty: '暂无会话',
  noMatch: '没有匹配的会话',
  removed: '已从面板移出，原会话仍保留',
  undo: '撤销',
  noTurn: '暂时找不到正在运行的轮次，请稍后再试',
  pauseFailed: '暂停失败：',
  resumeFailed: '继续失败：',
  pause: '暂停任务',
  resume: '启动任务',
  pauseHint: '中断当前一轮，并留在处理中',
  resumeHint: '按 DSH 原生方式恢复，不发送新消息',
  pauseLabel: 'Ⅱ 暂停',
  resumeLabel: '▶ 启动',
  busyLabel: '处理中…',
  openHint: '打开原始会话',
  doneLabel: '完成并移出面板',
  starOn: '设为优先',
  starOff: '取消优先',
  unread: '未读',
  read: '已读',
  unreadHint: '有新进展；从任务面板打开后标记为已读',
  readHint: '已从任务面板打开',
  workHint: 'DSH 当前一轮或最近一轮的原生用时；不累计历次会话。',
  resumePrompt: '继续',
  unknown: '未知错误',
}

const en = {
  panel: 'Task board',
  heading: 'Task board',
  subheading: 'Cross-project sessions · saved locally',
  add: '＋ Add session',
  close: 'Close task board',
  searchPlaceholder: 'Search board sessions…',
  searchLabel: 'Search board sessions',
  connecting: 'Connecting to DSH…',
  syncing: 'Syncing DSH sessions…',
  connected: 'Connected to DSH',
  synced: 'Synced',
  failed: 'Could not read DSH sessions.',
  total: 'sessions',
  footerNote: 'Completing removes the card, never the session',
  pickerTitle: 'Add a DSH session',
  pickerCopy: 'Search older sessions across every project and add them to the board.',
  pickerSearch: 'Enter a session title or project…',
  pickerSearchLabel: 'Search all DSH sessions',
  pickerLoading: 'Reading DSH sessions…',
  pickerEmpty: 'No recent sessions to show',
  pickerNoMatch: 'No matching session found',
  join: 'Add',
  joined: 'Added',
  rejoin: 'Add again',
  empty: 'No sessions yet',
  noMatch: 'No matching session',
  removed: 'Removed from the board; the session is untouched',
  undo: 'Undo',
  noTurn: 'No running turn found yet, try again shortly',
  pauseFailed: 'Pause failed: ',
  resumeFailed: 'Resume failed: ',
  pause: 'Pause task',
  resume: 'Start task',
  pauseHint: 'Interrupt the current turn and stay in progress',
  resumeHint: 'Resume the DSH-native way, without sending a new message',
  pauseLabel: 'Ⅱ Pause',
  resumeLabel: '▶ Start',
  busyLabel: 'Working…',
  openHint: 'Open the original session',
  doneLabel: 'Complete and remove from board',
  starOn: 'Mark as priority',
  starOff: 'Clear priority',
  unread: 'Unread',
  read: 'Read',
  unreadHint: 'New progress; opens as read from the board',
  readHint: 'Already opened from the board',
  workHint: 'Native duration of the current or latest DSH turn; turns are not summed.',
  resumePrompt: 'Continue',
  unknown: 'unknown error',
}

/** Inline SVG so the bundle needs no asset pipeline. */
function searchIcon() {
  return React.createElement('svg', {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.8, strokeLinecap: 'round', 'aria-hidden': 'true',
  }, [
    React.createElement('circle', { key: 'c', cx: 11, cy: 11, r: 6.5 }),
    React.createElement('path', { key: 'p', d: 'm16 16 4 4' }),
  ])
}

/**
 * The sidebar nav glyph: four board tiles, the original's exact paths.
 * @param props - owner share (`size`, `active`).
 */
function BoardIcon(props) {
  const size = props?.size ?? 18
  return React.createElement('svg', {
    className: 'dtb-panel-icon',
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.75,
    strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
  }, [
    React.createElement('path', { key: 'a', d: 'M4.5 5.5h6v5h-6z' }),
    React.createElement('path', { key: 'b', d: 'M13.5 5.5h6v8h-6z' }),
    React.createElement('path', { key: 'c', d: 'M4.5 13.5h6v5h-6z' }),
    React.createElement('path', { key: 'd', d: 'M13.5 16.5h6v2h-6z' }),
  ])
}

// ---------------------------------------------------------------------------
// Store: localStorage-backed, exactly the original's schema and lifecycle.
// ---------------------------------------------------------------------------

function loadStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    const store = normalizeStore(parsed)
    if (store) return store
  } catch { /* Start from a clean, recoverable local state. */ }
  const store = emptyStore()
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) } catch { /* storage may be unavailable */ }
  return store
}

function persistStore(store) {
  syncDoingOrder(store)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) } catch { /* storage may be unavailable */ }
}

// ---------------------------------------------------------------------------
// Host facts: project a DSH session summary into the board's input shape.
// ---------------------------------------------------------------------------

/**
 * Project one `useSessions` row into the facts `core` consumes.
 *
 * `SessionSummary` already carries the runtime facts the board needs:
 *   `running`   — the host's agent status for this session;
 *   `completed` — "finished while not selected and not yet opened", i.e. the
 *                 host's own waiting-to-be-reviewed signal;
 *   `blank`     — an empty log, which never belongs on the board.
 *
 * DSH's list summary carries no `createdAt`, so a session's own `updatedAt`
 * stands in for the newness test — `updatedAt` is `max(createdAt,
 * lastPromptAt)`, so a session touched after the board initialized is exactly
 * the "new or newly active" case the original auto-added.
 *
 * @param summary - one `byId` row from the sessions snapshot.
 * @returns facts for `syncSessions`.
 */
function sessionFacts(summary) {
  const id = String(summary.id)
  return {
    id,
    title: summary.title || summary.displayTitle || '',
    cwd: summary.cwd || '',
    running: summary.running === true,
    pending: false,
    error: false,
    completed: summary.completed === true,
    blank: summary.blank === true,
    createdAt: Number(summary.updatedAt) || 0,
    updatedAt: Number(summary.updatedAt) || 0,
  }
}

/**
 * Read the live turn timing for a materialized session.
 *
 * DSH only materializes a binding for sessions the controller has scoped
 * (typically the ones the user opened), so `undefined` here means "not
 * readable yet", not "no turn". The caller records that as checked so the card
 * shows 暂无原生用时 instead of a perpetual loading label.
 *
 * @param ctx - client root context.
 * @param id - session id.
 * @returns the timing, or `undefined` when the session has no binding.
 */
function readTurnTiming(ctx, id) {
  const binding = ctx.sessions?.binding?.(id)
  if (!binding) return undefined
  try {
    return turnTimingFromEvents(binding.eventSource.getSnapshot().entries)
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

/**
 * Diagnostic boundary around the panel. The shell already contains a crashed
 * entry, but it renders an opaque empty div; this one shows the actual stack so
 * a real failure is diagnosable from the page itself.
 */
class BoardBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('[dsh-task-board] panel crashed:', error)
  }

  render() {
    if (this.state.error) {
      const detail = this.state.error && this.state.error.stack
        ? this.state.error.stack
        : String(this.state.error)
      return React.createElement('pre', {
        style: {
          margin: 0, padding: '16px 20px', color: '#ff8a86',
          font: '12px/1.6 ui-monospace, monospace', whiteSpace: 'pre-wrap', overflow: 'auto',
        },
      }, `dsh-task-board panel crashed:\n\n${detail}`)
    }
    return this.props.children
  }
}

/**
 * The board panel body, rendered into the shell's `main` seat.
 * @param props - global standard props plus this entry's injected face.
 */
function BoardPanel(props) {
  const { t, useSessions, store, ctx } = props
  const snapshot = useSessions(s => s)
  const [query, setQuery] = React.useState('')
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pickerQuery, setPickerQuery] = React.useState('')
  const [connection, setConnection] = React.useState('ok')
  const [lastSyncAt, setLastSyncAt] = React.useState(null)
  const [toast, setToast] = React.useState(null)
  const [busy, setBusy] = React.useState(() => new Set())
  const [lastRemoved, setLastRemoved] = React.useState(null)
  const [, forceRender] = React.useReducer(n => n + 1, 0)

  const scrollRef = React.useRef(null)
  const boardRef = React.useRef(null)
  const [layout, setLayout] = React.useState({ lanes: [1, 1, 1], totalLanes: 3, density: 'normal' })
  const layoutKey = React.useRef('')

  // Fold the live session list into the store on every snapshot change. The
  // store is the board's own memory (status, colour, order); the snapshot is
  // the host truth.
  React.useEffect(() => {
    // Subagent children are not tasks, and a blank session is DSH's reusable
    // New-Session draft rather than a conversation.
    const rows = snapshot.ids.map(id => snapshot.byId[id]).filter(Boolean)
      .filter(row => row.origin !== 'subagent' && row.blank !== true)
    const facts = rows.map(row => sessionFacts(row))
    let changed = syncSessions(store.current, facts)
    // Refresh native turn timing for every session the controller has bound.
    // Sessions the auto-add rule skipped have no item yet — leave them alone.
    for (const fact of facts) {
      const item = store.current.items[fact.id]
      if (!item) continue
      const timing = readTurnTiming(ctx, fact.id)
      if (timing) {
        if (applyTurnTiming(store.current, fact.id, timing)) changed = true
      } else if (item.nativeTimeChecked !== true) {
        // No readable binding: mark it checked so the card settles on
        // 暂无原生用时 rather than showing a loading label forever.
        item.nativeTimeChecked = true
        changed = true
      }
    }
    if (changed) { persistStore(store.current); forceRender() }
    setConnection('ok')
    setLastSyncAt(Date.now())
  }, [snapshot, ctx, store])

  // 1s tick: the running turn's duration and the relative timestamps move
  // without any card being rebuilt. It also retries turn timing for cards the
  // controller had not materialized yet, so a session opened elsewhere picks up
  // its duration without a list change.
  const [, tick] = React.useReducer(n => n + 1, 0)
  React.useEffect(() => {
    const timer = setInterval(() => {
      let changed = false
      for (const item of Object.values(store.current.items)) {
        if (item.nativeTurn) continue
        const timing = readTurnTiming(ctx, item.id)
        if (timing && applyTurnTiming(store.current, item.id, timing)) changed = true
      }
      if (changed) persistStore(store.current)
      tick()
    }, 1000)
    return () => clearInterval(timer)
  }, [ctx, store])

  const all = currentItems(store.current)
  const visible = filterItems(all, query)

  // Adaptive lanes: measure, then distribute — never shrink the font.
  //
  // The probe writes the lane variables straight onto the DOM (the original's
  // `apply()`), because each candidate must be laid out before it can be
  // measured; the final winner is then committed to React state once, so the
  // two never disagree.
  React.useLayoutEffect(() => {
    const scroll = scrollRef.current
    const board = boardRef.current
    if (!scroll || !board) return
    const width = scroll.clientWidth
    const height = scroll.clientHeight
    if (!width || !height) return
    const key = `${width}:${height}:${visible.length}`
    if (key === layoutKey.current) return
    layoutKey.current = key

    const columns = [...board.querySelectorAll('.dtb-column')]
    const base = adaptiveBoardLayout(visible, width, height)
    const write = (lanes, density) => {
      board.dataset.density = density
      board.style.setProperty('--tb-total-lanes', String(lanes.reduce((a, b) => a + b, 0)))
      columns.forEach((column, index) => {
        column.style.setProperty('--tb-lanes', String(lanes[index]))
        column.dataset.lanes = String(lanes[index])
      })
    }
    const fits = () => scroll.scrollHeight <= scroll.clientHeight + 1
      && scroll.scrollWidth <= scroll.clientWidth + 1

    let settled = null
    for (const density of ['normal', 'compact']) {
      const maxLanes = density === 'normal'
        ? base.maxLanes
        : Math.max(3, Math.floor((width - 20) / 145))
      const lanes = [...base.lanes]
      write(lanes, density)
      while (!fits() && lanes.reduce((a, b) => a + b, 0) < maxLanes) {
        let busiest = -1
        let tallest = 0
        columns.forEach((column, index) => {
          const list = column.querySelector('.dtb-list')
          const h = list ? list.getBoundingClientRect().height : 0
          const count = column.querySelectorAll('.dtb-card').length
          if (count > lanes[index] && h > tallest) { busiest = index; tallest = h }
        })
        if (busiest < 0) break
        lanes[busiest] += 1
        write(lanes, density)
      }
      settled = { lanes, density }
      if (fits()) break
    }
    if (!settled) return
    // Restore the committed values (the probe may have stopped mid-density).
    write(settled.lanes, settled.density)
    setLayout({
      lanes: settled.lanes,
      totalLanes: settled.lanes.reduce((a, b) => a + b, 0),
      density: settled.density,
    })
  }, [visible, layout])

  React.useEffect(() => {
    const scroll = scrollRef.current
    if (!scroll) return
    const observer = new ResizeObserver(() => { layoutKey.current = '' })
    observer.observe(scroll)
    return () => observer.disconnect()
  }, [])

  const showToast = React.useCallback((message, undoable = true) => {
    setToast({ message, undoable })
    setTimeout(() => setToast(current => (current?.message === message ? null : current)), 5200)
  }, [])

  const openSession = React.useCallback((id) => {
    const item = store.current.items[id]
    if (!item) return
    item.panelReadAt = Date.now()
    persistStore(store.current)
    ctx.uiWorkspace?.openSession?.(id)
    ctx.layout.selectPanel(null)
  }, [store, ctx])

  const removeSession = React.useCallback((id) => {
    const item = store.current.items[id]
    if (!item) return
    setLastRemoved({ ...item })
    delete store.current.items[id]
    store.current.dismissed[id] = Date.now()
    persistStore(store.current)
    forceRender()
    showToast(t('removed'))
  }, [store, showToast, t])

  const undoRemove = React.useCallback(() => {
    setLastRemoved(item => {
      if (!item) return null
      store.current.items[item.id] = item
      delete store.current.dismissed[item.id]
      persistStore(store.current)
      forceRender()
      return null
    })
    setToast(null)
  }, [store])

  const togglePriority = React.useCallback((id) => {
    const item = store.current.items[id]
    if (!item) return
    item.priority = !item.priority
    if (item.priority) {
      if (!Object.hasOwn(PRIORITY_COLORS, item.priorityColor)) {
        item.priorityColor = store.current.threadColors[id]
          || randomPriorityColor([], Object.values(store.current.items).filter(other => other !== item))
      }
      store.current.threadColors[id] = item.priorityColor
    }
    persistStore(store.current)
    forceRender()
  }, [store])

  const withBusy = React.useCallback(async (id, run) => {
    setBusy(current => new Set(current).add(id))
    try { await run() } finally {
      setBusy(current => { const next = new Set(current); next.delete(id); return next })
    }
  }, [])

  /** Pause: mark first, then cancel — so the interrupt cannot move the card. */
  const pauseTask = React.useCallback((id) => withBusy(id, async () => {
    const item = store.current.items[id]
    if (!item || item.manualPaused) return
    const session = ctx.sessions?.binding?.(id)?.session
    if (!session) { showToast(t('noTurn'), false); return }
    item.manualPaused = true
    persistStore(store.current)
    forceRender()
    try {
      const result = await session.cancel()
      if (result && result.ok === false) throw new Error(result.error?.message || t('unknown'))
      const current = store.current.items[id]
      if (!current) return
      current.manualPaused = true
      current.status = 'doing'
      persistStore(store.current)
    } catch (error) {
      if (store.current.items[id]) store.current.items[id].manualPaused = false
      showToast(`${t('pauseFailed')}${error instanceof Error ? error.message : t('unknown')}`, false)
    } finally {
      forceRender()
    }
  }), [ctx, store, showToast, t, withBusy])

  /**
   * Resume a paused card.
   *
   * DSH offers no "continue without a message" verb: `prompt` rejects content
   * with no non-whitespace text (the gateway's `hasPromptContent` guard), and
   * there is no session-level resume. So the card sends a real, minimal
   * instruction instead of a fabricated empty turn: it leaves `manualPaused`,
   * the session runs, and the message is visible in the transcript.
   */
  const resumeTask = React.useCallback((id) => withBusy(id, async () => {
    const item = store.current.items[id]
    if (!item || !item.manualPaused) return
    const session = ctx.sessions?.binding?.(id)?.session
    if (!session) { showToast(t('noTurn'), false); return }
    try {
      const result = await session.prompt([{ type: 'text', text: t('resumePrompt') }], 'queue')
      if (result && result.ok === false) throw new Error(result.error?.message || t('unknown'))
      const current = store.current.items[id]
      if (!current) return
      current.manualPaused = false
      current.status = 'doing'
      current.lastRuntimeType = 'active'
      persistStore(store.current)
    } catch (error) {
      showToast(`${t('resumeFailed')}${error instanceof Error ? error.message : t('unknown')}`, false)
    } finally {
      forceRender()
    }
  }), [ctx, store, showToast, t, withBusy])

  const addFromPicker = React.useCallback((id) => {
    const summary = snapshot.byId[id]
    if (!summary) return
    const existing = store.current.items[id] || null
    const item = itemFromSession(sessionFacts(summary), existing, store.current)
    if (item.lastRuntimeType === 'notLoaded') item.status = 'todo'
    // Resolve the native turn timing now: the fold effect only re-runs when the
    // session list changes, so a card added here would otherwise sit on the
    // loading label until the next list update.
    const timing = readTurnTiming(ctx, id)
    if (timing) item.nativeTurn = timing
    item.nativeTimeChecked = true
    store.current.items[id] = item
    delete store.current.dismissed[id]
    persistStore(store.current)
    forceRender()
  }, [snapshot, store, ctx])

  const onKeyDown = React.useCallback((event) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    if (pickerOpen) setPickerOpen(false)
    else ctx.layout.selectPanel(null)
  }, [pickerOpen, ctx])

  // -- picker rows ---------------------------------------------------------
  // Blank sessions are excluded: DSH reuses one empty draft per workspace for
  // the New Session flow, so it is a scratch slot rather than a conversation.
  // (The original filtered `thread.ephemeral` the same way.)
  const pickerRows = React.useMemo(() => {
    const needle = pickerQuery.trim().toLowerCase()
    return snapshot.ids.map(id => snapshot.byId[id]).filter(Boolean)
      .filter(row => row.origin !== 'subagent' && row.blank !== true)
      .filter(row => !needle || `${row.title || ''} ${row.displayTitle || ''} ${row.cwd || ''}`.toLowerCase().includes(needle))
      .slice(0, 30)
  }, [snapshot, pickerQuery])

  const total = all.length

  return React.createElement('div', { className: 'dtb-panel', onKeyDown }, [
    React.createElement('header', { className: 'dtb-header', key: 'header' }, [
      React.createElement('div', { className: 'dtb-heading', key: 'h' }, [
        React.createElement('h1', { key: 't' }, t('heading')),
        React.createElement('span', { key: 's' }, t('subheading')),
      ]),
      React.createElement('div', { className: 'dtb-actions', key: 'a' }, [
        React.createElement('button', {
          key: 'add', type: 'button', className: 'dtb-button dtb-button-primary',
          onClick: () => { setPickerOpen(true); setPickerQuery('') },
        }, t('add')),
        React.createElement('button', {
          key: 'close', type: 'button', className: 'dtb-button dtb-button-icon',
          'aria-label': t('close'), onClick: () => ctx.layout.selectPanel(null),
        }, '×'),
      ]),
    ]),

    React.createElement('div', { className: 'dtb-toolbar', key: 'toolbar' }, [
      React.createElement('label', { className: 'dtb-search', key: 'search' }, [
        searchIcon(),
        React.createElement('input', {
          key: 'i', type: 'search', value: query,
          placeholder: t('searchPlaceholder'), 'aria-label': t('searchLabel'),
          onChange: event => setQuery(event.target.value.trim().toLowerCase()),
        }),
      ]),
      React.createElement('span', {
        className: 'dtb-connection', key: 'conn', 'data-state': connection,
      }, connection === 'ok' && lastSyncAt
        ? `${t('synced')} · ${new Date(lastSyncAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
        : t(connection === 'error' ? 'failed' : 'connecting')),
    ]),

    React.createElement('div', { className: 'dtb-board-scroll', key: 'scroll', ref: scrollRef },
      React.createElement('div', {
        className: 'dtb-board', ref: boardRef,
        'data-density': layout.density,
        style: { '--tb-total-lanes': String(layout.totalLanes) },
      }, STATUS.map((column, index) => {
        const items = visible.filter(item => item.status === column.id)
        const columnTotal = all.filter(item => item.status === column.id).length
        const lanes = layout.lanes[index]
        return React.createElement('section', {
          key: column.id, className: 'dtb-column',
          'data-status': column.id, 'data-lanes': String(lanes),
          style: { '--tb-color': column.color, '--tb-lanes': String(lanes) },
        }, [
          React.createElement('div', { className: 'dtb-column-head', key: 'head' },
            React.createElement('div', { className: 'dtb-column-title' }, [
              React.createElement('span', { className: 'dtb-dot', key: 'dot' }),
              React.createElement('h2', { key: 'n' }, column.name),
              React.createElement('span', { className: 'dtb-count', key: 'c' }, String(columnTotal)),
            ])),
          React.createElement('p', { className: 'dtb-column-hint', key: 'hint' }, column.hint),
          React.createElement('div', { className: 'dtb-list', key: 'list' },
            items.length
              ? items.map(item => cardNode(item))
              : React.createElement('div', { className: 'dtb-empty', key: 'empty' },
                query ? t('noMatch') : t('empty'))),
        ])
      }))),

    React.createElement('footer', { className: 'dtb-footer', key: 'footer' }, [
      React.createElement('span', { key: 'c' }, `${total} ${t('total')}`),
      React.createElement('span', { key: 'n' }, t('footerNote')),
    ]),

    pickerOpen && React.createElement('div', {
      className: 'dtb-modal-layer', key: 'modal', 'data-open': 'true',
      onClick: event => { if (event.target === event.currentTarget) setPickerOpen(false) },
    }, React.createElement('section', {
      className: 'dtb-picker', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('pickerTitle'),
    }, [
      React.createElement('header', { className: 'dtb-picker-head', key: 'ph' }, [
        React.createElement('h2', { key: 't' }, t('pickerTitle')),
        React.createElement('button', {
          key: 'x', type: 'button', className: 'dtb-button dtb-button-icon',
          'aria-label': t('close'), onClick: () => setPickerOpen(false),
        }, '×'),
      ]),
      React.createElement('div', { className: 'dtb-picker-copy', key: 'pc' }, t('pickerCopy')),
      React.createElement('label', { className: 'dtb-search dtb-picker-search', key: 'ps' }, [
        searchIcon(),
        React.createElement('input', {
          key: 'i', type: 'search', value: pickerQuery, autoFocus: true,
          placeholder: t('pickerSearch'), 'aria-label': t('pickerSearchLabel'),
          onChange: event => setPickerQuery(event.target.value),
        }),
      ]),
      React.createElement('div', { className: 'dtb-picker-results', key: 'pr' },
        pickerRows.length
          ? pickerRows.map(row => {
            const id = String(row.id)
            const tracked = Boolean(store.current.items[id])
            return React.createElement('div', { className: 'dtb-picker-row', key: id }, [
              React.createElement('div', { key: 'd' }, [
                React.createElement('div', { className: 'dtb-picker-title', key: 't' }, sessionTitle(row)),
                React.createElement('div', { className: 'dtb-picker-project', key: 'p' }, [
                  React.createElement('span', { key: 'a' }, projectName(row.cwd || '')),
                  React.createElement('span', { key: 'b' }, '·'),
                  React.createElement('span', { key: 'c', title: row.cwd || '' }, row.cwd || '未指定路径'),
                  React.createElement('span', { key: 'd' }, '·'),
                  React.createElement('span', { key: 'e' }, relativeTime(row.updatedAt)),
                ]),
              ]),
              React.createElement('button', {
                key: 'add', type: 'button',
                className: 'dtb-button dtb-picker-add',
                disabled: tracked,
                onClick: () => addFromPicker(id),
              }, tracked ? t('joined') : store.current.dismissed[id] ? t('rejoin') : t('join')),
            ])
          })
          : React.createElement('div', { className: 'dtb-picker-state' },
            pickerQuery.trim() ? t('pickerNoMatch') : t('pickerEmpty'))),
    ])),

    toast && React.createElement('div', { className: 'dtb-toast', key: 'toast' }, [
      React.createElement('span', { key: 'm' }, toast.message),
      toast.undoable && React.createElement('button', {
        key: 'u', type: 'button', onClick: undoRemove,
      }, t('undo')),
    ]),
  ])

  // -- card ----------------------------------------------------------------
  function cardNode(item) {
    const controlBusy = busy.has(item.id)
    const unread = isUnread(item)
    const colorKey = priorityColor(item.priorityColor)
    const taskControl = item.status === 'doing'
      ? React.createElement('button', {
        className: 'dtb-task-control',
        'data-paused': String(item.manualPaused === true),
        disabled: controlBusy,
        'aria-label': item.manualPaused ? t('resume') : t('pause'),
        title: item.manualPaused ? t('resumeHint') : t('pauseHint'),
        onClick: event => {
          event.stopPropagation()
          if (item.manualPaused) resumeTask(item.id)
          else pauseTask(item.id)
        },
      }, controlBusy ? t('busyLabel') : item.manualPaused ? t('resumeLabel') : t('pauseLabel'))
      : null

    return React.createElement('article', {
      key: item.id,
      className: 'dtb-card',
      tabIndex: 0,
      'data-unread': String(unread),
      'data-priority': String(item.priority === true),
      'data-priority-color': colorKey,
      title: t('openHint'),
      style: {
        '--tb-priority-color': PRIORITY_COLORS[colorKey],
        '--tb-priority-accent': PRIORITY_ACCENTS[colorKey],
        '--tb-priority-angle': `${PRIORITY_ANGLES[colorKey]}deg`,
      },
      onClick: () => openSession(item.id),
      onKeyDown: event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openSession(item.id)
        }
      },
    }, [
      React.createElement('button', {
        key: 'star', type: 'button', className: 'dtb-card-priority',
        'aria-pressed': String(item.priority === true),
        'aria-label': item.priority ? t('starOff') : t('starOn'),
        title: item.priority ? t('starOff') : t('starOn'),
        onClick: event => { event.stopPropagation(); togglePriority(item.id) },
      }, item.priority ? '★' : '☆'),
      React.createElement('button', {
        key: 'done', type: 'button', className: 'dtb-card-remove',
        'aria-label': t('doneLabel'), title: t('doneLabel'),
        onClick: event => { event.stopPropagation(); removeSession(item.id) },
      }, '✓'),
      React.createElement('div', { className: 'dtb-card-title-row', key: 'title' }, [
        React.createElement('span', {
          key: 'dot', className: 'dtb-unread-dot', 'data-unread': String(unread),
          'aria-label': unread ? t('unread') : t('read'),
          title: unread ? t('unreadHint') : t('readHint'),
        }),
        React.createElement('h3', { key: 'h' }, item.title),
      ]),
      React.createElement('div', {
        className: 'dtb-card-project', key: 'project', title: item.cwd || '未指定路径',
      }, item.project),
      React.createElement('div', { className: 'dtb-card-meta', key: 'meta' }, [
        React.createElement('span', {
          key: 'note', className: 'dtb-card-note',
          'data-error': String(item.lastRuntimeType === 'systemError'),
        }, statusNote(item)),
        React.createElement('span', { key: 'time' }, relativeTime(item.updatedAt)),
      ]),
      React.createElement('div', { className: 'dtb-card-work-row', key: 'work' }, [
        React.createElement('div', {
          key: 'd', className: 'dtb-work-duration', title: t('workHint'),
        }, workDurationLabel(item)),
        taskControl,
      ]),
    ])
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/**
 * Services this plugin needs before it can register.
 *
 * `sessions` supplies the live session list; `uiWorkspace` navigates to a
 * session; `layout` owns panel selection.
 */
const inject = ['slots', 'layout', 'locale', 'sessions', 'uiWorkspace']

/**
 * Register the board's nav entry and panel body.
 * @param ctx - client root context.
 */
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-task-board: dictionaries')
  const t = ctx.locale.bind(NS)

  // The board's memory lives across panel unmounts, so the store is one
  // instance per plugin fiber rather than per render.
  const store = { current: loadStore() }

  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 30,
    locale: NS,
    label: () => t('panel'),
  }, BoardIcon))

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
    locale: NS,
    inject: () => ({ store, ctx }),
  }, props => React.createElement(BoardBoundary, null, React.createElement(BoardPanel, props))))
}

//#endregion

exports.inject = inject;
exports.apply = apply;
return module.exports;
} });
