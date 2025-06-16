import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred'
    
    // Don't show toast for certain errors
    const silentErrors = [401, 404]
    if (!silentErrors.includes(error.response?.status)) {
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

// API endpoints
export const neighborhoodAPI = {
  // Get all neighborhoods
  getAll: (params = {}) => api.get('/neighborhoods', { params }),
  
  // Get neighborhood by ID
  getById: (id) => api.get(`/neighborhoods/${id}`),
  
  // Get neighborhoods by borough
  getByBorough: (borough, params = {}) => api.get(`/neighborhoods/borough/${borough}`, { params }),
  
  // Find similar neighborhoods
  findSimilar: (neighborhoodId, limit = 10) => 
    api.post('/neighborhoods/similar', { neighborhoodId, limit }),
  
  // Search neighborhoods by characteristics
  search: (criteria) => api.post('/neighborhoods/search', criteria),
  
  // Compare neighborhoods
  compare: (neighborhoodIds) => api.post('/neighborhoods/compare', { neighborhoodIds }),

  // Get market insights
  getMarketInsights: () => api.get('/neighborhoods/market-insights'),
}

export const searchAPI = {
  // General search
  search: (params) => api.get('/search', { params }),
  
  // Autocomplete
  autocomplete: (query, limit = 10) => api.get('/search/autocomplete', { 
    params: { q: query, limit } 
  }),
  
  // Get filter options
  getFilters: () => api.get('/search/filters'),
  
  // Get popular searches
  getPopular: () => api.get('/search/popular'),
}

export const chatAPI = {
  // Send chat message
  sendMessage: (message, context = [], sessionId = null) => 
    api.post('/chat', { message, context, sessionId }),
  
  // Neighborhood-specific query
  neighborhoodQuery: (query, filters = {}) => 
    api.post('/chat/neighborhood-query', { query, filters }),
  
  // Get chat suggestions
  getSuggestions: () => api.get('/chat/suggestions'),
}

export const analyticsAPI = {
  // Get trend data
  getTrends: (neighborhood, months = 12, metric = 'crime') =>
    api.get(`/analytics/trends/${neighborhood}`, {
      params: { months, metric }
    }),

  // Compare analytics
  compare: (neighborhoods, metrics = ['housing', 'safety', 'amenities']) =>
    api.post('/analytics/compare', { neighborhoods, metrics }),

  // Get neighborhood overview
  getOverview: (neighborhood) => api.get(`/analytics/overview/${neighborhood}`),

  // Get general stats
  getStats: () => api.get('/analytics/stats'),
}

export const taxiRoutesAPI = {
  // Get all taxi routes
  getAll: (params = {}) => api.get('/taxi-routes', { params }),

  // Get taxi route by ID
  getById: (id, format = 'google-maps') => api.get(`/taxi-routes/${id}`, {
    params: { format }
  }),

  // Get all origins
  getOrigins: () => api.get('/taxi-routes/origins'),

  // Get all destinations
  getDestinations: () => api.get('/taxi-routes/destinations'),

  // Search routes
  search: (term, limit = 20) => api.get(`/taxi-routes/search/${term}`, {
    params: { limit }
  }),

  // Get routes near location
  getNearby: (lng, lat, maxDistance = 1000, limit = 20) =>
    api.get(`/taxi-routes/near/${lng}/${lat}`, {
      params: { maxDistance, limit }
    }),

  // Get route statistics
  getStats: () => api.get('/taxi-routes/stats'),
}

export const hospitalsAPI = {
  // Get all hospitals
  getAll: (params = {}) => api.get('/hospitals', { params }),

  // Get hospital by ID
  getById: (id, format = 'google-maps') => api.get(`/hospitals/${id}`, {
    params: { format }
  }),

  // Get all classifications
  getClassifications: () => api.get('/hospitals/classifications'),

  // Get all districts
  getDistricts: () => api.get('/hospitals/districts'),

  // Search hospitals
  search: (term, limit = 20, format = 'google-maps') => api.get(`/hospitals/search/${term}`, {
    params: { limit, format }
  }),

  // Get hospitals near location
  getNearby: (lng, lat, maxDistance = 5000, limit = 20, format = 'google-maps') =>
    api.get(`/hospitals/near/${lng}/${lat}/${maxDistance}`, {
      params: { limit, format }
    }),

  // Get hospital statistics
  getStats: () => api.get('/hospitals/stats'),
}

export const schoolsAPI = {
  // Get all schools
  getAll: (params = {}) => api.get('/schools', { params }),

  // Get school by EMIS ID
  getById: (id, format = 'google-maps') => api.get(`/schools/${id}`, {
    params: { format }
  }),

  // Get all school types
  getTypes: () => api.get('/schools/types'),

  // Get all education districts
  getDistricts: () => api.get('/schools/districts'),

  // Get all instruction mediums
  getMediums: () => api.get('/schools/mediums'),

  // Search schools
  search: (term, limit = 20, format = 'google-maps') => api.get(`/schools/search/${term}`, {
    params: { limit, format }
  }),

  // Get schools near location
  getNearby: (lng, lat, maxDistance = 5000, limit = 20, format = 'google-maps') =>
    api.get(`/schools/near/${lng}/${lat}/${maxDistance}`, {
      params: { limit, format }
    }),

  // Get school statistics
  getStats: () => api.get('/schools/stats')
}

export const houseRentalsAPI = {
  // Get all house rentals with filtering
  getAll: async (params = {}) => {
    const response = await api.get('/house-rentals', { params });
    return response.data;
  },

  // Get rental statistics
  getStats: async () => {
    const response = await api.get('/house-rentals/stats');
    return response.data;
  },

  // Search rentals
  search: async (params = {}) => {
    const response = await api.get('/house-rentals/search', { params });
    return response.data;
  },

  // Get rental by ID
  getById: async (id) => {
    const response = await api.get(`/house-rentals/${id}`);
    return response.data;
  },

  // Get rentals by location
  getByLocation: async (location, params = {}) => {
    const response = await api.get(`/house-rentals/location/${location}`, { params });
    return response.data;
  },

  // Get AI-powered recommendations
  getRecommendations: async (criteria) => {
    const response = await api.post('/house-rentals/recommendations', criteria);
    return response.data;
  },

  // Get market insights with AI analysis
  getMarketInsights: async () => {
    const response = await api.get('/house-rentals/market-insights');
    return response.data;
  },

  // Get neighborhood rental data with AI insights
  getNeighborhoodData: async (neighborhood) => {
    const response = await api.get(`/house-rentals/neighborhood/${neighborhood}`);
    return response.data;
  }
}

// Utility functions
export const handleApiError = (error) => {
  console.error('API Error:', error)
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response
    return {
      status,
      message: data.message || data.error || 'Server error',
      details: data.details || null
    }
  } else if (error.request) {
    // Request was made but no response received
    return {
      status: 0,
      message: 'Network error - please check your connection',
      details: null
    }
  } else {
    // Something else happened
    return {
      status: 0,
      message: error.message || 'Unknown error',
      details: null
    }
  }
}

export const isApiError = (error) => {
  return error.response || error.request || error.message
}

export default api
