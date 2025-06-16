const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const PersonalizationEngine = require('../services/personalizationEngine');
const PredictiveAnalytics = require('../services/predictiveAnalytics');
const AdvancedNLP = require('../services/advancedNLP');
const geminiService = require('../services/geminiService');
const Neighborhood = require('../models/Neighborhood');
const { logger } = require('../utils/logger');

const router = express.Router();

// Initialize services
const personalizationEngine = new PersonalizationEngine();
const predictiveAnalytics = new PredictiveAnalytics();
const advancedNLP = new AdvancedNLP();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * POST /api/revolutionary/smart-search
 * Revolutionary natural language search with AI understanding
 */
router.post('/smart-search', [
  body('query').isString().trim().isLength({ min: 3, max: 500 }),
  body('userId').optional().isString().trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { query, userId } = req.body;

    logger.info(`🧠 Smart search query: "${query}" from user: ${userId}`);

    // Parse complex natural language query
    const parsedQuery = await advancedNLP.parseComplexQuery(query);
    
    // Get all neighborhoods for filtering
    const allNeighborhoods = await Neighborhood.find({});
    
    // Apply intelligent filtering based on parsed criteria
    const filteredNeighborhoods = await applyIntelligentFiltering(
      allNeighborhoods, 
      parsedQuery.searchCriteria
    );

    // Get personalized recommendations if user provided
    let recommendations;
    if (userId && filteredNeighborhoods.length > 0) {
      recommendations = await personalizationEngine.getPersonalizedRecommendations(
        userId, 
        filteredNeighborhoods, 
        10
      );
      
      // Learn from this search
      await personalizationEngine.learnFromInteraction(userId, {
        type: 'search',
        data: parsedQuery.searchCriteria,
        context: { query, timestamp: new Date() }
      });
    } else {
      recommendations = {
        recommendations: filteredNeighborhoods.slice(0, 10).map(n => ({
          ...n.toObject(),
          personalizedScore: 50,
          matchReasons: ['General match']
        }))
      };
    }

    // Generate AI explanation
    const aiExplanation = await geminiService.generateEnhancedChatResponse(
      `Explain why these neighborhoods match the query: "${query}". Focus on the specific criteria and provide actionable insights.`,
      [],
      recommendations.recommendations[0]
    );

    res.json({
      query: parsedQuery.originalQuery,
      understanding: {
        intent: parsedQuery.intent,
        entities: parsedQuery.entities,
        explanation: parsedQuery.naturalLanguageExplanation
      },
      results: recommendations.recommendations,
      totalFound: filteredNeighborhoods.length,
      aiExplanation,
      personalized: !!userId,
      userProfile: recommendations.profile,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error in smart search:', error);
    res.status(500).json({
      error: 'Smart search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/revolutionary/predict-prices/:neighborhoodId
 * Predict future housing prices with AI analysis
 */
router.get('/predict-prices/:neighborhoodId', [
  param('neighborhoodId').isMongoId(),
  query('timeHorizon').optional().isInt({ min: 1, max: 60 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { neighborhoodId } = req.params;
    const { timeHorizon = 36 } = req.query;

    logger.info(`🔮 Predicting prices for neighborhood: ${neighborhoodId}`);

    // Get price predictions
    const predictions = await predictiveAnalytics.predictPriceTrends(
      neighborhoodId, 
      timeHorizon
    );

    // Get gentrification risk
    const gentrificationRisk = await predictiveAnalytics.predictGentrificationRisk(
      neighborhoodId
    );

    // Generate AI analysis of predictions
    const aiAnalysis = await geminiService.generateEnhancedChatResponse(
      `Analyze these housing price predictions and gentrification risk for ${predictions.neighborhood}. Provide investment insights and recommendations for different types of buyers/renters.`,
      [],
      null
    );

    res.json({
      neighborhood: predictions.neighborhood,
      pricePredictions: {
        current: predictions.currentPrice,
        predictions: predictions.predictions,
        factors: predictions.factors,
        confidence: predictions.confidence
      },
      gentrificationRisk,
      aiAnalysis,
      investmentInsights: generateInvestmentInsights(predictions, gentrificationRisk),
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error predicting prices:', error);
    res.status(500).json({
      error: 'Price prediction failed',
      message: error.message
    });
  }
});

/**
 * POST /api/revolutionary/personalized-recommendations
 * Get AI-powered personalized neighborhood recommendations
 */
router.post('/personalized-recommendations', [
  body('userId').isString().trim(),
  body('preferences').optional().isObject(),
  body('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { userId, preferences = {}, limit = 10 } = req.body;

    logger.info(`🎯 Getting personalized recommendations for user: ${userId}`);

    // Update user preferences if provided
    if (Object.keys(preferences).length > 0) {
      await personalizationEngine.learnFromInteraction(userId, {
        type: 'preferences_update',
        data: preferences,
        context: { timestamp: new Date() }
      });
    }

    // Get all neighborhoods
    const allNeighborhoods = await Neighborhood.find({});

    // Get personalized recommendations
    const recommendations = await personalizationEngine.getPersonalizedRecommendations(
      userId,
      allNeighborhoods,
      limit
    );

    // Find similar users for collaborative filtering
    const similarUsers = await personalizationEngine.findSimilarUsers(userId, 5);

    // Generate AI explanation of recommendations
    const aiExplanation = await geminiService.generateEnhancedChatResponse(
      `Explain these personalized neighborhood recommendations based on the user's preferences and behavior patterns. Highlight why each recommendation makes sense.`,
      [],
      recommendations.recommendations[0]
    );

    res.json({
      recommendations: recommendations.recommendations,
      userProfile: recommendations.profile,
      explanation: recommendations.explanation,
      aiExplanation,
      similarUsers: similarUsers.map(u => ({ userId: u.userId, similarity: u.similarity })),
      personalizationStrength: calculatePersonalizationStrength(recommendations.profile),
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error getting personalized recommendations:', error);
    res.status(500).json({
      error: 'Personalized recommendations failed',
      message: error.message
    });
  }
});

/**
 * POST /api/revolutionary/ai-conversation
 * Advanced conversational AI with context and learning
 */
router.post('/ai-conversation', [
  body('message').isString().trim().isLength({ min: 1, max: 1000 }),
  body('userId').optional().isString().trim(),
  body('context').optional().isArray(),
  body('neighborhoodContext').optional().isObject(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { message, userId, context = [], neighborhoodContext } = req.body;

    logger.info(`🤖 AI conversation: "${message}" from user: ${userId}`);

    // Parse the message for intent and entities
    const parsedMessage = await advancedNLP.parseComplexQuery(message);

    // Get user profile for personalization
    let userProfile = null;
    if (userId) {
      userProfile = await personalizationEngine.getUserProfile(userId);
    }

    // Generate enhanced response with full context
    const aiResponse = await geminiService.generateEnhancedChatResponse(
      message,
      context,
      neighborhoodContext
    );

    // Learn from this interaction
    if (userId) {
      await personalizationEngine.learnFromInteraction(userId, {
        type: 'chat',
        data: { message, response: aiResponse, parsedMessage },
        context: { timestamp: new Date(), neighborhoodContext }
      });
    }

    // Generate follow-up suggestions
    const followUpSuggestions = generateFollowUpSuggestions(parsedMessage, aiResponse);

    res.json({
      response: aiResponse,
      understanding: {
        intent: parsedMessage.intent,
        entities: parsedMessage.entities,
        confidence: parsedMessage.confidence
      },
      followUpSuggestions,
      userProfile: userProfile ? personalizationEngine.sanitizeProfile(userProfile) : null,
      conversationId: generateConversationId(userId),
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error in AI conversation:', error);
    res.status(500).json({
      error: 'AI conversation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/revolutionary/market-intelligence
 * Advanced market intelligence with predictive insights
 */
router.get('/market-intelligence', [
  query('timeframe').optional().isIn(['1month', '3months', '6months', '1year']),
  query('focus').optional().isIn(['prices', 'demand', 'development', 'all']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { timeframe = '6months', focus = 'all' } = req.query;

    logger.info(`📊 Generating market intelligence report: ${timeframe}, focus: ${focus}`);

    // Get all neighborhoods for analysis
    const neighborhoods = await Neighborhood.find({}).limit(50);

    // Generate predictions for top neighborhoods
    const marketPredictions = await Promise.all(
      neighborhoods.slice(0, 10).map(async (neighborhood) => {
        try {
          const predictions = await predictiveAnalytics.predictPriceTrends(
            neighborhood._id,
            timeframe === '1month' ? 1 : timeframe === '3months' ? 3 : 
            timeframe === '6months' ? 6 : 12
          );
          return {
            neighborhood: neighborhood.name,
            currentPrice: predictions.currentPrice,
            predictedGrowth: predictions.predictions[predictions.predictions.length - 1],
            confidence: predictions.confidence,
            factors: predictions.factors
          };
        } catch (error) {
          return null;
        }
      })
    );

    const validPredictions = marketPredictions.filter(p => p !== null);

    // Generate AI market analysis
    const marketAnalysis = await geminiService.generateChatResponse(
      `Analyze the Cape Town real estate market based on these predictions and provide strategic insights for investors, renters, and city planners. Focus on trends, opportunities, and risks.`,
      [],
      validPredictions
    );

    // Calculate market metrics
    const marketMetrics = calculateMarketMetrics(validPredictions);

    res.json({
      timeframe,
      focus,
      marketMetrics,
      predictions: validPredictions,
      aiAnalysis: marketAnalysis,
      insights: generateMarketInsights(validPredictions),
      recommendations: generateMarketRecommendations(validPredictions),
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error generating market intelligence:', error);
    res.status(500).json({
      error: 'Market intelligence generation failed',
      message: error.message
    });
  }
});

// Helper functions
async function applyIntelligentFiltering(neighborhoods, criteria) {
  return neighborhoods.filter(neighborhood => {
    // Budget filtering
    if (criteria.maxRent && neighborhood.housing?.avgRent > criteria.maxRent) {
      return false;
    }

    // Safety filtering
    if (criteria.minSafetyScore && neighborhood.safety?.safetyScore < criteria.minSafetyScore) {
      return false;
    }

    // Area filtering
    if (criteria.preferredAreas && !criteria.preferredAreas.some(area => 
      neighborhood.borough?.toLowerCase().includes(area.toLowerCase())
    )) {
      return false;
    }

    // Family-friendly filtering
    if (criteria.familyFriendly && neighborhood.amenities?.schools < 3) {
      return false;
    }

    return true;
  });
}

function generateInvestmentInsights(predictions, gentrificationRisk) {
  const insights = [];

  const finalPrediction = predictions.predictions[predictions.predictions.length - 1];
  const totalGrowth = ((finalPrediction.predictedPrice - predictions.currentPrice) / predictions.currentPrice) * 100;

  if (totalGrowth > 20) {
    insights.push({
      type: 'opportunity',
      message: `Strong investment potential with ${totalGrowth.toFixed(1)}% predicted growth`,
      confidence: predictions.confidence
    });
  }

  if (gentrificationRisk.riskLevel === 'High' || gentrificationRisk.riskLevel === 'Very High') {
    insights.push({
      type: 'warning',
      message: `High gentrification risk - consider social impact`,
      timeframe: gentrificationRisk.estimatedTimeframe
    });
  }

  return insights;
}

function calculatePersonalizationStrength(profile) {
  if (!profile) return 0;
  
  const interactionCount = profile.behaviorPatterns?.interactionHistory?.length || 0;
  const preferenceStrength = Object.values(profile.preferences || {}).reduce((sum, val) => {
    return sum + (typeof val === 'number' ? Math.abs(val) : val ? 1 : 0);
  }, 0);

  return Math.min(100, (interactionCount * 2) + (preferenceStrength * 5));
}

function generateFollowUpSuggestions(parsedMessage, aiResponse) {
  const suggestions = [];

  if (parsedMessage.intent.intent === 'search') {
    suggestions.push("Would you like to see price predictions for these areas?");
    suggestions.push("Should I compare the top 3 recommendations?");
  }

  if (parsedMessage.entities.budget) {
    suggestions.push("Want to see areas just above your budget that might be worth considering?");
  }

  if (parsedMessage.entities.familySize) {
    suggestions.push("Would you like school ratings and distances for these neighborhoods?");
  }

  return suggestions.slice(0, 3);
}

function generateConversationId(userId) {
  return `conv_${userId || 'anon'}_${Date.now()}`;
}

function calculateMarketMetrics(predictions) {
  const avgGrowth = predictions.reduce((sum, p) => {
    const growth = ((p.predictedGrowth.predictedPrice - p.currentPrice) / p.currentPrice) * 100;
    return sum + growth;
  }, 0) / predictions.length;

  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

  return {
    averageGrowthRate: avgGrowth.toFixed(2),
    averageConfidence: avgConfidence.toFixed(1),
    totalNeighborhoods: predictions.length,
    highGrowthAreas: predictions.filter(p => {
      const growth = ((p.predictedGrowth.predictedPrice - p.currentPrice) / p.currentPrice) * 100;
      return growth > 15;
    }).length
  };
}

function generateMarketInsights(predictions) {
  const insights = [];

  const highGrowthAreas = predictions.filter(p => {
    const growth = ((p.predictedGrowth.predictedPrice - p.currentPrice) / p.currentPrice) * 100;
    return growth > 20;
  });

  if (highGrowthAreas.length > 0) {
    insights.push({
      type: 'opportunity',
      title: 'High Growth Potential',
      description: `${highGrowthAreas.length} neighborhoods showing 20%+ growth potential`,
      areas: highGrowthAreas.map(a => a.neighborhood)
    });
  }

  return insights;
}

function generateMarketRecommendations(predictions) {
  return [
    {
      category: 'Investors',
      recommendation: 'Focus on emerging areas with strong infrastructure development',
      priority: 'high'
    },
    {
      category: 'First-time Buyers',
      recommendation: 'Consider stable areas with moderate growth potential',
      priority: 'medium'
    },
    {
      category: 'Renters',
      recommendation: 'Lock in longer leases in high-growth areas before price increases',
      priority: 'high'
    }
  ];
}

module.exports = router;
