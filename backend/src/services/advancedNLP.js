const geminiService = require('./geminiService');
const { logger } = require('../utils/logger');

class AdvancedNLP {
  constructor() {
    this.intentPatterns = this.initializeIntentPatterns();
    this.entityExtractors = this.initializeEntityExtractors();
  }

  /**
   * Parse complex natural language queries into structured search criteria
   */
  async parseComplexQuery(query) {
    try {
      // Use Gemini for advanced intent recognition
      const intentAnalysis = await this.analyzeIntentWithAI(query);
      
      // Extract entities using pattern matching + AI
      const entities = await this.extractEntities(query);
      
      // Combine results into structured criteria
      const criteria = this.buildSearchCriteria(intentAnalysis, entities);
      
      return {
        originalQuery: query,
        intent: intentAnalysis.intent,
        confidence: intentAnalysis.confidence,
        entities,
        searchCriteria: criteria,
        naturalLanguageExplanation: this.generateExplanation(criteria)
      };
      
    } catch (error) {
      logger.error('Error parsing complex query:', error);
      return this.fallbackParsing(query);
    }
  }

  async analyzeIntentWithAI(query) {
    const prompt = `Analyze this real estate search query and identify the intent and key requirements:

Query: "${query}"

Respond with a JSON object containing:
{
  "intent": "search|compare|analyze|recommend|predict",
  "confidence": 0.0-1.0,
  "primaryGoal": "brief description",
  "urgency": "low|medium|high",
  "specificity": "vague|specific|very_specific",
  "familyContext": true/false,
  "investmentContext": true/false,
  "budgetMentioned": true/false,
  "locationSpecific": true/false
}`;

    try {
      const response = await geminiService.generateChatResponse(prompt, []);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.fallbackIntentAnalysis(query);
    } catch (error) {
      logger.warn('AI intent analysis failed, using fallback:', error);
      return this.fallbackIntentAnalysis(query);
    }
  }

  async extractEntities(query) {
    const entities = {
      budget: this.extractBudget(query),
      location: this.extractLocation(query),
      familySize: this.extractFamilySize(query),
      timeframe: this.extractTimeframe(query),
      priorities: this.extractPriorities(query),
      lifestyle: this.extractLifestyle(query),
      propertyType: this.extractPropertyType(query),
      amenities: this.extractAmenities(query),
      constraints: this.extractConstraints(query)
    };

    // Use AI for complex entity extraction
    const aiEntities = await this.extractEntitiesWithAI(query);
    
    // Merge AI results with pattern-based extraction
    return this.mergeEntityResults(entities, aiEntities);
  }

  extractBudget(query) {
    const budgetPatterns = [
      // ZAR patterns
      /(?:under|below|max|maximum|up to)\s*r?(\d+(?:,\d{3})*(?:k|000)?)/i,
      /r?(\d+(?:,\d{3})*(?:k|000)?)\s*(?:budget|max|maximum|limit)/i,
      /between\s*r?(\d+(?:,\d{3})*(?:k|000)?)\s*(?:and|to|-)\s*r?(\d+(?:,\d{3})*(?:k|000)?)/i,
      /r(\d+(?:,\d{3})*(?:k|000)?)\s*(?:per month|monthly|\/month)/i,
      
      // USD patterns for comparison
      /(?:under|below|max|maximum|up to)\s*\$(\d+(?:,\d{3})*(?:k|000)?)/i,
      /\$(\d+(?:,\d{3})*(?:k|000)?)\s*(?:budget|max|maximum|limit)/i
    ];

    for (const pattern of budgetPatterns) {
      const match = query.match(pattern);
      if (match) {
        let amount = match[1].replace(/,/g, '');
        if (amount.endsWith('k')) {
          amount = parseInt(amount.slice(0, -1)) * 1000;
        } else if (amount.endsWith('000')) {
          amount = parseInt(amount.slice(0, -3)) * 1000;
        } else {
          amount = parseInt(amount);
        }
        
        const currency = query.includes('$') ? 'USD' : 'ZAR';
        
        return {
          max: amount,
          min: match[2] ? parseInt(match[2].replace(/,/g, '').replace(/k$/, '000')) : 0,
          currency,
          confidence: 0.9
        };
      }
    }
    
    return null;
  }

  extractLocation(query) {
    const locations = [
      // Cape Town areas
      'city bowl', 'atlantic seaboard', 'southern suburbs', 'northern suburbs',
      'cape flats', 'west coast', 'helderberg', 'cape peninsula',
      
      // Specific neighborhoods
      'camps bay', 'sea point', 'green point', 'waterfront', 'woodstock',
      'observatory', 'rondebosch', 'newlands', 'claremont', 'constantia',
      'stellenbosch', 'paarl', 'bellville', 'durbanville', 'brackenfell',
      'mitchell\'s plain', 'khayelitsha', 'gugulethu', 'langa', 'nyanga',
      
      // General terms
      'near cbd', 'close to city', 'suburban', 'coastal', 'mountain view'
    ];

    const foundLocations = locations.filter(loc => 
      query.toLowerCase().includes(loc.toLowerCase())
    );

    if (foundLocations.length > 0) {
      return {
        areas: foundLocations,
        specificity: foundLocations.length === 1 ? 'specific' : 'multiple',
        confidence: 0.8
      };
    }

    return null;
  }

  extractFamilySize(query) {
    const familyPatterns = [
      /family of (\d+)/i,
      /(\d+) (?:people|person|adults?|kids?|children)/i,
      /couple with (\d+) (?:kids?|children)/i,
      /(\d+)(?:-| )bedroom/i,
      /single person/i,
      /young couple/i
    ];

    for (const pattern of familyPatterns) {
      const match = query.match(pattern);
      if (match) {
        if (query.includes('single')) {
          return { size: 1, type: 'single', confidence: 0.9 };
        } else if (query.includes('couple')) {
          const kids = match[1] ? parseInt(match[1]) : 0;
          return { size: 2 + kids, type: 'couple', kids, confidence: 0.9 };
        } else {
          return { size: parseInt(match[1]), confidence: 0.8 };
        }
      }
    }

    return null;
  }

  extractTimeframe(query) {
    const timePatterns = [
      /(?:in|within|by) (\d+) (?:months?|years?)/i,
      /next (\d+) (?:months?|years?)/i,
      /(?:asap|immediately|urgent|soon)/i,
      /(?:flexible|no rush|eventually)/i
    ];

    for (const pattern of timePatterns) {
      const match = query.match(pattern);
      if (match) {
        if (query.includes('asap') || query.includes('urgent')) {
          return { urgency: 'high', timeframe: 'immediate', confidence: 0.9 };
        } else if (query.includes('flexible') || query.includes('no rush')) {
          return { urgency: 'low', timeframe: 'flexible', confidence: 0.8 };
        } else {
          const number = parseInt(match[1]);
          const unit = query.includes('month') ? 'months' : 'years';
          return { 
            urgency: number <= 3 ? 'high' : number <= 12 ? 'medium' : 'low',
            timeframe: `${number} ${unit}`,
            confidence: 0.8
          };
        }
      }
    }

    return null;
  }

  extractPriorities(query) {
    const priorityKeywords = {
      safety: ['safe', 'security', 'low crime', 'secure'],
      schools: ['schools', 'education', 'kids', 'children', 'family'],
      transport: ['transport', 'commute', 'subway', 'bus', 'taxi', 'walkable'],
      nightlife: ['nightlife', 'restaurants', 'bars', 'entertainment'],
      quiet: ['quiet', 'peaceful', 'residential', 'calm'],
      modern: ['modern', 'new', 'contemporary', 'updated'],
      affordable: ['cheap', 'affordable', 'budget', 'value'],
      luxury: ['luxury', 'upscale', 'premium', 'high-end']
    };

    const foundPriorities = [];
    const lowerQuery = query.toLowerCase();

    Object.entries(priorityKeywords).forEach(([priority, keywords]) => {
      const matches = keywords.filter(keyword => lowerQuery.includes(keyword));
      if (matches.length > 0) {
        foundPriorities.push({
          priority,
          keywords: matches,
          confidence: matches.length / keywords.length
        });
      }
    });

    return foundPriorities.length > 0 ? foundPriorities : null;
  }

  extractLifestyle(query) {
    const lifestylePatterns = {
      urban: ['city life', 'urban', 'downtown', 'bustling', 'vibrant'],
      suburban: ['suburban', 'family-friendly', 'residential', 'quiet'],
      coastal: ['beach', 'ocean', 'coastal', 'waterfront', 'sea view'],
      mountain: ['mountain', 'hiking', 'nature', 'outdoor'],
      cultural: ['cultural', 'arts', 'museums', 'galleries', 'historic']
    };

    const lowerQuery = query.toLowerCase();
    const lifestyles = [];

    Object.entries(lifestylePatterns).forEach(([lifestyle, keywords]) => {
      const matches = keywords.filter(keyword => lowerQuery.includes(keyword));
      if (matches.length > 0) {
        lifestyles.push({
          type: lifestyle,
          confidence: matches.length / keywords.length
        });
      }
    });

    return lifestyles.length > 0 ? lifestyles : null;
  }

  extractPropertyType(query) {
    const propertyTypes = {
      apartment: ['apartment', 'flat', 'unit'],
      house: ['house', 'home', 'villa'],
      townhouse: ['townhouse', 'townhome'],
      studio: ['studio', 'bachelor'],
      penthouse: ['penthouse'],
      cottage: ['cottage', 'garden cottage']
    };

    const lowerQuery = query.toLowerCase();

    for (const [type, keywords] of Object.entries(propertyTypes)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return { type, confidence: 0.8 };
      }
    }

    return null;
  }

  extractAmenities(query) {
    const amenityKeywords = {
      parking: ['parking', 'garage', 'car space'],
      pool: ['pool', 'swimming'],
      gym: ['gym', 'fitness', 'exercise'],
      garden: ['garden', 'yard', 'outdoor space'],
      security: ['security', 'gated', 'access control'],
      petFriendly: ['pet', 'dog', 'cat', 'animal'],
      furnished: ['furnished', 'furniture included']
    };

    const lowerQuery = query.toLowerCase();
    const amenities = [];

    Object.entries(amenityKeywords).forEach(([amenity, keywords]) => {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        amenities.push(amenity);
      }
    });

    return amenities.length > 0 ? amenities : null;
  }

  extractConstraints(query) {
    const constraints = [];
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('no pets') || lowerQuery.includes('pet-free')) {
      constraints.push('no_pets');
    }
    if (lowerQuery.includes('no smoking') || lowerQuery.includes('non-smoking')) {
      constraints.push('no_smoking');
    }
    if (lowerQuery.includes('ground floor') || lowerQuery.includes('no stairs')) {
      constraints.push('ground_floor');
    }
    if (lowerQuery.includes('short term') || lowerQuery.includes('temporary')) {
      constraints.push('short_term');
    }

    return constraints.length > 0 ? constraints : null;
  }

  async extractEntitiesWithAI(query) {
    const prompt = `Extract specific entities from this real estate query:

Query: "${query}"

Identify and extract:
1. Budget range (min/max amounts and currency)
2. Location preferences (specific areas, general regions)
3. Family composition (number of people, ages if mentioned)
4. Property requirements (bedrooms, bathrooms, type)
5. Lifestyle preferences (urban/suburban/coastal etc.)
6. Must-have amenities
7. Deal-breakers or constraints

Respond with a JSON object containing the extracted entities.`;

    try {
      const response = await geminiService.generateChatResponse(prompt, []);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn('AI entity extraction failed:', error);
    }

    return {};
  }

  mergeEntityResults(patternEntities, aiEntities) {
    // Merge pattern-based and AI-based entity extraction
    const merged = { ...patternEntities };

    // AI results can override or supplement pattern results
    Object.entries(aiEntities).forEach(([key, value]) => {
      if (value && (!merged[key] || merged[key].confidence < 0.7)) {
        merged[key] = { ...value, source: 'ai' };
      }
    });

    return merged;
  }

  buildSearchCriteria(intentAnalysis, entities) {
    const criteria = {};

    // Budget criteria
    if (entities.budget) {
      criteria.maxRent = entities.budget.max;
      if (entities.budget.min) criteria.minRent = entities.budget.min;
      criteria.currency = entities.budget.currency;
    }

    // Location criteria
    if (entities.location) {
      criteria.preferredAreas = entities.location.areas;
    }

    // Family criteria
    if (entities.familySize) {
      criteria.familySize = entities.familySize.size;
      if (entities.familySize.kids > 0) {
        criteria.familyFriendly = true;
        criteria.schoolImportance = 'high';
      }
    }

    // Priority-based criteria
    if (entities.priorities) {
      entities.priorities.forEach(priority => {
        switch (priority.priority) {
          case 'safety':
            criteria.minSafetyScore = 7;
            break;
          case 'schools':
            criteria.schoolImportance = 'high';
            break;
          case 'transport':
            criteria.transitAccess = true;
            break;
          case 'quiet':
            criteria.lifestyle = 'quiet';
            break;
          case 'luxury':
            criteria.luxuryFeatures = true;
            break;
        }
      });
    }

    // Lifestyle criteria
    if (entities.lifestyle) {
      criteria.lifestylePreferences = Array.isArray(entities.lifestyle)
        ? entities.lifestyle.map(l => l.type)
        : [entities.lifestyle.type];
    }

    // Property type
    if (entities.propertyType) {
      criteria.propertyType = entities.propertyType.type;
    }

    // Amenities
    if (entities.amenities) {
      criteria.requiredAmenities = entities.amenities;
    }

    // Constraints
    if (entities.constraints) {
      criteria.constraints = entities.constraints;
    }

    // Intent-based adjustments
    if (intentAnalysis.investmentContext) {
      criteria.investmentPotential = true;
    }

    if (intentAnalysis.urgency === 'high') {
      criteria.availabilityRequired = true;
    }

    return criteria;
  }

  generateExplanation(criteria) {
    const parts = [];

    if (criteria.maxRent) {
      parts.push(`Budget up to ${criteria.currency || 'R'}${criteria.maxRent.toLocaleString()}`);
    }

    if (criteria.preferredAreas) {
      parts.push(`Looking in ${criteria.preferredAreas.join(', ')}`);
    }

    if (criteria.familyFriendly) {
      parts.push(`Family-friendly with good schools`);
    }

    if (criteria.minSafetyScore) {
      parts.push(`High safety priority (${criteria.minSafetyScore}+ score)`);
    }

    if (criteria.transitAccess) {
      parts.push(`Good public transport access`);
    }

    return parts.length > 0 ? 
      `Searching for: ${parts.join(', ')}` : 
      'General neighborhood search';
  }

  fallbackIntentAnalysis(query) {
    const lowerQuery = query.toLowerCase();
    
    let intent = 'search';
    if (lowerQuery.includes('compare')) intent = 'compare';
    else if (lowerQuery.includes('analyze')) intent = 'analyze';
    else if (lowerQuery.includes('recommend')) intent = 'recommend';
    else if (lowerQuery.includes('predict')) intent = 'predict';

    return {
      intent,
      confidence: 0.6,
      primaryGoal: 'neighborhood search',
      urgency: 'medium',
      specificity: 'moderate',
      familyContext: lowerQuery.includes('family') || lowerQuery.includes('kids'),
      investmentContext: lowerQuery.includes('invest') || lowerQuery.includes('buy'),
      budgetMentioned: /\d+/.test(query),
      locationSpecific: false
    };
  }

  fallbackParsing(query) {
    return {
      originalQuery: query,
      intent: { intent: 'search', confidence: 0.5 },
      entities: this.extractEntities(query),
      searchCriteria: { query: query.toLowerCase() },
      naturalLanguageExplanation: `Searching for: ${query}`
    };
  }

  initializeIntentPatterns() {
    return {
      search: /(?:find|show|search|look|need|want)/i,
      compare: /(?:compare|versus|vs|difference)/i,
      analyze: /(?:analyze|analysis|insights|trends)/i,
      recommend: /(?:recommend|suggest|best|top)/i,
      predict: /(?:predict|forecast|future|will)/i
    };
  }

  initializeEntityExtractors() {
    return {
      budget: this.extractBudget,
      location: this.extractLocation,
      familySize: this.extractFamilySize,
      timeframe: this.extractTimeframe,
      priorities: this.extractPriorities
    };
  }
}

module.exports = AdvancedNLP;
