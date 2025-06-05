const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
  },
});

module.exports = mongoose.model('Like', likeSchema);