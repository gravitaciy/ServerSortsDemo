import type { AddRecordPayload, RecordsResponse, SessionState, TableRow } from './types'

const BASE_URL =
  import.meta.env.VITE_API_URL ??
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : 'http://localhost:3001')
const SESSION_BATCH_MS = 1000
const ADD_BATCH_MS = 10_000

function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | undefined> } = {}
): Promise<T> {
  const { params, ...init } = options
  const url = new URL(path, BASE_URL)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    })
  }
  return fetch(url.toString(), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    },
  }).then((r) => {
    if (!r.ok) return r.json().then((b) => Promise.reject(new Error(b?.error ?? r.statusText)))
    return r.json() as Promise<T>
  })
}

type GetRecordsParams = {
  page: number
  limit: number
  idFilter?: string
  excludeIds?: string[]
}

const getRecordsCache = new Map<string, Promise<RecordsResponse>>()

function getRecordsKey(params: GetRecordsParams): string {
  const ex = (params.excludeIds ?? []).slice().sort().join(',')
  return `records:${params.page}:${params.limit}:${params.idFilter ?? ''}:${ex}`
}

export function getRecords(params: {
  page: number
  limit?: number
  idFilter?: string
  excludeIds?: string[]
}): Promise<RecordsResponse> {
  const limit = params.limit ?? 20
  const fullParams: GetRecordsParams = {
    page: params.page,
    limit,
    idFilter: params.idFilter,
    excludeIds: params.excludeIds,
  }
  const key = getRecordsKey(fullParams)
  const existing = getRecordsCache.get(key)
  if (existing) return existing
  const promise = request<RecordsResponse>('/api/records', {
    params: {
      page: params.page,
      limit,
      ...(params.idFilter ? { idFilter: params.idFilter } : {}),
      ...(params.excludeIds?.length ? { excludeIds: params.excludeIds.join(',') } : {}),
    },
  })
  getRecordsCache.set(key, promise)
  promise.finally(() => getRecordsCache.delete(key))
  return promise
}

const sessionStateKey = 'session:state'
let sessionPromise: Promise<SessionState> | null = null
let sessionRequestedAt = 0

export function getSessionState(): Promise<SessionState> {
  const now = Date.now()
  if (sessionPromise && now - sessionRequestedAt < SESSION_BATCH_MS) {
    return sessionPromise
  }
  sessionRequestedAt = now
  sessionPromise = request<SessionState>('/api/session/state')
  return sessionPromise
}

let sessionPending: Partial<SessionState> | null = null
let sessionFlushTimer: ReturnType<typeof setTimeout> | null = null

function flushSessionState() {
  sessionFlushTimer = null
  const state = sessionPending
  sessionPending = null
  if (!state || (Object.keys(state).length === 0)) return
  request<SessionState>('/api/session/state', {
    method: 'POST',
    body: JSON.stringify(state),
  }).catch(() => {})
}

export function postSessionState(update: Partial<SessionState>): Promise<void> {
  sessionPending = { ...sessionPending, ...update }
  if (!sessionFlushTimer) {
    sessionFlushTimer = setTimeout(flushSessionState, SESSION_BATCH_MS)
  }
  return Promise.resolve()
}

function addDedupeKey(p: AddRecordPayload): string {
  return p.id ? `id:${p.id}` : `body:${p.message}:${p.date ?? ''}`
}

const addQueue = new Map<string, AddRecordPayload>()
let addFlushTimer: ReturnType<typeof setTimeout> | null = null

function flushAddQueue() {
  addFlushTimer = null
  const batch = Array.from(addQueue.values())
  addQueue.clear()
  batch.forEach((payload) => {
    request<TableRow>('/api/records', {
      method: 'POST',
      body: JSON.stringify({
        ...(payload.id ? { id: payload.id } : {}),
        message: payload.message,
        ...(payload.date ? { date: payload.date } : {}),
      }),
    }).catch(() => {})
  })
}

export function postAddRecord(payload: AddRecordPayload): Promise<void> {
  const key = addDedupeKey(payload)
  if (addQueue.has(key)) return Promise.resolve()
  addQueue.set(key, payload)
  if (!addFlushTimer) {
    addFlushTimer = setTimeout(flushAddQueue, ADD_BATCH_MS)
  }
  return Promise.resolve()
}

export function flushAddQueueNow(): Promise<void> {
  if (addFlushTimer) {
    clearTimeout(addFlushTimer)
    addFlushTimer = null
  }
  const batch = Array.from(addQueue.values())
  addQueue.clear()
  return Promise.all(
    batch.map((p) =>
      request<TableRow>('/api/records', {
        method: 'POST',
        body: JSON.stringify({
          ...(p.id ? { id: p.id } : {}),
          message: p.message,
          ...(p.date ? { date: p.date } : {}),
        }),
      })
    )
  ).then(() => undefined)
}
