const mongoose = require('mongoose');

const crimeDataSchema = new mongoose.Schema({
  neighborhood: {
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
  incidentType: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'ASSAULT',
      'BURGLARY',
      'ROBBERY',
      'THEFT',
      'VANDALISM',
      'DRUG_OFFENSE',
      'DOMESTIC_VIOLENCE',
      'FRAUD',
      'VEHICLE_THEFT',
      'HOMICIDE',
      'OTHER'
    ]
  },
  category: {
    type: String,
    required: true,
    enum: ['VIOLENT', 'PROPERTY', 'DRUG', 'OTHER']
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  coordinates: {
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
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  timeOfDay: {
    type: String,
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'],
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    required: true
  },
  month: {
    type: Number,
    min: 1,
    max: 12,
    required: true
  },
  year: {
    type: Number,
    min: 2000,
    max: 2030,
    required: true
  },
  resolved: {
    type: Boolean,
    default: false
  },
  dataSource: {
    type: String,
    default: 'NYC Open Data'
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
crimeDataSchema.index({ neighborhood: 1, date: -1 });
crimeDataSchema.index({ borough: 1, incidentType: 1, date: -1 });
crimeDataSchema.index({ coordinates: '2dsphere' });
crimeDataSchema.index({ year: 1, month: 1 });
crimeDataSchema.index({ category: 1, severity: 1 });

// Static method to get crime statistics for a neighborhood
crimeDataSchema.statics.getNeighborhoodStats = async function(neighborhood, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        neighborhood: neighborhood,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        incidents: {
          $push: {
            type: '$incidentType',
            date: '$date',
            severity: '$severity'
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalIncidents: { $sum: '$count' },
        byCategory: {
          $push: {
            category: '$_id',
            count: '$count',
            incidents: '$incidents'
          }
        }
      }
    }
  ];

  return this.aggregate(pipeline);
};

// Static method to get trend data
crimeDataSchema.statics.getTrendData = async function(neighborhood, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const pipeline = [
    {
      $match: {
        neighborhood: neighborhood,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: '$year',
          month: '$month',
          category: '$category'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1
      }
    }
  ];

  return this.aggregate(pipeline);
};

// Static method to compare crime rates between neighborhoods
crimeDataSchema.statics.compareNeighborhoods = async function(neighborhoods, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        neighborhood: { $in: neighborhoods },
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          neighborhood: '$neighborhood',
          category: '$category'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.neighborhood',
        totalCrimes: { $sum: '$count' },
        byCategory: {
          $push: {
            category: '$_id.category',
            count: '$count'
          }
        }
      }
    }
  ];

  return this.aggregate(pipeline);
};

module.exports = mongoose.model('CrimeData', crimeDataSchema);
