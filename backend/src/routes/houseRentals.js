const express = require('express');
const { query, param, body } = require('express-validator');
const HouseRental = require('../models/HouseRental');
const RentalIntegrationService = require('../services/rentalIntegrationService');
const GeminiService = require('../services/geminiService');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = require('express-validator').validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * GET /api/house-rentals
 * Get all house rentals with filtering and pagination
 */
router.get('/', [
  query('q').optional().isString().trim(),
  query('location').optional().isString().trim(),
  query('minPrice').optional().isInt({ min: 0 }).toInt(),
  query('maxPrice').optional().isInt({ min: 0 }).toInt(),
  query('bedrooms').optional().isInt({ min: 0, max: 10 }).toInt(),
  query('bathrooms').optional().isInt({ min: 0, max: 10 }).toInt(),
  query('propertyType').optional().isString().trim(),
  query('category').optional().isIn(['Budget', 'Moderate', 'Luxury', 'Ultra-Luxury']),
  query('furnished').optional().isIn(['Unfurnished', 'Semi-furnished', 'Fully furnished']),
  query('available').optional().isBoolean(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('sortBy').optional().isIn(['price', 'bedrooms', 'location', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      q,
      location,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      propertyType,
      category,
      furnished,
      available,
      limit = 20,
      offset = 0,
      sortBy = 'price',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};

    // Text search
    if (q) {
      query.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { location: new RegExp(q, 'i') },
        { propertyType: new RegExp(q, 'i') }
      ];
    }

    if (location) {
      query.location = new RegExp(location, 'i');
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }
    
    if (bedrooms !== undefined) query.bedrooms = bedrooms;
    if (bathrooms !== undefined) query.bathrooms = bathrooms;
    if (propertyType) query.propertyType = propertyType;
    if (category) query.category = category;
    if (furnished) query.furnished = furnished;
    if (available !== undefined) query['availability.available'] = available;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [rentals, total] = await Promise.all([
      HouseRental.find(query)
        .sort(sort)
        .limit(limit)
        .skip(offset)
        .lean(),
      HouseRental.countDocuments(query)
    ]);

    res.json({
      rentals,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      },
      filters: {
        q,
        location,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        propertyType,
        category,
        furnished,
        available
      }
    });
  } catch (error) {
    logger.error('Error fetching house rentals:', error);
    res.status(500).json({
      error: 'Failed to fetch house rentals',
      message: error.message
    });
  }
});

/**
 * GET /api/house-rentals/stats
 * Get rental market statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      locationStats,
      priceDistribution,
      bedroomStats,
      totalCount,
      avgPrice,
      categoryStats
    ] = await Promise.all([
      HouseRental.getLocationStats(),
      HouseRental.getPriceDistribution(),
      HouseRental.getBedroomStats(),
      HouseRental.countDocuments(),
      HouseRental.aggregate([{ $group: { _id: null, avgPrice: { $avg: '$price' } } }]),
      HouseRental.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      overview: {
        totalProperties: totalCount,
        averagePrice: avgPrice[0]?.avgPrice || 0
      },
      locationStats,
      priceDistribution,
      bedroomStats,
      categoryStats,
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Error fetching rental stats:', error);
    res.status(500).json({
      error: 'Failed to fetch rental statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/house-rentals/search
 * Advanced search with multiple criteria
 */
router.get('/search', [
  query('q').optional().isString().trim(),
  query('location').optional().isString().trim(),
  query('budget').optional().isInt({ min: 0 }).toInt(),
  query('bedrooms').optional().isInt({ min: 0, max: 10 }).toInt(),
  query('features').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { q, location, budget, bedrooms, features, limit = 20 } = req.query;

    const query = {};
    
    // Text search
    if (q) {
      query.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { location: new RegExp(q, 'i') }
      ];
    }
    
    if (location) query.location = new RegExp(location, 'i');
    if (budget) query.price = { $lte: budget };
    if (bedrooms !== undefined) query.bedrooms = bedrooms;
    if (features) {
      query.features = { $in: [new RegExp(features, 'i')] };
    }

    const rentals = await HouseRental.find(query)
      .limit(limit)
      .sort({ price: 1 })
      .lean();

    res.json({
      rentals,
      count: rentals.length,
      searchCriteria: { q, location, budget, bedrooms, features }
    });
  } catch (error) {
    logger.error('Error searching house rentals:', error);
    res.status(500).json({
      error: 'Failed to search house rentals',
      message: error.message
    });
  }
});

/**
 * GET /api/house-rentals/:id
 * Get specific rental by ID
 */
router.get('/:id', [
  param('id').isMongoId(),
  handleValidationErrors
], async (req, res) => {
  try {
    const rental = await HouseRental.findById(req.params.id);
    
    if (!rental) {
      return res.status(404).json({
        error: 'Rental property not found'
      });
    }

    // Increment view count
    await HouseRental.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({ rental });
  } catch (error) {
    logger.error('Error fetching rental by ID:', error);
    res.status(500).json({
      error: 'Failed to fetch rental property',
      message: error.message
    });
  }
});

/**
 * GET /api/house-rentals/location/:location
 * Get rentals by location
 */
router.get('/location/:location', [
  param('location').isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['price', 'bedrooms', 'createdAt']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { location } = req.params;
    const { limit = 20, sortBy = 'price' } = req.query;

    const rentals = await HouseRental.find({
      location: new RegExp(location, 'i')
    })
      .limit(limit)
      .sort({ [sortBy]: 1 })
      .lean();

    // Get location statistics
    const stats = await HouseRental.aggregate([
      { $match: { location: new RegExp(location, 'i') } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgBedrooms: { $avg: '$bedrooms' }
        }
      }
    ]);

    res.json({
      location,
      rentals,
      stats: stats[0] || {},
      count: rentals.length
    });
  } catch (error) {
    logger.error('Error fetching rentals by location:', error);
    res.status(500).json({
      error: 'Failed to fetch rentals by location',
      message: error.message
    });
  }
});

/**
 * POST /api/house-rentals/recommendations
 * Get AI-powered rental recommendations
 */
router.post('/recommendations', [
  body('maxBudget').optional().isInt({ min: 0 }).toInt(),
  body('bedrooms').optional().isInt({ min: 0, max: 10 }).toInt(),
  body('preferredLocations').optional().isArray(),
  body('propertyType').optional().isString().trim(),
  body('furnished').optional().isIn(['Unfurnished', 'Semi-furnished', 'Fully furnished']),
  body('features').optional().isArray(),
  handleValidationErrors
], async (req, res) => {
  try {
    const rentalService = new RentalIntegrationService();
    const geminiService = new GeminiService();

    const criteria = req.body;

    // Get rental recommendations
    const recommendations = await rentalService.getRentalRecommendations(criteria);

    // Generate AI analysis of recommendations
    const aiAnalysis = await geminiService.generateChatResponse(
      `Analyze these rental recommendations for someone with budget R${criteria.maxBudget || 'flexible'}, looking for ${criteria.bedrooms || 'any'} bedrooms in Cape Town. Explain why these properties are good matches and provide insights about the locations.`,
      [],
      null
    );

    res.json({
      ...recommendations,
      aiAnalysis,
      generatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error getting rental recommendations:', error);
    res.status(500).json({
      error: 'Failed to get rental recommendations',
      message: error.message
    });
  }
});

/**
 * GET /api/house-rentals/market-insights
 * Get AI-powered rental market insights
 */
router.get('/market-insights', async (req, res) => {
  try {
    const rentalService = new RentalIntegrationService();
    const geminiService = new GeminiService();

    // Get market insights
    const insights = await rentalService.getRentalMarketInsights();

    // Generate AI analysis
    const aiAnalysis = await geminiService.generateChatResponse(
      `Analyze the current Cape Town rental market based on this data. Provide insights about trends, best value areas, and recommendations for different types of renters.`,
      [],
      null
    );

    res.json({
      ...insights,
      aiAnalysis,
      generatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error getting rental market insights:', error);
    res.status(500).json({
      error: 'Failed to get rental market insights',
      message: error.message
    });
  }
});

/**
 * GET /api/house-rentals/neighborhood/:neighborhood
 * Get rental data for a specific neighborhood with AI insights
 */
router.get('/neighborhood/:neighborhood', [
  param('neighborhood').isString().trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { neighborhood } = req.params;
    const rentalService = new RentalIntegrationService();
    const geminiService = new GeminiService();

    // Get neighborhood rental data
    const rentalData = await rentalService.getNeighborhoodRentalData(neighborhood);

    if (rentalData.totalProperties === 0) {
      return res.json({
        neighborhood,
        message: 'No rental properties found in this neighborhood',
        suggestions: 'Try searching in nearby areas or check back later for new listings.'
      });
    }

    // Generate AI insights about the rental market in this neighborhood
    const aiInsights = await geminiService.generateChatResponse(
      `Provide insights about the rental market in ${neighborhood}, Cape Town. Based on the data, what should potential renters know about this area?`,
      [],
      null
    );

    res.json({
      ...rentalData,
      aiInsights,
      generatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error getting neighborhood rental data:', error);
    res.status(500).json({
      error: 'Failed to get neighborhood rental data',
      message: error.message
    });
  }
});

module.exports = router;
