const mongoose = require('mongoose');

const houseRentalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  location: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
    index: true
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  floorSize: {
    type: Number,
    min: 0 // in square meters
  },
  parking: {
    type: Number,
    min: 0,
    default: 0
  },
  propertyType: {
    type: String,
    enum: ['House', 'Apartment', 'Townhouse', 'Penthouse', 'Loft', 'Studio', 'Other'],
    default: 'Apartment'
  },
  category: {
    type: String,
    enum: ['Budget', 'Moderate', 'Luxury', 'Ultra-Luxury'],
    required: true,
    index: true
  },
  size: {
    type: String,
    enum: ['Compact', 'Medium', 'Large', 'Extra Large'],
    required: true
  },
  features: [{
    type: String,
    trim: true
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  images: [{
    url: String,
    caption: String
  }],
  coordinates: {
    lat: {
      type: Number,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  contactInfo: {
    agent: String,
    phone: String,
    email: String,
    company: String
  },
  availability: {
    available: {
      type: Boolean,
      default: true
    },
    availableFrom: Date,
    leaseTerm: {
      type: String,
      enum: ['Month-to-month', '6 months', '12 months', '24 months', 'Negotiable'],
      default: '12 months'
    }
  },
  utilities: {
    included: [String],
    excluded: [String],
    avgMonthlyCost: Number
  },
  petPolicy: {
    allowed: {
      type: Boolean,
      default: false
    },
    deposit: Number,
    restrictions: String
  },
  securityDeposit: {
    type: Number,
    min: 0
  },
  furnished: {
    type: String,
    enum: ['Unfurnished', 'Semi-furnished', 'Fully furnished'],
    default: 'Unfurnished'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  dataSource: {
    type: String,
    default: 'Cape Town Rental Market 2025'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
houseRentalSchema.index({ location: 1, price: 1 });
houseRentalSchema.index({ bedrooms: 1, price: 1 });
houseRentalSchema.index({ category: 1, location: 1 });
houseRentalSchema.index({ coordinates: '2dsphere' });
houseRentalSchema.index({ 'availability.available': 1 });

// Virtual for price per square meter
houseRentalSchema.virtual('pricePerSqm').get(function() {
  if (!this.floorSize || this.floorSize === 0) return null;
  return Math.round(this.price / this.floorSize);
});

// Virtual for affordability rating
houseRentalSchema.virtual('affordabilityRating').get(function() {
  if (this.price >= 50000) return 'Ultra-Luxury';
  if (this.price >= 35000) return 'Luxury';
  if (this.price >= 20000) return 'Expensive';
  if (this.price >= 12000) return 'Moderate';
  if (this.price >= 8000) return 'Affordable';
  return 'Budget';
});

// Virtual for bedroom category
houseRentalSchema.virtual('bedroomCategory').get(function() {
  if (this.bedrooms === 0) return 'Studio';
  if (this.bedrooms === 1) return '1 Bedroom';
  if (this.bedrooms === 2) return '2 Bedrooms';
  if (this.bedrooms === 3) return '3 Bedrooms';
  if (this.bedrooms >= 4) return '4+ Bedrooms';
  return 'Unknown';
});

// Static methods
houseRentalSchema.statics.getLocationStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$location',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        avgBedrooms: { $avg: '$bedrooms' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

houseRentalSchema.statics.getPriceDistribution = function() {
  return this.aggregate([
    {
      $bucket: {
        groupBy: '$price',
        boundaries: [0, 15000, 25000, 40000, 60000, 100000, 300000],
        default: 'Over 300k',
        output: {
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          properties: { $push: '$$ROOT' }
        }
      }
    }
  ]);
};

houseRentalSchema.statics.getBedroomStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$bedrooms',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        locations: { $addToSet: '$location' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('HouseRental', houseRentalSchema);
