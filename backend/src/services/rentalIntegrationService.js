const { MongoClient } = require('mongodb');
const HouseRental = require('../models/HouseRental');
const Neighborhood = require('../models/Neighborhood');
const logger = require('../utils/logger');

class RentalIntegrationService {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (!this.client) {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }

  /**
   * Get comprehensive rental data for a neighborhood
   */
  async getNeighborhoodRentalData(neighborhoodName) {
    try {
      await this.connect();

      // Get all rentals in the neighborhood
      const rentals = await HouseRental.find({
        location: new RegExp(neighborhoodName, 'i'),
        'availability.available': true
      }).lean();

      if (rentals.length === 0) {
        return {
          neighborhood: neighborhoodName,
          totalProperties: 0,
          message: 'No rental properties found in this neighborhood'
        };
      }

      // Calculate comprehensive statistics
      const stats = this.calculateRentalStatistics(rentals);
      
      // Get property type breakdown
      const propertyTypes = this.getPropertyTypeBreakdown(rentals);
      
      // Get bedroom distribution
      const bedroomDistribution = this.getBedroomDistribution(rentals);
      
      // Get price ranges
      const priceRanges = this.getPriceRanges(rentals);
      
      // Get featured properties (top 5 by value)
      const featuredProperties = this.getFeaturedProperties(rentals);

      return {
        neighborhood: neighborhoodName,
        totalProperties: rentals.length,
        statistics: stats,
        propertyTypes,
        bedroomDistribution,
        priceRanges,
        featuredProperties,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error getting neighborhood rental data:', error);
      throw error;
    }
  }

  /**
   * Update neighborhood data with real rental prices
   */
  async updateNeighborhoodWithRentalData(neighborhoodName) {
    try {
      await this.connect();

      const rentalData = await this.getNeighborhoodRentalData(neighborhoodName);
      
      if (rentalData.totalProperties === 0) {
        logger.warn(`No rental data found for ${neighborhoodName}`);
        return null;
      }

      // Find the neighborhood
      const neighborhood = await Neighborhood.findOne({
        name: new RegExp(neighborhoodName, 'i')
      });

      if (!neighborhood) {
        logger.warn(`Neighborhood ${neighborhoodName} not found in database`);
        return null;
      }

      // Update housing data with real rental information
      const updatedHousing = {
        ...neighborhood.housing,
        avgRent: rentalData.statistics.averagePrice,
        rentByBedroom: {
          studio: this.getBedroomPricing(rentalData.bedroomDistribution, 0),
          oneBed: this.getBedroomPricing(rentalData.bedroomDistribution, 1),
          twoBed: this.getBedroomPricing(rentalData.bedroomDistribution, 2),
          threeBed: this.getBedroomPricing(rentalData.bedroomDistribution, 3),
          fourBed: this.getBedroomPricing(rentalData.bedroomDistribution, 4)
        },
        rentalAvailability: Math.min(100, (rentalData.totalProperties / 10) * 100), // Rough estimate
        lastRentalUpdate: new Date()
      };

      // Update the neighborhood
      await Neighborhood.findByIdAndUpdate(neighborhood._id, {
        housing: updatedHousing,
        lastUpdated: new Date()
      });

      logger.info(`Updated ${neighborhoodName} with real rental data`);
      return updatedHousing;
    } catch (error) {
      logger.error('Error updating neighborhood with rental data:', error);
      throw error;
    }
  }

  /**
   * Get rental recommendations based on criteria
   */
  async getRentalRecommendations(criteria) {
    try {
      await this.connect();

      const {
        maxBudget,
        bedrooms,
        preferredLocations = [],
        propertyType,
        furnished,
        features = []
      } = criteria;

      // Build query
      const query = {
        'availability.available': true
      };

      if (maxBudget) query.price = { $lte: maxBudget };
      if (bedrooms !== undefined) query.bedrooms = bedrooms;
      if (propertyType) query.propertyType = propertyType;
      if (furnished) query.furnished = furnished;
      
      if (preferredLocations.length > 0) {
        query.location = { 
          $in: preferredLocations.map(loc => new RegExp(loc, 'i')) 
        };
      }

      if (features.length > 0) {
        query.features = { $in: features.map(f => new RegExp(f, 'i')) };
      }

      // Get recommendations
      const recommendations = await HouseRental.find(query)
        .sort({ price: 1 })
        .limit(20)
        .lean();

      // Score and rank recommendations
      const scoredRecommendations = recommendations.map(rental => ({
        ...rental,
        score: this.calculateRecommendationScore(rental, criteria)
      })).sort((a, b) => b.score - a.score);

      return {
        recommendations: scoredRecommendations.slice(0, 10),
        totalFound: recommendations.length,
        criteria,
        searchDate: new Date()
      };
    } catch (error) {
      logger.error('Error getting rental recommendations:', error);
      throw error;
    }
  }

  /**
   * Get market insights for rentals
   */
  async getRentalMarketInsights() {
    try {
      await this.connect();

      const [
        totalProperties,
        locationStats,
        priceDistribution,
        trendingLocations,
        bestValue
      ] = await Promise.all([
        HouseRental.countDocuments({ 'availability.available': true }),
        HouseRental.getLocationStats(),
        HouseRental.getPriceDistribution(),
        this.getTrendingLocations(),
        this.getBestValueProperties()
      ]);

      return {
        overview: {
          totalAvailableProperties: totalProperties,
          averagePrice: locationStats.reduce((sum, loc) => sum + loc.avgPrice, 0) / locationStats.length,
          mostPopularLocation: locationStats[0]?.location || 'N/A',
          priceRange: {
            min: Math.min(...locationStats.map(l => l.minPrice)),
            max: Math.max(...locationStats.map(l => l.maxPrice))
          }
        },
        locationStats: locationStats.slice(0, 10),
        priceDistribution,
        trendingLocations,
        bestValue,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error getting rental market insights:', error);
      throw error;
    }
  }

  // Helper methods
  calculateRentalStatistics(rentals) {
    const prices = rentals.map(r => r.price);
    const bedrooms = rentals.map(r => r.bedrooms);
    
    return {
      averagePrice: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
      medianPrice: this.calculateMedian(prices),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      averageBedrooms: Math.round(bedrooms.reduce((sum, b) => sum + b, 0) / bedrooms.length * 10) / 10,
      pricePerSqm: this.calculateAveragePricePerSqm(rentals)
    };
  }

  getPropertyTypeBreakdown(rentals) {
    const breakdown = {};
    rentals.forEach(rental => {
      const type = rental.propertyType || 'Unknown';
      if (!breakdown[type]) {
        breakdown[type] = { count: 0, avgPrice: 0, prices: [] };
      }
      breakdown[type].count++;
      breakdown[type].prices.push(rental.price);
    });

    // Calculate averages
    Object.keys(breakdown).forEach(type => {
      const prices = breakdown[type].prices;
      breakdown[type].avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
      delete breakdown[type].prices;
    });

    return breakdown;
  }

  getBedroomDistribution(rentals) {
    const distribution = {};
    rentals.forEach(rental => {
      const bedrooms = rental.bedrooms;
      if (!distribution[bedrooms]) {
        distribution[bedrooms] = { count: 0, avgPrice: 0, prices: [] };
      }
      distribution[bedrooms].count++;
      distribution[bedrooms].prices.push(rental.price);
    });

    // Calculate averages
    Object.keys(distribution).forEach(bedrooms => {
      const prices = distribution[bedrooms].prices;
      distribution[bedrooms].avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
      distribution[bedrooms].minPrice = Math.min(...prices);
      distribution[bedrooms].maxPrice = Math.max(...prices);
      delete distribution[bedrooms].prices;
    });

    return distribution;
  }

  getPriceRanges(rentals) {
    const ranges = {
      'Under R15k': 0,
      'R15k-R25k': 0,
      'R25k-R40k': 0,
      'R40k-R60k': 0,
      'R60k-R100k': 0,
      'Over R100k': 0
    };

    rentals.forEach(rental => {
      const price = rental.price;
      if (price < 15000) ranges['Under R15k']++;
      else if (price < 25000) ranges['R15k-R25k']++;
      else if (price < 40000) ranges['R25k-R40k']++;
      else if (price < 60000) ranges['R40k-R60k']++;
      else if (price < 100000) ranges['R60k-R100k']++;
      else ranges['Over R100k']++;
    });

    return ranges;
  }

  getFeaturedProperties(rentals) {
    return rentals
      .sort((a, b) => {
        // Score based on value (price per bedroom and features)
        const scoreA = this.calculateValueScore(a);
        const scoreB = this.calculateValueScore(b);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }

  calculateValueScore(rental) {
    let score = 0;
    
    // Price efficiency (lower price per bedroom is better)
    const pricePerBedroom = rental.bedrooms > 0 ? rental.price / rental.bedrooms : rental.price;
    score += (50000 - pricePerBedroom) / 1000; // Normalize
    
    // Features bonus
    score += (rental.features?.length || 0) * 5;
    
    // Parking bonus
    score += (rental.parking || 0) * 3;
    
    // Floor size bonus
    if (rental.floorSize) {
      score += rental.floorSize / 10;
    }
    
    return Math.max(0, score);
  }

  getBedroomPricing(bedroomDistribution, bedrooms) {
    const data = bedroomDistribution[bedrooms];
    if (!data) return { min: 0, max: 0, avg: 0 };
    
    return {
      min: data.minPrice || 0,
      max: data.maxPrice || 0,
      avg: data.avgPrice || 0
    };
  }

  calculateMedian(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  calculateAveragePricePerSqm(rentals) {
    const withFloorSize = rentals.filter(r => r.floorSize && r.floorSize > 0);
    if (withFloorSize.length === 0) return null;
    
    const pricesPerSqm = withFloorSize.map(r => r.price / r.floorSize);
    return Math.round(pricesPerSqm.reduce((sum, p) => sum + p, 0) / pricesPerSqm.length);
  }

  calculateRecommendationScore(rental, criteria) {
    let score = 100;
    
    // Budget efficiency
    if (criteria.maxBudget) {
      const budgetEfficiency = (criteria.maxBudget - rental.price) / criteria.maxBudget;
      score += budgetEfficiency * 50;
    }
    
    // Bedroom match
    if (criteria.bedrooms !== undefined && rental.bedrooms === criteria.bedrooms) {
      score += 30;
    }
    
    // Location preference
    if (criteria.preferredLocations?.some(loc => 
      rental.location.toLowerCase().includes(loc.toLowerCase())
    )) {
      score += 25;
    }
    
    // Features match
    if (criteria.features?.length > 0) {
      const matchingFeatures = criteria.features.filter(feature =>
        rental.features?.some(f => f.toLowerCase().includes(feature.toLowerCase()))
      );
      score += matchingFeatures.length * 10;
    }
    
    return Math.max(0, score);
  }

  async getTrendingLocations() {
    // This would analyze recent activity, for now return top locations by property count
    const stats = await HouseRental.getLocationStats();
    return stats.slice(0, 5).map(stat => ({
      location: stat._id,
      properties: stat.count,
      avgPrice: Math.round(stat.avgPrice),
      trend: 'stable' // Would be calculated from historical data
    }));
  }

  async getBestValueProperties() {
    const rentals = await HouseRental.find({ 'availability.available': true })
      .limit(100)
      .lean();
    
    return rentals
      .map(rental => ({
        ...rental,
        valueScore: this.calculateValueScore(rental)
      }))
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, 5);
  }
}

module.exports = RentalIntegrationService;
