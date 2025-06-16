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
  Pagination,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'

import { houseRentalsAPI } from '../services/api'
import RentalCard from '../components/Rentals/RentalCard'

const RentalExplorer = () => {
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

  const itemsPerPage = 12

  // Fetch rentals with current filters
  const { 
    data: rentalsData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['rentals', appliedFilters, page],
    () => houseRentalsAPI.getAll({
      ...appliedFilters,
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      sortBy: 'price',
      sortOrder: 'asc'
    }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000 // 5 minutes
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
    const newFilters = { ...filters }
    
    // Add search query if provided
    if (searchQuery.trim()) {
      newFilters.q = searchQuery.trim()
    }
    
    // Remove empty filters
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key] === '' || newFilters[key] === 0) {
        delete newFilters[key]
      }
    })
    
    setAppliedFilters(newFilters)
    setPage(1)
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
    // Navigate to rental details or open modal
    console.log('View rental:', rental)
  }

  const totalPages = rentalsData?.pagination ? 
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

          {/* Filters */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon />
                <Typography>Advanced Filters</Typography>
                {Object.keys(appliedFilters).length > 0 && (
                  <Chip 
                    label={`${Object.keys(appliedFilters).length} active`} 
                    size="small" 
                    color="primary" 
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Location */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="e.g. Sea Point, Gardens"
                  />
                </Grid>

                {/* Bedrooms */}
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

                {/* Property Type */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Property Type</InputLabel>
                    <Select
                      value={filters.propertyType}
                      onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                      label="Property Type"
                    >
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="Apartment">Apartment</MenuItem>
                      <MenuItem value="House">House</MenuItem>
                      <MenuItem value="Townhouse">Townhouse</MenuItem>
                      <MenuItem value="Penthouse">Penthouse</MenuItem>
                      <MenuItem value="Loft">Loft</MenuItem>
                      <MenuItem value="Studio">Studio</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Category */}
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

                {/* Price Range */}
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Price Range: R{filters.minPrice.toLocaleString()} - R{filters.maxPrice.toLocaleString()}
                  </Typography>
                  <Slider
                    value={[filters.minPrice, filters.maxPrice]}
                    onChange={(e, newValue) => {
                      handleFilterChange('minPrice', newValue[0])
                      handleFilterChange('maxPrice', newValue[1])
                    }}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100000}
                    step={1000}
                    valueLabelFormat={(value) => `R${value.toLocaleString()}`}
                  />
                </Grid>

                {/* Furnished */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Furnished</InputLabel>
                    <Select
                      value={filters.furnished}
                      onChange={(e) => handleFilterChange('furnished', e.target.value)}
                      label="Furnished"
                    >
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="Unfurnished">Unfurnished</MenuItem>
                      <MenuItem value="Semi-furnished">Semi-furnished</MenuItem>
                      <MenuItem value="Fully furnished">Fully furnished</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={handleSearch}
                    >
                      Apply Filters
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={handleClearFilters}
                    >
                      Clear All
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* Results Summary */}
        {rentalsData && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {rentalsData.pagination.total} Properties Found
            </Typography>
            {statsData && (
              <Typography variant="body2" color="text.secondary">
                Average price: R{Math.round(statsData.overview?.averagePrice || 0).toLocaleString()}/month
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
            {totalPages > 1 && (
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

export default RentalExplorer
