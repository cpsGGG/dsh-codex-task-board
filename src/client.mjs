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

import React from 'react'
import {
  PANEL_ID, PRIORITY_COLORS, PRIORITY_ACCENTS, PRIORITY_ANGLES, STATUS,
  adaptiveBoardLayout, applyTurnTiming, currentItems, emptyStore, filterItems,
  isUnread, itemFromSession, normalizeStore, priorityColor, projectName,
  randomPriorityColor, relativeTime, sessionTitle, statusNote, syncDoingOrder,
  syncSessions, turnTimingFromEvents, workDurationLabel,
} from './core.mjs'

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
export const inject = ['slots', 'layout', 'locale', 'sessions', 'uiWorkspace']

/**
 * Register the board's nav entry and panel body.
 * @param ctx - client root context.
 */
export function apply(ctx) {
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
