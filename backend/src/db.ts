import path from 'path'
import sqlite3Module from 'sqlite3'
import type { MessageRow } from './types/api'

interface Sqlite3Verbose {
  Database: new (path: string) => Sqlite3Database
}
interface Sqlite3Database {
  run(sql: string, params?: unknown[], callback?: (this: RunResult, err: Error | null) => void): void
  get(sql: string, params?: unknown[], callback?: (err: Error | null, row: unknown) => void): void
  all(sql: string, params?: unknown[], callback?: (err: Error | null, rows: unknown[]) => void): void
}
interface RunResult {
  lastID: number
  changes: number
}

const sqlite3 =
  typeof (sqlite3Module as { verbose?: () => Sqlite3Verbose }).verbose === 'function'
    ? (sqlite3Module as { verbose: () => Sqlite3Verbose }).verbose()
    : (sqlite3Module as unknown as Sqlite3Verbose)
const dbPath = path.join(__dirname, '..', 'data', 'app.db')
const db = new sqlite3.Database(dbPath)

function run(sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: RunResult, err: Error | null) {
      if (err) return reject(err)
      resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}

function get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: Error | null, row: unknown) => {
      if (err) return reject(err)
      resolve(row as T | undefined)
    })
  })
}

function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: Error | null, rows: unknown[]) => {
      if (err) return reject(err)
      resolve((rows ?? []) as T[])
    })
  })
}

export async function initDb(): Promise<void> {
  
  await run(
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      date TEXT NOT NULL
    )`
  )

  
  const countRow = await get<{ count: number }>('SELECT COUNT(*) AS count FROM messages')
  if ((countRow?.count ?? 0) > 0) return

  const seed: Pick<MessageRow, 'message' | 'date'>[] = [
    { message: 'First message', date: '2024-01-15T10:00:00' },
    { message: 'Second message', date: '2024-02-20T14:30:00' },
    { message: 'Third message', date: '2024-03-10T09:15:00' },
    { message: 'Fourth message', date: '2024-04-05T16:45:00' },
    { message: 'Fifth message', date: '2024-05-12T11:20:00' },
    { message: 'Sixth message', date: '2024-06-01T08:00:00' },
    { message: 'Seventh message', date: '2024-07-18T13:00:00' },
    { message: 'Eighth message', date: '2024-08-22T17:30:00' },
  ]

  await run('BEGIN TRANSACTION')
  try {
    for (const row of seed) {
      
      await run('INSERT INTO messages (message, date) VALUES (?, ?)', [row.message, row.date])
    }
    await run('COMMIT')
  } catch (err) {
    await run('ROLLBACK')
    throw err
  }
}

export { db, run, get, all }
