const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  positiveTraits: [{
    type: String
  }],
  negativeTraits: [{
    type: String
  }],
  confidence: {
    type: Number,
    default: 0.95
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to ensure one analysis per image
analysisSchema.index({ image: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Analysis', analysisSchema); 