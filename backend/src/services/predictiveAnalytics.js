const { MongoClient } = require('mongodb');
const { logger } = require('../utils/logger');

class PredictiveAnalytics {
  constructor() {
    this.client = null;
    this.models = {
      priceGrowth: this.initializePriceGrowthModel(),
      gentrification: this.initializeGentrificationModel(),
      infrastructure: this.initializeInfrastructureModel()
    };
  }

  async connect() {
    if (!this.client) {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
    }
    return this.client;
  }

  /**
   * Predict housing price trends for neighborhoods
   */
  async predictPriceTrends(neighborhoodId, timeHorizon = 36) { // 36 months default
    try {
      await this.connect();
      const db = this.client.db();
      
      // Get neighborhood data
      const neighborhood = await db.collection('neighborhoods').findOne({ _id: neighborhoodId });
      if (!neighborhood) throw new Error('Neighborhood not found');

      // Get historical data (simulated for demo)
      const historicalData = await this.getHistoricalPriceData(neighborhoodId);
      
      // Calculate prediction factors
      const factors = await this.calculatePredictionFactors(neighborhood);
      
      // Generate predictions
      const predictions = this.generatePricePredictions(
        neighborhood.housing?.avgRent || 15000,
        factors,
        timeHorizon
      );

      return {
        neighborhood: neighborhood.name,
        currentPrice: neighborhood.housing?.avgRent || 15000,
        predictions,
        factors,
        confidence: this.calculateConfidence(factors),
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error('Error predicting price trends:', error);
      throw error;
    }
  }

  async calculatePredictionFactors(neighborhood) {
    const factors = {
      // Infrastructure development factor
      infrastructureScore: await this.calculateInfrastructureScore(neighborhood),
      
      // Safety trend factor
      safetyTrend: this.calculateSafetyTrend(neighborhood.safety?.safetyScore || 5),
      
      // Education quality factor
      educationFactor: await this.calculateEducationFactor(neighborhood),
      
      // Transport connectivity factor
      transportFactor: this.calculateTransportFactor(neighborhood.amenities?.transitScore || 50),
      
      // Economic indicators
      economicGrowth: this.getEconomicGrowthFactor(neighborhood.borough),
      
      // Supply/demand dynamics
      supplyDemand: this.calculateSupplyDemandFactor(neighborhood),
      
      // Gentrification pressure
      gentrificationPressure: await this.calculateGentrificationPressure(neighborhood)
    };

    return factors;
  }

  async calculateInfrastructureScore(neighborhood) {
    try {
      await this.connect();
      const db = this.client.db();
      
      // Count nearby infrastructure
      const [schools, hospitals] = await Promise.all([
        db.collection('pub_schools').countDocuments({
          geometry: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [neighborhood.coordinates.lng, neighborhood.coordinates.lat]
              },
              $maxDistance: 2000
            }
          }
        }),
        db.collection('pub_hospitals').countDocuments({
          geometry: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [neighborhood.coordinates.lng, neighborhood.coordinates.lat]
              },
              $maxDistance: 5000
            }
          }
        })
      ]);

      // Infrastructure development score (0-1)
      const schoolScore = Math.min(1, schools / 10); // Normalize to max 10 schools
      const hospitalScore = Math.min(1, hospitals / 5); // Normalize to max 5 hospitals
      
      return (schoolScore * 0.6 + hospitalScore * 0.4);
    } catch (error) {
      logger.warn('Error calculating infrastructure score:', error);
      return 0.5; // Default neutral score
    }
  }

  calculateSafetyTrend(currentSafetyScore) {
    // Simulate safety trend based on current score
    // Higher current safety = more stable/improving trend
    const baseScore = currentSafetyScore / 10;
    const trendFactor = baseScore > 0.7 ? 0.1 : baseScore > 0.5 ? 0.05 : -0.05;
    return Math.max(-0.2, Math.min(0.2, trendFactor));
  }

  async calculateEducationFactor(neighborhood) {
    try {
      await this.connect();
      const db = this.client.db();
      
      const schools = await db.collection('pub_schools').find({
        geometry: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [neighborhood.coordinates.lng, neighborhood.coordinates.lat]
            },
            $maxDistance: 2000
          }
        }
      }).toArray();

      // Calculate education quality score
      let qualityScore = 0;
      schools.forEach(school => {
        const type = school.properties.SCHOOLTYPE;
        if (type === 'Secondary School') qualityScore += 0.4;
        else if (type === 'Primary School') qualityScore += 0.3;
        else if (type === 'Combined School') qualityScore += 0.5;
        else qualityScore += 0.2;
      });

      return Math.min(1, qualityScore);
    } catch (error) {
      logger.warn('Error calculating education factor:', error);
      return 0.5;
    }
  }

  calculateTransportFactor(transitScore) {
    // Convert transit score to growth factor
    const normalizedScore = transitScore / 100;
    return normalizedScore > 0.8 ? 0.15 : normalizedScore > 0.6 ? 0.1 : normalizedScore > 0.4 ? 0.05 : 0;
  }

  getEconomicGrowthFactor(borough) {
    // Simulated economic growth factors by borough
    const growthFactors = {
      'City Bowl': 0.12,
      'Atlantic Seaboard': 0.08,
      'Southern Suburbs': 0.10,
      'Northern Suburbs': 0.15,
      'Cape Flats': 0.18,
      'West Coast': 0.20
    };
    
    return growthFactors[borough] || 0.10; // Default 10% growth
  }

  calculateSupplyDemandFactor(neighborhood) {
    // Simulate supply/demand based on affordability category
    const category = neighborhood.affordabilityCategory;
    const demandFactors = {
      'Budget': 0.15,      // High demand, low supply
      'Affordable': 0.12,
      'Moderate': 0.08,
      'Expensive': 0.05,
      'Luxury': 0.03,
      'Ultra-Luxury': 0.01
    };
    
    return demandFactors[category] || 0.08;
  }

  async calculateGentrificationPressure(neighborhood) {
    // Factors indicating gentrification pressure
    const currentRent = neighborhood.housing?.avgRent || 15000;
    const safetyScore = neighborhood.safety?.safetyScore || 5;
    const transitScore = neighborhood.amenities?.transitScore || 50;
    
    // Low rent + improving safety + good transit = high gentrification pressure
    let pressure = 0;
    
    if (currentRent < 20000) pressure += 0.3; // Affordable areas
    if (safetyScore > 6) pressure += 0.2; // Safe areas
    if (transitScore > 70) pressure += 0.2; // Good transport
    
    // Infrastructure development adds pressure
    const infraScore = await this.calculateInfrastructureScore(neighborhood);
    pressure += infraScore * 0.3;
    
    return Math.min(1, pressure);
  }

  generatePricePredictions(currentPrice, factors, months) {
    const predictions = [];
    let price = currentPrice;
    
    for (let month = 1; month <= months; month++) {
      // Calculate monthly growth rate
      const monthlyGrowthRate = this.calculateMonthlyGrowthRate(factors, month);
      
      // Apply growth
      price *= (1 + monthlyGrowthRate);
      
      // Add some realistic volatility
      const volatility = this.calculateVolatility(factors);
      const randomFactor = 1 + (Math.random() - 0.5) * volatility;
      price *= randomFactor;
      
      predictions.push({
        month,
        predictedPrice: Math.round(price),
        growthRate: monthlyGrowthRate,
        confidence: this.calculateMonthlyConfidence(month, factors)
      });
    }
    
    return predictions;
  }

  calculateMonthlyGrowthRate(factors, month) {
    // Base growth rate from economic factors
    let baseRate = factors.economicGrowth / 12; // Convert annual to monthly
    
    // Infrastructure improvements (gradual impact)
    baseRate += (factors.infrastructureScore * 0.02) / 12;
    
    // Safety improvements
    baseRate += factors.safetyTrend / 12;
    
    // Education factor
    baseRate += (factors.educationFactor * 0.015) / 12;
    
    // Transport improvements
    baseRate += factors.transportFactor / 12;
    
    // Supply/demand dynamics
    baseRate += factors.supplyDemand / 12;
    
    // Gentrification pressure (accelerates over time)
    const gentrificationImpact = factors.gentrificationPressure * (month / 36) * 0.03;
    baseRate += gentrificationImpact / 12;
    
    // Seasonal adjustments (Cape Town market patterns)
    const seasonalFactor = this.getSeasonalFactor(month);
    baseRate *= seasonalFactor;
    
    return Math.max(-0.02, Math.min(0.05, baseRate)); // Cap between -2% and 5% monthly
  }

  getSeasonalFactor(month) {
    // Cape Town rental market seasonality
    const seasonalPattern = [
      1.02, 1.01, 0.99, 0.98, 0.97, 0.98, // Jan-Jun (summer to winter)
      0.99, 1.00, 1.01, 1.02, 1.03, 1.02  // Jul-Dec (winter to summer)
    ];
    
    const seasonIndex = (month - 1) % 12;
    return seasonalPattern[seasonIndex];
  }

  calculateVolatility(factors) {
    // Higher infrastructure and safety = lower volatility
    const stabilityFactor = (factors.infrastructureScore + factors.safetyTrend + 1) / 3;
    const baseVolatility = 0.05; // 5% base volatility
    
    return baseVolatility * (2 - stabilityFactor); // Inverse relationship
  }

  calculateMonthlyConfidence(month, factors) {
    // Confidence decreases over time and with uncertainty
    const timeDecay = Math.max(0.3, 1 - (month / 60)); // Decay over 5 years
    
    const stabilityFactor = (
      factors.infrastructureScore + 
      Math.abs(factors.safetyTrend) + 
      factors.educationFactor
    ) / 3;
    
    return Math.round((timeDecay * stabilityFactor) * 100);
  }

  calculateConfidence(factors) {
    // Overall model confidence based on data quality and stability
    const dataQuality = (
      factors.infrastructureScore + 
      factors.educationFactor + 
      (factors.safetyTrend > 0 ? 1 : 0.5)
    ) / 3;
    
    return Math.round(dataQuality * 85 + 15); // 15-100% confidence range
  }

  async getHistoricalPriceData(neighborhoodId) {
    // Simulate historical data for demo
    // In production, this would query actual historical price data
    const months = 24;
    const data = [];
    let basePrice = 15000;
    
    for (let i = months; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Simulate realistic price progression
      basePrice *= (1 + (Math.random() - 0.45) * 0.02); // Slight upward trend with volatility
      
      data.push({
        date,
        price: Math.round(basePrice),
        volume: Math.floor(Math.random() * 50) + 10 // Simulated transaction volume
      });
    }
    
    return data;
  }

  /**
   * Predict gentrification risk for a neighborhood
   */
  async predictGentrificationRisk(neighborhoodId) {
    try {
      const neighborhood = await this.getNeighborhood(neighborhoodId);
      const factors = await this.calculatePredictionFactors(neighborhood);
      
      const riskScore = factors.gentrificationPressure;
      const timeframe = this.estimateGentrificationTimeframe(riskScore);
      
      return {
        neighborhood: neighborhood.name,
        riskLevel: this.categorizeRisk(riskScore),
        riskScore: Math.round(riskScore * 100),
        estimatedTimeframe: timeframe,
        keyFactors: this.identifyGentrificationFactors(factors),
        recommendations: this.generateGentrificationRecommendations(riskScore)
      };
      
    } catch (error) {
      logger.error('Error predicting gentrification risk:', error);
      throw error;
    }
  }

  categorizeRisk(score) {
    if (score >= 0.8) return 'Very High';
    if (score >= 0.6) return 'High';
    if (score >= 0.4) return 'Moderate';
    if (score >= 0.2) return 'Low';
    return 'Very Low';
  }

  estimateGentrificationTimeframe(riskScore) {
    if (riskScore >= 0.8) return '1-2 years';
    if (riskScore >= 0.6) return '2-4 years';
    if (riskScore >= 0.4) return '4-7 years';
    if (riskScore >= 0.2) return '7-10 years';
    return '10+ years';
  }

  identifyGentrificationFactors(factors) {
    const keyFactors = [];
    
    if (factors.infrastructureScore > 0.7) {
      keyFactors.push('Strong infrastructure development');
    }
    if (factors.transportFactor > 0.1) {
      keyFactors.push('Excellent transport connectivity');
    }
    if (factors.safetyTrend > 0.05) {
      keyFactors.push('Improving safety conditions');
    }
    if (factors.supplyDemand > 0.1) {
      keyFactors.push('High housing demand');
    }
    
    return keyFactors;
  }

  generateGentrificationRecommendations(riskScore) {
    if (riskScore >= 0.7) {
      return [
        'Consider investing now before significant price increases',
        'Existing residents should be aware of potential displacement pressure',
        'Monitor rental market closely for rapid changes'
      ];
    } else if (riskScore >= 0.4) {
      return [
        'Good medium-term investment opportunity',
        'Stable area with gradual improvement expected',
        'Suitable for long-term residents'
      ];
    } else {
      return [
        'Stable area with minimal gentrification pressure',
        'Good for affordable long-term housing',
        'Lower investment appreciation potential'
      ];
    }
  }

  async getNeighborhood(neighborhoodId) {
    await this.connect();
    const db = this.client.db();
    return await db.collection('neighborhoods').findOne({ _id: neighborhoodId });
  }

  // Initialize ML models (simplified for demo)
  initializePriceGrowthModel() {
    return {
      weights: {
        infrastructure: 0.25,
        safety: 0.20,
        education: 0.15,
        transport: 0.15,
        economic: 0.15,
        supplyDemand: 0.10
      }
    };
  }

  initializeGentrificationModel() {
    return {
      thresholds: {
        low: 0.2,
        moderate: 0.4,
        high: 0.6,
        veryHigh: 0.8
      }
    };
  }

  initializeInfrastructureModel() {
    return {
      developmentFactors: {
        schoolDensity: 0.3,
        hospitalAccess: 0.25,
        transportConnectivity: 0.25,
        commercialDevelopment: 0.2
      }
    };
  }
}

module.exports = PredictiveAnalytics;
