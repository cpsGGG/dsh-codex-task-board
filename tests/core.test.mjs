/**
 * Core-logic tests for the task board.
 *
 * The expectations carry over the author's earlier fixtures, re-pointed at the
 * DSH session model: where those asserted a `thread` with a `status.type`, the
 * equivalent DSH facts (`running` / `completed` / `pending` / `error`) are
 * asserted instead — the output contract is the same.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  PRIORITY_ACCENTS, PRIORITY_ANGLES, PRIORITY_COLORS, STATUS,
  adaptiveBoardLayout, applyTurnTiming, currentItems, emptyStore, filterItems,
  isUnread, itemFromSession, nextBoardStatus, normalizeStore, priorityColor,
  projectName, randomPriorityColor, relativeTime, sameItem, shouldAutoAdd,
  statusNote, syncDoingOrder, syncSessions, turnTimingFromEvents, workDurationLabel,
} from '../src/core.mjs'

/** Minimal session facts. */
function session(overrides = {}) {
  return { id: 'a', title: 'T', cwd: 'D:\\proj', createdAt: 1000, updatedAt: 1000, ...overrides }
}

// -- palette ----------------------------------------------------------------

test('the 16-colour palette keeps the original keys, order and values', () => {
  const keys = Object.keys(PRIORITY_COLORS)
  assert.equal(keys.length, 16)
  assert.deepEqual(keys.slice(0, 4), ['gold', 'red', 'blue', 'green'])
  assert.equal(PRIORITY_COLORS.gold, '#d6af67')
  assert.equal(PRIORITY_COLORS.slate, '#9aaabd')
  assert.equal(PRIORITY_ACCENTS.gold, '#e4c591')
  assert.equal(PRIORITY_ANGLES.gold, 118)
  assert.equal(PRIORITY_ANGLES.coral, 164)
  for (const key of keys) {
    assert.match(PRIORITY_COLORS[key], /^#[0-9a-f]{6}$/)
    assert.match(PRIORITY_ACCENTS[key], /^#[0-9a-f]{6}$/)
    assert.equal(typeof PRIORITY_ANGLES[key], 'number')
  }
})

test('priorityColor is prototype-safe and falls back to gold', () => {
  assert.equal(priorityColor('red'), 'red')
  assert.equal(priorityColor('__proto__'), 'gold')
  assert.equal(priorityColor('nope'), 'gold')
  assert.equal(priorityColor(null), 'gold')
  assert.equal(priorityColor(undefined), 'gold')
})

test('randomPriorityColor prefers the least-used colour', () => {
  const original = Math.random
  try {
    // gold is taken once, so the least-used tier is every other colour.
    Math.random = () => 0
    assert.equal(randomPriorityColor(['red'], [{ priority: true, priorityColor: 'gold' }]), 'blue')
    // Nothing used at all → the first key wins at random()===0.
    assert.equal(randomPriorityColor(), 'gold')
    // Full pool excluded → fall back to the whole palette rather than throwing.
    assert.equal(randomPriorityColor(Object.keys(PRIORITY_COLORS)), 'gold')
  } finally {
    Math.random = original
  }
})

test('randomPriorityColor indexes the palette in insertion order', () => {
  const original = Math.random
  try {
    const keys = Object.keys(PRIORITY_COLORS)
    for (let i = 0; i < keys.length; i++) {
      Math.random = () => (i + 0.01) / 16
      assert.equal(randomPriorityColor(), keys[i])
    }
  } finally {
    Math.random = original
  }
})

// -- formatting -------------------------------------------------------------

test('projectName takes the last path segment and honours label overrides', () => {
  assert.equal(projectName('D:\\work\\acme-web'), 'acme-web')
  assert.equal(projectName('D:/work/acme-web/'), 'acme-web')
  assert.equal(projectName('\\\\?\\D:\\work\\alpha'), 'alpha')
  assert.equal(projectName(''), '未指定项目')
  assert.equal(projectName(undefined), '未指定项目')
  assert.equal(projectName('D:\\work\\alpha', { 'd:\\work\\alpha': 'Alpha 项目' }), 'Alpha 项目')
  // A non-ASCII leaf survives the path split.
  assert.equal(projectName('D:\\work\\项目文档'), '项目文档')
})

test('relativeTime uses the original thresholds', () => {
  const now = 1_700_000_000_000
  assert.equal(relativeTime(0, now), '时间未知')
  assert.equal(relativeTime(NaN, now), '时间未知')
  assert.equal(relativeTime(now - 30_000, now), '刚刚')
  assert.match(relativeTime(now - 120_000, now), /2\s*分钟前/)
  assert.match(relativeTime(now - 7_200_000, now), /2\s*小时前/)
  // numeric:'auto' renders exactly 2 days as 前天, not 2天前 — same as the original.
  assert.equal(relativeTime(now - 172_800_000, now), '前天')
  assert.match(relativeTime(now - 259_200_000, now), /3\s*天前/)
  // Older than a week falls back to M/D.
  assert.match(relativeTime(now - 30 * 86_400_000, now), /^\d+\/\d+$/)
})

test('workDurationLabel reproduces every verified fixture', () => {
  const now = 10_000_000
  assert.equal(workDurationLabel({ nativeTurn: null }), '正在读取原生用时…')
  assert.equal(workDurationLabel({ nativeTurn: null, nativeTimeChecked: true }), '暂无原生用时')

  // Running: elapsed is now - startedAtMs.
  assert.equal(workDurationLabel({
    nativeTurn: { id: 't', status: 'inProgress', startedAtMs: now - 8_510_000, completedAtMs: null, durationMs: null },
  }, now), '已处理 2小时 21分钟 50秒')

  // Completed with an explicit duration.
  assert.equal(workDurationLabel({
    nativeTurn: { id: 't', status: 'completed', startedAtMs: 0, completedAtMs: 0, durationMs: 165_000 },
  }, now), '用时 2分钟 45秒')

  // Interrupted.
  assert.equal(workDurationLabel({
    nativeTurn: { id: 't', status: 'interrupted', startedAtMs: 0, completedAtMs: 0, durationMs: 60_000 },
  }, now), '停止前用时 1分钟')

  // Manually paused.
  assert.equal(workDurationLabel({
    manualPaused: true,
    nativeTurn: { id: 't', status: 'interrupted', startedAtMs: 0, completedAtMs: 0, durationMs: 60_000 },
  }, now), '暂停前用时 1分钟')

  // Zero-length turn keeps the 0秒 floor.
  assert.equal(workDurationLabel({
    nativeTurn: { id: 't', status: 'completed', startedAtMs: 0, completedAtMs: 0, durationMs: 0 },
  }, now), '用时 0秒')

  // Full unit stack.
  assert.equal(workDurationLabel({
    nativeTurn: { id: 't', status: 'completed', startedAtMs: 0, completedAtMs: 0, durationMs: 90_061_000 },
  }, now), '用时 1天 1小时 1分钟 1秒')

  // No timing at all → the explicit empty label.
  assert.equal(workDurationLabel({
    nativeTurn: { id: 't', status: 'completed', startedAtMs: null, completedAtMs: null, durationMs: null },
  }, now), '暂无原生用时')
})

test('isUnread compares the board read mark with the session timestamp', () => {
  assert.equal(isUnread({ panelReadAt: 0, updatedAt: 5000 }), true)
  assert.equal(isUnread({ panelReadAt: 4000, updatedAt: 5000 }), true)
  assert.equal(isUnread({ panelReadAt: 5000, updatedAt: 5000 }), false)
  assert.equal(isUnread({ panelReadAt: 6000, updatedAt: 5000 }), false)
  assert.equal(isUnread({}), true)
})

// -- status -----------------------------------------------------------------

test('nextBoardStatus follows the original precedence', () => {
  // 1. an error wins outright.
  assert.equal(nextBoardStatus({ error: 'boom', running: true }, null), 'review')
  // 2. a manual pause holds the card in doing.
  assert.equal(nextBoardStatus({ running: false }, { manualPaused: true, status: 'doing' }), 'doing')
  // 3. active + awaiting an answer → review.
  assert.equal(nextBoardStatus({ running: true, pending: true }, null), 'review')
  // 4. active → doing.
  assert.equal(nextBoardStatus({ running: true }, null), 'doing')
  // 5. idle after having run → review.
  assert.equal(nextBoardStatus({ running: false }, { lastRuntimeType: 'active', status: 'doing' }), 'review')
  // 5b. an untouched new session stays where it was.
  assert.equal(nextBoardStatus({ running: false, updatedAt: 1000, createdAt: 1000 }, { status: 'todo' }), 'todo')
  // 5c. a first sighting that already moved past creation → review.
  assert.equal(nextBoardStatus({ running: false, updatedAt: 9000, createdAt: 1000 }, null), 'review')
  // 6. unknown runtime keeps the stored status.
  assert.equal(nextBoardStatus({ running: false }, { status: 'review' }), 'review')
  assert.equal(nextBoardStatus({ running: false }, null), 'todo')
})

test('statusNote returns the seven exact strings', () => {
  assert.equal(statusNote({ lastRuntimeType: 'systemError' }), '运行异常 · 需要检查')
  assert.equal(statusNote({ manualPaused: true }), '已暂停 · 可启动')
  assert.equal(statusNote({ status: 'doing' }), 'DSH 正在处理')
  assert.equal(statusNote({ status: 'review', activeFlags: ['waitingOnApproval'] }), '等待你批准操作')
  assert.equal(statusNote({ status: 'review', activeFlags: ['waitingOnUserInput'] }), '等待你输入或确认')
  assert.equal(statusNote({ status: 'review' }), '已停止运行，等待你检查')
  assert.equal(statusNote({ status: 'todo' }), '尚未开始')
})

test('shouldAutoAdd accepts new, running, finished and erroring sessions only', () => {
  const store = { initializedAt: 10_000, dismissed: {} }
  assert.equal(shouldAutoAdd(session({ createdAt: 9_000 }), store), true)
  assert.equal(shouldAutoAdd(session({ createdAt: 1, updatedAt: 1 }), store), false)
  assert.equal(shouldAutoAdd(session({ createdAt: 1, updatedAt: 1, running: true }), store), true)
  assert.equal(shouldAutoAdd(session({ createdAt: 1, updatedAt: 1, completed: true }), store), true)
  assert.equal(shouldAutoAdd(session({ createdAt: 1, updatedAt: 1, error: 'x' }), store), true)
  assert.equal(shouldAutoAdd({ id: '' }, store), false)

  // A blank session is DSH's reusable New-Session draft, never a task.
  assert.equal(shouldAutoAdd(session({ createdAt: 9_500, blank: true }), store), false)
  assert.equal(shouldAutoAdd(session({ createdAt: 9_500, blank: true, running: true }), store), false)

  // Dismissed: silent until it advances by more than 1s.
  const dismissed = { initializedAt: 10_000, dismissed: { a: 50_000 } }
  assert.equal(shouldAutoAdd(session({ createdAt: 1, updatedAt: 50_500 }), dismissed), false)
  assert.equal(shouldAutoAdd(session({ createdAt: 1, updatedAt: 51_500 }), dismissed), true)
})

test('a finished-but-unopened session lands in 待审阅', () => {
  assert.equal(nextBoardStatus({ running: false, completed: true }, null), 'review')
  // A running session still wins over the completed flag.
  assert.equal(nextBoardStatus({ running: true, completed: true }, null), 'doing')
})

test('sameItem ignores the fields that must not force a redraw', () => {
  const base = { title: 'T', cwd: 'c', project: 'p', updatedAt: 1, status: 'todo', lastRuntimeType: 'idle', activeFlags: [] }
  assert.equal(sameItem(base, { ...base }), true)
  assert.equal(sameItem(base, { ...base, panelReadAt: 99 }), true)
  assert.equal(sameItem(base, { ...base, priority: true }), true)
  assert.equal(sameItem(base, { ...base, status: 'doing' }), false)
  assert.equal(sameItem(base, { ...base, updatedAt: 2 }), false)
  assert.equal(sameItem(null, base), false)
})

// -- ordering ---------------------------------------------------------------

test('syncDoingOrder drops stale ids, dedupes, and appends newcomers', () => {
  const store = {
    items: {
      a: { id: 'a', status: 'doing', updatedAt: 1 },
      b: { id: 'b', status: 'doing', updatedAt: 2 },
      c: { id: 'c', status: 'doing', updatedAt: 3 },
      d: { id: 'd', status: 'doing', updatedAt: 4 },
      e: { id: 'e', status: 'doing', updatedAt: 5 },
      x: { id: 'x', status: 'todo', updatedAt: 9 },
    },
    doingOrder: ['e', 'missing', 'e', 'a'],
  }
  assert.equal(syncDoingOrder(store), true)
  assert.deepEqual(store.doingOrder, ['e', 'a', 'b', 'c', 'd'])
})

test('syncDoingOrder reports no change when the order is already stable', () => {
  const store = {
    items: { a: { id: 'a', status: 'doing', updatedAt: 1 }, b: { id: 'b', status: 'doing', updatedAt: 2 } },
    doingOrder: ['a', 'b'],
  }
  assert.equal(syncDoingOrder(store), false)
  assert.deepEqual(store.doingOrder, ['a', 'b'])
})

test('syncDoingOrder seeds from priority then recency on first migration', () => {
  const store = {
    items: {
      low: { id: 'low', status: 'doing', priority: false, updatedAt: 10 },
      high: { id: 'high', status: 'doing', priority: true, updatedAt: 1 },
      mid: { id: 'mid', status: 'doing', priority: false, updatedAt: 20 },
    },
  }
  syncDoingOrder(store)
  assert.deepEqual(store.doingOrder, ['high', 'mid', 'low'])
})

test('an empty doing column clears the order', () => {
  const store = { items: { a: { id: 'a', status: 'todo', updatedAt: 1 } }, doingOrder: ['a'] }
  syncDoingOrder(store)
  assert.deepEqual(store.doingOrder, [])
})

test('currentItems sorts by priority then recency, splicing doingOrder in place', () => {
  const store = {
    items: {
      a: { id: 'a', status: 'todo', priority: false, updatedAt: 10 },
      b: { id: 'b', status: 'doing', priority: false, updatedAt: 50 },
      c: { id: 'c', status: 'doing', priority: false, updatedAt: 40 },
      d: { id: 'd', status: 'review', priority: true, updatedAt: 5 },
    },
    doingOrder: ['c', 'b'],
  }
  // Global order: d (priority) then b, c, a by recency; the doing slots
  // (positions 1 and 2) are then filled from doingOrder → c, b.
  assert.deepEqual(currentItems(store).map(i => i.id), ['d', 'c', 'b', 'a'])
})

// -- layout -----------------------------------------------------------------

test('adaptiveBoardLayout reproduces the three verified fixtures', () => {
  const items = (todo, doing, review) => [
    ...Array.from({ length: todo }, () => ({ status: 'todo' })),
    ...Array.from({ length: doing }, () => ({ status: 'doing' })),
    ...Array.from({ length: review }, () => ({ status: 'review' })),
  ]

  const wide = adaptiveBoardLayout(items(1, 2, 10), 1676, 932)
  assert.equal(wide.rowCapacity, 7)
  assert.equal(wide.maxLanes, 9)
  assert.deepEqual(wide.lanes, [1, 1, 2])
  assert.equal(wide.totalLanes, 4)
  assert.equal(wide.fits, true)

  const mid = adaptiveBoardLayout(items(1, 2, 10), 940, 580)
  assert.equal(mid.rowCapacity, 4)
  assert.equal(mid.maxLanes, 5)
  assert.deepEqual(mid.lanes, [1, 1, 3])
  assert.equal(mid.totalLanes, 5)
  assert.equal(mid.fits, true)

  const tight = adaptiveBoardLayout(items(1, 2, 30), 520, 420)
  assert.equal(tight.rowCapacity, 2)
  assert.equal(tight.maxLanes, 3)
  assert.deepEqual(tight.lanes, [1, 1, 1])
  assert.equal(tight.totalLanes, 3)
  assert.equal(tight.fits, false)
})

test('adaptiveBoardLayout floors the row capacity and lane count', () => {
  const layout = adaptiveBoardLayout([], 0, 0)
  assert.equal(layout.rowCapacity, 2)
  assert.equal(layout.maxLanes, 3)
  assert.deepEqual(layout.lanes, [1, 1, 1])
  assert.equal(layout.fits, true)
})

// -- store ------------------------------------------------------------------

test('normalizeStore rejects a foreign payload and migrates a blocked status', () => {
  assert.equal(normalizeStore(null), null)
  assert.equal(normalizeStore({ version: 2, items: {} }), null)
  assert.equal(normalizeStore({ version: 3 }), null)

  const store = normalizeStore({
    version: 3,
    initializedAt: 1,
    items: {
      a: { id: 'a', status: 'blocked', priorityColor: 'red', priority: true },
      b: { id: 'b', status: 'todo', priorityColor: 'not-a-colour', priority: true },
    },
    threadColors: { a: 'red', b: 'bogus' },
    dismissed: {},
  })
  assert.equal(store.items.a.status, 'review')
  assert.equal(store.items.a.lastRuntimeType, 'systemError')
  assert.equal(store.items.a.priorityColor, 'red')
  // An invalid colour on a starred item degrades to gold, never to raw CSS.
  assert.equal(store.items.b.priorityColor, 'gold')
  // The registry keeps only real palette keys.
  assert.deepEqual(Object.keys(store.threadColors).sort(), ['a', 'b'])
  assert.equal(store.threadColors.b, 'gold')
})

test('normalizeStore deletes the superseded cumulative timers', () => {
  const store = normalizeStore({
    version: 3,
    items: { a: { id: 'a', status: 'todo', workMs: 1, workTracked: true, workRunning: true, workObservedAt: 2 } },
    threadColors: {},
  })
  for (const key of ['workMs', 'workTracked', 'workRunning', 'workObservedAt']) {
    assert.equal(key in store.items.a, false, `${key} must not survive`)
  }
})

test('an unstarred item keeps its saved colour across a reload', () => {
  const store = normalizeStore({
    version: 3,
    items: { a: { id: 'a', status: 'todo', priority: false, priorityColor: null } },
    threadColors: { a: 'teal' },
  })
  assert.equal(store.items.a.priorityColor, 'teal')
  assert.equal(store.items.a.priority, false)
})

test('syncSessions adds new sessions and leaves unrelated ones alone', () => {
  const store = emptyStore()
  store.initializedAt = 10_000
  const changed = syncSessions(store, [
    session({ id: 'new', createdAt: 9_500, updatedAt: 9_500 }),
    session({ id: 'old', createdAt: 1, updatedAt: 1 }),
  ])
  assert.equal(changed, true)
  assert.deepEqual(Object.keys(store.items), ['new'])
})

test('syncSessions clears a dismissal once the session advances', () => {
  const store = emptyStore()
  store.initializedAt = 10_000
  store.dismissed.old = 5_000
  syncSessions(store, [session({ id: 'old', createdAt: 1, updatedAt: 7_000 })])
  assert.equal(store.dismissed.old, undefined)
  assert.equal(store.items.old.id, 'old')
})

test('itemFromSession preserves the stored per-item memory', () => {
  const existing = {
    id: 'a', priority: true, priorityColor: 'mint', manualPaused: true,
    panelReadAt: 42, addedAt: 7, nativeTurn: { id: 'turn-1' }, nativeTimeChecked: true,
    title: 'Old', cwd: 'D:\\old', status: 'doing', lastRuntimeType: 'active',
  }
  const item = itemFromSession(session({ id: 'a', running: true, updatedAt: 2000 }), existing, { threadColors: {} })
  assert.equal(item.priority, true)
  assert.equal(item.priorityColor, 'mint')
  assert.equal(item.manualPaused, true)
  assert.equal(item.panelReadAt, 42)
  assert.equal(item.addedAt, 7)
  assert.equal(item.nativeTurn.id, 'turn-1')
  assert.equal(item.status, 'doing')
})

// -- turn timing ------------------------------------------------------------

test('turnTimingFromEvents folds a running turn', () => {
  const timing = turnTimingFromEvents([
    { type: 'event', event: { type: 'turn/start', time: 1_000, data: { turn: 1 } } },
  ])
  assert.deepEqual(timing, {
    id: 'turn-1', status: 'inProgress', startedAtMs: 1_000, completedAtMs: null, durationMs: null, source: 'server',
  })
})

test('turnTimingFromEvents folds a completed turn and its duration', () => {
  const timing = turnTimingFromEvents([
    { type: 'event', event: { type: 'turn/start', time: 1_000, data: { turn: 1 } } },
    { type: 'event', event: { type: 'turn/end', time: 4_000, data: { turn: 1, reason: { kind: 'completed' } } } },
  ])
  assert.equal(timing.status, 'completed')
  assert.equal(timing.durationMs, 3_000)
  assert.equal(timing.completedAtMs, 4_000)
})

test('turnTimingFromEvents maps an aborted turn to interrupted', () => {
  const timing = turnTimingFromEvents([
    { type: 'event', event: { type: 'turn/start', time: 1_000, data: { turn: 1 } } },
    { type: 'event', event: { type: 'turn/end', time: 2_500, data: { turn: 1, reason: { kind: 'aborted', reason: { kind: 'user' } } } } },
  ])
  assert.equal(timing.status, 'interrupted')
  assert.equal(timing.durationMs, 1_500)
})

test('turnTimingFromEvents keeps the latest turn of several', () => {
  const timing = turnTimingFromEvents([
    { type: 'event', event: { type: 'turn/start', time: 1_000, data: { turn: 1 } } },
    { type: 'event', event: { type: 'turn/end', time: 2_000, data: { turn: 1, reason: { kind: 'completed' } } } },
    { type: 'event', event: { type: 'turn/start', time: 5_000, data: { turn: 2 } } },
  ])
  assert.equal(timing.id, 'turn-2')
  assert.equal(timing.status, 'inProgress')
})

test('turnTimingFromEvents returns null without a turn', () => {
  assert.equal(turnTimingFromEvents([]), null)
  assert.equal(turnTimingFromEvents([{ type: 'event', event: { type: 'user/message', time: 1 } }]), null)
  assert.equal(turnTimingFromEvents(undefined), null)
})

test('applyTurnTiming keeps a more precise native-header record', () => {
  const store = { items: { a: { id: 'a', nativeTurn: { id: 'turn-1', status: 'inProgress', source: 'native-header' } } } }
  // A coarser server record must not overwrite the precise native one.
  assert.equal(applyTurnTiming(store, 'a', { id: 'turn-1', status: 'inProgress', source: 'server' }), false)
  assert.equal(store.items.a.nativeTurn.source, 'native-header')
  // A completion does replace it.
  assert.equal(applyTurnTiming(store, 'a', { id: 'turn-1', status: 'completed', source: 'server' }), true)
  assert.equal(store.items.a.nativeTurn.status, 'completed')
  // Unknown items are ignored.
  assert.equal(applyTurnTiming(store, 'zzz', { id: 'turn-9' }), false)
})

// -- search -----------------------------------------------------------------

test('filterItems matches title, project and path, case-insensitively', () => {
  const items = [
    { title: 'Alpha 任务', project: 'acme-web', cwd: 'D:\\work\\acme-web' },
    { title: 'Beta', project: 'other', cwd: 'D:\\work\\other' },
  ]
  assert.equal(filterItems(items, '').length, 2)
  assert.equal(filterItems(items, '   ').length, 2)
  assert.equal(filterItems(items, 'alpha').length, 1)
  assert.equal(filterItems(items, 'acme-web').length, 1)
  // A non-ASCII title is matched case-insensitively too.
  assert.equal(filterItems(items, '任务').length, 1)
  assert.equal(filterItems(items, 'd:\\work\\other').length, 1)
  assert.equal(filterItems(items, 'nope').length, 0)
})

// -- status table -----------------------------------------------------------

test('the three columns keep the original ids, names, hints and dot colours', () => {
  assert.deepEqual(STATUS.map(c => c.id), ['todo', 'doing', 'review'])
  assert.deepEqual(STATUS.map(c => c.name), ['待处理', '处理中', '待审阅'])
  assert.deepEqual(STATUS.map(c => c.hint), ['刚加入、尚未开始', 'DSH 正在工作', '等待回答、批准或检查'])
  assert.deepEqual(STATUS.map(c => c.color), ['#8b8b8b', '#339cff', '#e5a23c'])
})
