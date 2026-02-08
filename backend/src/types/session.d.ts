import 'express-session'

export type SortItem = { id: string; desc: boolean }

export type UserState = {
  selectedIds: string[]
  sorting: SortItem[]
}

declare module 'express-session' {
  interface SessionData {
    userState?: UserState
  }
}
