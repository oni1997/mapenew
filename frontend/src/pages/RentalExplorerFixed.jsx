import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Pagination
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'

import { houseRentalsAPI } from '../services/api'
import RentalCard from '../components/Rentals/RentalCard'

const RentalExplorerFixed = () => {
  const [filters, setFilters] = useState({
    location: '',
    minPrice: 0,
    maxPrice: 100000,
    bedrooms: '',
    propertyType: '',
    category: '',
    furnished: ''
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [favorites, setFavorites] = useState(new Set())
  const [appliedFilters, setAppliedFilters] = useState({})
  const [showFilters, setShowFilters] = useState(false)

  const itemsPerPage = 12

  // Load initial data on mount
  useEffect(() => {
    // Trigger initial load by setting empty applied filters
    setAppliedFilters({});
  }, []);

  // Fetch rentals with current filters
  const {
    data: rentalsData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['rentals', appliedFilters, page],
    () => {
      const params = {
        ...appliedFilters,
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        sortBy: 'price',
        sortOrder: 'asc'
      };
      return houseRentalsAPI.getAll(params);
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: true // Always enable the query
    }
  )

  // Fetch rental statistics
  const { data: statsData } = useQuery(
    'rental-stats',
    houseRentalsAPI.getStats,
    {
      staleTime: 30 * 60 * 1000 // 30 minutes
    }
  )

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSearch = () => {
    const newFilters = { ...filters };
    
    // Add search query if provided
    if (searchQuery.trim()) {
      newFilters.q = searchQuery.trim();
    }
    
    // Remove empty filters but keep minPrice=0
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key] === '' || (key !== 'minPrice' && newFilters[key] === 0)) {
        delete newFilters[key];
      }
    });
    
    setAppliedFilters(newFilters);
    setPage(1);
  }

  const handleClearFilters = () => {
    setFilters({
      location: '',
      minPrice: 0,
      maxPrice: 100000,
      bedrooms: '',
      propertyType: '',
      category: '',
      furnished: ''
    })
    setSearchQuery('')
    setAppliedFilters({})
    setPage(1)
  }

  const handleFavorite = (rental) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(rental._id)) {
      newFavorites.delete(rental._id)
    } else {
      newFavorites.add(rental._id)
    }
    setFavorites(newFavorites)
  }

  const handleViewRental = (rental) => {
    console.log('View rental:', rental)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const totalPages = rentalsData?.pagination?.total ?
    Math.ceil(rentalsData.pagination.total / itemsPerPage) : 1



  return (
    <>
      <Helmet>
        <title>Rental Explorer - City Insights AI</title>
        <meta name="description" content="Explore rental properties in Cape Town with AI-powered insights" />
      </Helmet>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            🏠 Rental Property Explorer
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover your perfect rental property in Cape Town with AI-powered insights
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          {/* Search Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search by location, property type, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              sx={{ minWidth: 120 }}
            >
              Search
            </Button>
          </Box>

          {/* Simple Filters */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="e.g. Sea Point, Gardens"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Bedrooms</InputLabel>
                <Select
                  value={filters.bedrooms}
                  onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                  label="Bedrooms"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value={0}>Studio</MenuItem>
                  <MenuItem value={1}>1 Bedroom</MenuItem>
                  <MenuItem value={2}>2 Bedrooms</MenuItem>
                  <MenuItem value={3}>3 Bedrooms</MenuItem>
                  <MenuItem value={4}>4+ Bedrooms</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="Budget">Budget</MenuItem>
                  <MenuItem value="Moderate">Moderate</MenuItem>
                  <MenuItem value="Luxury">Luxury</MenuItem>
                  <MenuItem value="Ultra-Luxury">Ultra-Luxury</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  fullWidth
                >
                  Apply
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Results Summary */}
        {rentalsData && rentalsData.pagination && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {rentalsData.pagination.total || 0} Properties Found
            </Typography>
            {statsData && (
              <Typography variant="body2" color="text.secondary">
                Average price: {formatPrice(Math.round(statsData.overview?.averagePrice || 0))}/month
              </Typography>
            )}
          </Box>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load rental properties. Please try again.
          </Alert>
        )}

        {/* Results Grid */}
        {rentalsData?.rentals && (
          <>
            <Grid container spacing={3}>
              {rentalsData.rentals.map((rental) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={rental._id}>
                  <RentalCard
                    rental={rental}
                    onFavorite={handleFavorite}
                    onView={handleViewRental}
                    isFavorited={favorites.has(rental._id)}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {rentalsData?.pagination?.total && totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, newPage) => setPage(newPage)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}

        {/* No Results */}
        {rentalsData?.rentals?.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              No properties found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Try adjusting your search criteria or filters
            </Typography>
            <Button variant="outlined" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </Box>
        )}
      </Container>
    </>
  )
}

export default RentalExplorerFixed
