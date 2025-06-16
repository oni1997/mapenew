import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  IconButton,
  Divider,
  Paper
} from '@mui/material'
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'

import { neighborhoodAPI, houseRentalsAPI } from '../services/api'
import useFavoritesStore from '../store/favoritesStore'

const Favorites = () => {
  const navigate = useNavigate()
  const {
    favoriteNeighborhoods,
    favoriteRentals,
    toggleNeighborhoodFavorite,
    toggleRentalFavorite,
    clearAllFavorites,
    getFavoritesCount
  } = useFavoritesStore()

  const favoritesCount = getFavoritesCount()
  const favoriteNeighborhoodIds = Array.from(favoriteNeighborhoods)
  const favoriteRentalIds = Array.from(favoriteRentals)

  // Fetch favorite neighborhoods
  const { data: neighborhoodsData, isLoading: neighborhoodsLoading } = useQuery(
    ['favorite-neighborhoods', favoriteNeighborhoodIds],
    async () => {
      if (favoriteNeighborhoodIds.length === 0) return { neighborhoods: [] }
      const response = await neighborhoodAPI.getAll({ 
        limit: 100,
        ids: favoriteNeighborhoodIds 
      })
      return response
    },
    {
      enabled: favoriteNeighborhoodIds.length > 0
    }
  )

  // Fetch favorite rentals
  const { data: rentalsData, isLoading: rentalsLoading } = useQuery(
    ['favorite-rentals', favoriteRentalIds],
    async () => {
      if (favoriteRentalIds.length === 0) return { rentals: [] }
      // Fetch each rental individually since we don't have a bulk endpoint
      const rentalPromises = favoriteRentalIds.map(id => 
        houseRentalsAPI.getById(id).catch(() => null)
      )
      const results = await Promise.all(rentalPromises)
      return { 
        rentals: results.filter(r => r?.rental).map(r => r.rental)
      }
    },
    {
      enabled: favoriteRentalIds.length > 0
    }
  )

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleViewNeighborhood = (neighborhood) => {
    navigate(`/explorer?neighborhood=${encodeURIComponent(neighborhood.name)}`)
  }

  const handleViewRental = (rental) => {
    navigate(`/rentals/${rental._id}`)
  }

  const handleCompareNeighborhoods = () => {
    const neighborhoods = neighborhoodsData?.neighborhoods?.slice(0, 3) || []
    if (neighborhoods.length >= 2) {
      const names = neighborhoods.map(n => n.name).join(',')
      navigate(`/compare?neighborhoods=${encodeURIComponent(names)}`)
    }
  }

  if (favoritesCount.total === 0) {
    return (
      <>
        <Helmet>
          <title>My Favorites - Cape Town Insights</title>
          <meta name="description" content="Your saved neighborhoods and rental properties in Cape Town" />
        </Helmet>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            ❤️ My Favorites
          </Typography>

          <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
            <FavoriteBorderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No favorites yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Start exploring neighborhoods and rental properties to add them to your favorites!
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/explorer')}
                startIcon={<LocationIcon />}
              >
                Explore Neighborhoods
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/rentals')}
                startIcon={<HomeIcon />}
              >
                Browse Rentals
              </Button>
            </Box>
          </Paper>
        </Container>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>My Favorites ({favoritesCount.total}) - Cape Town Insights</title>
        <meta name="description" content="Your saved neighborhoods and rental properties in Cape Town" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              ❤️ My Favorites
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {favoritesCount.neighborhoods} neighborhoods • {favoritesCount.rentals} rental properties
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {favoriteNeighborhoods.size >= 2 && (
              <Button
                variant="outlined"
                onClick={handleCompareNeighborhoods}
                size="small"
              >
                Compare Neighborhoods
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              onClick={clearAllFavorites}
              startIcon={<ClearIcon />}
              size="small"
            >
              Clear All
            </Button>
          </Box>
        </Box>

        {/* Favorite Neighborhoods */}
        {favoriteNeighborhoods.size > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              🏘️ Favorite Neighborhoods ({favoriteNeighborhoods.size})
            </Typography>
            
            {neighborhoodsLoading ? (
              <Alert severity="info">Loading neighborhoods...</Alert>
            ) : (
              <Grid container spacing={3}>
                {neighborhoodsData?.neighborhoods?.map((neighborhood) => (
                  <Grid item xs={12} md={6} lg={4} key={neighborhood._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="h3" fontWeight="bold">
                            {neighborhood.name}
                          </Typography>
                          <IconButton
                            onClick={() => toggleNeighborhoodFavorite(neighborhood._id)}
                            color="error"
                            size="small"
                          >
                            <FavoriteIcon />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {neighborhood.borough}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={`Safety: ${neighborhood.safetyScore || 'N/A'}/10`}
                            size="small"
                            color={neighborhood.safetyScore >= 7 ? 'success' : neighborhood.safetyScore >= 5 ? 'warning' : 'error'}
                            sx={{ mr: 1, mb: 1 }}
                          />
                          {neighborhood.housing?.avgRent && (
                            <Chip
                              label={`Avg Rent: ${formatPrice(neighborhood.housing.avgRent)}`}
                              size="small"
                              variant="outlined"
                              sx={{ mb: 1 }}
                            />
                          )}
                        </Box>
                        
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleViewNeighborhood(neighborhood)}
                          startIcon={<ViewIcon />}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Favorite Rentals */}
        {favoriteRentals.size > 0 && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              🏠 Favorite Rental Properties ({favoriteRentals.size})
            </Typography>
            
            {rentalsLoading ? (
              <Alert severity="info">Loading rental properties...</Alert>
            ) : (
              <Grid container spacing={3}>
                {rentalsData?.rentals?.map((rental) => (
                  <Grid item xs={12} md={6} lg={4} key={rental._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="h3" fontWeight="bold" noWrap>
                            {rental.title}
                          </Typography>
                          <IconButton
                            onClick={() => toggleRentalFavorite(rental._id)}
                            color="error"
                            size="small"
                          >
                            <FavoriteIcon />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          📍 {rental.location}
                        </Typography>
                        
                        <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
                          {formatPrice(rental.price)}/month
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={`${rental.bedrooms} bed • ${rental.bathrooms} bath`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1, mb: 1 }}
                          />
                          <Chip
                            label={rental.category}
                            size="small"
                            color={rental.category === 'Luxury' ? 'warning' : 'default'}
                            sx={{ mb: 1 }}
                          />
                        </Box>
                        
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleViewRental(rental)}
                          startIcon={<ViewIcon />}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Container>
    </>
  )
}

export default Favorites
