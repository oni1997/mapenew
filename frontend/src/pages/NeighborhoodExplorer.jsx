import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { debounce } from 'lodash'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  DirectionsTransit as TransitIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
  Map as MapIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

import { neighborhoodAPI, searchAPI } from '../services/api'
import { useAppStore } from '../store/appStore'
import MapContainer from '../components/Map/MapContainer'

// Separate component for debounced input to prevent focus loss
const DebouncedNumberInput = ({ label, value, onChange, inputProps, ...props }) => {
  const [localValue, setLocalValue] = useState(value || '')
  const debouncedOnChange = useMemo(() => debounce(onChange, 500), [onChange])

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const handleChange = (e) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }

  return (
    <TextField
      {...props}
      label={label}
      type="number"
      value={localValue}
      onChange={handleChange}
      inputProps={inputProps}
    />
  )
}

const NeighborhoodExplorer = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [searchParams, setSearchParams] = useSearchParams()
  
  const {
    searchFilters,
    updateSearchFilters,
    clearSearchFilters,
    selectedNeighborhoods,
    addSelectedNeighborhood,
    removeSelectedNeighborhood
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [mapDrawerOpen, setMapDrawerOpen] = useState(false)
  const [neighborhoods, setNeighborhoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchExplanation, setSearchExplanation] = useState(null)

  // Get filter options
  const { data: filterOptions } = useQuery('filter-options', searchAPI.getFilters)

  // Search neighborhoods
  const searchNeighborhoods = async () => {
    setLoading(true)
    try {
      let response
      if (searchQuery.trim()) {
        // Use search API with query and filters
        response = await searchAPI.search({
          q: searchQuery,
          ...searchFilters,
          limit: 50
        })
        setNeighborhoods(response.data.results || [])
      } else if (Object.values(searchFilters).some(v => v)) {
        // Use neighborhood search with just filters
        response = await neighborhoodAPI.search(searchFilters)
        setNeighborhoods(response.data.neighborhoods || [])
        setSearchExplanation(response.data.explanation || null)
      } else {
        // Get all neighborhoods
        response = await neighborhoodAPI.getAll({ limit: 50 })
        setNeighborhoods(response.data.neighborhoods || [])
        setSearchExplanation(null)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial load and search when filters change
  useEffect(() => {
    searchNeighborhoods()
  }, [searchFilters])

  // Handle URL parameters
  useEffect(() => {
    const neighborhood = searchParams.get('neighborhood')
    const search = searchParams.get('search')

    if (search) {
      setSearchQuery(search)
    }

    if (neighborhood) {
      // Focus on specific neighborhood
      setSearchQuery(neighborhood)
    }
  }, [searchParams])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    searchNeighborhoods()
    if (searchQuery) {
      setSearchParams({ search: searchQuery })
    }
  }

  const handleFilterChange = useCallback((key, value) => {
    updateSearchFilters({ [key]: value })
  }, [updateSearchFilters])

  // Handlers for debounced number inputs
  const handleMaxRentChange = useCallback((value) => {
    const numValue = value ? parseInt(value) : null
    updateSearchFilters({ maxRent: numValue })
  }, [updateSearchFilters])

  const handleMinSafetyScoreChange = useCallback((value) => {
    const numValue = value ? parseFloat(value) : null
    updateSearchFilters({ minSafetyScore: numValue })
  }, [updateSearchFilters])

  const handleClearFilters = useCallback(() => {
    clearSearchFilters()
    setSearchQuery('')
    setSearchParams({})
  }, [clearSearchFilters, setSearchParams])

  const isNeighborhoodSelected = (neighborhood) => {
    return selectedNeighborhoods.some(n => n._id === neighborhood._id)
  }

  const handleNeighborhoodSelect = (neighborhood) => {
    if (isNeighborhoodSelected(neighborhood)) {
      removeSelectedNeighborhood(neighborhood._id)
    } else {
      addSelectedNeighborhood(neighborhood)
    }
  }

  const FilterPanel = useMemo(() => (
    <Box sx={{ p: 2, width: isMobile ? '100vw' : 300 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Filters
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Borough Filter */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Borough</InputLabel>
        <Select
          value={searchFilters.borough}
          onChange={(e) => handleFilterChange('borough', e.target.value)}
          label="Borough"
        >
          <MenuItem value="">All Boroughs</MenuItem>
          {filterOptions?.data?.boroughs?.map(borough => (
            <MenuItem key={borough} value={borough}>{borough}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Max Rent Filter */}
      <DebouncedNumberInput
        fullWidth
        label="Max Rent (R)"
        value={searchFilters.maxRent}
        onChange={handleMaxRentChange}
        sx={{ mb: 2 }}
      />

      {/* Min Safety Score */}
      <DebouncedNumberInput
        fullWidth
        label="Min Safety Score (0-10)"
        value={searchFilters.minSafetyScore}
        onChange={handleMinSafetyScoreChange}
        inputProps={{ min: 0, max: 10, step: 0.1 }}
        sx={{ mb: 2 }}
      />

      {/* Characteristic Filters */}
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
        Characteristics
      </Typography>

      {[
        { key: 'familyFriendly', label: 'Family Friendly' },
        { key: 'youngProfessionals', label: 'Young Professionals' },
        { key: 'transitAccess', label: 'Good Transit' },
        { key: 'quiet', label: 'Quiet Area' },
        { key: 'cultural', label: 'Cultural Attractions' }
      ].map(filter => (
        <Box key={filter.key} sx={{ mb: 1 }}>
          <Chip
            label={filter.label}
            clickable
            color={searchFilters[filter.key] ? 'primary' : 'default'}
            onClick={() => handleFilterChange(filter.key, !searchFilters[filter.key])}
            variant={searchFilters[filter.key] ? 'filled' : 'outlined'}
          />
        </Box>
      ))}

      {/* Clear Filters */}
      <Button
        fullWidth
        variant="outlined"
        onClick={handleClearFilters}
        sx={{ mt: 3 }}
        startIcon={<ClearIcon />}
      >
        Clear All Filters
      </Button>
    </Box>
  ), [
    isMobile,
    searchFilters,
    filterOptions,
    handleFilterChange,
    handleMaxRentChange,
    handleMinSafetyScoreChange,
    handleClearFilters
  ])

  return (
    <>
      <Helmet>
        <title>Neighborhood Explorer - City Insights AI</title>
        <meta name="description" content="Explore and discover neighborhoods with AI-powered search and filtering" />
      </Helmet>

      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Search Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'white' }}>
          <form onSubmit={handleSearchSubmit}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search neighborhoods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <IconButton
                onClick={() => setFilterDrawerOpen(true)}
                color={Object.values(searchFilters).some(v => v) ? 'primary' : 'default'}
              >
                <FilterIcon />
              </IconButton>
              {isMobile && (
                <IconButton
                  onClick={() => setMapDrawerOpen(true)}
                  color="default"
                >
                  <MapIcon />
                </IconButton>
              )}
              <Button type="submit" variant="contained">
                Search
              </Button>
            </Box>
          </form>

          {/* Active Filters */}
          {Object.entries(searchFilters).some(([key, value]) => value) && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(searchFilters).map(([key, value]) => {
                if (!value) return null
                return (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    onDelete={() => handleFilterChange(key, key.includes('Score') || key.includes('Rent') ? null : false)}
                  />
                )
              })}
            </Box>
          )}
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, display: 'flex', height: 'calc(100vh - 140px)' }}>
          {/* Results Panel */}
          <Box sx={{
            width: isMobile ? '100%' : '400px',
            borderRight: 1,
            borderColor: 'divider',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'white' }}>
              <Typography variant="h6" gutterBottom>
                Results ({neighborhoods.length})
              </Typography>

              {/* AI Search Explanation */}
              {searchExplanation && (
                <Box sx={{ mt: 1, p: 2, backgroundColor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                  <Typography variant="body2" color="primary.dark" sx={{ fontWeight: 500, mb: 1 }}>
                    🤖 AI Insights
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchExplanation.explanation}
                  </Typography>
                  {searchExplanation.topReasons && searchExplanation.topReasons.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {searchExplanation.topReasons.map((reason, index) => (
                        <Chip
                          key={index}
                          label={reason}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : neighborhoods.length === 0 ? (
                <Alert severity="info">
                  No neighborhoods found. Try adjusting your search criteria.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {neighborhoods.map((neighborhood) => (
                    <Card 
                      key={neighborhood._id}
                      variant={isNeighborhoodSelected(neighborhood) ? 'elevation' : 'outlined'}
                      sx={{ 
                        cursor: 'pointer',
                        border: isNeighborhoodSelected(neighborhood) ? 2 : 1,
                        borderColor: isNeighborhoodSelected(neighborhood) ? 'primary.main' : 'divider'
                      }}
                      onClick={() => handleNeighborhoodSelect(neighborhood)}
                    >
                      <CardContent sx={{ pb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {neighborhood.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {neighborhood.borough}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            color={isNeighborhoodSelected(neighborhood) ? 'primary' : 'default'}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                          {neighborhood.safety?.safetyScore && (
                            <Chip
                              icon={<SecurityIcon />}
                              label={`Safety: ${neighborhood.safety.safetyScore.toFixed(1)}`}
                              size="small"
                              color="success"
                            />
                          )}
                          {neighborhood.amenities?.transitScore && (
                            <Chip
                              icon={<TransitIcon />}
                              label={`Transit: ${neighborhood.amenities.transitScore}`}
                              size="small"
                              color="info"
                            />
                          )}
                          <Chip
                            label={neighborhood.affordabilityCategory || 'Unknown'}
                            size="small"
                            color={
                              neighborhood.affordabilityCategory === 'Budget' ? 'success' :
                              neighborhood.affordabilityCategory === 'Affordable' ? 'success' :
                              neighborhood.affordabilityCategory === 'Moderate' ? 'info' :
                              neighborhood.affordabilityCategory === 'Expensive' ? 'warning' :
                              neighborhood.affordabilityCategory === 'Luxury' ? 'error' :
                              neighborhood.affordabilityCategory === 'Ultra-Luxury' ? 'error' : 'default'
                            }
                          />
                        </Box>

                        {/* Bedroom Pricing */}
                        {neighborhood.housing?.rentByBedroom && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              Rental Prices:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {neighborhood.housing.rentByBedroom.oneBed && (
                                <Chip
                                  label={`1-bed: R${neighborhood.housing.rentByBedroom.oneBed.avg?.toLocaleString()}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {neighborhood.housing.rentByBedroom.twoBed && (
                                <Chip
                                  label={`2-bed: R${neighborhood.housing.rentByBedroom.twoBed.avg?.toLocaleString()}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {neighborhood.housing.rentByBedroom.threeBed && (
                                <Chip
                                  label={`3-bed: R${neighborhood.housing.rentByBedroom.threeBed.avg?.toLocaleString()}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* Transport Information */}
                        {neighborhood.transport && (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                              🚌 Transport:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                              {neighborhood.transport.publicTransport?.map((transport, idx) => (
                                <Chip
                                  key={idx}
                                  label={transport}
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                            {neighborhood.transport.uberAvg && (
                              <Typography variant="caption" color="text.secondary">
                                🚗 {neighborhood.transport.uberAvg} min to city center
                              </Typography>
                            )}
                          </Box>
                        )}

                        {neighborhood.tags && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                            {neighborhood.tags.slice(0, 3).map(tag => (
                              <Chip key={tag} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          {/* Map Panel - Desktop */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1 }}>
              <MapContainer neighborhoods={neighborhoods} />
            </Box>
          )}
        </Box>

        {/* Filter Drawer */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          sx={{
            zIndex: theme.zIndex.drawer + 2,
            '& .MuiDrawer-paper': {
              zIndex: theme.zIndex.drawer + 2,
            }
          }}
        >
          {FilterPanel}
        </Drawer>

        {/* Map Drawer - Mobile */}
        {isMobile && (
          <Drawer
            anchor="bottom"
            open={mapDrawerOpen}
            onClose={() => setMapDrawerOpen(false)}
            sx={{
              zIndex: theme.zIndex.drawer + 1,
              '& .MuiDrawer-paper': {
                height: '80vh',
                zIndex: theme.zIndex.drawer + 1,
              }
            }}
          >
            <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Map View
                </Typography>
                <IconButton onClick={() => setMapDrawerOpen(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <MapContainer neighborhoods={neighborhoods} height="100%" />
              </Box>
            </Box>
          </Drawer>
        )}
      </Box>
    </>
  )
}

export default NeighborhoodExplorer
