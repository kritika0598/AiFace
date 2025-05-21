const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Image = require('../models/Image');
const Analysis = require('../models/Analysis');
const AnalysisUsage = require('../models/AnalysisUsage');
const OpenAI = require('openai');
const fs = require('fs');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Default daily limit
const DAILY_ANALYSIS_LIMIT = 5;

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get analysis for an image
router.get('/:imageId', auth, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      image: req.params.imageId,
      user: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({ message: 'No analysis found for this image' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ message: 'Error fetching analysis' });
  }
});

// Get user's analysis usage
router.get('/usage/status', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let usage = await AnalysisUsage.findOne({
      user: req.user._id,
      date: today
    });

    if (!usage) {
      usage = { count: 0 };
    }

    res.json({
      count: usage.count,
      limit: DAILY_ANALYSIS_LIMIT,
      remaining: DAILY_ANALYSIS_LIMIT - usage.count
    });
  } catch (error) {
    console.error('Error fetching usage status:', error);
    res.status(500).json({ message: 'Error fetching usage status' });
  }
});

// Analyze face
router.post('/analyze/:imageId', auth, async (req, res) => {
  try {
    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let usage = await AnalysisUsage.findOne({
      user: req.user._id,
      date: today
    });

    if (!usage) {
      usage = new AnalysisUsage({
        user: req.user._id,
        date: today,
        count: 0
      });
    }

    if (usage.count >= DAILY_ANALYSIS_LIMIT) {
      return res.status(429).json({ 
        message: `Daily analysis limit reached (${DAILY_ANALYSIS_LIMIT} analyses per day)`,
        limit: DAILY_ANALYSIS_LIMIT,
        count: usage.count
      });
    }

    const image = await Image.findOne({ _id: req.params.imageId, user: req.user._id });
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(image.path);
    const base64Image = imageBuffer.toString('base64');

    // Call OpenAI API for analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Do a step by step face analysis based on scientific practices and psychological profiling. Analyse every part of the face one by one.

Add positive and negative points both with respect to personality and character. 
Add *Observations*, *Scientific/Psychological Insights*, *Positive Traits* and *Potential Drawbacks* in the analysis.

If you don't see any face or unclear face in the picture, reply to provide clear face in the image in order to do analysis.
Do not add any disclaimer or PS, start with point one.
Do not ask any questions at the end.

Output should be in this JSON format:
{
  "analysis": "detailed analysis text (without listing positive/negative traits)",
  "positive_traits": ["trait1", "trait2", ...],
  "negative_traits": ["trait1", "trait2", ...]
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${image.mimetype};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    // Parse the response to extract JSON
    const responseText = response.choices[0].message.content;
    let analysisData;
    try {
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      analysisData = {
        analysis: responseText,
        positive_traits: [],
        negative_traits: []
      };
    }

    const analysisResult = {
      message: analysisData.analysis,
      positiveTraits: analysisData.positive_traits || [],
      negativeTraits: analysisData.negative_traits || [],
      confidence: 0.95,
      timestamp: new Date()
    };

    // Store analysis in database
    await Analysis.findOneAndUpdate(
      { image: image._id, user: req.user._id },
      {
        message: analysisResult.message,
        positiveTraits: analysisResult.positiveTraits,
        negativeTraits: analysisResult.negativeTraits,
        confidence: analysisResult.confidence,
        createdAt: analysisResult.timestamp
      },
      { upsert: true, new: true }
    );

    // Increment usage count
    usage.count += 1;
    await usage.save();

    res.json({
      ...analysisResult,
      usage: {
        count: usage.count,
        limit: DAILY_ANALYSIS_LIMIT,
        remaining: DAILY_ANALYSIS_LIMIT - usage.count
      }
    });
  } catch (error) {
    console.error('Error analyzing face:', error);
    res.status(500).json({ 
      message: 'Error analyzing face',
      error: error.message 
    });
  }
});

module.exports = router; 