const express = require('express');
const { MongoClient } = require('mongodb');
const { query, param, body, validationResult } = require('express-validator');
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
 * GET /api/taxi-routes
 * Get all taxi routes with optional filtering
 */
router.get('/', [
  query('origin').optional().isString().trim(),
  query('destination').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('format').optional().isIn(['google-maps', 'geojson', 'raw']),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      origin,
      destination,
      limit = 100,
      offset = 0,
      format = 'google-maps'
    } = req.query;

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('taxi_routes');
    
    // Build query
    const query = {};
    if (origin) {
      query['properties.ORGN'] = new RegExp(origin, 'i');
    }
    if (destination) {
      query['properties.DSTN'] = new RegExp(destination, 'i');
    }

    const routes = await collection.find(query)
      .limit(limit)
      .skip(offset)
      .toArray();

    const total = await collection.countDocuments(query);

    await client.close();

    // Transform data based on format
    let transformedRoutes;
    switch (format) {
      case 'google-maps':
        transformedRoutes = routes.map(transformForGoogleMaps);
        break;
      case 'geojson':
        transformedRoutes = routes.map(transformForGeoJSON);
        break;
      default:
        transformedRoutes = routes.map(route => ({
          id: route.properties.OBJECTID,
          origin: route.properties.ORGN,
          destination: route.properties.DSTN,
          coordinates: route.geometry.coordinates[0],
          length: route.properties.SHAPE_Length
        }));
    }

    res.json({
      routes: transformedRoutes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    logger.error('Error fetching taxi routes:', error);
    res.status(500).json({
      error: 'Failed to fetch taxi routes',
      message: error.message
    });
  }
});

/**
 * GET /api/taxi-routes/origins
 * Get all unique origin locations
 */
router.get('/origins', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('taxi_routes');
    const origins = await collection.distinct('properties.ORGN');

    await client.close();

    res.json({
      origins: origins.sort()
    });

  } catch (error) {
    logger.error('Error fetching taxi route origins:', error);
    res.status(500).json({
      error: 'Failed to fetch taxi route origins',
      message: error.message
    });
  }
});

/**
 * GET /api/taxi-routes/destinations
 * Get all unique destination locations
 */
router.get('/destinations', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('taxi_routes');
    const destinations = await collection.distinct('properties.DSTN');

    await client.close();

    res.json({
      destinations: destinations.sort()
    });

  } catch (error) {
    logger.error('Error fetching taxi route destinations:', error);
    res.status(500).json({
      error: 'Failed to fetch taxi route destinations',
      message: error.message
    });
  }
});

/**
 * GET /api/taxi-routes/stats
 * Get taxi route statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('taxi_routes');

    const [totalRoutes, origins, destinations, avgLength] = await Promise.all([
      collection.countDocuments(),
      collection.distinct('properties.ORGN'),
      collection.distinct('properties.DSTN'),
      collection.aggregate([
        {
          $group: {
            _id: null,
            avgLength: { $avg: '$properties.SHAPE_Length' },
            minLength: { $min: '$properties.SHAPE_Length' },
            maxLength: { $max: '$properties.SHAPE_Length' }
          }
        }
      ]).toArray()
    ]);

    await client.close();

    res.json({
      totalRoutes,
      uniqueOrigins: origins.length,
      uniqueDestinations: destinations.length,
      averageLength: avgLength[0]?.avgLength || 0,
      minLength: avgLength[0]?.minLength || 0,
      maxLength: avgLength[0]?.maxLength || 0,
      topOrigins: origins.slice(0, 10),
      topDestinations: destinations.slice(0, 10)
    });

  } catch (error) {
    logger.error('Error fetching taxi route stats:', error);
    res.status(500).json({
      error: 'Failed to fetch taxi route stats',
      message: error.message
    });
  }
});

/**
 * GET /api/taxi-routes/:id
 * Get specific taxi route by ID
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

    const collection = client.db().collection('taxi_routes');
    const route = await collection.findOne({
      'properties.OBJECTID': parseInt(id)
    });

    await client.close();

    if (!route) {
      return res.status(404).json({
        error: 'Taxi route not found'
      });
    }

    // Transform data based on format
    let transformedRoute;
    switch (format) {
      case 'google-maps':
        transformedRoute = transformForGoogleMaps(route);
        break;
      case 'geojson':
        transformedRoute = transformForGeoJSON(route);
        break;
      default:
        transformedRoute = {
          id: route.properties.OBJECTID,
          origin: route.properties.ORGN,
          destination: route.properties.DSTN,
          coordinates: route.geometry.coordinates[0],
          length: route.properties.SHAPE_Length
        };
    }

    res.json(transformedRoute);

  } catch (error) {
    logger.error('Error fetching taxi route:', error);
    res.status(500).json({
      error: 'Failed to fetch taxi route',
      message: error.message
    });
  }
});

// Helper functions for data transformation
function transformForGoogleMaps(mongoRoute) {
  return {
    routeId: mongoRoute.properties.OBJECTID,
    origin: mongoRoute.properties.ORGN,
    destination: mongoRoute.properties.DSTN,
    path: mongoRoute.geometry.coordinates[0].map(coord => ({
      lat: coord[1],  // Note: MongoDB stores [lng, lat], Google wants {lat, lng}
      lng: coord[0]
    })),
    distance: mongoRoute.properties.SHAPE_Length,
    strokeColor: getRouteColor(mongoRoute.properties.ORGN),
    strokeWeight: 3,
    strokeOpacity: 0.8
  };
}

function transformForGeoJSON(mongoRoute) {
  return {
    type: 'Feature',
    properties: {
      routeId: mongoRoute.properties.OBJECTID,
      origin: mongoRoute.properties.ORGN,
      destination: mongoRoute.properties.DSTN,
      distance: mongoRoute.properties.SHAPE_Length,
      popupContent: `${mongoRoute.properties.ORGN} → ${mongoRoute.properties.DSTN}`
    },
    geometry: {
      type: 'LineString',
      coordinates: mongoRoute.geometry.coordinates[0] // [lng, lat] format is correct for GeoJSON
    }
  };
}

function getRouteColor(origin) {
  // Generate consistent colors based on origin
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const hash = origin.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}

/**
 * GET /api/taxi-routes/search/:term
 * Search routes by origin or destination
 */
router.get('/search/:term', [
  param('term').isString().trim().isLength({ min: 2 }),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { term } = req.params;
    const { limit = 20 } = req.query;

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const collection = client.db().collection('taxi_routes');

    // Search in both origin and destination
    const routes = await collection.find({
      $or: [
        { 'properties.ORGN': new RegExp(term, 'i') },
        { 'properties.DSTN': new RegExp(term, 'i') }
      ]
    })
      .limit(limit)
      .toArray();

    await client.close();

    const transformedRoutes = routes.map(transformForGoogleMaps);

    res.json({
      searchTerm: term,
      routes: transformedRoutes,
      count: routes.length
    });

  } catch (error) {
    logger.error('Error searching taxi routes:', error);
    res.status(500).json({
      error: 'Failed to search taxi routes',
      message: error.message
    });
  }
});

module.exports = router;
