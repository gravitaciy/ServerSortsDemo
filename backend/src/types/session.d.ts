import 'express-session'
import type { TableRow } from './api'

export type SortItem = { id: string; desc: boolean }

export type UserState = {
  selectedIds: string[]
  sorting: SortItem[]
  selectedRows?: TableRow[]
}

declare module 'express-session' {
  interface SessionData {
    userState?: UserState
  }
}
