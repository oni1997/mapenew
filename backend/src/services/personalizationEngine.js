const { MongoClient } = require('mongodb');
const { logger } = require('../utils/logger');

class PersonalizationEngine {
  constructor() {
    this.client = null;
    this.userProfiles = new Map(); // In-memory cache for active sessions
  }

  async connect() {
    if (!this.client) {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
    }
    return this.client;
  }

  /**
   * Learn from user interactions and build preference profile
   */
  async learnFromInteraction(userId, interaction) {
    try {
      await this.connect();
      const db = this.client.db();
      const collection = db.collection('user_interactions');

      const interactionData = {
        userId,
        timestamp: new Date(),
        type: interaction.type, // 'view', 'like', 'search', 'compare', 'chat'
        data: interaction.data,
        context: interaction.context
      };

      await collection.insertOne(interactionData);
      
      // Update user profile in real-time
      await this.updateUserProfile(userId, interaction);
      
      logger.info(`Learned from user ${userId} interaction: ${interaction.type}`);
    } catch (error) {
      logger.error('Error learning from interaction:', error);
    }
  }

  /**
   * Update user preference profile based on interactions
   */
  async updateUserProfile(userId, interaction) {
    try {
      const db = this.client.db();
      const collection = db.collection('user_profiles');

      let profile = await collection.findOne({ userId }) || {
        userId,
        preferences: {
          priceRange: { min: 0, max: 100000 },
          safetyImportance: 0.5,
          schoolImportance: 0.5,
          transportImportance: 0.5,
          healthcareImportance: 0.5,
          preferredAreas: [],
          avoidedAreas: [],
          familySize: 1,
          lifestyle: 'balanced' // 'urban', 'suburban', 'quiet', 'vibrant'
        },
        behaviorPatterns: {
          searchFrequency: 0,
          avgSessionTime: 0,
          preferredFilters: {},
          interactionHistory: []
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      // Update preferences based on interaction type
      switch (interaction.type) {
        case 'search':
          this.updateSearchPreferences(profile, interaction.data);
          break;
        case 'view':
          this.updateViewPreferences(profile, interaction.data);
          break;
        case 'like':
          this.updateLikePreferences(profile, interaction.data);
          break;
        case 'compare':
          this.updateComparePreferences(profile, interaction.data);
          break;
        case 'chat':
          this.updateChatPreferences(profile, interaction.data);
          break;
      }

      profile.lastUpdated = new Date();
      profile.behaviorPatterns.interactionHistory.push({
        type: interaction.type,
        timestamp: new Date(),
        data: interaction.data
      });

      // Keep only last 100 interactions
      if (profile.behaviorPatterns.interactionHistory.length > 100) {
        profile.behaviorPatterns.interactionHistory = 
          profile.behaviorPatterns.interactionHistory.slice(-100);
      }

      await collection.replaceOne({ userId }, profile, { upsert: true });
      
      // Cache in memory for quick access
      this.userProfiles.set(userId, profile);

    } catch (error) {
      logger.error('Error updating user profile:', error);
    }
  }

  updateSearchPreferences(profile, searchData) {
    if (searchData.maxRent) {
      profile.preferences.priceRange.max = Math.min(
        profile.preferences.priceRange.max * 0.8 + searchData.maxRent * 0.2,
        searchData.maxRent * 1.2
      );
    }

    if (searchData.minSafetyScore) {
      profile.preferences.safetyImportance = Math.min(1, 
        profile.preferences.safetyImportance + 0.1
      );
    }

    if (searchData.familyFriendly) {
      profile.preferences.schoolImportance = Math.min(1,
        profile.preferences.schoolImportance + 0.15
      );
    }

    if (searchData.transitAccess) {
      profile.preferences.transportImportance = Math.min(1,
        profile.preferences.transportImportance + 0.1
      );
    }
  }

  updateViewPreferences(profile, viewData) {
    const neighborhood = viewData.neighborhood;
    
    // Track viewed areas
    if (!profile.preferences.preferredAreas.includes(neighborhood.borough)) {
      profile.preferences.preferredAreas.push(neighborhood.borough);
    }

    // Infer preferences from viewed properties
    if (neighborhood.housing?.avgRent) {
      profile.preferences.priceRange.max = Math.max(
        profile.preferences.priceRange.max,
        neighborhood.housing.avgRent * 1.1
      );
    }
  }

  updateLikePreferences(profile, likeData) {
    const neighborhood = likeData.neighborhood;
    
    // Strong signal - user explicitly liked this
    if (neighborhood.safety?.safetyScore >= 8) {
      profile.preferences.safetyImportance = Math.min(1,
        profile.preferences.safetyImportance + 0.2
      );
    }

    if (neighborhood.amenities?.schools > 5) {
      profile.preferences.schoolImportance = Math.min(1,
        profile.preferences.schoolImportance + 0.2
      );
    }

    // Add to preferred areas with higher weight
    const area = neighborhood.borough;
    profile.preferences.preferredAreas = profile.preferences.preferredAreas
      .filter(a => a !== area);
    profile.preferences.preferredAreas.unshift(area); // Add to front
  }

  updateComparePreferences(profile, compareData) {
    // User is comparing - they care about differences
    const neighborhoods = compareData.neighborhoods;
    
    // Analyze what they're comparing to infer importance
    const hasSchoolVariation = this.hasSignificantVariation(
      neighborhoods.map(n => n.amenities?.schools || 0)
    );
    
    if (hasSchoolVariation) {
      profile.preferences.schoolImportance = Math.min(1,
        profile.preferences.schoolImportance + 0.1
      );
    }
  }

  updateChatPreferences(profile, chatData) {
    const message = chatData.message.toLowerCase();
    
    // Extract preferences from natural language
    if (message.includes('family') || message.includes('kids')) {
      profile.preferences.schoolImportance = Math.min(1,
        profile.preferences.schoolImportance + 0.15
      );
      profile.preferences.familySize = Math.max(profile.preferences.familySize, 3);
    }

    if (message.includes('safe') || message.includes('security')) {
      profile.preferences.safetyImportance = Math.min(1,
        profile.preferences.safetyImportance + 0.15
      );
    }

    if (message.includes('budget') || message.includes('cheap') || message.includes('affordable')) {
      profile.preferences.priceRange.max *= 0.9; // Lower budget preference
    }
  }

  hasSignificantVariation(values) {
    if (values.length < 2) return false;
    const max = Math.max(...values);
    const min = Math.min(...values);
    return (max - min) / Math.max(max, 1) > 0.3; // 30% variation
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(userId, neighborhoods, limit = 10) {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        return this.getFallbackRecommendations(neighborhoods, limit);
      }

      // Score neighborhoods based on user preferences
      const scoredNeighborhoods = neighborhoods.map(neighborhood => ({
        ...neighborhood,
        personalizedScore: this.calculatePersonalizedScore(neighborhood, profile),
        matchReasons: this.getMatchReasons(neighborhood, profile)
      }));

      // Sort by personalized score
      const recommendations = scoredNeighborhoods
        .sort((a, b) => b.personalizedScore - a.personalizedScore)
        .slice(0, limit);

      return {
        recommendations,
        profile: this.sanitizeProfile(profile),
        explanation: this.generateRecommendationExplanation(profile, recommendations)
      };

    } catch (error) {
      logger.error('Error getting personalized recommendations:', error);
      return this.getFallbackRecommendations(neighborhoods, limit);
    }
  }

  calculatePersonalizedScore(neighborhood, profile) {
    let score = 0;
    const prefs = profile.preferences;

    // Price fit (0-30 points)
    const rent = neighborhood.housing?.avgRent || 0;
    if (rent <= prefs.priceRange.max && rent >= prefs.priceRange.min) {
      score += 30 * (1 - Math.abs(rent - prefs.priceRange.max * 0.8) / prefs.priceRange.max);
    }

    // Safety importance (0-25 points)
    const safetyScore = neighborhood.safety?.safetyScore || 5;
    score += 25 * prefs.safetyImportance * (safetyScore / 10);

    // School importance (0-20 points)
    const schoolScore = Math.min(10, neighborhood.amenities?.schools || 0) / 10;
    score += 20 * prefs.schoolImportance * schoolScore;

    // Transport importance (0-15 points)
    const transitScore = (neighborhood.amenities?.transitScore || 50) / 100;
    score += 15 * prefs.transportImportance * transitScore;

    // Healthcare importance (0-10 points)
    const healthcareScore = Math.min(5, neighborhood.amenities?.hospitals || 0) / 5;
    score += 10 * prefs.healthcareImportance * healthcareScore;

    // Area preference bonus/penalty
    if (prefs.preferredAreas.includes(neighborhood.borough)) {
      const index = prefs.preferredAreas.indexOf(neighborhood.borough);
      score += 20 * (1 - index / prefs.preferredAreas.length); // Higher bonus for more preferred
    }

    if (prefs.avoidedAreas.includes(neighborhood.borough)) {
      score -= 30;
    }

    return Math.max(0, Math.min(100, score));
  }

  getMatchReasons(neighborhood, profile) {
    const reasons = [];
    const prefs = profile.preferences;

    if (neighborhood.housing?.avgRent <= prefs.priceRange.max) {
      reasons.push(`Within your budget (R${neighborhood.housing.avgRent?.toLocaleString()})`);
    }

    if (prefs.safetyImportance > 0.7 && neighborhood.safety?.safetyScore >= 8) {
      reasons.push(`Excellent safety score (${neighborhood.safety.safetyScore}/10)`);
    }

    if (prefs.schoolImportance > 0.7 && neighborhood.amenities?.schools >= 5) {
      reasons.push(`Great school access (${neighborhood.amenities.schools} schools nearby)`);
    }

    if (prefs.transportImportance > 0.7 && neighborhood.amenities?.transitScore >= 80) {
      reasons.push(`Excellent public transport (${neighborhood.amenities.transitScore}/100)`);
    }

    if (prefs.preferredAreas.includes(neighborhood.borough)) {
      reasons.push(`In your preferred area (${neighborhood.borough})`);
    }

    return reasons.slice(0, 3); // Top 3 reasons
  }

  generateRecommendationExplanation(profile, recommendations) {
    const prefs = profile.preferences;
    let explanation = "Based on your preferences, I've found neighborhoods that match your needs:\n\n";

    if (prefs.safetyImportance > 0.7) {
      explanation += "• Prioritizing safety (high importance to you)\n";
    }
    if (prefs.schoolImportance > 0.7) {
      explanation += "• Focusing on school access (important for your family)\n";
    }
    if (prefs.transportImportance > 0.7) {
      explanation += "• Emphasizing public transport connectivity\n";
    }

    explanation += `\nBudget range: R${prefs.priceRange.min?.toLocaleString()} - R${prefs.priceRange.max?.toLocaleString()}\n`;
    
    if (prefs.preferredAreas.length > 0) {
      explanation += `Preferred areas: ${prefs.preferredAreas.slice(0, 3).join(', ')}\n`;
    }

    return explanation;
  }

  async getUserProfile(userId) {
    // Check cache first
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId);
    }

    // Load from database
    try {
      await this.connect();
      const db = this.client.db();
      const collection = db.collection('user_profiles');
      const profile = await collection.findOne({ userId });
      
      if (profile) {
        this.userProfiles.set(userId, profile);
      }
      
      return profile;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      return null;
    }
  }

  sanitizeProfile(profile) {
    return {
      preferences: profile.preferences,
      interactionCount: profile.behaviorPatterns.interactionHistory.length,
      lastUpdated: profile.lastUpdated
    };
  }

  getFallbackRecommendations(neighborhoods, limit) {
    return {
      recommendations: neighborhoods.slice(0, limit).map(n => ({
        ...n,
        personalizedScore: 50,
        matchReasons: ['General recommendation']
      })),
      profile: null,
      explanation: "Showing general recommendations. Interact with the app to get personalized suggestions!"
    };
  }

  /**
   * Find users with similar preferences for collaborative filtering
   */
  async findSimilarUsers(userId, limit = 10) {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return [];

      await this.connect();
      const db = this.client.db();
      const collection = db.collection('user_profiles');

      // Find users with similar preferences using cosine similarity
      const allUsers = await collection.find({ 
        userId: { $ne: userId },
        'behaviorPatterns.interactionHistory.10': { $exists: true } // At least 10 interactions
      }).toArray();

      const similarities = allUsers.map(otherUser => ({
        userId: otherUser.userId,
        similarity: this.calculatePreferenceSimilarity(userProfile.preferences, otherUser.preferences)
      }));

      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error finding similar users:', error);
      return [];
    }
  }

  calculatePreferenceSimilarity(prefs1, prefs2) {
    // Simple cosine similarity for preference vectors
    const keys = ['safetyImportance', 'schoolImportance', 'transportImportance', 'healthcareImportance'];
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    keys.forEach(key => {
      const val1 = prefs1[key] || 0;
      const val2 = prefs2[key] || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    });

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

module.exports = PersonalizationEngine;
