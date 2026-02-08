export type TableRow = {
  id: string
  message: string
  date: string
}

export type MessageRow = {
  id: number
  message: string
  date: string
}

export type AddRecordBody = {
  id?: number | string
  message: string
  date?: string
}
