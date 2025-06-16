const express = require('express');
const { body, validationResult } = require('express-validator');
const geminiService = require('../services/geminiService');
const vectorSearchService = require('../services/vectorSearchService');
const AdvancedNLP = require('../services/advancedNLP');
const PersonalizationEngine = require('../services/personalizationEngine');
const ComprehensiveDataService = require('../services/comprehensiveDataService');
const Neighborhood = require('../models/Neighborhood');
const { logger } = require('../utils/logger');

const router = express.Router();

// Initialize revolutionary services
const advancedNLP = new AdvancedNLP();
const personalizationEngine = new PersonalizationEngine();
const comprehensiveDataService = new ComprehensiveDataService();

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
 * POST /api/chat
 * Handle chat messages and provide AI responses
 */
router.post('/', [
  body('message').isString().trim().isLength({ min: 1, max: 1000 }),
  body('context').optional().isArray({ max: 10 }),
  body('sessionId').optional().isString().trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { message, context = [], sessionId } = req.body;
    const userId = sessionId; // Use sessionId as userId for personalization

    logger.info(`🚀 Revolutionary Chat - Session: ${sessionId}, Message: "${message}"`);

    // Use Advanced NLP to parse the query
    const parsedQuery = await advancedNLP.parseComplexQuery(message);
    logger.info(`🧠 Parsed intent: ${parsedQuery.intent.intent}, confidence: ${parsedQuery.confidence}`);

    let relevantData = null;
    let response;
    let personalizedResults = null;

    if (parsedQuery.intent.intent === 'search' || parsedQuery.intent.intent === 'recommend') {
      // Get all neighborhoods for intelligent filtering
      const allNeighborhoods = await Neighborhood.find({});

      // Apply intelligent filtering based on parsed criteria
      const filteredNeighborhoods = await applyIntelligentFiltering(
        allNeighborhoods,
        parsedQuery.searchCriteria
      );

      logger.info(`🎯 Filtered to ${filteredNeighborhoods.length} neighborhoods from ${allNeighborhoods.length}`);

      if (filteredNeighborhoods.length > 0) {
        // Get personalized recommendations
        personalizedResults = await personalizationEngine.getPersonalizedRecommendations(
          userId,
          filteredNeighborhoods,
          5
        );

        relevantData = personalizedResults.recommendations;

        // Learn from this interaction
        await personalizationEngine.learnFromInteraction(userId, {
          type: 'search',
          data: parsedQuery.searchCriteria,
          context: { query: message, timestamp: new Date() }
        });

        // Generate response with available data
        if (relevantData.length > 0) {
          response = await generateBasicResponse(message, parsedQuery, personalizedResults, context);
        } else {
          response = "I couldn't find any neighborhoods matching your specific criteria. Could you try adjusting your budget or requirements?";
        }
      } else {
        response = await geminiService.generateEnhancedChatResponse(
          `No neighborhoods found matching: ${message}. Please suggest alternatives or ask for different criteria.`,
          context
        );
      }
    } else {
      // General chat response
      response = await geminiService.generateEnhancedChatResponse(message, context);
    }

    // Learn from chat interaction
    if (userId) {
      await personalizationEngine.learnFromInteraction(userId, {
        type: 'chat',
        data: { message, response, parsedQuery },
        context: { timestamp: new Date() }
      });
    }

    logger.info(`✅ Revolutionary chat response generated for session: ${sessionId}`);

    res.json({
      response,
      understanding: {
        intent: parsedQuery.intent,
        entities: parsedQuery.entities,
        explanation: parsedQuery.naturalLanguageExplanation
      },
      relevantNeighborhoods: relevantData ? relevantData.slice(0, 3) : null,
      personalized: !!personalizedResults,
      userProfile: personalizedResults?.profile || null,
      confidence: parsedQuery.confidence || 0.8,
      sessionId
    });

  } catch (error) {
    logger.error('Error in revolutionary chat:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message
    });
  }
});

/**
 * POST /api/chat/neighborhood-query
 * Specialized endpoint for neighborhood-specific queries
 */
router.post('/neighborhood-query', [
  body('query').isString().trim().isLength({ min: 1, max: 500 }),
  body('filters').optional().isObject(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { query, filters = {} } = req.body;

    // Combine query with filters for search
    const searchCriteria = {
      ...extractSearchCriteria(query),
      ...filters
    };

    const recommendations = await vectorSearchService.getRecommendations(searchCriteria);

    // Generate detailed explanation
    const explanation = await geminiService.generateChatResponse(
      `Explain why these neighborhoods match the query: "${query}"`,
      [],
      recommendations.neighborhoods
    );

    res.json({
      query,
      neighborhoods: recommendations.neighborhoods,
      explanation,
      totalFound: recommendations.totalFound,
      searchCriteria
    });

  } catch (error) {
    logger.error('Error processing neighborhood query:', error);
    res.status(500).json({
      error: 'Failed to process neighborhood query',
      message: error.message
    });
  }
});

/**
 * GET /api/chat/suggestions
 * Get suggested questions/queries for users
 */
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = [
      "Find family-friendly neighborhoods under R3500/month",
      "Show me safe areas with good public transportation",
      "What are the best neighborhoods for young professionals?",
      "Find quiet residential areas with parks",
      "Which neighborhoods have the best restaurants and nightlife?",
      "Show me affordable areas in Brooklyn",
      "Find neighborhoods similar to Greenwich Village",
      "What are the safest neighborhoods in Manhattan?",
      "Show me areas with good schools and low crime",
      "Find trendy neighborhoods with cultural attractions"
    ];

    res.json({
      suggestions,
      categories: [
        { name: 'Family-Friendly', keywords: ['family', 'schools', 'parks', 'safe'] },
        { name: 'Young Professionals', keywords: ['trendy', 'nightlife', 'restaurants', 'transit'] },
        { name: 'Budget-Conscious', keywords: ['affordable', 'cheap', 'budget', 'under'] },
        { name: 'Safety-Focused', keywords: ['safe', 'low crime', 'secure'] },
        { name: 'Transit-Oriented', keywords: ['subway', 'transportation', 'walkable'] }
      ]
    });
  } catch (error) {
    logger.error('Error fetching chat suggestions:', error);
    res.status(500).json({
      error: 'Failed to fetch suggestions',
      message: error.message
    });
  }
});

/**
 * Analyze message intent to determine if it's asking for neighborhood recommendations
 * @param {string} message - User message
 * @returns {Object} - Intent analysis
 */
async function analyzeMessageIntent(message) {
  const lowerMessage = message.toLowerCase();

  // Keywords that indicate neighborhood search
  const searchKeywords = [
    'find', 'show', 'recommend', 'suggest', 'looking for', 'need', 'want',
    'neighborhood', 'area', 'place', 'location', 'where', 'best'
  ];

  const locationKeywords = [
    'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island',
    'neighborhood', 'area', 'district', 'borough', 'city', 'cities'
  ];

  const criteriaKeywords = [
    'cheap', 'affordable', 'expensive', 'safe', 'dangerous', 'family',
    'young', 'professional', 'quiet', 'loud', 'trendy', 'hip', 'cultural',
    'restaurants', 'nightlife', 'schools', 'parks', 'transit', 'subway',
    'kids', 'children', 'raise', 'budget', 'rent', 'cost', 'price'
  ];

  // Budget/price patterns that indicate housing search - support USD and ZAR
  const budgetPattern = /[\$r]?\d+(?:,\d{3})*(?:\s*(?:per month|\/month|monthly|budget|rent|rand|zar|dollars?))?/i;
  const hasBudgetMention = budgetPattern.test(message);

  // Family-related patterns
  const familyPattern = /family\s+of\s+\d+|couple|kids|children|raising|schools/i;
  const hasFamilyMention = familyPattern.test(message);

  const hasSearchKeyword = searchKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasLocationKeyword = locationKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasCriteriaKeyword = criteriaKeywords.some(keyword => lowerMessage.includes(keyword));

  // More flexible search detection
  const isImplicitSearch = (hasBudgetMention && hasFamilyMention) ||
                          (hasBudgetMention && hasCriteriaKeyword) ||
                          (hasFamilyMention && hasCriteriaKeyword);

  const isSearchQuery = hasSearchKeyword && (hasLocationKeyword || hasCriteriaKeyword) || isImplicitSearch;

  let confidence = 0;
  if (hasSearchKeyword) confidence += 0.4;
  if (hasLocationKeyword) confidence += 0.3;
  if (hasCriteriaKeyword) confidence += 0.3;
  if (hasBudgetMention) confidence += 0.2;
  if (hasFamilyMention) confidence += 0.2;
  if (isImplicitSearch) confidence += 0.3;

  return {
    isSearchQuery,
    hasLocationKeyword,
    hasCriteriaKeyword,
    confidence: Math.min(confidence, 1.0) // Cap at 1.0
  };
}

/**
 * Extract search criteria from natural language message
 * @param {string} message - User message
 * @returns {Object} - Extracted criteria
 */
function extractSearchCriteria(message) {
  const lowerMessage = message.toLowerCase();
  const criteria = {};

  // Extract price criteria - support both USD ($) and ZAR (R) currencies
  const pricePatterns = [
    { pattern: /under\s*r(\d+(?:,\d{3})*)/i, currency: 'R' },  // "under R3500"
    { pattern: /under\s*\$(\d+(?:,\d{3})*)/i, currency: '$' },  // "under $3500"
    { pattern: /r(\d+(?:,\d{3})*)\s*(?:per month|\/month|monthly|budget)/i, currency: 'R' },  // "R3500 per month"
    { pattern: /\$(\d+(?:,\d{3})*)\s*(?:per month|\/month|monthly|budget)/i, currency: '$' },  // "$3500 per month"
    { pattern: /budget\s*(?:of\s*)?r(\d+(?:,\d{3})*)/i, currency: 'R' },  // "budget R3500"
    { pattern: /budget\s*(?:of\s*)?\$(\d+(?:,\d{3})*)/i, currency: '$' },  // "budget $3500"
    { pattern: /(\d+(?:,\d{3})*)\s*(?:rand|zar)\s*(?:per month|monthly|budget)?/i, currency: 'R' },  // "3500 rand"
    { pattern: /(\d+(?:,\d{3})*)\s*dollars?\s*(?:per month|monthly|budget)?/i, currency: '$' },  // "3500 dollars"
    { pattern: /under\s*(\d+(?:,\d{3})*)/i, currency: '$' }  // fallback "under 3500" assumes USD
  ];

  for (const { pattern, currency } of pricePatterns) {
    const priceMatch = lowerMessage.match(pattern);
    if (priceMatch) {
      criteria.maxRent = parseInt(priceMatch[1].replace(/,/g, ''));
      criteria.currency = currency;
      break; // Use the first match found
    }
  }

  // Extract borough/area - support both NYC and Cape Town areas
  const areas = [
    // NYC boroughs
    'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island',
    // Cape Town areas
    'atlantic seaboard', 'city bowl', 'southern suburbs', 'northern suburbs',
    'west coast', 'cape flats', 'helderberg', 'cape peninsula'
  ];
  const foundArea = areas.find(area => lowerMessage.includes(area));
  if (foundArea) {
    criteria.borough = foundArea;
  }

  // Extract characteristics
  if (lowerMessage.includes('family') || lowerMessage.includes('kids') || lowerMessage.includes('children')) {
    criteria.familyFriendly = true;
  }

  if (lowerMessage.includes('young professional') || lowerMessage.includes('professional')) {
    criteria.youngProfessionals = true;
  }

  if (lowerMessage.includes('safe') || lowerMessage.includes('safety') || lowerMessage.includes('secure')) {
    criteria.minSafetyScore = 7;
  }

  if (lowerMessage.includes('quiet') || lowerMessage.includes('peaceful')) {
    criteria.quiet = true;
  }

  if (lowerMessage.includes('transit') || lowerMessage.includes('subway') || lowerMessage.includes('transportation')) {
    criteria.transitAccess = true;
  }

  if (lowerMessage.includes('cultural') || lowerMessage.includes('arts') || lowerMessage.includes('museum')) {
    criteria.cultural = true;
  }

  return criteria;
}

/**
 * Apply intelligent filtering based on parsed search criteria
 */
async function applyIntelligentFiltering(neighborhoods, criteria) {
  return neighborhoods.filter(neighborhood => {
    // Budget filtering with currency conversion
    if (criteria.maxRent) {
      const neighborhoodRent = neighborhood.housing?.avgRent || 0;
      let maxBudget = criteria.maxRent;

      // Convert USD to ZAR if needed (approximate rate: 1 USD = 18 ZAR)
      if (criteria.currency === '$' && neighborhoodRent > 0) {
        maxBudget = criteria.maxRent * 18;
      }

      if (neighborhoodRent > maxBudget) {
        return false;
      }
    }

    // Safety filtering
    if (criteria.minSafetyScore) {
      const safetyScore = neighborhood.safety?.safetyScore || 0;
      if (safetyScore < criteria.minSafetyScore) {
        return false;
      }
    }

    // Area/borough filtering
    if (criteria.preferredAreas && criteria.preferredAreas.length > 0) {
      const neighborhoodArea = neighborhood.borough?.toLowerCase() || '';
      const matches = criteria.preferredAreas.some(area =>
        neighborhoodArea.includes(area.toLowerCase()) ||
        neighborhood.name?.toLowerCase().includes(area.toLowerCase())
      );
      if (!matches) {
        return false;
      }
    }

    // Family-friendly filtering (needs schools)
    if (criteria.familyFriendly) {
      const schoolCount = neighborhood.amenities?.schools || 0;
      if (schoolCount < 2) { // At least 2 schools nearby
        return false;
      }
    }

    // Transit access filtering
    if (criteria.transitAccess) {
      const transitScore = neighborhood.amenities?.transitScore || 0;
      if (transitScore < 60) { // Good transit threshold
        return false;
      }
    }

    // Property type filtering
    if (criteria.propertyType) {
      // This would need property type data in neighborhoods
      // For now, we'll skip this filter
    }

    return true;
  });
}

/**
 * Generate intelligent response with comprehensive data
 */
async function generateIntelligentResponse(message, parsedQuery, comprehensiveData, personalizedResults, context) {
  try {
    // Create rich context for AI
    const richContext = createRichContext(comprehensiveData, personalizedResults, parsedQuery);

    // Generate response with comprehensive context
    const prompt = `You are an expert Cape Town real estate advisor with access to comprehensive neighborhood data.

USER QUERY: "${message}"

PARSED REQUIREMENTS:
${JSON.stringify(parsedQuery.searchCriteria, null, 2)}

TOP RECOMMENDATION DATA:
${richContext}

INSTRUCTIONS:
1. Provide a direct, helpful answer to the user's specific question
2. Use the EXACT data provided (prices, safety scores, school counts, etc.)
3. Explain WHY this neighborhood matches their criteria
4. Mention specific schools, hospitals, or transport routes when relevant
5. Be conversational but informative
6. If budget doesn't match, suggest realistic alternatives
7. Include bedroom-specific pricing if mentioned in query

Respond naturally and helpfully, using the specific data provided.`;

    const response = await geminiService.generateChatResponse(prompt, context);
    return response;

  } catch (error) {
    logger.error('Error generating intelligent response:', error);
    return "I found some great neighborhoods for you, but I'm having trouble explaining the details right now. Please try asking again.";
  }
}

/**
 * Create rich context from comprehensive data
 */
function createRichContext(comprehensiveData, personalizedResults, parsedQuery) {
  if (!comprehensiveData || !comprehensiveData.neighborhood) {
    return "No detailed data available.";
  }

  const neighborhood = comprehensiveData.neighborhood;
  const education = comprehensiveData.education;
  const healthcare = comprehensiveData.healthcare;
  const transport = comprehensiveData.transport;

  let context = `NEIGHBORHOOD: ${neighborhood.name} (${neighborhood.borough})\n`;
  context += `- Average Rent: R${neighborhood.housing?.avgRent?.toLocaleString() || 'N/A'}/month\n`;
  context += `- Affordability Category: ${neighborhood.affordabilityCategory || 'N/A'}\n`;
  context += `- Safety Score: ${neighborhood.safety?.safetyScore || 'N/A'}/10\n`;
  context += `- Overall Livability Score: ${comprehensiveData.livabilityScore}/100\n\n`;

  context += `EDUCATION ACCESS:\n`;
  context += `- Schools within 2km: ${education.totalSchools}\n`;
  context += `- School Types: ${Object.entries(education.schoolTypes).map(([type, count]) => `${count} ${type}`).join(', ')}\n`;
  context += `- Has Full Education (Primary + Secondary): ${education.hasFullEducation ? 'Yes' : 'No'}\n`;
  if (education.nearestSchool) {
    context += `- Nearest School: ${education.nearestSchool.name} (${Math.round(education.nearestSchool.distance)}m away)\n`;
  }
  context += `- Education Score: ${education.educationScore}/100\n\n`;

  context += `HEALTHCARE ACCESS:\n`;
  context += `- Healthcare Facilities within 5km: ${healthcare.totalFacilities}\n`;
  context += `- Facility Types: ${Object.entries(healthcare.classifications).map(([type, count]) => `${count} ${type}`).join(', ')}\n`;
  context += `- Has Hospital: ${healthcare.hasHospital ? 'Yes' : 'No'}\n`;
  if (healthcare.nearestFacility) {
    context += `- Nearest Facility: ${healthcare.nearestFacility.name} (${Math.round(healthcare.nearestFacility.distance)}m away)\n`;
  }
  context += `- Healthcare Score: ${healthcare.healthcareScore}/100\n\n`;

  context += `TRANSPORT CONNECTIVITY:\n`;
  context += `- Taxi Routes: ${transport.totalRoutes} routes serving the area\n`;
  context += `- Major Destinations: ${transport.majorDestinations.join(', ')}\n`;
  context += `- Transport Score: ${transport.transportScore}/100\n\n`;

  if (personalizedResults && personalizedResults.recommendations.length > 0) {
    const topRec = personalizedResults.recommendations[0];
    context += `PERSONALIZATION:\n`;
    context += `- Personalized Score: ${topRec.personalizedScore}/100\n`;
    context += `- Match Reasons: ${topRec.matchReasons.join(', ')}\n\n`;
  }

  return context;
}

/**
 * Generate basic response without comprehensive data
 */
async function generateBasicResponse(message, parsedQuery, personalizedResults, context) {
  try {
    const topNeighborhood = personalizedResults.recommendations[0];

    const prompt = `You are an expert Cape Town real estate advisor.

USER QUERY: "${message}"

PARSED REQUIREMENTS:
${JSON.stringify(parsedQuery.searchCriteria, null, 2)}

TOP RECOMMENDATION:
- Neighborhood: ${topNeighborhood.name} (${topNeighborhood.borough})
- Average Rent: R${topNeighborhood.housing?.avgRent?.toLocaleString() || 'N/A'}/month
- Affordability: ${topNeighborhood.affordabilityCategory || 'N/A'}
- Safety Score: ${topNeighborhood.safety?.safetyScore || 'N/A'}/10
- Transit Score: ${topNeighborhood.amenities?.transitScore || 'N/A'}/100
- Personalized Score: ${topNeighborhood.personalizedScore}/100
- Match Reasons: ${topNeighborhood.matchReasons.join(', ')}

INSTRUCTIONS:
1. Provide a direct, helpful answer to the user's specific question
2. Use the EXACT data provided (prices, safety scores, etc.)
3. Explain WHY this neighborhood matches their criteria
4. Be conversational but informative
5. If budget doesn't match, suggest realistic alternatives

Respond naturally and helpfully, using the specific data provided.`;

    const response = await geminiService.generateChatResponse(prompt, context);
    return response;

  } catch (error) {
    logger.error('Error generating basic response:', error);
    return "I found some great neighborhoods for you, but I'm having trouble explaining the details right now. Please try asking again.";
  }
}

module.exports = router;
