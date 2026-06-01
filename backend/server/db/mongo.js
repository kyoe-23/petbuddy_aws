const mongoose = require('mongoose')

let isConnected = false

async function connectMongo(uri) {
  if (isConnected) return mongoose.connection
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet_buddy'
  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB || undefined,
  })
  isConnected = true
  return mongoose.connection
}

module.exports = { connectMongo }



