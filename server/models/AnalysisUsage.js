const mongoose = require('mongoose');

const analysisUsageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
});

// Compound index to ensure one document per user per day
analysisUsageSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AnalysisUsage', analysisUsageSchema); 