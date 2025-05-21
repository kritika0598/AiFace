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
              text: `Analyze this high-resolution image of a human face. Identify the person's face shape, symmetry, eyebrow position, eye spacing, nose shape, and jawline. Based on this information, provide insights aligned with traditional Chinese face reading and modern personality theories. Provide a detailed analysis in JSON format. Include personality traits, age, health indicators, and beauty features.

For beauty and symmetry scores, ensure all values are between 0 and 1 (will be converted to percentages 0-100%). This includes:
- symmetry_score (0-1)
- golden_ratio_score (0-1)
- aesthetic_balance.score (0-1)`
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
      response_format: { type: "json_object" },
      functions: [
        {
          name: "analyze_face",
          description: "Analyze facial features and provide detailed insights",
          parameters: {
            type: "object",
            properties: {
              analysis: {
                type: "string",
                description: "A detailed analysis of the face"
              },
              positive_traits: {
                type: "array",
                items: { type: "string" },
                description: "List of positive personality traits"
              },
              negative_traits: {
                type: "array",
                items: { type: "string" },
                description: "List of negative personality traits"
              },
              personality_analysis: {
                type: "object",
                properties: {
                  facial_features: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        feature: { type: "string" },
                        interpretation: { type: "string" }
                      }
                    }
                  },
                  mian_xiang: {
                    type: "object",
                    properties: {
                      elements: { 
                        type: "array",
                        items: { type: "string" }
                      },
                      interpretation: { type: "string" }
                    }
                  },
                  physiognomy: {
                    type: "object",
                    properties: {
                      traits: {
                        type: "array",
                        items: { type: "string" }
                      },
                      interpretation: { type: "string" }
                    }
                  }
                }
              },
              age_health_analysis: {
                type: "object",
                properties: {
                  estimated_age: { 
                    type: "number",
                    description: "Estimated chronological age"
                  },
                  biological_age: { 
                    type: "number",
                    description: "Estimated biological age based on facial features"
                  },
                  health_indicators: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        indicator: { type: "string" },
                        status: { type: "string" }
                      }
                    }
                  },
                  stress_level: {
                    type: "object",
                    properties: {
                      value: { 
                        type: "number",
                        description: "Stress level between 0 and 1"
                      },
                      interpretation: { type: "string" }
                    }
                  },
                  fatigue_level: {
                    type: "object",
                    properties: {
                      value: { 
                        type: "number",
                        description: "Fatigue level between 0 and 1"
                      },
                      interpretation: { type: "string" }
                    }
                  },
                  hydration_level: {
                    type: "object",
                    properties: {
                      value: { 
                        type: "number",
                        description: "Hydration level between 0 and 1"
                      },
                      interpretation: { type: "string" }
                    }
                  }
                }
              },
              beauty_analysis: {
                type: "object",
                properties: {
                  symmetry_score: { 
                    type: "number",
                    description: "Score between 0 and 1 representing facial symmetry"
                  },
                  golden_ratio_score: { 
                    type: "number",
                    description: "Score between 0 and 1 representing match with golden ratio"
                  },
                  aesthetic_balance: {
                    type: "object",
                    properties: {
                      score: { 
                        type: "number",
                        description: "Score between 0 and 1 representing aesthetic balance"
                      },
                      interpretation: { type: "string" }
                    }
                  },
                  celebrity_matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        similarity: { 
                          type: "number",
                          description: "Similarity score between 0 and 1"
                        },
                        features: {
                          type: "array",
                          items: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: [
              "analysis",
              "positive_traits",
              "negative_traits",
              "personality_analysis",
              "age_health_analysis",
              "beauty_analysis"
            ]
          }
        }
      ],
      function_call: { name: "analyze_face" }
    });

    // Parse the response to extract JSON
    const responseText = response.choices[0].message.function_call.arguments;
    let analysisData;
    try {
      analysisData = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      analysisData = {
        analysis: responseText,
        positive_traits: [],
        negative_traits: [],
        personality_analysis: {
          facial_features: [],
          mian_xiang: { elements: [], interpretation: "" },
          physiognomy: { traits: [], interpretation: "" }
        },
        age_health_analysis: {
          estimated_age: 0,
          biological_age: 0,
          health_indicators: [],
          stress_level: { value: 0, interpretation: "" },
          fatigue_level: { value: 0, interpretation: "" },
          hydration_level: { value: 0, interpretation: "" }
        },
        beauty_analysis: {
          symmetry_score: 0,
          golden_ratio_score: 0,
          aesthetic_balance: { score: 0, interpretation: "" },
          celebrity_matches: []
        }
      };
    }

    // Make a separate API call for celebrity matching
    const celebrityResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Based on this person's facial features, find 3-5 celebrities who share similar facial characteristics. Consider:
1. Overall facial structure and shape
2. Eye shape and spacing
3. Nose shape and size
4. Jawline and chin structure
5. Facial proportions

Return the results in this JSON format:
{
  "celebrity_matches": [
    {
      "name": "Celebrity name",
      "similarity": 0.85, // Similarity score between 0 and 1
      "features": ["List of specific facial features that match"]
    }
  ]
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
      response_format: { type: "json_object" }
    });

    let celebrityData;
    try {
      celebrityData = JSON.parse(celebrityResponse.choices[0].message.content);
    } catch (error) {
      console.error('Error parsing celebrity response:', error);
      celebrityData = {
        celebrity_matches: []
      };
    }

    // Clean up the traits arrays to remove duplicates and long sentences
    const cleanTraits = (traits) => {
      return [...new Set(traits)]
        .filter(trait => trait.length < 50) // Remove long sentences
        .map(trait => trait.trim())
        .filter(trait => trait.length > 0);
    };

    const analysisResult = {
      message: analysisData.analysis,
      positiveTraits: cleanTraits(analysisData.positive_traits || []),
      negativeTraits: cleanTraits(analysisData.negative_traits || []),
      personalityAnalysis: {
        facialFeatures: (analysisData.personality_analysis?.facial_features || []).map(feature => ({
          feature: feature.feature,
          interpretation: feature.interpretation
        })),
        mianXiang: {
          elements: analysisData.personality_analysis?.mian_xiang?.elements || [],
          interpretation: analysisData.personality_analysis?.mian_xiang?.interpretation || ""
        },
        physiognomy: {
          traits: analysisData.personality_analysis?.physiognomy?.traits || [],
          interpretation: analysisData.personality_analysis?.physiognomy?.interpretation || ""
        }
      },
      ageHealthAnalysis: {
        estimatedAge: analysisData.age_health_analysis?.estimated_age || 0,
        biologicalAge: analysisData.age_health_analysis?.biological_age || 0,
        healthIndicators: (analysisData.age_health_analysis?.health_indicators || []).map(indicator => ({
          indicator: indicator.indicator,
          status: indicator.status
        })),
        stressLevel: {
          value: analysisData.age_health_analysis?.stress_level?.value || 0,
          interpretation: analysisData.age_health_analysis?.stress_level?.interpretation || ""
        },
        fatigueLevel: {
          value: analysisData.age_health_analysis?.fatigue_level?.value || 0,
          interpretation: analysisData.age_health_analysis?.fatigue_level?.interpretation || ""
        },
        hydrationLevel: {
          value: analysisData.age_health_analysis?.hydration_level?.value || 0,
          interpretation: analysisData.age_health_analysis?.hydration_level?.interpretation || ""
        }
      },
      beautyAnalysis: {
        symmetryScore: analysisData.beauty_analysis?.symmetry_score || 0,
        goldenRatioScore: analysisData.beauty_analysis?.golden_ratio_score || 0,
        aestheticBalance: {
          score: analysisData.beauty_analysis?.aesthetic_balance?.score || 0,
          interpretation: analysisData.beauty_analysis?.aesthetic_balance?.interpretation || ""
        },
        celebrityMatches: (celebrityData.celebrity_matches || []).map(match => ({
          name: match.name,
          similarity: match.similarity,
          features: match.features || []
        }))
      },
      timestamp: new Date()
    };

    // Store analysis in database
    await Analysis.findOneAndUpdate(
      { image: image._id, user: req.user._id },
      analysisResult,
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