import { Router, Request, Response, NextFunction } from 'express'
import { all, get, run } from '../db'
import type { MessageRow, TableRow, AddRecordBody } from '../types/api'

const router = Router()
const PAGE_SIZE = 20
const MAX_LIMIT = 100

function toTableRow(row: MessageRow): TableRow {
  return {
    id: String(row.id),
    message: row.message,
    date: row.date,
  }
}

router.get('/records', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1)
    const limitRaw = parseInt(String(req.query.limit), 10) || PAGE_SIZE
    const limit = Math.min(MAX_LIMIT, Math.max(1, limitRaw))
    const offset = (page - 1) * limit
    const idFilter = req.query.idFilter != null ? String(req.query.idFilter).trim() : null

    const whereClause = idFilter ? ' WHERE id = ?' : ''
    const countParams = idFilter ? [idFilter] : []
    const totalRow = await get<{ count: number }>(
      `SELECT COUNT(*) AS count FROM messages${whereClause}`,
      countParams
    )
    const total = totalRow?.count ?? 0

    const rows = await all<MessageRow>(
      `SELECT id, message, date FROM messages${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...countParams, limit, offset]
    )
    const data = rows.map(toTableRow)
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit)

    res.json({ data, page, limit, total, totalPages })
  } catch (err) {
    next(err)
  }
})

router.post('/records', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as AddRecordBody
    const message = body.message.trim()
    if (!message) {
      res.status(400).json({ error: 'message is required' })
      return
    }
    const date =
      typeof body.date === 'string' && body.date.trim()
        ? body.date.trim().length === 16
          ? `${body.date.trim()}:00`
          : body.date.trim()
        : new Date().toISOString().slice(0, 19)

    const rawId = body.id
    if (rawId !== undefined && rawId !== null && rawId !== '') {
      const id = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10)
      if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'id must be a positive integer' })
        return
      }
      const existing = await get<MessageRow>('SELECT id FROM messages WHERE id = ?', [id])
      if (existing) {
        res.status(409).json({ error: 'Record with this id already exists' })
        return
      }
      await run('INSERT INTO messages (id, message, date) VALUES (?, ?, ?)', [id, message, date])
      res.status(201).json(toTableRow({ id, message, date }))
      return
    }

    const result = await run('INSERT INTO messages (message, date) VALUES (?, ?)', [message, date])
    const row = await get<MessageRow>('SELECT id, message, date FROM messages WHERE id = ?', [
      result.lastID,
    ])
    if (!row) {
      res.status(500).json({ error: 'Failed to read created record' })
      return
    }
    res.status(201).json(toTableRow(row))
  } catch (err) {
    next(err)
  }
})

export default router
