const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, index: true, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String },
  type: { type: String, enum: ['text','image','file'], default: 'text' },
  content: { type: String },
  imageUri: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  readBy: [{ userId: String, readAt: Date }],
}, { timestamps: true })

MessageSchema.index({ conversationId: 1, createdAt: 1 })

module.exports = mongoose.model('Message', MessageSchema)



