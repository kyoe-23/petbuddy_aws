const mongoose = require('mongoose')

const ConversationSchema = new mongoose.Schema({
  participants: { type: [String], index: true },
  lastMessageText: { type: String },
  lastMessageAt: { type: Date, index: true },
  lastMessageSenderName: { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Conversation', ConversationSchema)



