const express = require('express');
const { MongoClient } = require('mongodb');
const { query, param, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const router = express.Router();

/**
 * GET /api/schools
 * Get all schools with optional filtering
 */
router.get('/', [
  query('type').optional().isString().trim(),
  query('district').optional().isString().trim(),
  query('status').optional().isString().trim(),
  query('medium').optional().isString().trim(),
  query('sector').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('format').optional().isIn(['google-maps', 'geojson', 'raw']),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      type,
      district,
      status,
      medium,
      sector,
      limit = 100,
      offset = 0,
      format = 'google-maps'
    } = req.query;

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_schools');
    
    // Build query
    const query = {};
    if (type) {
      query['properties.SCHOOLTYPE'] = new RegExp(type, 'i');
    }
    if (district) {
      query['properties.EDUCATIONDISTRICT'] = new RegExp(district, 'i');
    }
    if (status) {
      query['properties.SCHOOL_STATUS'] = new RegExp(status, 'i');
    }
    if (medium) {
      query['properties.MEDIUMOFINSTRUCTION'] = new RegExp(medium, 'i');
    }
    if (sector) {
      query['properties.SECTOR'] = new RegExp(sector, 'i');
    }

    const schools = await collection.find(query)
      .limit(limit)
      .skip(offset)
      .toArray();

    const total = await collection.countDocuments(query);

    await client.close();

    // Transform data based on format
    let transformedSchools;
    switch (format) {
      case 'google-maps':
        transformedSchools = schools.map(transformForGoogleMaps);
        break;
      case 'geojson':
        transformedSchools = schools.map(transformForGeoJSON);
        break;
      default:
        transformedSchools = schools.map(school => ({
          id: school.properties.EMIS,
          name: school.properties.NAME,
          type: school.properties.SCHOOLTYPE,
          district: school.properties.EDUCATIONDISTRICT,
          circuit: school.properties.CIRCUIT,
          sector: school.properties.SECTOR,
          control: school.properties.CONTROL,
          status: school.properties.SCHOOL_STATUS,
          medium: school.properties.MEDIUMOFINSTRUCTION,
          coordinates: school.geometry.coordinates
        }));
    }

    res.json({
      schools: transformedSchools,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    logger.error('Error fetching schools:', error);
    res.status(500).json({
      error: 'Failed to fetch schools',
      message: error.message
    });
  }
});

/**
 * GET /api/schools/types
 * Get all unique school types
 */
router.get('/types', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_schools');
    const types = await collection.distinct('properties.SCHOOLTYPE');

    await client.close();

    res.json({
      types: types.filter(t => t).sort()
    });

  } catch (error) {
    logger.error('Error fetching school types:', error);
    res.status(500).json({
      error: 'Failed to fetch school types',
      message: error.message
    });
  }
});

/**
 * GET /api/schools/districts
 * Get all unique education districts
 */
router.get('/districts', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_schools');
    const districts = await collection.distinct('properties.EDUCATIONDISTRICT');

    await client.close();

    res.json({
      districts: districts.filter(d => d).sort()
    });

  } catch (error) {
    logger.error('Error fetching school districts:', error);
    res.status(500).json({
      error: 'Failed to fetch school districts',
      message: error.message
    });
  }
});

/**
 * GET /api/schools/mediums
 * Get all unique instruction mediums
 */
router.get('/mediums', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_schools');
    const mediums = await collection.distinct('properties.MEDIUMOFINSTRUCTION');

    await client.close();

    res.json({
      mediums: mediums.filter(m => m).sort()
    });

  } catch (error) {
    logger.error('Error fetching instruction mediums:', error);
    res.status(500).json({
      error: 'Failed to fetch instruction mediums',
      message: error.message
    });
  }
});

/**
 * GET /api/schools/stats
 * Get school statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_schools');

    const [totalSchools, types, districts, mediums] = await Promise.all([
      collection.countDocuments(),
      collection.distinct('properties.SCHOOLTYPE'),
      collection.distinct('properties.EDUCATIONDISTRICT'),
      collection.distinct('properties.MEDIUMOFINSTRUCTION')
    ]);

    // Get type breakdown
    const typeStats = await collection.aggregate([
      {
        $group: {
          _id: '$properties.SCHOOLTYPE',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // Get district breakdown
    const districtStats = await collection.aggregate([
      {
        $group: {
          _id: '$properties.EDUCATIONDISTRICT',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    await client.close();

    res.json({
      totalSchools,
      uniqueTypes: types.length,
      uniqueDistricts: districts.length,
      uniqueMediums: mediums.length,
      typeBreakdown: typeStats,
      districtBreakdown: districtStats,
      topTypes: types.slice(0, 10),
      topDistricts: districts.slice(0, 10)
    });

  } catch (error) {
    logger.error('Error fetching school stats:', error);
    res.status(500).json({
      error: 'Failed to fetch school stats',
      message: error.message
    });
  }
});

/**
 * GET /api/schools/near/:lng/:lat/:distance
 * Get schools near a location
 */
router.get('/near/:lng/:lat/:distance', [
  param('lng').isFloat({ min: -180, max: 180 }),
  param('lat').isFloat({ min: -90, max: 90 }),
  param('distance').isInt({ min: 1, max: 50000 }),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('format').optional().isIn(['google-maps', 'geojson', 'raw']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { lng, lat, distance } = req.params;
    const { limit = 20, format = 'google-maps' } = req.query;

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_schools');

    const schools = await collection.find({
      geometry: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(distance)
        }
      }
    })
      .limit(limit)
      .toArray();

    await client.close();

    // Transform data based on format
    let transformedSchools;
    switch (format) {
      case 'google-maps':
        transformedSchools = schools.map(transformForGoogleMaps);
        break;
      case 'geojson':
        transformedSchools = schools.map(transformForGeoJSON);
        break;
      default:
        transformedSchools = schools.map(transformToSimpleFormat);
    }

    res.json({
      location: { lng: parseFloat(lng), lat: parseFloat(lat) },
      distance: parseInt(distance),
      schools: transformedSchools,
      count: schools.length
    });

  } catch (error) {
    logger.error('Error fetching nearby schools:', error);
    res.status(500).json({
      error: 'Failed to fetch nearby schools',
      message: error.message
    });
  }
});

/**
 * GET /api/schools/:id
 * Get specific school by EMIS ID
 */
router.get('/:id', [
  param('id').isString().trim(),
  query('format').optional().isIn(['google-maps', 'geojson', 'raw']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'google-maps' } = req.query;

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_schools');
    const school = await collection.findOne({
      'properties.EMIS': id
    });

    await client.close();

    if (!school) {
      return res.status(404).json({
        error: 'School not found'
      });
    }

    // Transform data based on format
    let transformedSchool;
    switch (format) {
      case 'google-maps':
        transformedSchool = transformForGoogleMaps(school);
        break;
      case 'geojson':
        transformedSchool = transformForGeoJSON(school);
        break;
      default:
        transformedSchool = transformToSimpleFormat(school);
    }

    res.json({
      school: transformedSchool
    });

  } catch (error) {
    logger.error('Error fetching school by ID:', error);
    res.status(500).json({
      error: 'Failed to fetch school',
      message: error.message
    });
  }
});

/**
 * GET /api/schools/search/:term
 * Search schools by name or other attributes
 */
router.get('/search/:term', [
  param('term').isString().trim().isLength({ min: 2 }),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('format').optional().isIn(['google-maps', 'geojson', 'raw']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { term } = req.params;
    const { limit = 20, format = 'google-maps' } = req.query;

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_schools');

    // Search in school name, district, and type
    const schools = await collection.find({
      $or: [
        { 'properties.NAME': new RegExp(term, 'i') },
        { 'properties.EDUCATIONDISTRICT': new RegExp(term, 'i') },
        { 'properties.SCHOOLTYPE': new RegExp(term, 'i') }
      ]
    })
      .limit(limit)
      .toArray();

    await client.close();

    // Transform data based on format
    let transformedSchools;
    switch (format) {
      case 'google-maps':
        transformedSchools = schools.map(transformForGoogleMaps);
        break;
      case 'geojson':
        transformedSchools = schools.map(transformForGeoJSON);
        break;
      default:
        transformedSchools = schools.map(transformToSimpleFormat);
    }

    res.json({
      searchTerm: term,
      schools: transformedSchools,
      count: schools.length
    });

  } catch (error) {
    logger.error('Error searching schools:', error);
    res.status(500).json({
      error: 'Failed to search schools',
      message: error.message
    });
  }
});

// Helper functions for data transformation
function transformForGoogleMaps(school) {
  return {
    id: school.properties.EMIS,
    name: school.properties.NAME,
    type: school.properties.SCHOOLTYPE,
    position: {
      lat: school.geometry.coordinates[1],
      lng: school.geometry.coordinates[0]
    },
    district: school.properties.EDUCATIONDISTRICT,
    circuit: school.properties.CIRCUIT,
    sector: school.properties.SECTOR,
    status: school.properties.SCHOOL_STATUS,
    medium: school.properties.MEDIUMOFINSTRUCTION,
    icon: getIconByType(school.properties.SCHOOLTYPE),
    content: createInfoWindowContent(school)
  };
}

function transformForGeoJSON(school) {
  return {
    type: 'Feature',
    properties: {
      id: school.properties.EMIS,
      name: school.properties.NAME,
      type: school.properties.SCHOOLTYPE,
      district: school.properties.EDUCATIONDISTRICT,
      circuit: school.properties.CIRCUIT,
      sector: school.properties.SECTOR,
      status: school.properties.SCHOOL_STATUS,
      medium: school.properties.MEDIUMOFINSTRUCTION
    },
    geometry: school.geometry
  };
}

function transformToSimpleFormat(school) {
  return {
    id: school.properties.EMIS,
    name: school.properties.NAME,
    type: school.properties.SCHOOLTYPE,
    district: school.properties.EDUCATIONDISTRICT,
    circuit: school.properties.CIRCUIT,
    sector: school.properties.SECTOR,
    status: school.properties.SCHOOL_STATUS,
    medium: school.properties.MEDIUMOFINSTRUCTION,
    location: {
      latitude: school.geometry.coordinates[1],
      longitude: school.geometry.coordinates[0]
    }
  };
}

// Get icon based on school type
function getIconByType(schoolType) {
  const iconMap = {
    'Primary School': {
      url: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#059669">
          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
        </svg>
      `),
      scaledSize: { width: 28, height: 28 }
    },
    'Secondary School': {
      url: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb">
          <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
        </svg>
      `),
      scaledSize: { width: 32, height: 32 }
    },
    'Combined School': {
      url: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7c3aed">
          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
        </svg>
      `),
      scaledSize: { width: 30, height: 30 }
    },
    'Intermediate School': {
      url: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ea580c">
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
        </svg>
      `),
      scaledSize: { width: 30, height: 30 }
    }
  };

  return iconMap[schoolType] || iconMap['Primary School'];
}

// Create info window content for schools
function createInfoWindowContent(school) {
  const props = school.properties;
  return `
    <div style="padding: 12px; font-family: Arial, sans-serif; max-width: 300px;">
      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${props.NAME || 'Unknown School'}</h3>
      <div style="margin-bottom: 8px;">
        <span style="background: ${getTypeColor(props.SCHOOLTYPE)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
          ${props.SCHOOLTYPE || 'School'}
        </span>
        ${props.SCHOOL_STATUS === 'Operational' ?
          '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 4px;">Active</span>' :
          '<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 4px;">Inactive</span>'
        }
      </div>
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>District:</strong> ${props.EDUCATIONDISTRICT || 'Unknown'}
      </p>
      ${props.CIRCUIT ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>Circuit:</strong> ${props.CIRCUIT}
      </p>` : ''}
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>Sector:</strong> ${props.SECTOR || 'Public'}
      </p>
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>Language:</strong> ${props.MEDIUMOFINSTRUCTION || 'Not specified'}
      </p>
      ${props.EMIS ? `<p style="margin: 4px 0; color: #6b7280; font-size: 12px;">
        <strong>EMIS:</strong> ${props.EMIS}
      </p>` : ''}
    </div>
  `;
}

// Get color based on school type
function getTypeColor(schoolType) {
  const colorMap = {
    'Primary School': '#059669',
    'Secondary School': '#2563eb',
    'Combined School': '#7c3aed',
    'Intermediate School': '#ea580c'
  };
  return colorMap[schoolType] || '#059669';
}

module.exports = router;
