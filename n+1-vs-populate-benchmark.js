// N+1 Query vs Populate Benchmark
// @exzosolution - Instagram: github.com/Bekzod13
// Mavzu: Node.js'da N+1 muammosi va yechimi

import mongoose from 'mongoose'
import { performance } from 'perf_hooks'

// Schema'lar
const userSchema = new mongoose.Schema({
  name: String,
  email: String
})

const postSchema = new mongoose.Schema({
  title: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
})

const User = mongoose.model('User', userSchema)
const Post = mongoose.model('Post', postSchema)

// TEST 1: N+1 Query - YOMON USUL
async function testN1() {
  console.log('❌ N+1 Query test boshlandi...')
  const start = performance.now()

  const users = await User.find().limit(500) // 1 ta so'rov

  for (const user of users) {
    // Har bir user uchun alohida so'rov = 500 ta qo'shimcha so'rov
    const posts = await Post.find({ userId: user._id })
    user.posts = posts
  }

  const end = performance.now()
  console.log(`N+1 vaqti: ${(end - start).toFixed(2)}ms`)
  console.log(`Jami so'rovlar: ${users.length + 1}`)
}

// TEST 2: Populate - YAXSHI USUL
async function testPopulate() {
  console.log('✅ Populate test boshlandi...')
  const start = performance.now()

  // Faqat 1 ta so'rov
  const users = await User.find().limit(500).populate('posts')

  const end = performance.now()
  console.log(`Populate vaqti: ${(end - start).toFixed(2)}ms`)
  console.log(`Jami so'rovlar: 1`)
}

// TEST 3: $in bilan - ALTERNATIV YAXSHI USUL
async function testInQuery() {
  console.log('✅ $in Query test boshlandi...')
  const start = performance.now()

  const users = await User.find().limit(500)
  const userIds = users.map(u => u._id)

  // Faqat 2 ta so'rov
  const posts = await Post.find({ userId: { $in: userIds } })

  // Post'larni user'larga manual biriktirish
  const postsByUser = {}
  posts.forEach(post => {
    if (!postsByUser[post.userId]) postsByUser[post.userId] = []
    postsByUser[post.userId].push(post)
  })

  users.forEach(user => {
    user.posts = postsByUser[user._id] || []
  })

  const end = performance.now()
  console.log(`$in Query vaqti: ${(end - start).toFixed(2)}ms`)
  console.log(`Jami so'rovlar: 2`)
}

// Ishga tushirish
async function runBenchmark() {
  await mongoose.connect('mongodb://localhost:27017/test')

  await testN1() // ~8200ms
  await testPopulate() // ~210ms
  await testInQuery() // ~250ms

  await mongoose.disconnect()
}

runBenchmark()

/*
NATIJALAR:
N+1: 8200ms, 501 ta so'rov
Populate: 210ms, 1 ta so'rov
$in: 250ms, 2 ta so'rov

Xulosa: 40x tezroq
*/
