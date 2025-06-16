const { MongoClient } = require('mongodb');
const { logger } = require('../utils/logger');
const CrimeData = require('../models/CrimeData');

class ComprehensiveDataService {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (!this.client) {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }

  /**
   * Get comprehensive data for a neighborhood including schools, hospitals, and transport
   * @param {Object} neighborhood - Neighborhood data
   * @param {number} schoolRadius - Radius for school search in meters (default: 2000)
   * @param {number} hospitalRadius - Radius for hospital search in meters (default: 5000)
   * @returns {Promise<Object>} - Comprehensive neighborhood data
   */
  async getComprehensiveNeighborhoodData(neighborhood, schoolRadius = 2000, hospitalRadius = 5000) {
    try {
      await this.connect();
      const db = this.client.db();

      const [schools, hospitals, taxiRoutes] = await Promise.all([
        this.getNearbySchools(neighborhood.coordinates, schoolRadius),
        this.getNearbyHospitals(neighborhood.coordinates, hospitalRadius),
        this.getNearbyTaxiRoutes(neighborhood.coordinates)
      ]);

      const analysis = {
        neighborhood,
        education: this.analyzeEducationAccess(schools),
        healthcare: this.analyzeHealthcareAccess(hospitals),
        transport: this.analyzeTransportAccess(taxiRoutes),
        livabilityScore: this.calculateLivabilityScore(schools, hospitals, taxiRoutes, neighborhood)
      };

      return analysis;
    } catch (error) {
      logger.error('Error getting comprehensive neighborhood data:', error);
      throw error;
    }
  }

  /**
   * Get schools near a location
   */
  async getNearbySchools(coordinates, radius = 2000) {
    const collection = this.client.db().collection('pub_schools');
    
    const schools = await collection.find({
      geometry: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [coordinates.lng, coordinates.lat]
          },
          $maxDistance: radius
        }
      }
    }).toArray();

    return schools.map(school => ({
      id: school.properties.EMIS,
      name: school.properties.NAME,
      type: school.properties.SCHOOLTYPE,
      district: school.properties.EDUCATIONDISTRICT,
      medium: school.properties.MEDIUMOFINSTRUCTION,
      status: school.properties.SCHOOL_STATUS,
      coordinates: school.geometry.coordinates,
      distance: this.calculateDistance(coordinates, {
        lng: school.geometry.coordinates[0],
        lat: school.geometry.coordinates[1]
      })
    }));
  }

  /**
   * Get hospitals near a location
   */
  async getNearbyHospitals(coordinates, radius = 5000) {
    const collection = this.client.db().collection('pub_hospitals');
    
    const hospitals = await collection.find({
      geometry: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [coordinates.lng, coordinates.lat]
          },
          $maxDistance: radius
        }
      }
    }).toArray();

    return hospitals.map(hospital => ({
      id: hospital.properties.OBJECTID,
      name: hospital.properties.NAME,
      classification: hospital.properties.CLASSIFICATION,
      district: hospital.properties.DISTRICT,
      status: hospital.properties.STATUS,
      contact: hospital.properties.TELNO,
      coordinates: hospital.geometry.coordinates,
      distance: this.calculateDistance(coordinates, {
        lng: hospital.geometry.coordinates[0],
        lat: hospital.geometry.coordinates[1]
      })
    }));
  }

  /**
   * Get taxi routes serving an area
   */
  async getNearbyTaxiRoutes(coordinates, radius = 3000) {
    const collection = this.client.db().collection('taxi_routes');
    
    // Find routes that pass near the neighborhood
    const routes = await collection.find({
      geometry: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [coordinates.lng, coordinates.lat]
          },
          $maxDistance: radius
        }
      }
    }).limit(20).toArray();

    return routes.map(route => ({
      id: route.properties.OBJECTID,
      origin: route.properties.ORGN,
      destination: route.properties.DSTN,
      length: route.properties.SHAPE_Length
    }));
  }

  /**
   * Analyze education access
   */
  analyzeEducationAccess(schools) {
    const schoolTypes = {};
    const languages = {};
    let operationalCount = 0;

    schools.forEach(school => {
      // Count by type
      schoolTypes[school.type] = (schoolTypes[school.type] || 0) + 1;
      
      // Count by language
      languages[school.medium] = (languages[school.medium] || 0) + 1;
      
      // Count operational schools
      if (school.status === 'Open') operationalCount++;
    });

    const hasFullEducation = schoolTypes['Primary School'] > 0 && schoolTypes['Secondary School'] > 0;
    const educationScore = Math.min(100, (schools.length * 10) + (hasFullEducation ? 20 : 0));

    return {
      totalSchools: schools.length,
      operationalSchools: operationalCount,
      schoolTypes,
      languages,
      hasFullEducation,
      educationScore,
      nearestSchool: schools.length > 0 ? schools[0] : null,
      diversity: Object.keys(languages).length
    };
  }

  /**
   * Analyze healthcare access
   */
  analyzeHealthcareAccess(hospitals) {
    const classifications = {};
    let activeCount = 0;

    hospitals.forEach(hospital => {
      classifications[hospital.classification] = (classifications[hospital.classification] || 0) + 1;
      if (hospital.status === 'Active') activeCount++;
    });

    const hasHospital = classifications['Hospital'] > 0;
    const healthcareScore = Math.min(100, (hospitals.length * 15) + (hasHospital ? 25 : 0));

    return {
      totalFacilities: hospitals.length,
      activeFacilities: activeCount,
      classifications,
      hasHospital,
      healthcareScore,
      nearestFacility: hospitals.length > 0 ? hospitals[0] : null,
      emergencyAccess: hasHospital && hospitals[0]?.distance < 10000 // Within 10km
    };
  }

  /**
   * Analyze transport access
   */
  analyzeTransportAccess(taxiRoutes) {
    const origins = new Set();
    const destinations = new Set();

    taxiRoutes.forEach(route => {
      origins.add(route.origin);
      destinations.add(route.destination);
    });

    const connectivity = origins.size + destinations.size;
    const transportScore = Math.min(100, connectivity * 2);

    return {
      totalRoutes: taxiRoutes.length,
      uniqueOrigins: origins.size,
      uniqueDestinations: destinations.size,
      connectivity,
      transportScore,
      majorDestinations: Array.from(destinations).slice(0, 5)
    };
  }

  /**
   * Calculate overall livability score
   */
  calculateLivabilityScore(schools, hospitals, taxiRoutes, neighborhood) {
    const educationScore = Math.min(100, schools.length * 10);
    const healthcareScore = Math.min(100, hospitals.length * 15);
    const transportScore = Math.min(100, taxiRoutes.length * 5);
    const safetyScore = (neighborhood.safety?.safetyScore || 5) * 10;
    const amenityScore = neighborhood.amenities?.transitScore || 50;

    const weights = {
      education: 0.2,
      healthcare: 0.2,
      transport: 0.15,
      safety: 0.25,
      amenities: 0.2
    };

    const livabilityScore = 
      (educationScore * weights.education) +
      (healthcareScore * weights.healthcare) +
      (transportScore * weights.transport) +
      (safetyScore * weights.safety) +
      (amenityScore * weights.amenities);

    return Math.round(livabilityScore);
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(coord1, coord2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.lat * Math.PI/180;
    const φ2 = coord2.lat * Math.PI/180;
    const Δφ = (coord2.lat-coord1.lat) * Math.PI/180;
    const Δλ = (coord2.lng-coord1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c); // Distance in meters
  }

  /**
   * Get comprehensive market insights using ALL databases
   */
  async getEnhancedMarketInsights() {
    try {
      await this.connect();
      const db = this.client.db();

      const [
        schoolStats,
        hospitalStats,
        neighborhoodStats,
        rentalStats,
        taxiRouteStats,
        crimeStats,
        infrastructureAnalysis,
        marketTrends
      ] = await Promise.all([
        this.getSchoolStatistics(),
        this.getHospitalStatistics(),
        this.getNeighborhoodStatistics(),
        this.getRentalMarketStatistics(),
        this.getTaxiRouteStatistics(),
        this.getCrimeStatistics(),
        this.getInfrastructureAnalysis(),
        this.getMarketTrends()
      ]);

      // Generate comprehensive insights
      const comprehensiveInsights = this.generateComprehensiveInsights(
        schoolStats,
        hospitalStats,
        neighborhoodStats,
        rentalStats,
        taxiRouteStats,
        crimeStats,
        infrastructureAnalysis,
        marketTrends
      );

      return {
        overview: {
          totalDataPoints: schoolStats.total + hospitalStats.total + neighborhoodStats.totalNeighborhoods + rentalStats.totalProperties + crimeStats.totalCrimes,
          lastUpdated: new Date(),
          dataSourcesUsed: ['neighborhoods', 'schools', 'hospitals', 'rentals', 'taxi_routes', 'crime_data']
        },
        education: schoolStats,
        healthcare: hospitalStats,
        neighborhoods: neighborhoodStats,
        rentals: rentalStats,
        transport: taxiRouteStats,
        crime: crimeStats,
        infrastructure: infrastructureAnalysis,
        marketTrends,
        insights: comprehensiveInsights,
        recommendations: this.generateActionableRecommendations(comprehensiveInsights)
      };
    } catch (error) {
      logger.error('Error getting enhanced market insights:', error);
      throw error;
    }
  }

  async getSchoolStatistics() {
    const collection = this.client.db().collection('pub_schools');
    
    const [total, typeBreakdown, districtBreakdown] = await Promise.all([
      collection.countDocuments(),
      collection.aggregate([
        { $group: { _id: '$properties.SCHOOLTYPE', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: '$properties.EDUCATIONDISTRICT', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray()
    ]);

    return { total, typeBreakdown, districtBreakdown };
  }

  async getHospitalStatistics() {
    const collection = this.client.db().collection('pub_hospitals');
    
    const [total, classificationBreakdown] = await Promise.all([
      collection.countDocuments(),
      collection.aggregate([
        { $group: { _id: '$properties.CLASSIFICATION', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray()
    ]);

    return { total, classificationBreakdown };
  }

  async getNeighborhoodStatistics() {
    const collection = this.client.db().collection('neighborhoods');

    const [
      totalNeighborhoods,
      boroughStats,
      safetyStats,
      housingStats,
      amenityStats
    ] = await Promise.all([
      collection.countDocuments(),
      collection.aggregate([
        { $group: { _id: '$borough', count: { $sum: 1 }, avgRent: { $avg: '$housing.avgRent' } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: { $round: '$safety.safetyScore' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray(),
      collection.aggregate([
        {
          $group: {
            _id: null,
            avgRent: { $avg: '$housing.avgRent' },
            minRent: { $min: '$housing.avgRent' },
            maxRent: { $max: '$housing.avgRent' },
            avgSalePrice: { $avg: '$housing.avgSalePrice' }
          }
        }
      ]).toArray(),
      collection.aggregate([
        {
          $group: {
            _id: null,
            avgRestaurants: { $avg: '$amenities.restaurants' },
            avgShops: { $avg: '$amenities.shops' },
            avgTransitScore: { $avg: '$amenities.transitScore' }
          }
        }
      ]).toArray()
    ]);

    return {
      totalNeighborhoods,
      boroughStats,
      safetyStats,
      housingStats: housingStats[0] || {},
      amenityStats: amenityStats[0] || {},
      averageRent: housingStats[0]?.avgRent || 0,
      safetyDistribution: safetyStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }

  async getRentalMarketStatistics() {
    const collection = this.client.db('houseRentals').collection('properties');

    const [
      totalProperties,
      availableProperties,
      locationStats,
      priceDistribution,
      bedroomStats,
      categoryStats
    ] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ 'availability.available': true }),
      collection.aggregate([
        { $group: { _id: '$location', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),
      collection.aggregate([
        {
          $bucket: {
            groupBy: '$price',
            boundaries: [0, 10000, 20000, 35000, 50000, 100000],
            default: 'Over 100k',
            output: { count: { $sum: 1 }, avgPrice: { $avg: '$price' } }
          }
        }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: '$bedrooms', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
        { $sort: { _id: 1 } }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
        { $sort: { count: -1 } }
      ]).toArray()
    ]);

    return {
      totalProperties,
      availableProperties,
      occupancyRate: ((totalProperties - availableProperties) / totalProperties * 100).toFixed(1),
      locationStats,
      priceDistribution,
      bedroomStats,
      categoryStats,
      averagePrice: locationStats.reduce((sum, loc) => sum + loc.avgPrice, 0) / locationStats.length
    };
  }

  async getTaxiRouteStatistics() {
    const collection = this.client.db().collection('taxi_routes');

    const [
      totalRoutes,
      originStats,
      destinationStats,
      routeLength
    ] = await Promise.all([
      collection.countDocuments(),
      collection.aggregate([
        { $group: { _id: '$properties.ORGN', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: '$properties.DSTN', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),
      collection.aggregate([
        {
          $group: {
            _id: null,
            avgLength: { $avg: '$properties.SHAPE_Length' },
            totalLength: { $sum: '$properties.SHAPE_Length' }
          }
        }
      ]).toArray()
    ]);

    return {
      totalRoutes,
      originStats,
      destinationStats,
      routeLength: routeLength[0] || {},
      connectivity: originStats.length + destinationStats.length
    };
  }

  async getCrimeStatistics() {
    const collection = this.client.db().collection('crimedatas');

    const [
      totalCrimes,
      crimesByCategory,
      crimesByNeighborhood,
      crimesBySeverity,
      crimesByType,
      recentTrends,
      safetyMetrics
    ] = await Promise.all([
      collection.countDocuments(),
      collection.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: '$neighborhood', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: '$incidentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),
      collection.aggregate([
        {
          $match: {
            date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last year
          }
        },
        {
          $group: {
            _id: { year: '$year', month: '$month' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]).toArray(),
      collection.aggregate([
        {
          $group: {
            _id: '$neighborhood',
            totalCrimes: { $sum: 1 },
            violentCrimes: {
              $sum: { $cond: [{ $eq: ['$category', 'VIOLENT'] }, 1, 0] }
            },
            propertyCrimes: {
              $sum: { $cond: [{ $eq: ['$category', 'PROPERTY'] }, 1, 0] }
            },
            highSeverity: {
              $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] }
            }
          }
        },
        {
          $addFields: {
            crimeRate: '$totalCrimes',
            violentCrimeRate: { $divide: ['$violentCrimes', '$totalCrimes'] },
            safetyScore: {
              $max: [
                1,
                {
                  $subtract: [
                    10,
                    {
                      $add: [
                        { $min: [{ $divide: ['$totalCrimes', 100] }, 5] },
                        { $multiply: [{ $divide: ['$violentCrimes', '$totalCrimes'] }, 3] }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        },
        { $sort: { safetyScore: -1 } }
      ]).toArray()
    ]);

    // Calculate overall safety metrics
    const overallSafetyScore = safetyMetrics.reduce((sum, area) => sum + area.safetyScore, 0) / safetyMetrics.length;
    const totalViolentCrimes = safetyMetrics.reduce((sum, area) => sum + area.violentCrimes, 0);
    const violentCrimeRate = totalViolentCrimes / totalCrimes;

    return {
      totalCrimes,
      crimesByCategory,
      crimesByNeighborhood,
      crimesBySeverity,
      crimesByType,
      recentTrends,
      safetyMetrics,
      overallSafetyScore: parseFloat(overallSafetyScore.toFixed(2)),
      violentCrimeRate: parseFloat(violentCrimeRate.toFixed(3)),
      safestAreas: safetyMetrics.slice(0, 5),
      highestCrimeAreas: safetyMetrics.slice(-5).reverse()
    };
  }

  async getInfrastructureAnalysis() {
    // Cross-reference all infrastructure data
    const [schools, hospitals, neighborhoods] = await Promise.all([
      this.client.db().collection('pub_schools').find({}).toArray(),
      this.client.db().collection('pub_hospitals').find({}).toArray(),
      this.client.db().collection('neighborhoods').find({}).toArray()
    ]);

    // Calculate infrastructure density per neighborhood
    const infrastructureDensity = neighborhoods.map(neighborhood => {
      const nearbySchools = schools.filter(school =>
        this.calculateDistance(
          neighborhood.coordinates,
          { lng: school.geometry.coordinates[0], lat: school.geometry.coordinates[1] }
        ) < 3000
      );

      const nearbyHospitals = hospitals.filter(hospital =>
        this.calculateDistance(
          neighborhood.coordinates,
          { lng: hospital.geometry.coordinates[0], lat: hospital.geometry.coordinates[1] }
        ) < 5000
      );

      return {
        neighborhood: neighborhood.name,
        schoolCount: nearbySchools.length,
        hospitalCount: nearbyHospitals.length,
        infrastructureScore: (nearbySchools.length * 10) + (nearbyHospitals.length * 15),
        safetyScore: neighborhood.safety?.safetyScore || 5,
        avgRent: neighborhood.housing?.avgRent || 0
      };
    });

    return {
      totalAnalyzed: neighborhoods.length,
      infrastructureDensity: infrastructureDensity.sort((a, b) => b.infrastructureScore - a.infrastructureScore),
      bestInfrastructure: infrastructureDensity.slice(0, 5),
      worstInfrastructure: infrastructureDensity.slice(-5).reverse()
    };
  }

  async getMarketTrends() {
    // Analyze trends across all data sources
    const [neighborhoods, rentals] = await Promise.all([
      this.client.db().collection('neighborhoods').find({}).toArray(),
      this.client.db('houseRentals').collection('properties').find({}).toArray()
    ]);

    // Calculate market trends
    const trends = {
      hotspots: neighborhoods
        .filter(n => n.amenities?.restaurants > 20 && n.safety?.safetyScore > 7)
        .sort((a, b) => (b.amenities?.restaurants || 0) - (a.amenities?.restaurants || 0))
        .slice(0, 5),

      valueOpportunities: neighborhoods
        .filter(n => n.housing?.avgRent < 20000 && n.safety?.safetyScore > 6)
        .sort((a, b) => (b.safety?.safetyScore || 0) - (a.safety?.safetyScore || 0))
        .slice(0, 5),

      emergingAreas: neighborhoods
        .filter(n => n.demographics?.medianAge < 35 && n.amenities?.transitScore > 70)
        .slice(0, 5),

      rentalTrends: {
        mostAffordable: rentals
          .filter(r => r.availability?.available)
          .sort((a, b) => a.price - b.price)
          .slice(0, 5),

        bestValue: rentals
          .filter(r => r.availability?.available && r.floorSize > 0)
          .map(r => ({ ...r, pricePerSqm: r.price / r.floorSize }))
          .sort((a, b) => a.pricePerSqm - b.pricePerSqm)
          .slice(0, 5)
      }
    };

    return trends;
  }

  generateComprehensiveInsights(schoolStats, hospitalStats, neighborhoodStats, rentalStats, taxiRouteStats, crimeStats, infrastructureAnalysis, marketTrends) {
    return [
      {
        title: "Education Infrastructure",
        value: `${schoolStats.total} schools`,
        trend: "stable",
        description: `Cape Town has ${schoolStats.total} public schools across ${schoolStats.districtBreakdown.length} education districts.`,
        impact: "high",
        category: "education"
      },
      {
        title: "Healthcare Access",
        value: `${hospitalStats.total} facilities`,
        trend: "improving",
        description: `Healthcare infrastructure includes ${hospitalStats.classificationBreakdown.length} different facility types.`,
        impact: "high",
        category: "healthcare"
      },
      {
        title: "Rental Market Activity",
        value: `${rentalStats.totalProperties} properties`,
        trend: rentalStats.occupancyRate > 80 ? "hot" : "moderate",
        description: `${rentalStats.occupancyRate}% occupancy rate with average rent of R${Math.round(rentalStats.averagePrice).toLocaleString()}.`,
        impact: "high",
        category: "housing"
      },
      {
        title: "Transport Connectivity",
        value: `${taxiRouteStats.totalRoutes} routes`,
        trend: "stable",
        description: `Extensive taxi network connecting ${taxiRouteStats.connectivity} unique locations.`,
        impact: "medium",
        category: "transport"
      },
      {
        title: "Infrastructure Density",
        value: `${infrastructureAnalysis.bestInfrastructure.length} top areas`,
        trend: "improving",
        description: `${infrastructureAnalysis.bestInfrastructure[0]?.neighborhood} leads with infrastructure score of ${infrastructureAnalysis.bestInfrastructure[0]?.infrastructureScore}.`,
        impact: "high",
        category: "infrastructure"
      },
      {
        title: "Market Hotspots",
        value: `${marketTrends.hotspots.length} emerging areas`,
        trend: "hot",
        description: `${marketTrends.hotspots[0]?.name} and ${marketTrends.hotspots[1]?.name} showing strong growth indicators.`,
        impact: "high",
        category: "investment"
      },
      {
        title: "Safety & Security",
        value: `${crimeStats.overallSafetyScore}/10 avg score`,
        trend: crimeStats.violentCrimeRate < 0.2 ? "improving" : "stable",
        description: `${crimeStats.totalCrimes} total incidents analyzed. ${crimeStats.safestAreas[0]?._id} is the safest area.`,
        impact: "high",
        category: "safety"
      }
    ];
  }

  generateActionableRecommendations(insights) {
    return [
      {
        category: "Investment",
        title: "Value Opportunities",
        description: "Focus on neighborhoods with good infrastructure but lower rental prices",
        action: "Consider areas with safety scores above 6 and rent below R20,000",
        priority: "high"
      },
      {
        category: "Living",
        title: "Family-Friendly Areas",
        description: "Choose neighborhoods with good school and hospital access",
        action: "Look for areas within 2km of primary schools and 5km of hospitals",
        priority: "high"
      },
      {
        category: "Transport",
        title: "Connectivity Matters",
        description: "Areas with multiple taxi routes offer better mobility",
        action: "Prioritize locations with 5+ taxi route connections",
        priority: "medium"
      },
      {
        category: "Safety",
        title: "Security Investment",
        description: "Higher safety scores correlate with better long-term value",
        action: "Target neighborhoods with safety scores above 7",
        priority: "high"
      }
    ];
  }
}

module.exports = ComprehensiveDataService;
