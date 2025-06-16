const express = require('express');
const { query, validationResult } = require('express-validator');
const ComprehensiveDataService = require('../services/comprehensiveDataService');
const geminiService = require('../services/geminiService');
const Neighborhood = require('../models/Neighborhood');
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
 * GET /api/insights/comprehensive
 * Get comprehensive market insights with schools, hospitals, and transport data
 */
router.get('/comprehensive', async (req, res) => {
  try {
    const dataService = new ComprehensiveDataService();
    const insights = await dataService.getEnhancedMarketInsights();
    
    // Generate AI analysis of the insights
    const aiAnalysis = await geminiService.generateChatResponse(
      "Analyze the current Cape Town neighborhood market based on education, healthcare, and transportation infrastructure. Provide key insights and trends.",
      [],
      null
    );

    res.json({
      insights,
      aiAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting comprehensive insights:', error);
    res.status(500).json({
      error: 'Failed to get comprehensive insights',
      message: error.message
    });
  }
});

/**
 * GET /api/insights/neighborhood/:id/comprehensive
 * Get comprehensive insights for a specific neighborhood
 */
router.get('/neighborhood/:id/comprehensive', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get neighborhood data
    const neighborhood = await Neighborhood.findById(id);
    if (!neighborhood) {
      return res.status(404).json({ error: 'Neighborhood not found' });
    }

    const dataService = new ComprehensiveDataService();
    const comprehensiveData = await dataService.getComprehensiveNeighborhoodData(neighborhood);
    
    // Generate AI insights about this specific neighborhood
    const aiInsights = await geminiService.generateEnhancedChatResponse(
      `Provide comprehensive insights about living in ${neighborhood.name}, including education access, healthcare facilities, transportation options, and overall livability.`,
      [],
      neighborhood
    );

    res.json({
      neighborhood: comprehensiveData.neighborhood,
      education: comprehensiveData.education,
      healthcare: comprehensiveData.healthcare,
      transport: comprehensiveData.transport,
      livabilityScore: comprehensiveData.livabilityScore,
      aiInsights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting neighborhood comprehensive insights:', error);
    res.status(500).json({
      error: 'Failed to get neighborhood insights',
      message: error.message
    });
  }
});

/**
 * GET /api/insights/education-access
 * Get insights about education access across neighborhoods
 */
router.get('/education-access', async (req, res) => {
  try {
    const dataService = new ComprehensiveDataService();
    await dataService.connect();
    
    const schoolStats = await dataService.getSchoolStatistics();
    
    // Generate AI analysis of education access
    const educationAnalysis = await geminiService.generateChatResponse(
      `Analyze Cape Town's education infrastructure based on this data: ${JSON.stringify(schoolStats)}. Discuss school distribution, types, and accessibility across different areas.`,
      [],
      null
    );

    res.json({
      statistics: schoolStats,
      analysis: educationAnalysis,
      insights: [
        {
          title: "Total Public Schools",
          value: schoolStats.total,
          trend: "stable",
          description: "Public schools serving Cape Town communities"
        },
        {
          title: "Most Common School Type",
          value: schoolStats.typeBreakdown[0]?._id || "N/A",
          trend: "stable",
          description: `${schoolStats.typeBreakdown[0]?.count || 0} schools of this type`
        },
        {
          title: "Education Districts",
          value: schoolStats.districtBreakdown.length,
          trend: "stable",
          description: "Administrative districts managing schools"
        }
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting education insights:', error);
    res.status(500).json({
      error: 'Failed to get education insights',
      message: error.message
    });
  }
});

/**
 * GET /api/insights/healthcare-access
 * Get insights about healthcare access across neighborhoods
 */
router.get('/healthcare-access', async (req, res) => {
  try {
    const dataService = new ComprehensiveDataService();
    await dataService.connect();
    
    const hospitalStats = await dataService.getHospitalStatistics();
    
    // Generate AI analysis of healthcare access
    const healthcareAnalysis = await geminiService.generateChatResponse(
      `Analyze Cape Town's healthcare infrastructure based on this data: ${JSON.stringify(hospitalStats)}. Discuss facility distribution, types, and accessibility.`,
      [],
      null
    );

    res.json({
      statistics: hospitalStats,
      analysis: healthcareAnalysis,
      insights: [
        {
          title: "Total Healthcare Facilities",
          value: hospitalStats.total,
          trend: "improving",
          description: "Public healthcare facilities available"
        },
        {
          title: "Primary Facility Type",
          value: hospitalStats.classificationBreakdown[0]?._id || "N/A",
          trend: "stable",
          description: `${hospitalStats.classificationBreakdown[0]?.count || 0} facilities of this type`
        },
        {
          title: "Facility Types",
          value: hospitalStats.classificationBreakdown.length,
          trend: "stable",
          description: "Different types of healthcare facilities"
        }
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting healthcare insights:', error);
    res.status(500).json({
      error: 'Failed to get healthcare insights',
      message: error.message
    });
  }
});

/**
 * GET /api/insights/livability-ranking
 * Get neighborhood livability rankings based on comprehensive data
 */
router.get('/livability-ranking', [
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Get all neighborhoods
    const neighborhoods = await Neighborhood.find({}).limit(limit);
    
    const dataService = new ComprehensiveDataService();
    
    // Calculate livability scores for each neighborhood
    const neighborhoodScores = await Promise.all(
      neighborhoods.map(async (neighborhood) => {
        try {
          const comprehensiveData = await dataService.getComprehensiveNeighborhoodData(neighborhood, 1500, 3000);
          return {
            ...neighborhood.toObject(),
            livabilityScore: comprehensiveData.livabilityScore,
            educationScore: comprehensiveData.education.educationScore,
            healthcareScore: comprehensiveData.healthcare.healthcareScore,
            transportScore: comprehensiveData.transport.transportScore
          };
        } catch (error) {
          logger.warn(`Error calculating scores for ${neighborhood.name}:`, error.message);
          return {
            ...neighborhood.toObject(),
            livabilityScore: 50, // Default score
            educationScore: 50,
            healthcareScore: 50,
            transportScore: 50
          };
        }
      })
    );

    // Sort by livability score
    const rankedNeighborhoods = neighborhoodScores
      .sort((a, b) => b.livabilityScore - a.livabilityScore)
      .slice(0, limit);

    // Generate AI analysis of the rankings
    const rankingAnalysis = await geminiService.generateChatResponse(
      `Analyze these neighborhood livability rankings for Cape Town. Explain what makes the top neighborhoods score well and identify patterns in education, healthcare, and transport access.`,
      [],
      rankedNeighborhoods.slice(0, 5)
    );

    res.json({
      rankings: rankedNeighborhoods,
      analysis: rankingAnalysis,
      methodology: {
        description: "Livability scores calculated based on education access (20%), healthcare access (20%), transport connectivity (15%), safety (25%), and amenities (20%)",
        factors: [
          "Education: Number and types of schools within 1.5km",
          "Healthcare: Number and types of facilities within 3km", 
          "Transport: Taxi route connectivity",
          "Safety: Neighborhood safety score",
          "Amenities: Transit and walkability scores"
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting livability rankings:', error);
    res.status(500).json({
      error: 'Failed to get livability rankings',
      message: error.message
    });
  }
});

/**
 * GET /api/insights/family-friendly
 * Get insights about family-friendly neighborhoods
 */
router.get('/family-friendly', async (req, res) => {
  try {
    const neighborhoods = await Neighborhood.find({});
    const dataService = new ComprehensiveDataService();
    
    // Calculate family-friendly scores
    const familyScores = await Promise.all(
      neighborhoods.slice(0, 20).map(async (neighborhood) => {
        try {
          const data = await dataService.getComprehensiveNeighborhoodData(neighborhood, 2000, 5000);
          
          // Family-friendly scoring
          let familyScore = 0;
          familyScore += data.education.hasFullEducation ? 30 : 0;
          familyScore += Math.min(30, data.education.totalSchools * 5);
          familyScore += Math.min(20, data.healthcare.totalFacilities * 3);
          familyScore += (neighborhood.safety?.safetyScore || 5) * 2;
          
          return {
            ...neighborhood.toObject(),
            familyScore,
            schoolsNearby: data.education.totalSchools,
            hasFullEducation: data.education.hasFullEducation,
            healthcareFacilities: data.healthcare.totalFacilities
          };
        } catch (error) {
          return {
            ...neighborhood.toObject(),
            familyScore: 0,
            schoolsNearby: 0,
            hasFullEducation: false,
            healthcareFacilities: 0
          };
        }
      })
    );

    const topFamilyNeighborhoods = familyScores
      .sort((a, b) => b.familyScore - a.familyScore)
      .slice(0, 10);

    const familyAnalysis = await geminiService.generateChatResponse(
      "Analyze the best family-friendly neighborhoods in Cape Town based on school access, healthcare facilities, and safety scores. Provide recommendations for families.",
      [],
      topFamilyNeighborhoods
    );

    res.json({
      topNeighborhoods: topFamilyNeighborhoods,
      analysis: familyAnalysis,
      criteria: [
        "Primary and secondary schools within 2km",
        "Healthcare facilities within 5km", 
        "Safety score above 6/10",
        "Family-oriented amenities"
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting family-friendly insights:', error);
    res.status(500).json({
      error: 'Failed to get family-friendly insights',
      message: error.message
    });
  }
});

module.exports = router;
