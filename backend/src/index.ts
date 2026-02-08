import path from 'path'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import dotenv from 'dotenv'
import { initDb } from './db'
import recordsRouter from './routes/records'
import sessionRouter from './routes/session'

dotenv.config()

const app = express()
const isProduction = process.env.NODE_ENV === 'production'
const PORT = parseInt(process.env.PORT ?? '', 10) || 3001
const FRONTEND_ORIGINS = (
  process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',').map((s) => s.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173']
).filter(Boolean)
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'

app.use(
  cors({
    origin: (origin, cb) => {
      if (origin === undefined || FRONTEND_ORIGINS.includes(origin)) {
        cb(null, origin ?? FRONTEND_ORIGINS[0])
      } else {
        cb(null, false)
      }
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    },
  })
)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', recordsRouter)
app.use('/api', sessionRouter)

if (isProduction) {
  const staticDir =
    process.env.STATIC_DIR ?? path.join(__dirname, '..', '..', 'frontend', 'dist')
  app.use(express.static(staticDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(staticDir, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal Server Error' })
})

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err)
    process.exit(1)
  })
