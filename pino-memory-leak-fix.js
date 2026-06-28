// Instagram post: Node.js Memory Leak Fix
// Exzosolution @exzosolution

import express from 'express'
import pino from 'pino'

const app = express()
const logger = pino()

// Yomon variant - production'da ishlatmang
app.post('/bad-webhook', (req, res) => {
  console.log(req.body) // LEAK SABABI
  res.send('ok')
})

// To'g'ri variant
app.post('/good-webhook', (req, res) => {
  logger.info({ msg: 'webhook', id: req.body.id })
  res.send('ok')
})

app.listen(3000)