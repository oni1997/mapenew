const Neighborhood = require('../models/Neighborhood');
const geminiService = require('./geminiService');
const { logger } = require('../utils/logger');

class VectorSearchService {
  /**
   * Find similar neighborhoods using vector search
   * @param {string} neighborhoodId - Source neighborhood ID
   * @param {number} limit - Number of similar neighborhoods to return
   * @returns {Promise<Array>} - Similar neighborhoods with scores
   */
  async findSimilarNeighborhoods(neighborhoodId, limit = 10) {
    try {
      const sourceNeighborhood = await Neighborhood.findById(neighborhoodId);
      if (!sourceNeighborhood) {
        throw new Error('Neighborhood not found');
      }

      if (!sourceNeighborhood.vectorEmbedding) {
        throw new Error('Neighborhood does not have vector embedding');
      }

      const similarNeighborhoods = await Neighborhood.findSimilar(
        sourceNeighborhood.vectorEmbedding,
        limit,
        neighborhoodId
      );

      return similarNeighborhoods;
    } catch (error) {
      logger.error('Error finding similar neighborhoods:', error);
      throw error;
    }
  }

  /**
   * Search neighborhoods by text query using embeddings
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} - Matching neighborhoods
   */
  async searchByQuery(query, limit = 10) {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await geminiService.generateEmbedding(query);

      // Try vector search first
      try {
        const results = await Neighborhood.aggregate([
          {
            $vectorSearch: {
              index: 'neighborhood_vector_index',
              path: 'vectorEmbedding',
              queryVector: queryEmbedding,
              numCandidates: 100,
              limit: limit
            }
          },
          {
            $addFields: {
              score: { $meta: 'vectorSearchScore' }
            }
          }
        ]);

        if (results.length > 0) {
          return results;
        }
      } catch (vectorError) {
        logger.warn('Vector search failed, falling back to text search:', vectorError.message);
      }

      // Fallback to text-based search if vector search fails or returns no results
      logger.info('Using fallback text search for query:', query);
      return await this.fallbackTextSearch(query, limit);

    } catch (error) {
      logger.error('Error searching by query:', error);
      throw error;
    }
  }

  /**
   * Fallback text search when vector search is not available
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} - Matching neighborhoods
   */
  async fallbackTextSearch(query, limit = 10) {
    try {
      // Extract neighborhood names and keywords from the query
      const queryWords = query.toLowerCase().split(/\s+/);
      const neighborhoodKeywords = [
        'soho', 'greenwich village', 'williamsburg', 'park slope', 'astoria', 'upper east side',
        'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island'
      ];

      // Find specific neighborhood mentions
      const mentionedNeighborhoods = neighborhoodKeywords.filter(keyword =>
        query.toLowerCase().includes(keyword)
      );

      let searchConditions = [];

      // If specific neighborhoods are mentioned, prioritize them
      if (mentionedNeighborhoods.length > 0) {
        mentionedNeighborhoods.forEach(neighborhood => {
          searchConditions.push({ name: new RegExp(neighborhood, 'i') });
          searchConditions.push({ borough: new RegExp(neighborhood, 'i') });
        });
      }

      // Add general search conditions
      queryWords.forEach(word => {
        if (word.length > 2) { // Skip very short words
          const wordRegex = new RegExp(word, 'i');
          searchConditions.push(
            { name: wordRegex },
            { borough: wordRegex },
            { description: wordRegex },
            { tags: { $in: [wordRegex] } }
          );
        }
      });

      // If no specific conditions, search all neighborhoods
      if (searchConditions.length === 0) {
        searchConditions.push({});
      }

      const results = await Neighborhood.find({
        $or: searchConditions
      })
      .select('-vectorEmbedding')
      .limit(limit)
      .sort({ 'safety.safetyScore': -1, 'amenities.transitScore': -1 });

      logger.info(`Fallback search found ${results.length} results for query: "${query}"`);

      // Add mock similarity scores for consistency
      return results.map(neighborhood => ({
        ...neighborhood.toObject(),
        score: 0.8 // Mock similarity score
      }));

    } catch (error) {
      logger.error('Error in fallback text search:', error);
      throw error;
    }
  }

  /**
   * Find neighborhoods matching specific criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} - Matching neighborhoods
   */
  async findByCharacteristics(criteria) {
    try {
      // Build text query from criteria
      const queryParts = [];

      if (criteria.maxRent) {
        // Use the currency detected from the original message, default to USD
        const currency = criteria.currency || '$';
        queryParts.push(`affordable housing under ${currency}${criteria.maxRent}`);
      }

      if (criteria.minSafetyScore) {
        queryParts.push(`safe neighborhood with safety score above ${criteria.minSafetyScore}`);
      }

      if (criteria.familyFriendly) {
        queryParts.push('family-friendly area with good schools and parks');
      }

      if (criteria.youngProfessionals) {
        queryParts.push('trendy area for young professionals with nightlife and restaurants');
      }

      if (criteria.transitAccess) {
        queryParts.push('good public transportation and walkable');
      }

      if (criteria.quiet) {
        queryParts.push('quiet residential neighborhood');
      }

      if (criteria.cultural) {
        queryParts.push('cultural attractions and arts scene');
      }

      const query = queryParts.join(', ');

      if (!query) {
        throw new Error('No search criteria provided');
      }

      // Combine vector search with traditional filtering
      const vectorResults = await this.searchByQuery(query, 50);

      // Apply additional filters
      let filteredResults = vectorResults;

      if (criteria.maxRent) {
        filteredResults = filteredResults.filter(n => 
          !n.housing?.avgRent || n.housing.avgRent <= criteria.maxRent
        );
      }

      if (criteria.minSafetyScore) {
        filteredResults = filteredResults.filter(n => 
          n.safety?.safetyScore >= criteria.minSafetyScore
        );
      }

      if (criteria.borough) {
        filteredResults = filteredResults.filter(n => 
          n.borough.toLowerCase() === criteria.borough.toLowerCase()
        );
      }

      return filteredResults.slice(0, criteria.limit || 10);
    } catch (error) {
      logger.error('Error finding by characteristics:', error);
      throw error;
    }
  }

  /**
   * Get neighborhood recommendations based on user preferences
   * @param {Object} preferences - User preferences
   * @returns {Promise<Object>} - Recommendations with explanations
   */
  async getRecommendations(preferences) {
    try {
      const neighborhoods = await this.findByCharacteristics(preferences);

      if (neighborhoods.length === 0) {
        return {
          neighborhoods: [],
          explanation: 'No neighborhoods found matching your criteria. Try adjusting your preferences.'
        };
      }

      // Generate AI explanation for the recommendations
      const explanation = await geminiService.generateChatResponse(
        `Based on my preferences: ${JSON.stringify(preferences)}, explain why these neighborhoods are good matches.`,
        [],
        neighborhoods.slice(0, 5)
      );

      return {
        neighborhoods,
        explanation,
        totalFound: neighborhoods.length
      };
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Compare multiple neighborhoods
   * @param {Array} neighborhoodIds - Array of neighborhood IDs
   * @returns {Promise<Object>} - Comparison data with AI insights
   */
  async compareNeighborhoods(neighborhoodIds) {
    try {
      const neighborhoods = await Neighborhood.find({
        _id: { $in: neighborhoodIds }
      });

      if (neighborhoods.length < 2) {
        throw new Error('At least 2 neighborhoods required for comparison');
      }

      // Generate comparison insights
      const comparisonInsights = await geminiService.generateChatResponse(
        'Compare these neighborhoods and highlight the key differences and similarities.',
        [],
        neighborhoods
      );

      // Calculate comparison metrics
      const metrics = this.calculateComparisonMetrics(neighborhoods);

      return {
        neighborhoods,
        insights: comparisonInsights,
        metrics
      };
    } catch (error) {
      logger.error('Error comparing neighborhoods:', error);
      throw error;
    }
  }

  /**
   * Calculate comparison metrics for neighborhoods
   * @param {Array} neighborhoods - Array of neighborhood objects
   * @returns {Object} - Comparison metrics
   */
  calculateComparisonMetrics(neighborhoods) {
    const metrics = {
      avgRent: {},
      safetyScore: {},
      transitScore: {},
      walkabilityScore: {}
    };

    neighborhoods.forEach(n => {
      metrics.avgRent[n.name] = n.housing?.avgRent || 0;
      metrics.safetyScore[n.name] = n.safety?.safetyScore || 0;
      metrics.transitScore[n.name] = n.amenities?.transitScore || 0;
      metrics.walkabilityScore[n.name] = n.amenities?.walkabilityScore || 0;
    });

    return metrics;
  }

  /**
   * Update neighborhood embedding
   * @param {string} neighborhoodId - Neighborhood ID
   * @returns {Promise<Object>} - Updated neighborhood
   */
  async updateNeighborhoodEmbedding(neighborhoodId) {
    try {
      const neighborhood = await Neighborhood.findById(neighborhoodId);
      if (!neighborhood) {
        throw new Error('Neighborhood not found');
      }

      const embedding = await geminiService.generateNeighborhoodEmbedding(neighborhood);
      
      neighborhood.vectorEmbedding = embedding;
      neighborhood.lastUpdated = new Date();
      
      await neighborhood.save();

      logger.info(`Updated embedding for neighborhood: ${neighborhood.name}`);
      return neighborhood;
    } catch (error) {
      logger.error('Error updating neighborhood embedding:', error);
      throw error;
    }
  }
}

module.exports = new VectorSearchService();
