const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: String,
  description: String,
  quantity: String,
  reminderAt: Date,
  remind: {
    type:String,
    default:"none",
    enum:["none",'daily','weekly']
  },
  priority:{
    type:String,
    default:"low",
    enum:["low",'medium','high']
  },
  type:{
    type:String,
    default:"personal",
    enum:["personal","family" , "grocery"]
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
});

module.exports = mongoose.model('Reminder', postSchema);