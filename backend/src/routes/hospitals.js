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
 * GET /api/hospitals
 * Get all hospitals with optional filtering
 */
router.get('/', [
  query('classification').optional().isString().trim(),
  query('province').optional().isString().trim(),
  query('district').optional().isString().trim(),
  query('town').optional().isString().trim(),
  query('status').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('format').optional().isIn(['google-maps', 'geojson', 'raw']),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      classification,
      province,
      district,
      town,
      status,
      limit = 100,
      offset = 0,
      format = 'google-maps'
    } = req.query;

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_hospitals');
    
    // Build query
    const query = {};
    if (classification) {
      query['properties.CLASSIFICATION'] = new RegExp(classification, 'i');
    }
    if (province) {
      query['properties.PROVINCE'] = new RegExp(province, 'i');
    }
    if (district) {
      query['properties.DISTRICT'] = new RegExp(district, 'i');
    }
    if (town) {
      query['properties.TOWN'] = new RegExp(town, 'i');
    }
    if (status) {
      query['properties.STATUS'] = new RegExp(status, 'i');
    }

    const hospitals = await collection.find(query)
      .limit(limit)
      .skip(offset)
      .toArray();

    const total = await collection.countDocuments(query);

    await client.close();

    // Transform data based on format
    let transformedHospitals;
    switch (format) {
      case 'google-maps':
        transformedHospitals = hospitals.map(transformForGoogleMaps);
        break;
      case 'geojson':
        transformedHospitals = hospitals.map(transformForGeoJSON);
        break;
      default:
        transformedHospitals = hospitals.map(hospital => ({
          id: hospital.properties.OBJECTID,
          name: hospital.properties.NAME,
          classification: hospital.properties.CLASSIFICATION,
          province: hospital.properties.PROVINCE,
          district: hospital.properties.DISTRICT,
          town: hospital.properties.TOWN,
          status: hospital.properties.STATUS,
          contact: hospital.properties.TELNO,
          email: hospital.properties.EMAIL,
          coordinates: hospital.geometry.coordinates,
          operatingHours: {
            days: hospital.properties.OPEN_DAYS,
            hours: hospital.properties.OPEN_TIME
          }
        }));
    }

    res.json({
      hospitals: transformedHospitals,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    logger.error('Error fetching hospitals:', error);
    res.status(500).json({
      error: 'Failed to fetch hospitals',
      message: error.message
    });
  }
});

/**
 * GET /api/hospitals/classifications
 * Get all unique hospital classifications
 */
router.get('/classifications', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_hospitals');
    const classifications = await collection.distinct('properties.CLASSIFICATION');

    await client.close();

    res.json({
      classifications: classifications.filter(c => c).sort()
    });

  } catch (error) {
    logger.error('Error fetching hospital classifications:', error);
    res.status(500).json({
      error: 'Failed to fetch hospital classifications',
      message: error.message
    });
  }
});

/**
 * GET /api/hospitals/districts
 * Get all unique hospital districts
 */
router.get('/districts', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_hospitals');
    const districts = await collection.distinct('properties.DISTRICT');

    await client.close();

    res.json({
      districts: districts.filter(d => d).sort()
    });

  } catch (error) {
    logger.error('Error fetching hospital districts:', error);
    res.status(500).json({
      error: 'Failed to fetch hospital districts',
      message: error.message
    });
  }
});

/**
 * GET /api/hospitals/stats
 * Get hospital statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_hospitals');

    const [totalHospitals, classifications, districts, provinces] = await Promise.all([
      collection.countDocuments(),
      collection.distinct('properties.CLASSIFICATION'),
      collection.distinct('properties.DISTRICT'),
      collection.distinct('properties.PROVINCE')
    ]);

    // Get classification breakdown
    const classificationStats = await collection.aggregate([
      {
        $group: {
          _id: '$properties.CLASSIFICATION',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    await client.close();

    res.json({
      totalHospitals,
      uniqueClassifications: classifications.length,
      uniqueDistricts: districts.length,
      uniqueProvinces: provinces.length,
      classificationBreakdown: classificationStats,
      topClassifications: classifications.slice(0, 10),
      topDistricts: districts.slice(0, 10)
    });

  } catch (error) {
    logger.error('Error fetching hospital stats:', error);
    res.status(500).json({
      error: 'Failed to fetch hospital stats',
      message: error.message
    });
  }
});

/**
 * GET /api/hospitals/near/:lng/:lat/:distance
 * Get hospitals near a location
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

    const collection = client.db().collection('pub_hospitals');

    const hospitals = await collection.find({
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
    let transformedHospitals;
    switch (format) {
      case 'google-maps':
        transformedHospitals = hospitals.map(transformForGoogleMaps);
        break;
      case 'geojson':
        transformedHospitals = hospitals.map(transformForGeoJSON);
        break;
      default:
        transformedHospitals = hospitals.map(transformToSimpleFormat);
    }

    res.json({
      location: { lng: parseFloat(lng), lat: parseFloat(lat) },
      distance: parseInt(distance),
      hospitals: transformedHospitals,
      count: hospitals.length
    });

  } catch (error) {
    logger.error('Error fetching nearby hospitals:', error);
    res.status(500).json({
      error: 'Failed to fetch nearby hospitals',
      message: error.message
    });
  }
});

/**
 * GET /api/hospitals/search/:term
 * Search hospitals by name or other attributes
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

    const collection = client.db().collection('pub_hospitals');

    // Search in name, town, and district
    const hospitals = await collection.find({
      $or: [
        { 'properties.NAME': new RegExp(term, 'i') },
        { 'properties.TOWN': new RegExp(term, 'i') },
        { 'properties.DISTRICT': new RegExp(term, 'i') },
        { 'properties.CLASSIFICATION': new RegExp(term, 'i') }
      ]
    })
      .limit(limit)
      .toArray();

    await client.close();

    // Transform data based on format
    let transformedHospitals;
    switch (format) {
      case 'google-maps':
        transformedHospitals = hospitals.map(transformForGoogleMaps);
        break;
      case 'geojson':
        transformedHospitals = hospitals.map(transformForGeoJSON);
        break;
      default:
        transformedHospitals = hospitals.map(transformToSimpleFormat);
    }

    res.json({
      searchTerm: term,
      hospitals: transformedHospitals,
      count: hospitals.length
    });

  } catch (error) {
    logger.error('Error searching hospitals:', error);
    res.status(500).json({
      error: 'Failed to search hospitals',
      message: error.message
    });
  }
});

/**
 * GET /api/hospitals/:id
 * Get specific hospital by ID
 */
router.get('/:id', [
  param('id').isInt(),
  query('format').optional().isIn(['google-maps', 'geojson', 'raw']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'google-maps' } = req.query;

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('pub_hospitals');
    const hospital = await collection.findOne({
      'properties.OBJECTID': parseInt(id)
    });

    await client.close();

    if (!hospital) {
      return res.status(404).json({
        error: 'Hospital not found'
      });
    }

    // Transform data based on format
    let transformedHospital;
    switch (format) {
      case 'google-maps':
        transformedHospital = transformForGoogleMaps(hospital);
        break;
      case 'geojson':
        transformedHospital = transformForGeoJSON(hospital);
        break;
      default:
        transformedHospital = transformToSimpleFormat(hospital);
    }

    res.json(transformedHospital);

  } catch (error) {
    logger.error('Error fetching hospital:', error);
    res.status(500).json({
      error: 'Failed to fetch hospital',
      message: error.message
    });
  }
});

// Helper functions for data transformation
function transformForGoogleMaps(hospital) {
  return {
    id: hospital.properties.OBJECTID,
    name: hospital.properties.NAME,
    classification: hospital.properties.CLASSIFICATION,
    position: {
      lat: hospital.geometry.coordinates[1],
      lng: hospital.geometry.coordinates[0]
    },
    province: hospital.properties.PROVINCE,
    district: hospital.properties.DISTRICT,
    town: hospital.properties.TOWN,
    status: hospital.properties.STATUS,
    contact: hospital.properties.TELNO,
    email: hospital.properties.EMAIL,
    operatingHours: {
      days: hospital.properties.OPEN_DAYS,
      hours: hospital.properties.OPEN_TIME
    },
    icon: getIconByClassification(hospital.properties.CLASSIFICATION),
    content: createInfoWindowContent(hospital)
  };
}

function transformForGeoJSON(hospital) {
  return {
    type: 'Feature',
    properties: {
      id: hospital.properties.OBJECTID,
      name: hospital.properties.NAME,
      classification: hospital.properties.CLASSIFICATION,
      province: hospital.properties.PROVINCE,
      district: hospital.properties.DISTRICT,
      town: hospital.properties.TOWN,
      status: hospital.properties.STATUS,
      contact: hospital.properties.TELNO,
      email: hospital.properties.EMAIL,
      operatingHours: {
        days: hospital.properties.OPEN_DAYS,
        hours: hospital.properties.OPEN_TIME
      }
    },
    geometry: hospital.geometry
  };
}

function transformToSimpleFormat(hospital) {
  return {
    id: hospital.properties.OBJECTID,
    name: hospital.properties.NAME,
    classification: hospital.properties.CLASSIFICATION,
    province: hospital.properties.PROVINCE,
    district: hospital.properties.DISTRICT,
    town: hospital.properties.TOWN,
    status: hospital.properties.STATUS,
    contact: hospital.properties.TELNO,
    email: hospital.properties.EMAIL,
    location: {
      latitude: hospital.geometry.coordinates[1],
      longitude: hospital.geometry.coordinates[0]
    },
    operatingHours: {
      days: hospital.properties.OPEN_DAYS,
      hours: hospital.properties.OPEN_TIME
    }
  };
}

function getIconByClassification(classification) {
  const iconMap = {
    'Hospital': {
      url: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626">
          <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
        </svg>
      `),
      scaledSize: { width: 32, height: 32 }
    },
    'Clinic': {
      url: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#059669">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      `),
      scaledSize: { width: 28, height: 28 }
    },
    'CHC': {
      url: 'data:image/svg+xml;base64=' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      `),
      scaledSize: { width: 28, height: 28 }
    }
  };

  return iconMap[classification] || iconMap['Clinic'];
}

function createInfoWindowContent(hospital) {
  const props = hospital.properties;
  return `
    <div style="padding: 12px; font-family: Arial, sans-serif; max-width: 300px;">
      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${props.NAME || 'Unknown Facility'}</h3>
      <div style="margin-bottom: 8px;">
        <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
          ${props.CLASSIFICATION || 'Healthcare Facility'}
        </span>
        ${props.STATUS === 'Active' ?
          '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 4px;">Active</span>' :
          '<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 4px;">Inactive</span>'
        }
      </div>
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>Location:</strong> ${props.TOWN || 'Unknown'}, ${props.DISTRICT || 'Unknown District'}
      </p>
      ${props.TELNO ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>Contact:</strong> ${props.TELNO}
      </p>` : ''}
      ${props.OPEN_TIME && props.OPEN_DAYS ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>Hours:</strong> ${props.OPEN_TIME} (${props.OPEN_DAYS})
      </p>` : ''}
      ${props.EMAIL ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>Email:</strong> ${props.EMAIL}
      </p>` : ''}
    </div>
  `;
}

module.exports = router;
