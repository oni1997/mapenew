const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Neighborhood = require('../models/Neighborhood');
const vectorSearchService = require('../services/vectorSearchService');
const geminiService = require('../services/geminiService');
const { logger } = require('../utils/logger');

const router = express.Router();

// Middleware to clean null values from request body
const cleanNullValues = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === null) {
        delete req.body[key];
      }
    });
  }
  next();
};

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
 * GET /api/neighborhoods
 * Get all neighborhoods with optional filtering
 */
router.get('/', [
  query('borough').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('sortBy').optional().isIn(['name', 'avgRent', 'safetyScore', 'transitScore']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      borough,
      limit = 20,
      offset = 0,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    if (borough) {
      query.borough = new RegExp(borough, 'i');
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'avgRent') {
      sort['housing.avgRent'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'safetyScore') {
      sort['safety.safetyScore'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'transitScore') {
      sort['amenities.transitScore'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const neighborhoods = await Neighborhood.find(query)
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .select('-vectorEmbedding'); // Exclude large embedding array

    const total = await Neighborhood.countDocuments(query);

    res.json({
      neighborhoods,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    logger.error('Error fetching neighborhoods:', error);
    res.status(500).json({
      error: 'Failed to fetch neighborhoods',
      message: error.message
    });
  }
});

/**
 * GET /api/neighborhoods/market-insights
 * Get comprehensive AI-generated market insights using all databases
 */
router.get('/market-insights', async (req, res) => {
  try {
    const ComprehensiveDataService = require('../services/comprehensiveDataService');
    const dataService = new ComprehensiveDataService();

    // Get comprehensive market insights from all databases
    const comprehensiveData = await dataService.getEnhancedMarketInsights();

    // Get neighborhoods for AI analysis
    const neighborhoods = await Neighborhood.find({})
      .select('-vectorEmbedding')
      .lean();

    // Generate enhanced AI market insights with all data
    const aiInsights = await geminiService.generateEnhancedMarketInsights(
      neighborhoods,
      comprehensiveData
    );

    // Combine all insights
    const response = {
      ...comprehensiveData,
      aiAnalysis: aiInsights,
      summary: {
        totalDataSources: 5,
        dataSourcesUsed: ['neighborhoods', 'schools', 'hospitals', 'rentals', 'taxi_routes'],
        totalDataPoints: comprehensiveData.overview.totalDataPoints,
        lastUpdated: new Date(),
        analysisType: 'comprehensive'
      }
    };

    await dataService.disconnect();
    res.json(response);

  } catch (error) {
    logger.error('Error generating comprehensive market insights:', error);
    res.status(500).json({
      error: 'Failed to generate comprehensive market insights',
      message: error.message
    });
  }
});

/**
 * GET /api/neighborhoods/:id
 * Get specific neighborhood by ID
 */
router.get('/:id', [
  param('id').isMongoId(),
  handleValidationErrors
], async (req, res) => {
  try {
    const neighborhood = await Neighborhood.findById(req.params.id)
      .select('-vectorEmbedding');

    if (!neighborhood) {
      return res.status(404).json({
        error: 'Neighborhood not found'
      });
    }

    // Generate AI insights and summary for the neighborhood
    const insights = await geminiService.generateNeighborhoodInsights(neighborhood);
    const summary = await geminiService.generateNeighborhoodSummary(neighborhood);

    res.json({
      neighborhood,
      insights,
      summary
    });
  } catch (error) {
    logger.error('Error fetching neighborhood:', error);
    res.status(500).json({
      error: 'Failed to fetch neighborhood',
      message: error.message
    });
  }
});

/**
 * POST /api/neighborhoods/similar
 * Find similar neighborhoods using vector search
 */
router.post('/similar', [
  body('neighborhoodId').isMongoId(),
  body('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { neighborhoodId, limit = 10 } = req.body;

    const sourceNeighborhood = await Neighborhood.findById(neighborhoodId)
      .select('-vectorEmbedding');

    if (!sourceNeighborhood) {
      return res.status(404).json({
        error: 'Source neighborhood not found'
      });
    }

    const similarNeighborhoods = await vectorSearchService.findSimilarNeighborhoods(
      neighborhoodId,
      limit
    );

    // Generate AI explanation for the similarity
    const explanation = await geminiService.explainSimilarity(
      sourceNeighborhood,
      similarNeighborhoods
    );

    res.json({
      sourceNeighborhood,
      similarNeighborhoods,
      explanation
    });
  } catch (error) {
    logger.error('Error finding similar neighborhoods:', error);
    res.status(500).json({
      error: 'Failed to find similar neighborhoods',
      message: error.message
    });
  }
});

/**
 * POST /api/neighborhoods/search
 * Search neighborhoods by characteristics
 */
router.post('/search', [
  cleanNullValues,
  body('maxRent').optional().isInt({ min: 0 }),
  body('minSafetyScore').optional().isFloat({ min: 0, max: 10 }),
  body('borough').optional().isString().trim(),
  body('familyFriendly').optional().isBoolean(),
  body('youngProfessionals').optional().isBoolean(),
  body('transitAccess').optional().isBoolean(),
  body('quiet').optional().isBoolean(),
  body('cultural').optional().isBoolean(),
  body('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const criteria = req.body;
    const recommendations = await vectorSearchService.getRecommendations(criteria);

    // Generate AI explanation for the search results
    let explanation = null;
    if (recommendations.neighborhoods && recommendations.neighborhoods.length > 0) {
      explanation = await geminiService.generateSearchExplanation(criteria, recommendations.neighborhoods);
    }

    res.json({
      ...recommendations,
      explanation
    });
  } catch (error) {
    logger.error('Error searching neighborhoods:', error);
    res.status(500).json({
      error: 'Failed to search neighborhoods',
      message: error.message
    });
  }
});

/**
 * POST /api/neighborhoods/compare
 * Compare multiple neighborhoods
 */
router.post('/compare', [
  body('neighborhoodIds').isArray({ min: 2, max: 5 }),
  body('neighborhoodIds.*').isMongoId(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { neighborhoodIds } = req.body;
    const comparison = await vectorSearchService.compareNeighborhoods(neighborhoodIds);

    res.json(comparison);
  } catch (error) {
    logger.error('Error comparing neighborhoods:', error);
    res.status(500).json({
      error: 'Failed to compare neighborhoods',
      message: error.message
    });
  }
});

/**
 * GET /api/neighborhoods/borough/:borough
 * Get neighborhoods by borough
 */
router.get('/borough/:borough', [
  param('borough').isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { borough } = req.params;
    const { limit = 20 } = req.query;

    const neighborhoods = await Neighborhood.find({
      borough: new RegExp(borough, 'i')
    })
      .limit(limit)
      .select('-vectorEmbedding')
      .sort({ name: 1 });

    res.json({
      borough,
      neighborhoods,
      count: neighborhoods.length
    });
  } catch (error) {
    logger.error('Error fetching neighborhoods by borough:', error);
    res.status(500).json({
      error: 'Failed to fetch neighborhoods by borough',
      message: error.message
    });
  }
});

module.exports = router;
