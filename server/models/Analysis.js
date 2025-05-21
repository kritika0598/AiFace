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
  // Personality Analysis
  personalityAnalysis: {
    facialFeatures: [{
      feature: String,
      interpretation: String,
      confidence: Number
    }],
    mianXiang: {
      elements: [String],
      interpretation: String
    },
    physiognomy: {
      traits: [String],
      interpretation: String
    }
  },
  // Age & Health Analysis
  ageHealthAnalysis: {
    estimatedAge: Number,
    biologicalAge: Number,
    healthIndicators: [{
      indicator: String,
      status: String,
      confidence: Number
    }],
    stressLevel: {
      value: Number,
      interpretation: String
    },
    fatigueLevel: {
      value: Number,
      interpretation: String
    },
    hydrationLevel: {
      value: Number,
      interpretation: String
    }
  },
  // Beauty & Symmetry Analysis
  beautyAnalysis: {
    symmetryScore: Number,
    goldenRatioScore: Number,
    aestheticBalance: {
      score: Number,
      interpretation: String
    },
    celebrityMatches: [{
      name: String,
      similarity: Number,
      features: [String]
    }]
  },
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