const express = require('express');
const { query, validationResult } = require('express-validator');
const Neighborhood = require('../models/Neighborhood');
const vectorSearchService = require('../services/vectorSearchService');
const { logger } = require('../utils/logger');

const router = express.Router();

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
 * GET /api/search
 * General search endpoint with multiple search methods
 */
router.get('/', [
  query('q').optional().isString().trim().isLength({ min: 1, max: 200 }),
  query('borough').optional().isString().trim(),
  query('minRent').optional().isInt({ min: 0 }),
  query('maxRent').optional().isInt({ min: 0 }),
  query('minSafetyScore').optional().isFloat({ min: 0, max: 10 }),
  query('maxSafetyScore').optional().isFloat({ min: 0, max: 10 }),
  query('minTransitScore').optional().isInt({ min: 0, max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('searchType').optional().isIn(['text', 'filters', 'hybrid']),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      q,
      borough,
      minRent,
      maxRent,
      minSafetyScore,
      maxSafetyScore,
      minTransitScore,
      limit = 20,
      searchType = 'hybrid'
    } = req.query;

    let results = [];

    if (searchType === 'text' && q) {
      // Vector search using text query
      results = await vectorSearchService.searchByQuery(q, limit);
    } else if (searchType === 'filters') {
      // Traditional database filtering
      results = await searchWithFilters({
        borough,
        minRent,
        maxRent,
        minSafetyScore,
        maxSafetyScore,
        minTransitScore,
        limit
      });
    } else {
      // Hybrid search: combine text search with filters
      if (q) {
        // Start with vector search
        const vectorResults = await vectorSearchService.searchByQuery(q, limit * 2);
        
        // Apply filters to vector results
        results = applyFiltersToResults(vectorResults, {
          borough,
          minRent,
          maxRent,
          minSafetyScore,
          maxSafetyScore,
          minTransitScore
        }).slice(0, limit);
      } else {
        // Just use filters
        results = await searchWithFilters({
          borough,
          minRent,
          maxRent,
          minSafetyScore,
          maxSafetyScore,
          minTransitScore,
          limit
        });
      }
    }

    res.json({
      query: q,
      filters: {
        borough,
        minRent,
        maxRent,
        minSafetyScore,
        maxSafetyScore,
        minTransitScore
      },
      searchType,
      results,
      count: results.length,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error performing search:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/search/autocomplete
 * Autocomplete suggestions for neighborhood names
 */
router.get('/autocomplete', [
  query('q').isString().trim().isLength({ min: 1, max: 50 }),
  query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    const suggestions = await Neighborhood.find({
      name: new RegExp(q, 'i')
    })
      .select('name borough')
      .limit(limit)
      .sort({ name: 1 });

    res.json({
      query: q,
      suggestions: suggestions.map(n => ({
        name: n.name,
        borough: n.borough,
        fullName: `${n.name}, ${n.borough}`
      }))
    });

  } catch (error) {
    logger.error('Error fetching autocomplete suggestions:', error);
    res.status(500).json({
      error: 'Failed to fetch suggestions',
      message: error.message
    });
  }
});

/**
 * GET /api/search/filters
 * Get available filter options and ranges
 */
router.get('/filters', async (req, res) => {
  try {
    const [boroughs, rentRange, safetyRange, transitRange] = await Promise.all([
      Neighborhood.distinct('borough'),
      Neighborhood.aggregate([
        {
          $group: {
            _id: null,
            minRent: { $min: '$housing.avgRent' },
            maxRent: { $max: '$housing.avgRent' }
          }
        }
      ]),
      Neighborhood.aggregate([
        {
          $group: {
            _id: null,
            minSafety: { $min: '$safety.safetyScore' },
            maxSafety: { $max: '$safety.safetyScore' }
          }
        }
      ]),
      Neighborhood.aggregate([
        {
          $group: {
            _id: null,
            minTransit: { $min: '$amenities.transitScore' },
            maxTransit: { $max: '$amenities.transitScore' }
          }
        }
      ])
    ]);

    res.json({
      boroughs: boroughs.sort(),
      rentRange: {
        min: Math.floor((rentRange[0]?.minRent || 0) / 100) * 100,
        max: Math.ceil((rentRange[0]?.maxRent || 10000) / 100) * 100
      },
      safetyRange: {
        min: Math.floor(safetyRange[0]?.minSafety || 0),
        max: Math.ceil(safetyRange[0]?.maxSafety || 10)
      },
      transitRange: {
        min: Math.floor(transitRange[0]?.minTransit || 0),
        max: Math.ceil(transitRange[0]?.maxTransit || 100)
      }
    });

  } catch (error) {
    logger.error('Error fetching filter options:', error);
    res.status(500).json({
      error: 'Failed to fetch filter options',
      message: error.message
    });
  }
});

/**
 * GET /api/search/popular
 * Get popular search terms and trending neighborhoods
 */
router.get('/popular', async (req, res) => {
  try {
    // For demo purposes, return static popular searches
    // In production, this would be based on actual search analytics
    const popularSearches = [
      'family friendly neighborhoods',
      'affordable areas in Brooklyn',
      'safe neighborhoods with good transit',
      'trendy areas for young professionals',
      'quiet residential neighborhoods',
      'neighborhoods with good restaurants',
      'areas with low crime rates',
      'walkable neighborhoods',
      'neighborhoods near Central Park',
      'affordable Manhattan alternatives'
    ];

    // Get some trending neighborhoods (highest safety + transit scores)
    const trendingNeighborhoods = await Neighborhood.find({
      'safety.safetyScore': { $gte: 7 },
      'amenities.transitScore': { $gte: 70 }
    })
      .select('name borough safety.safetyScore amenities.transitScore')
      .sort({ 'safety.safetyScore': -1, 'amenities.transitScore': -1 })
      .limit(10);

    res.json({
      popularSearches,
      trendingNeighborhoods: trendingNeighborhoods.map(n => ({
        name: n.name,
        borough: n.borough,
        safetyScore: n.safety?.safetyScore,
        transitScore: n.amenities?.transitScore
      }))
    });

  } catch (error) {
    logger.error('Error fetching popular searches:', error);
    res.status(500).json({
      error: 'Failed to fetch popular searches',
      message: error.message
    });
  }
});

// Helper functions

async function searchWithFilters(filters) {
  const query = {};

  if (filters.borough) {
    query.borough = new RegExp(filters.borough, 'i');
  }

  if (filters.minRent || filters.maxRent) {
    query['housing.avgRent'] = {};
    if (filters.minRent) query['housing.avgRent'].$gte = parseInt(filters.minRent);
    if (filters.maxRent) query['housing.avgRent'].$lte = parseInt(filters.maxRent);
  }

  if (filters.minSafetyScore || filters.maxSafetyScore) {
    query['safety.safetyScore'] = {};
    if (filters.minSafetyScore) query['safety.safetyScore'].$gte = parseFloat(filters.minSafetyScore);
    if (filters.maxSafetyScore) query['safety.safetyScore'].$lte = parseFloat(filters.maxSafetyScore);
  }

  if (filters.minTransitScore) {
    query['amenities.transitScore'] = { $gte: parseInt(filters.minTransitScore) };
  }

  return await Neighborhood.find(query)
    .select('-vectorEmbedding')
    .limit(filters.limit || 20)
    .sort({ 'safety.safetyScore': -1, 'amenities.transitScore': -1 });
}

function applyFiltersToResults(results, filters) {
  return results.filter(neighborhood => {
    // Borough filter
    if (filters.borough && 
        !neighborhood.borough.toLowerCase().includes(filters.borough.toLowerCase())) {
      return false;
    }

    // Rent filters
    if (filters.minRent && 
        (!neighborhood.housing?.avgRent || neighborhood.housing.avgRent < parseInt(filters.minRent))) {
      return false;
    }
    if (filters.maxRent && 
        (!neighborhood.housing?.avgRent || neighborhood.housing.avgRent > parseInt(filters.maxRent))) {
      return false;
    }

    // Safety filters
    if (filters.minSafetyScore && 
        (!neighborhood.safety?.safetyScore || neighborhood.safety.safetyScore < parseFloat(filters.minSafetyScore))) {
      return false;
    }
    if (filters.maxSafetyScore && 
        (!neighborhood.safety?.safetyScore || neighborhood.safety.safetyScore > parseFloat(filters.maxSafetyScore))) {
      return false;
    }

    // Transit filter
    if (filters.minTransitScore && 
        (!neighborhood.amenities?.transitScore || neighborhood.amenities.transitScore < parseInt(filters.minTransitScore))) {
      return false;
    }

    return true;
  });
}

module.exports = router;
