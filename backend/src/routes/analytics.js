const express = require('express');
const { param, query, body, validationResult } = require('express-validator');
const Neighborhood = require('../models/Neighborhood');
const CrimeData = require('../models/CrimeData');
const geminiService = require('../services/geminiService');
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
 * GET /api/analytics/trends/:neighborhood
 * Get trend data for a specific neighborhood
 */
router.get('/trends/:neighborhood', [
  param('neighborhood').isString().trim(),
  query('months').optional().isInt({ min: 1, max: 60 }).toInt(),
  query('metric').optional().isIn(['crime', 'housing', 'demographics']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { neighborhood } = req.params;
    const { months = 12, metric = 'crime' } = req.query;

    // Find the neighborhood
    const neighborhoodData = await Neighborhood.findOne({
      name: new RegExp(neighborhood, 'i')
    });

    if (!neighborhoodData) {
      return res.status(404).json({
        error: 'Neighborhood not found'
      });
    }

    let trendData = {};

    if (metric === 'crime') {
      // Get crime trend data
      trendData = await CrimeData.getTrendData(neighborhoodData.name, months);
    } else if (metric === 'housing') {
      // For demo purposes, generate sample housing trend data
      trendData = generateHousingTrendData(neighborhoodData, months);
    } else if (metric === 'demographics') {
      // For demo purposes, generate sample demographic trend data
      trendData = generateDemographicTrendData(neighborhoodData, months);
    }

    // Generate AI analysis of the trends
    const analysis = await geminiService.analyzeTrends(trendData, neighborhoodData.name);

    res.json({
      neighborhood: neighborhoodData.name,
      metric,
      timeframe: `${months} months`,
      trendData,
      analysis,
      lastUpdated: new Date()
    });

  } catch (error) {
    logger.error('Error fetching trend data:', error);
    res.status(500).json({
      error: 'Failed to fetch trend data',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/compare
 * Compare analytics between multiple neighborhoods
 */
router.post('/compare', [
  body('neighborhoods').isArray({ min: 2, max: 5 }),
  body('neighborhoods.*').isString().trim(),
  body('metrics').optional().isArray(),
  body('metrics.*').optional().isIn(['housing', 'safety', 'amenities', 'demographics']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { neighborhoods, metrics = ['housing', 'safety', 'amenities'] } = req.body;

    // Find all neighborhoods
    const neighborhoodData = await Neighborhood.find({
      name: { $in: neighborhoods.map(n => new RegExp(n, 'i')) }
    });

    if (neighborhoodData.length < 2) {
      return res.status(400).json({
        error: 'At least 2 valid neighborhoods required for comparison'
      });
    }

    // Build comparison data
    const comparison = {
      neighborhoods: neighborhoodData.map(n => n.name),
      metrics: {},
      summary: {}
    };

    // Compare each metric
    for (const metric of metrics) {
      comparison.metrics[metric] = compareMetric(neighborhoodData, metric);
    }

    // Generate summary statistics
    comparison.summary = generateComparisonSummary(neighborhoodData, metrics);

    // Generate AI insights using specialized comparison prompt
    const insights = await geminiService.generateComparisonAnalysis(neighborhoodData, metrics);

    res.json({
      comparison,
      insights,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error comparing neighborhoods:', error);
    res.status(500).json({
      error: 'Failed to compare neighborhoods',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/overview/:neighborhood
 * Get comprehensive analytics overview for a neighborhood
 */
router.get('/overview/:neighborhood', [
  param('neighborhood').isString().trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { neighborhood } = req.params;

    const neighborhoodData = await Neighborhood.findOne({
      name: new RegExp(neighborhood, 'i')
    });

    if (!neighborhoodData) {
      return res.status(404).json({
        error: 'Neighborhood not found'
      });
    }

    // Get crime statistics for the last 12 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    const crimeStats = await CrimeData.getNeighborhoodStats(
      neighborhoodData.name,
      startDate,
      endDate
    );

    // Calculate key metrics
    const overview = {
      basic: {
        name: neighborhoodData.name,
        borough: neighborhoodData.borough,
        population: neighborhoodData.demographics?.population,
        coordinates: neighborhoodData.coordinates
      },
      housing: {
        avgRent: neighborhoodData.housing?.avgRent,
        avgSalePrice: neighborhoodData.housing?.avgSalePrice,
        affordabilityCategory: neighborhoodData.affordabilityCategory
      },
      safety: {
        safetyScore: neighborhoodData.safety?.safetyScore,
        crimeRate: neighborhoodData.safety?.crimeRate,
        recentCrimes: crimeStats[0]?.totalIncidents || 0
      },
      lifestyle: {
        transitScore: neighborhoodData.amenities?.transitScore,
        walkabilityScore: neighborhoodData.amenities?.walkabilityScore,
        restaurants: neighborhoodData.amenities?.restaurants,
        parks: neighborhoodData.amenities?.parks
      },
      demographics: {
        medianAge: neighborhoodData.demographics?.medianAge,
        medianIncome: neighborhoodData.demographics?.medianIncome,
        educationLevel: neighborhoodData.demographics?.educationLevel
      }
    };

    // Generate AI summary
    const summary = await geminiService.generateNeighborhoodInsights(neighborhoodData);

    res.json({
      overview,
      summary,
      lastUpdated: neighborhoodData.lastUpdated
    });

  } catch (error) {
    logger.error('Error fetching neighborhood overview:', error);
    res.status(500).json({
      error: 'Failed to fetch neighborhood overview',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/stats
 * Get general statistics about the dataset
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      Neighborhood.countDocuments(),
      Neighborhood.distinct('borough'),
      Neighborhood.aggregate([
        {
          $group: {
            _id: null,
            avgRent: { $avg: '$housing.avgRent' },
            avgSafetyScore: { $avg: '$safety.safetyScore' },
            avgTransitScore: { $avg: '$amenities.transitScore' }
          }
        }
      ]),
      CrimeData.countDocuments()
    ]);

    const [totalNeighborhoods, boroughs, averages, totalCrimes] = stats;

    res.json({
      totalNeighborhoods,
      boroughs: boroughs.length,
      boroughList: boroughs,
      averages: averages[0] || {},
      totalCrimeRecords: totalCrimes,
      lastUpdated: new Date()
    });

  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// Helper functions

function compareMetric(neighborhoods, metric) {
  const comparison = {};

  neighborhoods.forEach(n => {
    comparison[n.name] = {};

    switch (metric) {
      case 'housing':
        comparison[n.name] = {
          avgRent: n.housing?.avgRent || 0,
          avgSalePrice: n.housing?.avgSalePrice || 0,
          homeOwnershipRate: n.housing?.homeOwnershipRate || 0
        };
        break;
      case 'safety':
        comparison[n.name] = {
          safetyScore: n.safety?.safetyScore || 0,
          crimeRate: n.safety?.crimeRate || 0
        };
        break;
      case 'amenities':
        comparison[n.name] = {
          transitScore: n.amenities?.transitScore || 0,
          walkabilityScore: n.amenities?.walkabilityScore || 0,
          restaurants: n.amenities?.restaurants || 0,
          parks: n.amenities?.parks || 0
        };
        break;
      case 'demographics':
        comparison[n.name] = {
          population: n.demographics?.population || 0,
          medianAge: n.demographics?.medianAge || 0,
          medianIncome: n.demographics?.medianIncome || 0
        };
        break;
    }
  });

  return comparison;
}

function generateComparisonSummary(neighborhoods, metrics) {
  const summary = {};

  if (metrics.includes('housing')) {
    const rents = neighborhoods.map(n => n.housing?.avgRent || 0).filter(r => r > 0);
    summary.housing = {
      cheapest: Math.min(...rents),
      mostExpensive: Math.max(...rents),
      avgRent: rents.reduce((a, b) => a + b, 0) / rents.length
    };
  }

  if (metrics.includes('safety')) {
    const safetyScores = neighborhoods.map(n => n.safety?.safetyScore || 0).filter(s => s > 0);
    summary.safety = {
      safest: Math.max(...safetyScores),
      leastSafe: Math.min(...safetyScores),
      avgSafetyScore: safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length
    };
  }

  return summary;
}

// Generate sample trend data for demo purposes
function generateHousingTrendData(neighborhood, months) {
  const data = [];
  const baseRent = neighborhood.housing?.avgRent || 3000;
  
  for (let i = months; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    // Add some realistic variation
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const rent = Math.round(baseRent * (1 + variation));
    
    data.push({
      date: date.toISOString().slice(0, 7), // YYYY-MM format
      avgRent: rent,
      listings: Math.floor(Math.random() * 50) + 10
    });
  }
  
  return data;
}

function generateDemographicTrendData(neighborhood, months) {
  const data = [];
  const basePopulation = neighborhood.demographics?.population || 50000;
  
  for (let i = months; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    data.push({
      date: date.toISOString().slice(0, 7),
      population: Math.round(basePopulation * (1 + (Math.random() - 0.5) * 0.02)),
      medianAge: (neighborhood.demographics?.medianAge || 35) + (Math.random() - 0.5) * 2
    });
  }
  
  return data;
}

module.exports = router;
