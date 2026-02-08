import { Router, Request, Response } from 'express'
import type { UserState, SortItem } from '../types/session'

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

  ;(req.session as { userState?: UserState }).userState = nextState
  res.json(nextState)
})

export default router
