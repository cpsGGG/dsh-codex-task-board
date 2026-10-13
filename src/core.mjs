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

export const MOD_ID = 'dsh-task-board'
export const MOD_VERSION = '1.0.0'

export const PRIORITY_COLORS = {
  gold: '#d6af67', red: '#df7b87', blue: '#77a7e8', green: '#69b28d',
  purple: '#a68bd6', cyan: '#62b8c5', orange: '#dda06f', pink: '#d28ead',
  lime: '#a3b86f', indigo: '#909de0', teal: '#61aaa4', magenta: '#bb85c9',
  coral: '#dc9181', mint: '#79bf9d', azure: '#69a8d0', slate: '#9aaabd',
}
export const PRIORITY_ACCENTS = {
  gold: '#e4c591', red: '#e8a0a5', blue: '#a0bfef', green: '#91c5a8',
  purple: '#c0abe5', cyan: '#8dcbd3', orange: '#e8ba96', pink: '#e2adc3',
  lime: '#bdcc99', indigo: '#b1baeb', teal: '#8dc5bf', magenta: '#d2a6dc',
  coral: '#e8b1a2', mint: '#a0d2b6', azure: '#98c2de', slate: '#bcc7d4',
}
export const PRIORITY_ANGLES = {
  gold: 118, red: 148, blue: 132, green: 108,
  purple: 144, cyan: 124, orange: 158, pink: 114,
  lime: 138, indigo: 154, teal: 128, magenta: 104,
  coral: 164, mint: 100, azure: 150, slate: 136,
}

/** The one storage key; the profile's own localStorage namespace is the store. */
export const STORAGE_KEY = 'dsh-task-board:session-state:v3'

/** Board panel id: the `main` slot key and the `sidebar.panellist` list id. */
export const PANEL_ID = 'task-board'

export const STATUS = [
  { id: 'todo', name: '待处理', hint: '刚加入、尚未开始', color: '#8b8b8b' },
  { id: 'doing', name: '处理中', hint: 'DSH 正在工作', color: '#339cff' },
  { id: 'review', name: '待审阅', hint: '等待回答、批准或检查', color: '#e5a23c' },
]

/** Palette key for a stored value; unknown values fall back to gold. */
export function priorityColor(value) {
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
export function randomPriorityColor(excluded = [], items = []) {
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
export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

/** Normalize a filesystem path for comparison. */
export function normalizePath(value) {
  return String(value || '').replaceAll('/', '\\').replace(/^\\\\\?\\/, '').replace(/\\+$/, '').toLowerCase()
}

/**
 * Project a working directory to its display name.
 * @param cwd - absolute session directory.
 * @param projectLabels - optional root→label overrides (DSH workspaces).
 * @returns the display name, or `未指定项目`.
 */
export function projectName(cwd, projectLabels = {}) {
  const normalized = normalizePath(cwd)
  const exact = Object.entries(projectLabels).find(([root]) => normalizePath(root) === normalized)
  if (exact?.[1]) return exact[1]
  const parts = String(cwd || '未指定项目').replaceAll('/', '\\').split('\\').filter(Boolean)
  return parts.at(-1) || '未指定项目'
}

/** Session display title with the original fallback. */
export function sessionTitle(session) {
  const title = String(session?.title || session?.displayTitle || '').trim()
  return title || '未命名会话'
}

/**
 * Relative time in the original's exact thresholds.
 * @param timestampMs - epoch milliseconds.
 * @param now - reference clock.
 * @returns the localized relative label.
 */
export function relativeTime(timestampMs, now = Date.now()) {
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
export function workDurationLabel(item, now = Date.now()) {
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
export function isUnread(item) {
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
export function nextBoardStatus(session, existing) {
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
export function statusNote(item) {
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
export function shouldAutoAdd(session, store) {
  const id = String(session?.id || '')
  if (!id || session.blank === true) return false
  const dismissedAt = Number(store.dismissed[id] || 0)
  if (dismissedAt && Number(session.updatedAt || 0) <= dismissedAt + 1000) return false
  const isNew = Number(session.createdAt || 0) >= Number(store.initializedAt || 0) - 2000
  return isNew || session.running === true || session.completed === true || Boolean(session.error)
    || (dismissedAt > 0 && Number(session.updatedAt || 0) > dismissedAt + 1000)
}

/** Build a board item from session facts, preserving stored per-item state. */
export function itemFromSession(session, existing = null, store = {}) {
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
export function sameItem(a, b) {
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
export function syncDoingOrder(store) {
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
export function currentItems(store) {
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
export function adaptiveBoardLayout(items, width, height) {
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
export function emptyStore() {
  return { version: 3, initializedAt: Date.now(), items: {}, dismissed: {}, threadColors: {}, doingOrder: [] }
}

/**
 * Normalize a parsed store: filter the colour registry, migrate `blocked`
 * into `review`, coerce the boolean flags, and re-resolve every item colour.
 * @param parsed - the raw parsed JSON.
 * @returns a usable store, or null when the payload is not a v3 store.
 */
export function normalizeStore(parsed) {
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
export function syncSessions(store, sessions) {
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
export function applyTurnTiming(store, id, turn) {
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
export function turnTimingFromEvents(entries) {
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
export function filterItems(items, query) {
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return items
  return items.filter(item =>
    `${item.title} ${item.project} ${item.cwd}`.toLowerCase().includes(needle))
}
