import { Router, Request, Response } from 'express'
import type { UserState, SortItem } from '../types/session'
import type { TableRow } from '../types/api'

const router = Router()

const defaultState: UserState = {
  selectedIds: [],
  sorting: [],
}

function normalizeSelectedIds(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null
  return input.map((id) => String(id))
}

function normalizeSorting(input: unknown): SortItem[] | null {
  if (!Array.isArray(input)) return null
  return input
    .map((item) => ({
      id: item && typeof (item as SortItem).id !== 'undefined' ? String((item as SortItem).id) : '',
      desc: Boolean(item && (item as SortItem).desc),
    }))
    .filter((item) => item.id.length > 0)
}

function normalizeSelectedRows(input: unknown): TableRow[] | null {
  if (!Array.isArray(input)) return null
  return input
    .filter((r) => r && typeof r === 'object' && typeof (r as TableRow).id === 'string' && typeof (r as TableRow).message === 'string' && typeof (r as TableRow).date === 'string')
    .map((r) => ({
      id: String((r as TableRow).id),
      message: String((r as TableRow).message),
      date: String((r as TableRow).date),
    }))
}

router.get('/session/state', (req: Request, res: Response) => {
  const state = (req.session as { userState?: UserState }).userState ?? defaultState
  res.json(state)
})

router.post('/session/state', (req: Request, res: Response) => {
  const currentState = (req.session as { userState?: UserState }).userState ?? defaultState
  const nextState: UserState = { ...currentState }

  const selectedIds = normalizeSelectedIds(req.body?.selectedIds)
  if (selectedIds) nextState.selectedIds = selectedIds

  const sorting = normalizeSorting(req.body?.sorting)
  if (sorting) nextState.sorting = sorting

  const selectedRows = normalizeSelectedRows(req.body?.selectedRows)
  if (selectedRows) nextState.selectedRows = selectedRows

  ;(req.session as { userState?: UserState }).userState = nextState
  res.json(nextState)
})

export default router
