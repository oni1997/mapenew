const mongoose = require('mongoose');

const coordinatesSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  lng: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  }
}, { _id: false });

const demographicsSchema = new mongoose.Schema({
  population: {
    type: Number,
    min: 0
  },
  medianAge: {
    type: Number,
    min: 0,
    max: 120
  },
  medianIncome: {
    type: Number,
    min: 0
  },
  educationLevel: {
    highSchool: { type: Number, min: 0, max: 100 },
    bachelors: { type: Number, min: 0, max: 100 },
    graduate: { type: Number, min: 0, max: 100 }
  },
  ethnicComposition: {
    white: { type: Number, min: 0, max: 100 },
    black: { type: Number, min: 0, max: 100 },
    hispanic: { type: Number, min: 0, max: 100 },
    asian: { type: Number, min: 0, max: 100 },
    other: { type: Number, min: 0, max: 100 }
  }
}, { _id: false });

const bedroomPricingSchema = new mongoose.Schema({
  min: { type: Number, min: 0 },
  max: { type: Number, min: 0 },
  avg: { type: Number, min: 0 }
}, { _id: false });

const housingSchema = new mongoose.Schema({
  avgRent: {
    type: Number,
    min: 0
  },
  rentByBedroom: {
    studio: bedroomPricingSchema,
    oneBed: bedroomPricingSchema,
    twoBed: bedroomPricingSchema,
    threeBed: bedroomPricingSchema,
    fourBed: bedroomPricingSchema
  },
  avgSalePrice: {
    type: Number,
    min: 0
  },
  rentalAvailability: {
    type: Number,
    min: 0,
    max: 100
  },
  homeOwnershipRate: {
    type: Number,
    min: 0,
    max: 100
  },
  pricePerSqFt: {
    type: Number,
    min: 0
  },
  rentalYield: {
    type: Number,
    min: 0,
    max: 20
  }
}, { _id: false });

const safetySchema = new mongoose.Schema({
  crimeRate: {
    type: Number,
    min: 0
  },
  safetyScore: {
    type: Number,
    min: 0,
    max: 10
  },
  crimeTypes: {
    violent: { type: Number, min: 0 },
    property: { type: Number, min: 0 },
    drug: { type: Number, min: 0 },
    other: { type: Number, min: 0 }
  }
}, { _id: false });

const amenitiesSchema = new mongoose.Schema({
  restaurants: {
    type: Number,
    min: 0
  },
  schools: {
    type: Number,
    min: 0
  },
  parks: {
    type: Number,
    min: 0
  },
  transitScore: {
    type: Number,
    min: 0,
    max: 100
  },
  walkabilityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  bikeScore: {
    type: Number,
    min: 0,
    max: 100
  },
  groceryStores: {
    type: Number,
    min: 0
  },
  hospitals: {
    type: Number,
    min: 0
  },
  beaches: {
    type: Number,
    min: 0
  },
  entertainment: [{
    type: String,
    trim: true
  }],
  shopping: [{
    type: String,
    trim: true
  }]
}, { _id: false });

const transportSchema = new mongoose.Schema({
  uberAvg: {
    type: Number,
    min: 0,
    description: "Average Uber time to city center in minutes"
  },
  publicTransport: [{
    type: String,
    trim: true,
    description: "Available public transport options"
  }],
  parking: {
    type: String,
    trim: true,
    description: "Parking situation and availability"
  }
}, { _id: false });

const climateSchema = new mongoose.Schema({
  avgTemp: {
    type: Number,
    description: "Average temperature in Celsius"
  },
  rainyDays: {
    type: Number,
    min: 0,
    max: 365,
    description: "Number of rainy days per year"
  },
  windyDays: {
    type: Number,
    min: 0,
    max: 365,
    description: "Number of windy days per year"
  },
  sunnyDays: {
    type: Number,
    min: 0,
    max: 365,
    description: "Number of sunny days per year"
  },
  humidity: {
    type: Number,
    min: 0,
    max: 100,
    description: "Average humidity percentage"
  },
  bestMonths: [{
    type: String,
    trim: true,
    description: "Best months to visit/live"
  }]
}, { _id: false });

const neighborhoodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  borough: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  city: {
    type: String,
    required: true,
    trim: true,
    default: 'New York'
  },
  state: {
    type: String,
    required: true,
    trim: true,
    default: 'NY'
  },
  coordinates: {
    type: coordinatesSchema,
    required: true
  },
  // Geographic boundary polygon in GeoJSON format
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of coordinate pairs [lng, lat]
      validate: {
        validator: function(v) {
          // Basic validation for polygon structure
          return v && v.length > 0 && v[0].length >= 4;
        },
        message: 'Boundary must be a valid polygon with at least 4 coordinate pairs'
      }
    }
  },
  demographics: demographicsSchema,
  housing: housingSchema,
  safety: safetySchema,
  amenities: amenitiesSchema,
  transport: transportSchema,
  climate: climateSchema,
  vectorEmbedding: {
    type: [Number],
    validate: {
      validator: function(v) {
        return v.length === 768; // Standard embedding dimension
      },
      message: 'Vector embedding must have exactly 768 dimensions'
    }
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  dataSource: {
    type: String,
    default: 'NYC Open Data'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
neighborhoodSchema.index({ name: 1, borough: 1 }, { unique: true });
neighborhoodSchema.index({ coordinates: '2dsphere' });
neighborhoodSchema.index({ 'housing.avgRent': 1 });
neighborhoodSchema.index({ 'safety.safetyScore': -1 });
neighborhoodSchema.index({ 'amenities.transitScore': -1 });
neighborhoodSchema.index({ tags: 1 });

// Virtual for full address
neighborhoodSchema.virtual('fullAddress').get(function() {
  return `${this.name}, ${this.borough}, ${this.city}, ${this.state}`;
});

// Virtual for affordability category (Cape Town 2025 rental market thresholds)
neighborhoodSchema.virtual('affordabilityCategory').get(function() {
  if (!this.housing?.avgRent) return 'Unknown';
  const rent = this.housing.avgRent;
  if (rent >= 50000) return 'Ultra-Luxury'; // Constantia, premium Camps Bay
  if (rent >= 35000) return 'Luxury';        // High-end Atlantic Seaboard
  if (rent >= 20000) return 'Expensive';     // Mid-range Atlantic Seaboard, premium Southern Suburbs
  if (rent >= 12000) return 'Moderate';      // Standard Southern/Northern Suburbs
  if (rent >= 8000) return 'Affordable';     // Budget suburbs, Cape Flats formal housing
  return 'Budget';                           // Cape Flats, informal settlements
});

// Static method to find similar neighborhoods using vector search
neighborhoodSchema.statics.findSimilar = async function(vectorEmbedding, limit = 10, excludeId = null) {
  const pipeline = [
    {
      $vectorSearch: {
        index: 'neighborhood_vector_index',
        path: 'vectorEmbedding',
        queryVector: vectorEmbedding,
        numCandidates: 100,
        limit: limit + (excludeId ? 1 : 0)
      }
    },
    {
      $addFields: {
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ];

  if (excludeId) {
    pipeline.push({
      $match: {
        _id: { $ne: excludeId }
      }
    });
    pipeline.push({ $limit: limit });
  }

  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Neighborhood', neighborhoodSchema);
