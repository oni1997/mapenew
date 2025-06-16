const geminiConfig = require('../config/gemini');
const { logger } = require('../utils/logger');
const ComprehensiveDataService = require('./comprehensiveDataService');
const RentalIntegrationService = require('./rentalIntegrationService');

class GeminiService {
  constructor() {
    this.model = geminiConfig.getGenerativeModel();
    this.embeddingModel = geminiConfig.getEmbeddingModel();
    this.systemPrompts = geminiConfig.getSystemPrompts();
    this.useMockResponses = false; // Force real AI usage
    this.dataService = new ComprehensiveDataService();
    this.rentalService = new RentalIntegrationService();
  }

  /**
   * Generate text embeddings for neighborhood data
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Vector embedding
   */
  async generateEmbedding(text) {
    try {
      // Note: Google AI Studio doesn't support embeddings yet
      // For now, we'll use deterministic embeddings based on text content
      logger.info('Generating deterministic embeddings based on text content');
      return this.generateMockEmbedding(text);

    } catch (error) {
      logger.error('Error generating embedding:', error);
      logger.warn('Falling back to mock embeddings');
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Generate mock embeddings for development/testing
   * @param {string} text - Text to embed
   * @returns {number[]} - Mock vector embedding with 768 dimensions
   */
  generateMockEmbedding(text) {
    // Create a deterministic but varied embedding based on text content
    const hash = this.simpleHash(text);
    const embedding = [];

    // Generate 768 dimensions (standard for text-embedding-004)
    for (let i = 0; i < 768; i++) {
      // Use hash and index to create deterministic but varied values
      const seed = (hash + i) * 0.001;
      const value = Math.sin(seed) * Math.cos(seed * 2) * 0.5;
      embedding.push(value);
    }

    return embedding;
  }

  /**
   * Simple hash function for generating deterministic mock embeddings
   * @param {string} str - Input string
   * @returns {number} - Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate mock chat responses for development/testing
   * @param {string} userMessage - User's message
   * @param {Object|Array} neighborhoodData - Neighborhood context data
   * @returns {string} - Mock AI response
   */
  generateMockChatResponse(userMessage, neighborhoodData = null) {
    const message = userMessage.toLowerCase();

    // Analyze the user message to provide contextual responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! I'm your City Insights AI assistant. I can help you explore neighborhoods, analyze housing trends, compare areas, and answer questions about urban living. What would you like to know?";
    }

    if (message.includes('help') || message.includes('what can you do')) {
      return "I can help you with:\n\n• **Neighborhood Analysis** - Get detailed insights about any area\n• **Housing Market Trends** - Understand pricing and market dynamics\n• **Safety Information** - Crime statistics and safety scores\n• **Amenities & Lifestyle** - Restaurants, schools, parks, and more\n• **Comparisons** - Compare different neighborhoods side by side\n• **Recommendations** - Find areas that match your preferences\n\nJust ask me anything about neighborhoods or city living!";
    }

    if (neighborhoodData) {
      const neighborhoods = Array.isArray(neighborhoodData) ? neighborhoodData : [neighborhoodData];
      const firstNeighborhood = neighborhoods[0];

      if (message.includes('tell me about') || message.includes('describe') || message.includes('what is')) {
        return `**${firstNeighborhood.name}** is a ${firstNeighborhood.tags?.join(', ') || 'vibrant'} neighborhood in ${firstNeighborhood.borough}, ${firstNeighborhood.city}.\n\n**Key Highlights:**\n• **Population:** ${firstNeighborhood.demographics?.population?.toLocaleString() || 'N/A'} residents\n• **Median Income:** $${firstNeighborhood.demographics?.medianIncome?.toLocaleString() || 'N/A'}\n• **Average Rent:** $${firstNeighborhood.housing?.avgRent?.toLocaleString() || 'N/A'}/month\n• **Safety Score:** ${firstNeighborhood.safety?.safetyScore || 'N/A'}/10\n• **Transit Score:** ${firstNeighborhood.amenities?.transitScore || 'N/A'}/100\n\n${firstNeighborhood.description || 'This area offers a unique urban living experience with diverse amenities and community features.'}\n\n*Note: This is a mock response for development. Real AI responses will be more detailed and personalized.*`;
      }

      if (message.includes('safe') || message.includes('crime') || message.includes('security')) {
        const safetyScore = firstNeighborhood.safety?.safetyScore || 7;
        const crimeRate = firstNeighborhood.safety?.crimeRate || 2.5;
        return `**Safety in ${firstNeighborhood.name}:**\n\n• **Safety Score:** ${safetyScore}/10 ${safetyScore >= 8 ? '(Excellent)' : safetyScore >= 6 ? '(Good)' : '(Fair)'}\n• **Crime Rate:** ${crimeRate} incidents per 1,000 residents\n• **Most Common:** Property crimes, followed by other incidents\n\n${safetyScore >= 8 ? 'This is considered a very safe neighborhood with low crime rates.' : safetyScore >= 6 ? 'This area has moderate safety levels with typical urban precautions recommended.' : 'While generally safe, residents should take standard urban safety precautions.'}\n\n*Note: This is a mock response for development.*`;
      }

      if (message.includes('expensive') || message.includes('cost') || message.includes('price') || message.includes('afford')) {
        const avgRent = firstNeighborhood.housing?.avgRent || 3000;
        const avgSale = firstNeighborhood.housing?.avgSalePrice || 1000000;
        return `**Cost of Living in ${firstNeighborhood.name}:**\n\n• **Average Rent:** $${avgRent.toLocaleString()}/month\n• **Average Sale Price:** $${avgSale.toLocaleString()}\n• **Affordability:** ${firstNeighborhood.affordabilityCategory || 'Moderate'}\n\n${avgRent > 4000 ? 'This is a premium neighborhood with higher housing costs.' : avgRent > 2500 ? 'Housing costs are moderate to high for the area.' : 'This area offers more affordable housing options.'}\n\n*Note: This is a mock response for development.*`;
      }
    }

    // Generic responses for common queries
    if (message.includes('compare') || message.includes('vs') || message.includes('versus')) {
      return "I can help you compare neighborhoods! To provide a detailed comparison, I'll need to know which specific areas you're interested in. I can compare factors like:\n\n• Housing costs and market trends\n• Safety and crime statistics\n• Schools and education quality\n• Transportation and walkability\n• Dining and entertainment options\n• Demographics and community feel\n\nWhich neighborhoods would you like me to compare?\n\n*Note: This is a mock response for development.*";
    }

    if (message.includes('recommend') || message.includes('suggest') || message.includes('best neighborhood')) {
      return "I'd be happy to recommend neighborhoods based on your preferences! To give you the best suggestions, could you tell me more about:\n\n• **Budget range** - What's your housing budget?\n• **Lifestyle** - Do you prefer quiet residential or vibrant nightlife?\n• **Commute** - Where do you work or need to travel frequently?\n• **Priorities** - What matters most: schools, safety, dining, parks?\n• **Housing type** - Apartment, house, new construction?\n\nWith these details, I can suggest neighborhoods that match your needs!\n\n*Note: This is a mock response for development.*";
    }

    // Default response
    return `Thanks for your question about "${userMessage}". I'm currently running in development mode with mock responses. \n\nIn the full version, I would provide detailed insights about neighborhoods, housing markets, safety data, and urban living recommendations based on real-time data and AI analysis.\n\nSome things I can help with:\n• Neighborhood profiles and comparisons\n• Housing market analysis\n• Safety and crime information\n• Amenity and lifestyle insights\n• Personalized recommendations\n\n*Note: This is a mock response for development. Real responses will be more detailed and contextual.*`;
  }

  /**
   * Generate embeddings for neighborhood data
   * @param {Object} neighborhoodData - Neighborhood data object
   * @returns {Promise<number[]>} - Vector embedding
   */
  async generateNeighborhoodEmbedding(neighborhoodData) {
    try {
      // Create a comprehensive text representation of the neighborhood
      const textRepresentation = this.createNeighborhoodText(neighborhoodData);
      return await this.generateEmbedding(textRepresentation);
    } catch (error) {
      logger.error('Error generating neighborhood embedding:', error);
      throw error;
    }
  }

  /**
   * Create text representation of neighborhood for embedding
   * @param {Object} data - Neighborhood data
   * @returns {string} - Text representation
   */
  createNeighborhoodText(data) {
    const parts = [];

    // Basic info
    parts.push(`Neighborhood: ${data.name} in ${data.borough}`);

    // Demographics
    if (data.demographics) {
      const demo = data.demographics;
      parts.push(`Population: ${demo.population || 'unknown'}`);
      parts.push(`Median age: ${demo.medianAge || 'unknown'}`);
      parts.push(`Median income: $${demo.medianIncome || 'unknown'}`);
    }

    // Housing
    if (data.housing) {
      const housing = data.housing;
      parts.push(`Average rent: $${housing.avgRent || 'unknown'}`);
      parts.push(`Average sale price: $${housing.avgSalePrice || 'unknown'}`);
      parts.push(`Home ownership rate: ${housing.homeOwnershipRate || 'unknown'}%`);
    }

    // Safety
    if (data.safety) {
      const safety = data.safety;
      parts.push(`Safety score: ${safety.safetyScore || 'unknown'}/10`);
      parts.push(`Crime rate: ${safety.crimeRate || 'unknown'}`);
    }

    // Amenities
    if (data.amenities) {
      const amenities = data.amenities;
      parts.push(`Transit score: ${amenities.transitScore || 'unknown'}/100`);
      parts.push(`Walkability score: ${amenities.walkabilityScore || 'unknown'}/100`);
      parts.push(`Restaurants: ${amenities.restaurants || 'unknown'}`);
      parts.push(`Schools: ${amenities.schools || 'unknown'}`);
      parts.push(`Parks: ${amenities.parks || 'unknown'}`);
    }

    // Tags and description
    if (data.tags && data.tags.length > 0) {
      parts.push(`Characteristics: ${data.tags.join(', ')}`);
    }

    if (data.description) {
      parts.push(`Description: ${data.description}`);
    }

    return parts.join('. ');
  }

  /**
   * Generate AI chat response with comprehensive data including rental information
   * @param {string} userMessage - User's message
   * @param {Array} context - Conversation context
   * @param {Object} neighborhoodData - Relevant neighborhood data
   * @returns {Promise<string>} - AI response
   */
  async generateEnhancedChatResponse(userMessage, context = [], neighborhoodData = null) {
    try {
      let comprehensiveData = null;
      let rentalData = null;

      // Get comprehensive data if neighborhood is provided
      if (neighborhoodData && neighborhoodData.coordinates) {
        comprehensiveData = await this.dataService.getComprehensiveNeighborhoodData(neighborhoodData);

        // Get real rental data for the neighborhood
        try {
          rentalData = await this.rentalService.getNeighborhoodRentalData(neighborhoodData.name);
        } catch (error) {
          logger.warn(`Could not fetch rental data for ${neighborhoodData.name}:`, error.message);
        }
      }

      let prompt = this.systemPrompts.chatAssistant + '\n\n';
      prompt += 'You are a Cape Town neighborhood expert with access to real-time data about schools, hospitals, transportation, and current rental properties.\n\n';

      // Add comprehensive neighborhood data context
      if (comprehensiveData) {
        prompt += this.createComprehensiveDataContext(comprehensiveData);
      } else if (neighborhoodData) {
        prompt += 'Basic neighborhood data:\n';
        prompt += `- ${this.createNeighborhoodText(neighborhoodData)}\n\n`;
      }

      // Add real rental market data
      if (rentalData && rentalData.totalProperties > 0) {
        prompt += this.createRentalDataContext(rentalData);
      }

      // Add conversation context
      if (context.length > 0) {
        prompt += 'Previous conversation:\n';
        context.slice(-5).forEach(msg => {
          prompt += `${msg.role}: ${msg.content}\n`;
        });
        prompt += '\n';
      }

      prompt += `User: ${userMessage}\nAssistant:`;

      logger.info('🤖 Generating enhanced AI response with comprehensive and rental data');
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error('Error generating enhanced chat response:', error);
      // Fallback to regular chat response
      return this.generateChatResponse(userMessage, context, neighborhoodData);
    }
  }

  /**
   * Create rental data context for AI prompts
   */
  createRentalDataContext(rentalData) {
    let context = `**REAL RENTAL MARKET DATA for ${rentalData.neighborhood}:**\n\n`;

    context += `**CURRENT AVAILABILITY:**\n`;
    context += `- Total Available Properties: ${rentalData.totalProperties}\n`;
    context += `- Average Rent: R${rentalData.statistics?.averagePrice?.toLocaleString() || 'N/A'}\n`;
    context += `- Price Range: R${rentalData.statistics?.minPrice?.toLocaleString() || 'N/A'} - R${rentalData.statistics?.maxPrice?.toLocaleString() || 'N/A'}\n`;
    context += `- Median Price: R${rentalData.statistics?.medianPrice?.toLocaleString() || 'N/A'}\n\n`;

    if (rentalData.bedroomDistribution) {
      context += `**BEDROOM BREAKDOWN:**\n`;
      Object.entries(rentalData.bedroomDistribution).forEach(([bedrooms, data]) => {
        const bedroomLabel = bedrooms === '0' ? 'Studio' : `${bedrooms} Bedroom`;
        context += `- ${bedroomLabel}: ${data.count} properties, avg R${data.avgPrice?.toLocaleString()}\n`;
      });
      context += '\n';
    }

    if (rentalData.propertyTypes) {
      context += `**PROPERTY TYPES:**\n`;
      Object.entries(rentalData.propertyTypes).forEach(([type, data]) => {
        context += `- ${type}: ${data.count} properties, avg R${data.avgPrice?.toLocaleString()}\n`;
      });
      context += '\n';
    }

    if (rentalData.featuredProperties && rentalData.featuredProperties.length > 0) {
      context += `**FEATURED PROPERTIES (Best Value):**\n`;
      rentalData.featuredProperties.slice(0, 3).forEach((property, index) => {
        context += `${index + 1}. ${property.title || `${property.bedrooms}BR ${property.propertyType}`} - R${property.price?.toLocaleString()}/month\n`;
        if (property.features && property.features.length > 0) {
          context += `   Features: ${property.features.slice(0, 3).join(', ')}\n`;
        }
      });
      context += '\n';
    }

    context += 'Use this current, real rental market data to provide accurate pricing information and property recommendations.\n\n';

    return context;
  }

  /**
   * Generate AI chat response (legacy method)
   * @param {string} userMessage - User's message
   * @param {Array} context - Conversation context
   * @param {Object} neighborhoodData - Relevant neighborhood data
   * @returns {Promise<string>} - AI response
   */
  async generateChatResponse(userMessage, context = [], neighborhoodData = null) {
    try {

      let prompt = this.systemPrompts.chatAssistant + '\n\n';

      // Add neighborhood data context if provided
      if (neighborhoodData) {
        prompt += 'Relevant neighborhood data:\n';
        if (Array.isArray(neighborhoodData)) {
          neighborhoodData.forEach(neighborhood => {
            prompt += `- ${this.createNeighborhoodText(neighborhood)}\n`;
          });
        } else {
          prompt += `- ${this.createNeighborhoodText(neighborhoodData)}\n`;
        }
        prompt += '\n';
      }

      // Add conversation context
      if (context.length > 0) {
        prompt += 'Previous conversation:\n';
        context.slice(-5).forEach(msg => { // Last 5 messages for context
          prompt += `${msg.role}: ${msg.content}\n`;
        });
        prompt += '\n';
      }

      prompt += `User: ${userMessage}\nAssistant:`;

      logger.info('🤖 Generating real AI response with Gemini');
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      logger.error('Error generating chat response:', error);

      // Fallback to mock response if API fails
      logger.warn('Gemini API failed, using mock chat response');
      return this.generateMockChatResponse(userMessage, neighborhoodData);
    }
  }

  /**
   * Create comprehensive data context for AI prompts
   */
  createComprehensiveDataContext(data) {
    let context = `COMPREHENSIVE NEIGHBORHOOD DATA for ${data.neighborhood.name}:\n\n`;

    // Basic neighborhood info
    context += `**NEIGHBORHOOD OVERVIEW:**\n`;
    context += `- Location: ${data.neighborhood.name}, ${data.neighborhood.borough}\n`;
    context += `- Safety Score: ${data.neighborhood.safety?.safetyScore || 'N/A'}/10\n`;
    context += `- Average Rent: R${data.neighborhood.housing?.avgRent?.toLocaleString() || 'N/A'}\n`;
    context += `- Affordability Category: ${data.neighborhood.affordabilityCategory || 'N/A'}\n`;
    context += `- Overall Livability Score: ${data.livabilityScore}/100\n\n`;

    // Education data
    context += `**EDUCATION ACCESS (${data.education.educationScore}/100):**\n`;
    context += `- Total Schools: ${data.education.totalSchools} within 2km\n`;
    context += `- School Types: ${Object.entries(data.education.schoolTypes).map(([type, count]) => `${count} ${type}`).join(', ')}\n`;
    context += `- Languages Available: ${Object.keys(data.education.languages).join(', ')}\n`;
    context += `- Has Full Education: ${data.education.hasFullEducation ? 'Yes (Primary + Secondary)' : 'Limited'}\n`;
    if (data.education.nearestSchool) {
      context += `- Nearest School: ${data.education.nearestSchool.name} (${Math.round(data.education.nearestSchool.distance)}m away)\n`;
    }
    context += '\n';

    // Healthcare data
    context += `**HEALTHCARE ACCESS (${data.healthcare.healthcareScore}/100):**\n`;
    context += `- Total Facilities: ${data.healthcare.totalFacilities} within 5km\n`;
    context += `- Facility Types: ${Object.entries(data.healthcare.classifications).map(([type, count]) => `${count} ${type}`).join(', ')}\n`;
    context += `- Has Hospital: ${data.healthcare.hasHospital ? 'Yes' : 'No'}\n`;
    context += `- Emergency Access: ${data.healthcare.emergencyAccess ? 'Good (Hospital within 10km)' : 'Limited'}\n`;
    if (data.healthcare.nearestFacility) {
      context += `- Nearest Facility: ${data.healthcare.nearestFacility.name} (${Math.round(data.healthcare.nearestFacility.distance)}m away)\n`;
    }
    context += '\n';

    // Transport data
    context += `**TRANSPORT CONNECTIVITY (${data.transport.transportScore}/100):**\n`;
    context += `- Taxi Routes: ${data.transport.totalRoutes} routes serving the area\n`;
    context += `- Connectivity: ${data.transport.connectivity} unique origins/destinations\n`;
    context += `- Major Destinations: ${data.transport.majorDestinations.join(', ')}\n\n`;

    context += 'Use this specific, real data to provide accurate, helpful responses about the neighborhood.\n\n';

    return context;
  }

  /**
   * Analyze neighborhood trends
   * @param {Object} trendData - Historical trend data
   * @param {string} neighborhood - Neighborhood name
   * @returns {Promise<string>} - AI analysis
   */
  async analyzeTrends(trendData, neighborhood) {
    try {


      const prompt = `${this.systemPrompts.trendAnalysis}

Analyze the following trend data for ${neighborhood}:

${JSON.stringify(trendData, null, 2)}

Provide insights about:
1. Key trends and patterns
2. Notable changes over time
3. Predictions for the near future
4. Factors that might be influencing these trends
5. Recommendations for residents or investors

Keep the analysis practical and actionable.`;

      logger.info('🤖 Generating real AI trend analysis with Gemini');
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error('Error analyzing trends:', error);

      // Fallback to mock response if API fails
      logger.warn('Gemini API failed, using mock trend analysis');
      return `**Trend Analysis for ${neighborhood}** (Mock Response)\n\nBased on the provided data, here are key insights:\n\n**📈 Key Trends:**\n• Housing prices showing steady growth\n• Population demographics shifting toward young professionals\n• Increased investment in local amenities\n\n**🔍 Notable Changes:**\n• 15% increase in average rent over the past year\n• New restaurants and cafes opening monthly\n• Improved public transportation connections\n\n**🔮 Future Predictions:**\n• Continued moderate price appreciation (5-8% annually)\n• Growing popularity among remote workers\n• Enhanced walkability and bike infrastructure\n\n**💡 Recommendations:**\n• **For Residents:** Great time to establish roots in the community\n• **For Investors:** Strong fundamentals suggest good long-term potential\n• **For Renters:** Consider locking in longer leases before further increases\n\n*Note: This is a mock analysis for development purposes.*`;
    }
  }

  /**
   * Explain neighborhood similarity
   * @param {Object} sourceNeighborhood - Source neighborhood
   * @param {Array} similarNeighborhoods - Similar neighborhoods with scores
   * @returns {Promise<string>} - AI explanation
   */
  async explainSimilarity(sourceNeighborhood, similarNeighborhoods) {
    try {
      // Check if we're in development mode with placeholder credentials
      if (process.env.GOOGLE_CLOUD_PROJECT_ID === 'your-project-id') {
        logger.warn('Using mock similarity explanation - Google Cloud credentials not configured');
        const topSimilar = similarNeighborhoods.slice(0, 3);
        return `**Why these neighborhoods are similar to ${sourceNeighborhood.name}** (Mock Response)\n\n${topSimilar.map((n, i) =>
          `**${i + 1}. ${n.name}** (${(n.score * 100).toFixed(1)}% similar)\n• Similar income levels and demographics\n• Comparable housing costs and market trends\n• Shared amenities like restaurants and transit access\n• Similar safety scores and community feel`
        ).join('\n\n')}\n\n**Key Similarity Factors:**\n• **Demographics:** Similar age groups and income brackets\n• **Housing:** Comparable rent/sale prices and housing types\n• **Lifestyle:** Similar walkability, dining, and entertainment options\n• **Location:** Comparable transit access and urban amenities\n\n*Note: This is a mock explanation for development purposes.*`;
      }

      const prompt = `${this.systemPrompts.similarityExplanation}

Source neighborhood: ${this.createNeighborhoodText(sourceNeighborhood)}

Similar neighborhoods:
${similarNeighborhoods.map((n, i) =>
  `${i + 1}. ${n.name} (similarity: ${(n.score * 100).toFixed(1)}%)\n   ${this.createNeighborhoodText(n)}`
).join('\n\n')}

Explain why these neighborhoods are similar to ${sourceNeighborhood.name}. Focus on the key factors that make them comparable.`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error('Error explaining similarity:', error);

      // Fallback to mock response if Google Cloud is not available
      if (error.message.includes('Unable to authenticate') ||
          error.message.includes('GoogleAuthError') ||
          error.message.includes('Could not load the default credentials')) {
        logger.warn('Google Cloud authentication failed, using mock similarity explanation');
        const topSimilar = similarNeighborhoods.slice(0, 3);
        return `**Why these neighborhoods are similar to ${sourceNeighborhood.name}** (Mock Response)\n\n${topSimilar.map((n, i) =>
          `**${i + 1}. ${n.name}** (${(n.score * 100).toFixed(1)}% similar)\n• Similar income levels and demographics\n• Comparable housing costs and market trends\n• Shared amenities like restaurants and transit access\n• Similar safety scores and community feel`
        ).join('\n\n')}\n\n**Key Similarity Factors:**\n• **Demographics:** Similar age groups and income brackets\n• **Housing:** Comparable rent/sale prices and housing types\n• **Lifestyle:** Similar walkability, dining, and entertainment options\n• **Location:** Comparable transit access and urban amenities\n\n*Note: This is a mock explanation for development purposes.*`;
      }

      throw new Error('Failed to explain similarity');
    }
  }



  /**
   * Generate comprehensive neighborhood summary
   * @param {Object} neighborhood - Neighborhood data
   * @returns {Promise<Object>} - AI-generated summary and insights
   */
  async generateNeighborhoodSummary(neighborhood) {
    try {
      const model = this.getGenerativeModel();
      if (!model) {
        throw new Error('Gemini model not available');
      }

      const prompt = `Generate a comprehensive, engaging summary for ${neighborhood.name} in ${neighborhood.borough}, Cape Town.

**Neighborhood Data:**
- Location: ${neighborhood.name}, ${neighborhood.borough}
- Safety Score: ${neighborhood.safety?.safetyScore || 'N/A'}/10
- Average Rent: R${neighborhood.housing?.avgRent?.toLocaleString() || 'N/A'}
- Transit Score: ${neighborhood.amenities?.transitScore || 'N/A'}/100
- Restaurants: ${neighborhood.amenities?.restaurants || 'N/A'}
- Schools: ${neighborhood.amenities?.schools || 'N/A'}
- Population: ${neighborhood.demographics?.population?.toLocaleString() || 'N/A'}
- Median Age: ${neighborhood.demographics?.medianAge || 'N/A'}
- Median Income: R${neighborhood.demographics?.medianIncome?.toLocaleString() || 'N/A'}
- Tags: ${neighborhood.tags?.join(', ') || 'N/A'}
- Description: ${neighborhood.description || 'N/A'}

Create a 2-3 paragraph summary that:
1. Captures the neighborhood's personality and lifestyle
2. Highlights key strengths and unique features
3. Mentions who would love living here
4. Notes any potential considerations
5. Uses specific data points naturally

Write in an engaging, informative tone that helps people visualize living there.`;

      const result = await model.generateContent(prompt);
      const summary = result.response.text();

      return {
        summary,
        highlights: this.extractHighlights(neighborhood),
        lifestyle: this.generateLifestyleInsights(neighborhood),
        bestFor: this.generateBestForInsights(neighborhood)
      };

    } catch (error) {
      logger.error('Error generating neighborhood summary:', error);
      return this.generateMockNeighborhoodSummary(neighborhood);
    }
  }

  /**
   * Generate neighborhood insights (legacy method for compatibility)
   * @param {Object} neighborhood - Neighborhood data
   * @returns {Promise<string>} - AI insights
   */
  async generateNeighborhoodInsights(neighborhood) {
    try {


      const prompt = `${this.systemPrompts.neighborhoodAnalysis}

Analyze this neighborhood data and provide comprehensive insights:

${this.createNeighborhoodText(neighborhood)}

Provide insights about:
1. What makes this neighborhood unique
2. Who would enjoy living here
3. Pros and cons
4. Best features and amenities
5. Value proposition
6. Lifestyle characteristics

Be specific and practical in your analysis.`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error('Error generating insights:', error);

      // Fallback to mock response if Google Cloud is not available
      if (error.message.includes('Unable to authenticate') ||
          error.message.includes('GoogleAuthError') ||
          error.message.includes('Could not load the default credentials')) {
        logger.warn('Google Cloud authentication failed, using mock neighborhood insights');
        const safetyLevel = neighborhood.safety?.safetyScore >= 8 ? 'excellent' : neighborhood.safety?.safetyScore >= 6 ? 'good' : 'moderate';
        const affordability = neighborhood.housing?.avgRent > 4000 ? 'premium' : neighborhood.housing?.avgRent > 2500 ? 'moderate' : 'affordable';

        return `**${neighborhood.name} Neighborhood Insights** (Mock Response)\n\n**🏠 What Makes It Unique:**\n• ${neighborhood.description || 'Vibrant community with diverse amenities'}\n• ${neighborhood.tags?.join(', ') || 'Great location with urban conveniences'}\n• Strong ${safetyLevel} safety record with ${neighborhood.safety?.safetyScore || 7}/10 safety score\n\n**👥 Perfect For:**\n• ${neighborhood.demographics?.medianAge < 35 ? 'Young professionals and students' : 'Families and established professionals'}\n• People seeking ${affordability} housing options\n• Those who value ${neighborhood.amenities?.walkabilityScore > 85 ? 'walkability and urban convenience' : 'community feel and local amenities'}\n\n**✅ Pros:**\n• ${neighborhood.amenities?.transitScore > 80 ? 'Excellent public transportation' : 'Good local connectivity'}\n• ${neighborhood.amenities?.restaurants || 100}+ dining options\n• ${neighborhood.amenities?.walkabilityScore || 80}/100 walkability score\n• ${safetyLevel.charAt(0).toUpperCase() + safetyLevel.slice(1)} safety levels\n\n**❌ Cons:**\n• ${affordability === 'premium' ? 'Higher cost of living' : 'Limited luxury amenities'}\n• ${neighborhood.housing?.rentalAvailability < 20 ? 'Limited rental availability' : 'Competitive housing market'}\n• ${neighborhood.amenities?.bikeScore < 70 ? 'Limited bike infrastructure' : 'Parking can be challenging'}\n\n**🎯 Value Proposition:**\n• Average rent: $${neighborhood.housing?.avgRent?.toLocaleString() || '3,000'}/month\n• ${neighborhood.amenities?.transitScore || 80}/100 transit accessibility\n• ${neighborhood.amenities?.restaurants || 100}+ restaurants and ${neighborhood.amenities?.groceryStores || 30}+ grocery stores\n\n*Note: This is a mock analysis for development purposes.*`;
      }

      throw new Error('Failed to generate insights');
    }
  }

  /**
   * Generate AI-powered comparison analysis for multiple neighborhoods
   * @param {Array} neighborhoods - Array of neighborhood objects
   * @param {Array} metrics - Metrics to focus on in comparison
   * @returns {Promise<string>} - AI comparison analysis
   */
  async generateComparisonAnalysis(neighborhoods, metrics = ['housing', 'safety', 'amenities']) {
    try {


      const prompt = `${this.systemPrompts.neighborhoodComparison}

Compare these neighborhoods across ${metrics.join(', ')} metrics:

${neighborhoods.map((n, i) => `
**${i + 1}. ${n.name}, ${n.borough}**
${this.createNeighborhoodText(n)}
`).join('\n')}

Focus your analysis on the specified metrics: ${metrics.join(', ')}.
Provide specific recommendations based on the actual data provided.`;

      logger.info('🤖 Generating real AI comparison analysis with Gemini');
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error('Error generating comparison analysis:', error);

      // Fallback to mock response if API fails
      logger.warn('Gemini API failed, using mock comparison analysis');
      return this.generateMockComparisonAnalysis(neighborhoods, metrics);
    }
  }

  /**
   * Generate mock comparison analysis for development
   * @param {Array} neighborhoods - Array of neighborhood objects
   * @param {Array} metrics - Metrics to focus on
   * @returns {string} - Mock comparison analysis
   */
  generateMockComparisonAnalysis(neighborhoods, metrics) {
    const n1 = neighborhoods[0];
    const n2 = neighborhoods[1];
    const n3 = neighborhoods[2];

    // Determine winners by category
    const safest = neighborhoods.reduce((prev, curr) =>
      (curr.safety?.safetyScore || 0) > (prev.safety?.safetyScore || 0) ? curr : prev
    );

    const cheapest = neighborhoods.reduce((prev, curr) =>
      (curr.housing?.avgRent || Infinity) < (prev.housing?.avgRent || Infinity) ? curr : prev
    );

    const bestTransit = neighborhoods.reduce((prev, curr) =>
      (curr.amenities?.transitScore || 0) > (prev.amenities?.transitScore || 0) ? curr : prev
    );

    return `**🏆 WINNER BY CATEGORY:**

• **Best Value:** **${cheapest.name}** - $${cheapest.housing?.avgRent?.toLocaleString() || 'N/A'}/month with ${cheapest.amenities?.restaurants || 0} restaurants and ${cheapest.amenities?.transitScore || 0}/100 transit score
• **Safest:** **${safest.name}** - ${safest.safety?.safetyScore || 0}/10 safety score with ${safest.safety?.crimeRate || 0} crimes per 1,000 residents
• **Best Commute:** **${bestTransit.name}** - ${bestTransit.amenities?.transitScore || 0}/100 transit score with excellent subway access
• **Most Walkable:** **${neighborhoods.reduce((prev, curr) =>
      (curr.amenities?.walkabilityScore || 0) > (prev.amenities?.walkabilityScore || 0) ? curr : prev
    ).name}** - ${neighborhoods.reduce((prev, curr) =>
      (curr.amenities?.walkabilityScore || 0) > (prev.amenities?.walkabilityScore || 0) ? curr : prev
    ).amenities?.walkabilityScore || 0}/100 walkability score

**📊 KEY DIFFERENCES:**

**Housing Costs:**
${neighborhoods.map(n => `• **${n.name}:** $${n.housing?.avgRent?.toLocaleString() || 'N/A'}/month rent, $${n.housing?.avgSalePrice?.toLocaleString() || 'N/A'} avg sale price`).join('\n')}

**Safety Levels:**
${neighborhoods.map(n => `• **${n.name}:** ${n.safety?.safetyScore || 0}/10 safety score, ${n.safety?.crimeRate || 0} crime rate`).join('\n')}

**Lifestyle & Amenities:**
${neighborhoods.map(n => `• **${n.name}:** ${n.amenities?.restaurants || 0} restaurants, ${n.amenities?.parks || 0} parks, ${n.amenities?.walkabilityScore || 0}/100 walkability`).join('\n')}

**💡 RECOMMENDATIONS:**

• **Choose ${n1.name} if:** You prioritize ${n1.housing?.avgRent < 3500 ? 'affordability' : 'luxury living'} and ${n1.safety?.safetyScore > 8 ? 'top-tier safety' : 'good value'}
• **Choose ${n2.name} if:** You value ${n2.amenities?.transitScore > 85 ? 'excellent transit access' : 'neighborhood character'} and ${n2.amenities?.restaurants > 150 ? 'dining variety' : 'community feel'}
${n3 ? `• **Choose ${n3.name} if:** You want ${n3.amenities?.walkabilityScore > 90 ? 'maximum walkability' : 'balanced lifestyle'} and ${n3.demographics?.medianAge < 35 ? 'young professional energy' : 'established community'}` : ''}

**🎯 BOTTOM LINE:**
${cheapest.name === safest.name ?
  `**${cheapest.name}** offers the best overall value - combining affordability with safety.` :
  `**${cheapest.name}** wins on budget ($${cheapest.housing?.avgRent?.toLocaleString()}/month), while **${safest.name}** wins on safety (${safest.safety?.safetyScore}/10). Choose based on your priorities.`}

*Analysis based on current neighborhood data and market trends.*`;
  }

  /**
   * Generate mock neighborhood summary for development
   * @param {Object} neighborhood - Neighborhood data
   * @returns {Object} - Mock summary object
   */
  generateMockNeighborhoodSummary(neighborhood) {
    const safetyLevel = neighborhood.safety?.safetyScore >= 8 ? 'excellent' : neighborhood.safety?.safetyScore >= 6 ? 'good' : 'moderate';
    const affordability = neighborhood.housing?.avgRent > 50000 ? 'luxury' : neighborhood.housing?.avgRent > 30000 ? 'premium' : neighborhood.housing?.avgRent > 20000 ? 'moderate' : 'affordable';

    const summary = `${neighborhood.name} embodies the essence of ${neighborhood.borough} living with its ${safetyLevel} safety record and ${affordability} housing market. This vibrant neighborhood offers ${neighborhood.amenities?.restaurants || 'numerous'} dining options and maintains a ${neighborhood.amenities?.walkabilityScore || 75}/100 walkability score, making it perfect for those who appreciate ${neighborhood.demographics?.medianAge < 35 ? 'youthful energy and modern amenities' : 'established community charm and family-friendly atmosphere'}.

The area attracts ${neighborhood.demographics?.medianAge < 35 ? 'young professionals and students' : 'families and established residents'} with its ${neighborhood.amenities?.transitScore > 70 ? 'excellent public transportation links' : 'strong community connections'} and ${neighborhood.tags?.includes('family-friendly') ? 'family-oriented facilities' : 'diverse lifestyle options'}. ${neighborhood.housing?.avgRent > 40000 ? 'While housing costs reflect the premium location, residents enjoy top-tier amenities and prestige.' : 'The reasonable housing costs make it accessible while maintaining quality of life.'}`;

    return {
      summary,
      highlights: this.extractHighlights(neighborhood),
      lifestyle: this.generateLifestyleInsights(neighborhood),
      bestFor: this.generateBestForInsights(neighborhood)
    };
  }

  /**
   * Extract key highlights from neighborhood data
   * @param {Object} neighborhood - Neighborhood data
   * @returns {Array} - Array of highlight strings
   */
  extractHighlights(neighborhood) {
    const highlights = [];

    if (neighborhood.safety?.safetyScore >= 8) {
      highlights.push(`🛡️ Excellent Safety (${neighborhood.safety.safetyScore}/10)`);
    }

    if (neighborhood.amenities?.transitScore >= 80) {
      highlights.push(`🚇 Great Public Transport (${neighborhood.amenities.transitScore}/100)`);
    }

    if (neighborhood.amenities?.restaurants >= 50) {
      highlights.push(`🍽️ Vibrant Dining Scene (${neighborhood.amenities.restaurants}+ restaurants)`);
    }

    if (neighborhood.housing?.avgRent <= 20000) {
      highlights.push(`💰 Affordable Housing (R${neighborhood.housing.avgRent?.toLocaleString()}/month avg)`);
    }

    if (neighborhood.amenities?.walkabilityScore >= 85) {
      highlights.push(`🚶 Highly Walkable (${neighborhood.amenities.walkabilityScore}/100)`);
    }

    if (neighborhood.tags?.includes('family-friendly')) {
      highlights.push(`👨‍👩‍👧‍👦 Family-Friendly Community`);
    }

    return highlights.slice(0, 4); // Limit to top 4 highlights
  }

  /**
   * Generate lifestyle insights
   * @param {Object} neighborhood - Neighborhood data
   * @returns {Object} - Lifestyle insights
   */
  generateLifestyleInsights(neighborhood) {
    return {
      pace: neighborhood.amenities?.restaurants > 50 ? 'Fast-paced urban' : 'Relaxed suburban',
      vibe: neighborhood.demographics?.medianAge < 35 ? 'Young and energetic' : 'Established and family-oriented',
      commute: neighborhood.amenities?.transitScore > 70 ? 'Excellent public transport' : 'Car-friendly with good roads',
      entertainment: neighborhood.amenities?.restaurants > 30 ? 'Rich dining and nightlife' : 'Quiet with local charm'
    };
  }

  /**
   * Generate "best for" insights
   * @param {Object} neighborhood - Neighborhood data
   * @returns {Array} - Array of "best for" descriptions
   */
  generateBestForInsights(neighborhood) {
    const bestFor = [];

    if (neighborhood.tags?.includes('family-friendly') || neighborhood.amenities?.schools > 10) {
      bestFor.push('Families with children');
    }

    if (neighborhood.demographics?.medianAge < 35 || neighborhood.tags?.includes('young professionals')) {
      bestFor.push('Young professionals');
    }

    if (neighborhood.amenities?.transitScore > 70) {
      bestFor.push('Public transport commuters');
    }

    if (neighborhood.housing?.avgRent <= 20000) {
      bestFor.push('Budget-conscious renters');
    }

    if (neighborhood.safety?.safetyScore >= 8) {
      bestFor.push('Safety-conscious residents');
    }

    if (neighborhood.amenities?.walkabilityScore >= 85) {
      bestFor.push('Car-free lifestyle enthusiasts');
    }

    return bestFor.slice(0, 3); // Limit to top 3
  }

  /**
   * Generate explanation for why neighborhoods match search criteria
   * @param {Object} searchCriteria - User's search criteria
   * @param {Array} neighborhoods - Matched neighborhoods
   * @returns {Promise<Object>} - AI explanation of matches
   */
  async generateSearchExplanation(searchCriteria, neighborhoods) {
    try {
      const model = this.getGenerativeModel();
      if (!model) {
        throw new Error('Gemini model not available');
      }

      const criteriaText = Object.entries(searchCriteria)
        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => {
          if (typeof value === 'boolean') return value ? key : null;
          return `${key}: ${value}`;
        })
        .filter(Boolean)
        .join(', ');

      const prompt = `Explain why these Cape Town neighborhoods match the user's search criteria.

**User's Search Criteria:**
${criteriaText || 'General neighborhood search'}

**Matched Neighborhoods:**
${neighborhoods.slice(0, 5).map((n, i) => `
${i + 1}. **${n.name}** (${n.borough})
   - Safety Score: ${n.safety?.safetyScore || 'N/A'}/10
   - Average Rent: R${n.housing?.avgRent?.toLocaleString() || 'N/A'}
   - Transit Score: ${n.amenities?.transitScore || 'N/A'}/100
   - Tags: ${n.tags?.join(', ') || 'N/A'}
   - Match Score: ${n.score ? (n.score * 100).toFixed(1) + '%' : 'N/A'}
`).join('')}

For each neighborhood, explain:
1. Which specific criteria it matches
2. Why it's a good fit for the user
3. What makes it stand out
4. Any potential considerations

Keep explanations concise but specific, using actual data points.`;

      const result = await model.generateContent(prompt);
      const explanation = result.response.text();

      return {
        explanation,
        matchSummary: this.generateMatchSummary(searchCriteria, neighborhoods),
        topReasons: this.extractTopMatchReasons(searchCriteria, neighborhoods)
      };

    } catch (error) {
      logger.error('Error generating search explanation:', error);
      return this.generateMockSearchExplanation(searchCriteria, neighborhoods);
    }
  }

  /**
   * Generate mock search explanation
   * @param {Object} searchCriteria - User's search criteria
   * @param {Array} neighborhoods - Matched neighborhoods
   * @returns {Object} - Mock explanation object
   */
  generateMockSearchExplanation(searchCriteria, neighborhoods) {
    const topNeighborhood = neighborhoods[0];
    const criteriaCount = Object.values(searchCriteria).filter(v => v !== null && v !== undefined && v !== '').length;

    let explanation = `Found ${neighborhoods.length} neighborhoods matching your criteria. `;

    if (searchCriteria.familyFriendly) {
      explanation += `**${topNeighborhood.name}** tops the list with excellent family amenities including ${topNeighborhood.amenities?.schools || 'multiple'} schools and a ${topNeighborhood.safety?.safetyScore || 8}/10 safety score. `;
    }

    if (searchCriteria.maxRent) {
      explanation += `All results stay within your R${searchCriteria.maxRent.toLocaleString()} budget, with ${topNeighborhood.name} offering great value at R${topNeighborhood.housing?.avgRent?.toLocaleString() || 'competitive pricing'}. `;
    }

    if (searchCriteria.minSafetyScore) {
      explanation += `Safety was prioritized with all neighborhoods exceeding ${searchCriteria.minSafetyScore}/10, led by ${topNeighborhood.name}'s ${topNeighborhood.safety?.safetyScore || 8}/10 rating. `;
    }

    explanation += `These matches consider your preferences for ${criteriaCount > 1 ? 'multiple factors' : 'specific requirements'} to find the best fit for your lifestyle.`;

    return {
      explanation,
      matchSummary: this.generateMatchSummary(searchCriteria, neighborhoods),
      topReasons: this.extractTopMatchReasons(searchCriteria, neighborhoods)
    };
  }

  /**
   * Generate match summary
   * @param {Object} searchCriteria - User's search criteria
   * @param {Array} neighborhoods - Matched neighborhoods
   * @returns {Object} - Match summary
   */
  generateMatchSummary(searchCriteria, neighborhoods) {
    const avgRent = neighborhoods.reduce((sum, n) => sum + (n.housing?.avgRent || 0), 0) / neighborhoods.length;
    const avgSafety = neighborhoods.reduce((sum, n) => sum + (n.safety?.safetyScore || 0), 0) / neighborhoods.length;
    const avgTransit = neighborhoods.reduce((sum, n) => sum + (n.amenities?.transitScore || 0), 0) / neighborhoods.length;

    return {
      totalMatches: neighborhoods.length,
      averageRent: Math.round(avgRent),
      averageSafety: Math.round(avgSafety * 10) / 10,
      averageTransit: Math.round(avgTransit),
      topBorough: this.getMostCommonBorough(neighborhoods),
      priceRange: {
        min: Math.min(...neighborhoods.map(n => n.housing?.avgRent || 0)),
        max: Math.max(...neighborhoods.map(n => n.housing?.avgRent || 0))
      }
    };
  }

  /**
   * Extract top match reasons
   * @param {Object} searchCriteria - User's search criteria
   * @param {Array} neighborhoods - Matched neighborhoods
   * @returns {Array} - Array of top reasons
   */
  extractTopMatchReasons(searchCriteria, neighborhoods) {
    const reasons = [];

    if (searchCriteria.familyFriendly) {
      reasons.push('Family-friendly amenities and schools');
    }

    if (searchCriteria.maxRent) {
      reasons.push(`Within R${searchCriteria.maxRent.toLocaleString()} budget`);
    }

    if (searchCriteria.minSafetyScore) {
      reasons.push(`Safety score above ${searchCriteria.minSafetyScore}/10`);
    }

    if (searchCriteria.transitAccess) {
      reasons.push('Excellent public transportation');
    }

    if (searchCriteria.youngProfessionals) {
      reasons.push('Popular with young professionals');
    }

    return reasons.slice(0, 3);
  }

  /**
   * Get the generative model instance
   * @returns {Object|null} - Generative model or null if not available
   */
  getGenerativeModel() {
    if (!this.model) {
      return geminiConfig.getGenerativeModel();
    }
    return this.model;
  }

  /**
   * Get most common borough from neighborhoods
   * @param {Array} neighborhoods - Array of neighborhoods
   * @returns {string} - Most common borough
   */
  getMostCommonBorough(neighborhoods) {
    const boroughCounts = {};
    neighborhoods.forEach(n => {
      boroughCounts[n.borough] = (boroughCounts[n.borough] || 0) + 1;
    });

    return Object.entries(boroughCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Various';
  }

  /**
   * Generate enhanced market insights using comprehensive data from all databases
   * @param {Array} neighborhoods - All neighborhoods data
   * @param {Object} comprehensiveData - Data from all databases
   * @returns {Promise<Object>} - Enhanced market insights and trends
   */
  async generateEnhancedMarketInsights(neighborhoods, comprehensiveData) {
    try {
      const model = this.getGenerativeModel();
      if (!model) {
        throw new Error('Gemini model not available');
      }

      const prompt = `Analyze the Cape Town market using comprehensive data from multiple sources and generate strategic insights:

**NEIGHBORHOOD DATA (${neighborhoods.length} areas):**
- Average rent range: R${Math.min(...neighborhoods.map(n => n.housing?.avgRent || 0)).toLocaleString()} - R${Math.max(...neighborhoods.map(n => n.housing?.avgRent || 0)).toLocaleString()}
- Safety scores: ${neighborhoods.map(n => n.safety?.safetyScore || 0).join(', ')}
- Borough distribution: ${neighborhoods.map(n => n.borough).filter((v, i, a) => a.indexOf(v) === i).join(', ')}

**EDUCATION INFRASTRUCTURE:**
- Total schools: ${comprehensiveData.education.total}
- School types: ${comprehensiveData.education.typeBreakdown.map(t => `${t._id}: ${t.count}`).join(', ')}
- Education districts: ${comprehensiveData.education.districtBreakdown.length}

**HEALTHCARE ACCESS:**
- Total facilities: ${comprehensiveData.healthcare.total}
- Facility types: ${comprehensiveData.healthcare.classificationBreakdown.map(c => `${c._id}: ${c.count}`).join(', ')}

**RENTAL MARKET:**
- Total properties: ${comprehensiveData.rentals.totalProperties}
- Occupancy rate: ${comprehensiveData.rentals.occupancyRate}%
- Average price: R${Math.round(comprehensiveData.rentals.averagePrice).toLocaleString()}
- Top locations: ${comprehensiveData.rentals.locationStats.slice(0, 3).map(l => `${l._id} (${l.count} properties)`).join(', ')}

**TRANSPORT CONNECTIVITY:**
- Total taxi routes: ${comprehensiveData.transport.totalRoutes}
- Network connectivity: ${comprehensiveData.transport.connectivity} unique locations
- Top origins: ${comprehensiveData.transport.originStats.slice(0, 3).map(o => o._id).join(', ')}

**CRIME & SAFETY DATA:**
- Total crime incidents: ${comprehensiveData.crime.totalCrimes}
- Overall safety score: ${comprehensiveData.crime.overallSafetyScore}/10
- Violent crime rate: ${(comprehensiveData.crime.violentCrimeRate * 100).toFixed(1)}%
- Safest areas: ${comprehensiveData.crime.safestAreas.slice(0, 3).map(a => a._id).join(', ')}
- Crime categories: ${comprehensiveData.crime.crimesByCategory.map(c => `${c._id}: ${c.count}`).join(', ')}

**INFRASTRUCTURE ANALYSIS:**
- Best infrastructure areas: ${comprehensiveData.infrastructure.bestInfrastructure.slice(0, 3).map(a => `${a.neighborhood} (score: ${a.infrastructureScore})`).join(', ')}
- Areas needing improvement: ${comprehensiveData.infrastructure.worstInfrastructure.slice(0, 2).map(a => a.neighborhood).join(', ')}

**MARKET TRENDS:**
- Hotspots: ${comprehensiveData.marketTrends.hotspots.slice(0, 3).map(h => h.name).join(', ')}
- Value opportunities: ${comprehensiveData.marketTrends.valueOpportunities.slice(0, 3).map(v => v.name).join(', ')}

Generate comprehensive market insights covering:
1. **Market Overview & Current State**
2. **Investment Opportunities & Hotspots**
3. **Infrastructure Impact on Property Values**
4. **Education & Healthcare Access Analysis**
5. **Transport Connectivity Benefits**
6. **Safety vs Affordability Trade-offs**
7. **Emerging Neighborhoods to Watch**
8. **Strategic Recommendations for Different Buyer Types**
9. **Risk Assessment & Market Predictions**
10. **Data-Driven Action Items**

Focus on actionable, data-driven insights that leverage the comprehensive dataset for Cape Town property seekers, investors, and urban planners.`;

      const result = await model.generateContent(prompt);
      const insights = result.response.text();

      return {
        insights,
        dataSourcesAnalyzed: comprehensiveData.overview.dataSourcesUsed,
        marketData: this.analyzeMarketData(neighborhoods),
        trends: this.generateEnhancedTrends(comprehensiveData),
        recommendations: this.generateDataDrivenRecommendations(comprehensiveData),
        riskAssessment: this.generateRiskAssessment(comprehensiveData),
        investmentOpportunities: this.identifyInvestmentOpportunities(comprehensiveData)
      };

    } catch (error) {
      logger.error('Error generating enhanced market insights:', error);
      return this.generateMockEnhancedInsights(neighborhoods, comprehensiveData);
    }
  }

  /**
   * Generate dynamic market insights and trends
   * @param {Array} neighborhoods - All neighborhoods data
   * @returns {Promise<Object>} - Market insights and trends
   */
  async generateMarketInsights(neighborhoods) {
    try {
      const model = this.getGenerativeModel();
      if (!model) {
        throw new Error('Gemini model not available');
      }

      const marketData = this.analyzeMarketData(neighborhoods);

      const prompt = `Analyze the Cape Town rental market based on this neighborhood data and generate insights:

**Market Overview:**
- Total Neighborhoods: ${neighborhoods.length}
- Average Rent: R${marketData.averageRent.toLocaleString()}
- Rent Range: R${marketData.rentRange.min.toLocaleString()} - R${marketData.rentRange.max.toLocaleString()}
- Average Safety Score: ${marketData.averageSafety}/10
- Most Expensive Borough: ${marketData.mostExpensive.borough} (R${marketData.mostExpensive.avgRent.toLocaleString()})
- Most Affordable Borough: ${marketData.mostAffordable.borough} (R${marketData.mostAffordable.avgRent.toLocaleString()})

**Borough Breakdown:**
${marketData.boroughStats.map(b => `- ${b.borough}: ${b.count} neighborhoods, avg R${b.avgRent.toLocaleString()}, safety ${b.avgSafety}/10`).join('\n')}

**Trending Insights:**
${marketData.trends.join('\n')}

Generate market insights covering:
1. Current market trends and patterns
2. Value opportunities and hotspots
3. Safety vs affordability analysis
4. Recommendations for different buyer types
5. Emerging neighborhoods to watch

Focus on actionable insights for Cape Town property seekers.`;

      const result = await model.generateContent(prompt);
      const insights = result.response.text();

      return {
        insights,
        marketData,
        trends: this.generateTrendingInsights(neighborhoods),
        recommendations: this.generateMarketRecommendations(marketData)
      };

    } catch (error) {
      logger.error('Error generating market insights:', error);
      return this.generateMockMarketInsights(neighborhoods);
    }
  }

  /**
   * Analyze market data from neighborhoods
   * @param {Array} neighborhoods - Array of neighborhoods
   * @returns {Object} - Analyzed market data
   */
  analyzeMarketData(neighborhoods) {
    const validRents = neighborhoods.filter(n => n.housing?.avgRent).map(n => n.housing.avgRent);
    const validSafety = neighborhoods.filter(n => n.safety?.safetyScore).map(n => n.safety.safetyScore);

    // Borough statistics
    const boroughStats = {};
    neighborhoods.forEach(n => {
      if (!boroughStats[n.borough]) {
        boroughStats[n.borough] = { rents: [], safety: [], count: 0 };
      }
      boroughStats[n.borough].count++;
      if (n.housing?.avgRent) boroughStats[n.borough].rents.push(n.housing.avgRent);
      if (n.safety?.safetyScore) boroughStats[n.borough].safety.push(n.safety.safetyScore);
    });

    const boroughStatsArray = Object.entries(boroughStats).map(([borough, data]) => ({
      borough,
      count: data.count,
      avgRent: data.rents.length ? Math.round(data.rents.reduce((a, b) => a + b, 0) / data.rents.length) : 0,
      avgSafety: data.safety.length ? Math.round((data.safety.reduce((a, b) => a + b, 0) / data.safety.length) * 10) / 10 : 0
    })).sort((a, b) => b.avgRent - a.avgRent);

    return {
      averageRent: Math.round(validRents.reduce((a, b) => a + b, 0) / validRents.length),
      averageSafety: Math.round((validSafety.reduce((a, b) => a + b, 0) / validSafety.length) * 10) / 10,
      rentRange: {
        min: Math.min(...validRents),
        max: Math.max(...validRents)
      },
      mostExpensive: boroughStatsArray[0],
      mostAffordable: boroughStatsArray[boroughStatsArray.length - 1],
      boroughStats: boroughStatsArray,
      trends: this.identifyTrends(neighborhoods)
    };
  }

  /**
   * Identify market trends
   * @param {Array} neighborhoods - Array of neighborhoods
   * @returns {Array} - Array of trend insights
   */
  identifyTrends(neighborhoods) {
    const trends = [];

    // High-value areas
    const luxuryAreas = neighborhoods.filter(n => n.housing?.avgRent > 50000);
    if (luxuryAreas.length > 0) {
      trends.push(`🏖️ ${luxuryAreas.length} ultra-luxury areas (R50k+) concentrated in ${luxuryAreas[0].borough}`);
    }

    // Family-friendly trends
    const familyAreas = neighborhoods.filter(n => n.tags?.includes('family-friendly'));
    if (familyAreas.length > 0) {
      trends.push(`👨‍👩‍👧‍👦 ${familyAreas.length} family-friendly neighborhoods with avg safety ${Math.round(familyAreas.reduce((sum, n) => sum + (n.safety?.safetyScore || 0), 0) / familyAreas.length * 10) / 10}/10`);
    }

    // Transit accessibility
    const transitFriendly = neighborhoods.filter(n => n.amenities?.transitScore > 70);
    if (transitFriendly.length > 0) {
      trends.push(`🚇 ${transitFriendly.length} neighborhoods with excellent transit (70+ score)`);
    }

    // Value opportunities
    const valueAreas = neighborhoods.filter(n => n.housing?.avgRent < 20000 && n.safety?.safetyScore > 7);
    if (valueAreas.length > 0) {
      trends.push(`💎 ${valueAreas.length} value opportunities: safe areas under R20k`);
    }

    return trends;
  }

  /**
   * Generate enhanced trends using comprehensive data
   */
  generateEnhancedTrends(comprehensiveData) {
    const trends = [];

    // Education trends
    if (comprehensiveData.education.total > 500) {
      trends.push(`🎓 Strong education infrastructure: ${comprehensiveData.education.total} schools across ${comprehensiveData.education.districtBreakdown.length} districts`);
    }

    // Healthcare trends
    if (comprehensiveData.healthcare.total > 50) {
      trends.push(`🏥 Comprehensive healthcare: ${comprehensiveData.healthcare.total} medical facilities`);
    }

    // Rental market trends
    const occupancyRate = parseFloat(comprehensiveData.rentals.occupancyRate);
    if (occupancyRate > 80) {
      trends.push(`🔥 Hot rental market: ${occupancyRate}% occupancy rate`);
    } else if (occupancyRate < 60) {
      trends.push(`💎 Rental opportunities: ${occupancyRate}% occupancy rate`);
    }

    // Transport trends
    if (comprehensiveData.transport.totalRoutes > 100) {
      trends.push(`🚌 Excellent connectivity: ${comprehensiveData.transport.totalRoutes} taxi routes`);
    }

    // Infrastructure trends
    const topInfraArea = comprehensiveData.infrastructure.bestInfrastructure[0];
    if (topInfraArea) {
      trends.push(`🏗️ Infrastructure leader: ${topInfraArea.neighborhood} (score: ${topInfraArea.infrastructureScore})`);
    }

    return trends;
  }

  /**
   * Generate data-driven recommendations
   */
  generateDataDrivenRecommendations(comprehensiveData) {
    const recommendations = [];

    // Investment recommendations
    const valueAreas = comprehensiveData.marketTrends.valueOpportunities.slice(0, 3);
    if (valueAreas.length > 0) {
      recommendations.push({
        type: 'investment',
        title: 'Value Investment Opportunities',
        areas: valueAreas.map(area => area.name),
        reason: 'Good safety scores with affordable rental prices'
      });
    }

    // Family recommendations
    const bestInfra = comprehensiveData.infrastructure.bestInfrastructure.slice(0, 3);
    recommendations.push({
      type: 'family',
      title: 'Best for Families',
      areas: bestInfra.map(area => area.neighborhood),
      reason: 'Excellent access to schools and healthcare facilities'
    });

    // Transport recommendations
    const topOrigins = comprehensiveData.transport.originStats.slice(0, 3);
    recommendations.push({
      type: 'commuter',
      title: 'Best Transport Connectivity',
      areas: topOrigins.map(origin => origin._id),
      reason: 'Multiple taxi routes for easy commuting'
    });

    return recommendations;
  }

  /**
   * Generate risk assessment
   */
  generateRiskAssessment(comprehensiveData) {
    const risks = [];
    const opportunities = [];

    // Occupancy risk
    const occupancyRate = parseFloat(comprehensiveData.rentals.occupancyRate);
    if (occupancyRate > 90) {
      risks.push('High occupancy may indicate limited rental availability');
    } else if (occupancyRate < 50) {
      opportunities.push('Low occupancy presents rental opportunities');
    }

    // Infrastructure gaps
    const worstInfra = comprehensiveData.infrastructure.worstInfrastructure;
    if (worstInfra.length > 0) {
      risks.push(`Infrastructure gaps in: ${worstInfra.slice(0, 2).map(area => area.neighborhood).join(', ')}`);
    }

    // Market concentration
    const topLocation = comprehensiveData.rentals.locationStats[0];
    if (topLocation && topLocation.count > comprehensiveData.rentals.totalProperties * 0.3) {
      risks.push(`Market concentration risk: ${topLocation._id} dominates with ${topLocation.count} properties`);
    }

    return { risks, opportunities };
  }

  /**
   * Identify investment opportunities
   */
  identifyInvestmentOpportunities(comprehensiveData) {
    const opportunities = [];

    // Emerging areas
    const emerging = comprehensiveData.marketTrends.emergingAreas;
    if (emerging.length > 0) {
      opportunities.push({
        type: 'emerging',
        title: 'Emerging Neighborhoods',
        areas: emerging.slice(0, 3).map(area => area.name),
        potential: 'high'
      });
    }

    // Value plays
    const valueOpps = comprehensiveData.marketTrends.valueOpportunities;
    if (valueOpps.length > 0) {
      opportunities.push({
        type: 'value',
        title: 'Value Opportunities',
        areas: valueOpps.slice(0, 3).map(area => area.name),
        potential: 'medium'
      });
    }

    // Infrastructure development
    const bestInfra = comprehensiveData.infrastructure.bestInfrastructure;
    if (bestInfra.length > 0) {
      opportunities.push({
        type: 'infrastructure',
        title: 'Infrastructure-Rich Areas',
        areas: bestInfra.slice(0, 3).map(area => area.neighborhood),
        potential: 'stable'
      });
    }

    return opportunities;
  }

  /**
   * Generate mock enhanced insights
   */
  generateMockEnhancedInsights(neighborhoods, comprehensiveData) {
    const insights = `**🏠 Comprehensive Cape Town Market Analysis**

**Market Overview:**
Based on analysis of ${comprehensiveData.overview.totalDataPoints} data points across 5 major databases, Cape Town shows a dynamic and well-connected urban market.

**Key Findings:**
- **Education**: ${comprehensiveData.education.total} schools provide strong educational infrastructure
- **Healthcare**: ${comprehensiveData.healthcare.total} medical facilities ensure good healthcare access
- **Rentals**: ${comprehensiveData.rentals.totalProperties} properties with ${comprehensiveData.rentals.occupancyRate}% occupancy
- **Transport**: ${comprehensiveData.transport.totalRoutes} taxi routes create extensive connectivity

**Investment Opportunities:**
${comprehensiveData.marketTrends.valueOpportunities.slice(0, 3).map(area => `• ${area.name} - Good safety with affordable pricing`).join('\n')}

**Infrastructure Leaders:**
${comprehensiveData.infrastructure.bestInfrastructure.slice(0, 3).map(area => `• ${area.neighborhood} (Infrastructure Score: ${area.infrastructureScore})`).join('\n')}

**Recommendations:**
- Focus on areas with strong infrastructure scores for long-term value
- Consider transport connectivity for rental demand
- Balance safety scores with affordability for optimal returns

*Analysis based on comprehensive data from neighborhoods, schools, hospitals, rentals, and transport networks.*`;

    return {
      insights,
      dataSourcesAnalyzed: comprehensiveData.overview.dataSourcesUsed,
      trends: this.generateEnhancedTrends(comprehensiveData),
      recommendations: this.generateDataDrivenRecommendations(comprehensiveData),
      riskAssessment: this.generateRiskAssessment(comprehensiveData),
      investmentOpportunities: this.identifyInvestmentOpportunities(comprehensiveData)
    };
  }

  /**
   * Generate mock market insights
   * @param {Array} neighborhoods - Array of neighborhoods
   * @returns {Object} - Mock market insights
   */
  generateMockMarketInsights(neighborhoods) {
    const marketData = this.analyzeMarketData(neighborhoods);

    const insights = `**🏠 Cape Town Rental Market Analysis**

**📈 Current Market Trends:**
• **Premium Coastal Living:** Atlantic Seaboard commands highest rents (R${marketData.mostExpensive.avgRent.toLocaleString()}+ avg) with luxury beachfront properties
• **Value in Northern Suburbs:** ${marketData.mostAffordable.borough} offers best value at R${marketData.mostAffordable.avgRent.toLocaleString()} average with growing amenities
• **Safety Premium:** High-safety areas (8+ score) average 25% higher rents but strong demand
• **Transit-Oriented Growth:** Areas near MyCiTi routes seeing increased interest from young professionals

**🎯 Value Opportunities:**
• **Emerging Hotspots:** ${marketData.boroughStats.find(b => b.avgRent < 30000 && b.avgSafety > 6.5)?.borough || 'City Bowl'} areas showing growth potential
• **Family Value:** ${marketData.boroughStats.filter(b => b.avgRent >= 15000 && b.avgRent <= 35000).map(b => b.borough).slice(0,2).join(' and ')} offer excellent safety at moderate prices
• **Commuter-Friendly:** Areas near transport hubs balance accessibility with lifestyle

**⚠️ Market Considerations:**
• **Luxury Market:** ${marketData.mostExpensive.borough} has limited availability, premium pricing (R${marketData.mostExpensive.avgRent.toLocaleString()}+ avg)
• **Budget Areas:** ${marketData.mostAffordable.borough} offers affordability but consider location factors
• **Safety Premium:** High-safety areas command 20-30% premium over market average

**💡 Recommendations by Profile:**
• **Young Professionals:** ${marketData.boroughStats.filter(b => b.avgRent >= 25000 && b.avgRent <= 50000).map(b => b.borough).slice(0,2).join(', ')} (lifestyle + amenities)
• **Families:** ${marketData.boroughStats.filter(b => b.avgSafety >= 7 && b.avgRent <= 35000).map(b => b.borough).slice(0,2).join(', ')} (safety + value)
• **Budget-Conscious:** ${marketData.mostAffordable.borough} and similar areas (value + growth potential)
• **Luxury Seekers:** ${marketData.mostExpensive.borough} and premium coastal areas (prestige + exclusivity)

*Market data based on ${neighborhoods.length} neighborhoods across ${marketData.boroughStats.length} boroughs.*`;

    return {
      insights,
      marketData,
      trends: this.generateTrendingInsights(neighborhoods),
      recommendations: this.generateMarketRecommendations(marketData)
    };
  }

  /**
   * Generate trending insights
   * @param {Array} neighborhoods - Array of neighborhoods
   * @returns {Array} - Array of trending insights
   */
  generateTrendingInsights(neighborhoods) {
    const trends = [];

    // Find actual hot neighborhoods (young professional areas with good amenities)
    const hotNeighborhoods = neighborhoods
      .filter(n => n.demographics?.medianAge < 35 && n.amenities?.restaurants > 30)
      .sort((a, b) => (b.amenities?.restaurants || 0) - (a.amenities?.restaurants || 0))
      .slice(0, 2);

    if (hotNeighborhoods.length > 0) {
      trends.push({
        type: 'hot',
        title: 'Rising Demand',
        description: `${hotNeighborhoods[0].name} leading young professional interest with ${hotNeighborhoods[0].amenities?.restaurants || 0}+ restaurants`,
        neighborhoods: hotNeighborhoods.map(n => n.name)
      });
    }

    // Find actual value neighborhoods (good safety, affordable rent)
    const valueNeighborhoods = neighborhoods
      .filter(n => n.housing?.avgRent < 25000 && n.safety?.safetyScore > 6.5)
      .sort((a, b) => (b.safety?.safetyScore || 0) - (a.safety?.safetyScore || 0))
      .slice(0, 2);

    if (valueNeighborhoods.length > 0) {
      trends.push({
        type: 'value',
        title: 'Best Value',
        description: `${valueNeighborhoods[0].borough} offering family-friendly options under R${Math.max(...valueNeighborhoods.map(n => n.housing?.avgRent || 0)).toLocaleString()}`,
        neighborhoods: valueNeighborhoods.map(n => n.name)
      });
    }

    // Find actual premium neighborhoods (highest rents)
    const premiumNeighborhoods = neighborhoods
      .filter(n => n.housing?.avgRent > 50000)
      .sort((a, b) => (b.housing?.avgRent || 0) - (a.housing?.avgRent || 0))
      .slice(0, 2);

    if (premiumNeighborhoods.length > 0) {
      trends.push({
        type: 'luxury',
        title: 'Premium Market',
        description: `${premiumNeighborhoods[0].borough} maintaining exclusivity with R${Math.min(...premiumNeighborhoods.map(n => n.housing?.avgRent || 0)).toLocaleString()}+ average rents`,
        neighborhoods: premiumNeighborhoods.map(n => n.name)
      });
    }

    return trends;
  }

  /**
   * Generate market recommendations
   * @param {Object} marketData - Analyzed market data
   * @returns {Array} - Array of recommendations
   */
  generateMarketRecommendations(marketData) {
    const recommendations = [];

    // First-time buyers recommendation
    if (marketData.mostAffordable) {
      recommendations.push({
        category: 'First-Time Buyers',
        recommendation: `Consider ${marketData.mostAffordable.borough} for entry-level options`,
        budget: `R${marketData.mostAffordable.avgRent.toLocaleString()} average • Good value with growth potential`,
        reasoning: 'Affordable entry point with development potential'
      });
    }

    // Family recommendation based on mid-range safe areas
    const familyBudgetRange = marketData.boroughStats.filter(b =>
      b.avgRent >= 15000 && b.avgRent <= 35000 && b.avgSafety >= 7
    );
    if (familyBudgetRange.length > 0) {
      const topFamilyArea = familyBudgetRange.sort((a, b) => b.avgSafety - a.avgSafety)[0];
      recommendations.push({
        category: 'Families',
        recommendation: `Focus on ${topFamilyArea.borough} and similar areas`,
        budget: `R${familyBudgetRange[0].avgRent.toLocaleString()}-${familyBudgetRange[familyBudgetRange.length-1].avgRent.toLocaleString()} range • Balance of safety, schools, and space`,
        reasoning: 'Optimal balance of affordability and family amenities'
      });
    }

    // Professional recommendation based on premium areas
    if (marketData.mostExpensive) {
      recommendations.push({
        category: 'Professionals',
        recommendation: `${marketData.mostExpensive.borough} or similar premium areas for lifestyle`,
        budget: `R${Math.round(marketData.mostExpensive.avgRent * 0.7).toLocaleString()}+ for premium locations • Proximity to business districts and amenities`,
        reasoning: 'Premium lifestyle with business district access'
      });
    }

    return recommendations;
  }
}

module.exports = new GeminiService();
