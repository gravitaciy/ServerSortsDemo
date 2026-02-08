export type TableRow = {
  id: string
  message: string
  date: string
}

export type SortItem = { id: string; desc: boolean }

export type SessionState = {
  selectedIds: string[]
  sorting: SortItem[]
  selectedRows?: TableRow[]
}

export type RecordsResponse = {
  data: TableRow[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type AddRecordPayload = {
  id?: string
  message: string
  date?: string
}
