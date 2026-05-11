require('dotenv').config()
const env = require('./src/config/env')
const express = require('express')
const connectDB = require('./src/config/db')

const app = express()

// middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// connect database
connectDB()

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend', port: env.BACKEND_PORT })
})

// routes
app.use('/api/v1/auth', require('./src/routes/auth.routes'))

// global error handler (always last)
app.use(require('./src/middleware/errorHandler'))

app.listen(env.BACKEND_PORT, () => {
  console.log(`Backend running on port ${env.BACKEND_PORT}`)
})