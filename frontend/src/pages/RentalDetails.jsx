import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Breadcrumbs,
  Link
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Bed as BedIcon,
  Bathtub as BathtubIcon,
  DirectionsCar as ParkingIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Pets as PetsIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Map as MapIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'

import { houseRentalsAPI } from '../services/api'
import useFavoritesStore from '../store/favoritesStore'

const RentalDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isRentalFavorited, toggleRentalFavorite } = useFavoritesStore()

  // Fetch rental details
  const { 
    data: rentalData, 
    isLoading, 
    error 
  } = useQuery(
    ['rental', id],
    () => houseRentalsAPI.getById(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  )

  const rental = rentalData?.rental

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Budget': return 'success'
      case 'Moderate': return 'info'
      case 'Luxury': return 'warning'
      case 'Ultra-Luxury': return 'error'
      default: return 'default'
    }
  }

  const handleBack = () => {
    navigate('/rentals')
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  if (error || !rental) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error?.message || 'Rental property not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Rentals
        </Button>
      </Container>
    )
  }

  return (
    <>
      <Helmet>
        <title>{rental.title} - Cape Town Insights</title>
        <meta name="description" content={`${rental.title} in ${rental.location}. ${formatPrice(rental.price)}/month. ${rental.bedrooms} bed, ${rental.bathrooms} bath ${rental.propertyType}.`} />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body2"
            onClick={handleBack}
            sx={{ textDecoration: 'none' }}
          >
            Rentals
          </Link>
          <Typography variant="body2" color="text.primary">
            {rental.title}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight="bold" sx={{ flexGrow: 1 }}>
              {rental.title}
            </Typography>
            <IconButton
              onClick={() => toggleRentalFavorite(rental._id)}
              color={isRentalFavorited(rental._id) ? 'error' : 'default'}
            >
              {isRentalFavorited(rental._id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <IconButton>
              <ShareIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <LocationIcon color="action" />
            <Typography variant="h6" color="text.secondary">
              {rental.location}
            </Typography>
            <Chip 
              label={rental.category} 
              color={getCategoryColor(rental.category)}
              variant="outlined"
            />
          </Box>

          <Typography variant="h3" color="primary" fontWeight="bold">
            {formatPrice(rental.price)}/month
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Property Image Placeholder */}
            <Paper
              sx={{
                height: 400,
                backgroundColor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 4,
                borderRadius: 2
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
                  🏠
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Property Photos Coming Soon
                </Typography>
              </Box>
            </Paper>

            {/* Key Details */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  Property Details
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <BedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {rental.bedrooms}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bedrooms
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <BathtubIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {rental.bathrooms}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bathrooms
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {rental.parking > 0 && (
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <ParkingIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">
                          {rental.parking}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Parking
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {rental.floorSize && (
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <HomeIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">
                          {rental.floorSize}m²
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Floor Size
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" color="text.secondary">
                      <strong>Property Type:</strong> {rental.propertyType}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" color="text.secondary">
                      <strong>Size Category:</strong> {rental.size}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" color="text.secondary">
                      <strong>Furnished:</strong> {rental.furnished}
                    </Typography>
                  </Grid>
                  {rental.pricePerSqm && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" color="text.secondary">
                        <strong>Price per m²:</strong> R{rental.pricePerSqm}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Description */}
            {rental.description && (
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    Description
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {rental.description}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Contact Information */}
            {rental.contactInfo && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Contact Information
                  </Typography>
                  
                  {rental.contactInfo.agent && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BusinessIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {rental.contactInfo.agent}
                      </Typography>
                    </Box>
                  )}
                  
                  {rental.contactInfo.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {rental.contactInfo.phone}
                      </Typography>
                    </Box>
                  )}
                  
                  {rental.contactInfo.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {rental.contactInfo.email}
                      </Typography>
                    </Box>
                  )}
                  
                  {rental.contactInfo.company && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {rental.contactInfo.company}
                      </Typography>
                    </Box>
                  )}
                  
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 3 }}
                    startIcon={<PhoneIcon />}
                  >
                    Contact Agent
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Availability & Terms */}
            {rental.availability && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Availability & Terms
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                      <strong>Status:</strong>{' '}
                      <Chip
                        label={rental.availability.available ? 'Available' : 'Not Available'}
                        color={rental.availability.available ? 'success' : 'error'}
                        size="small"
                      />
                    </Typography>
                  </Box>

                  {rental.availability.availableFrom && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        Available from: {new Date(rental.availability.availableFrom).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}

                  {rental.availability.leaseTerm && (
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      <strong>Lease Term:</strong> {rental.availability.leaseTerm}
                    </Typography>
                  )}

                  {rental.securityDeposit && (
                    <Typography variant="body1" color="text.secondary">
                      <strong>Security Deposit:</strong> {formatPrice(rental.securityDeposit)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pet Policy */}
            {rental.petPolicy && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Pet Policy
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PetsIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      Pets {rental.petPolicy.allowed ? 'Allowed' : 'Not Allowed'}
                    </Typography>
                    {rental.petPolicy.allowed ? (
                      <CheckIcon sx={{ ml: 1, color: 'success.main' }} />
                    ) : (
                      <CloseIcon sx={{ ml: 1, color: 'error.main' }} />
                    )}
                  </Box>

                  {rental.petPolicy.deposit && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Pet Deposit: {formatPrice(rental.petPolicy.deposit)}
                    </Typography>
                  )}

                  {rental.petPolicy.restrictions && (
                    <Typography variant="body2" color="text.secondary">
                      Restrictions: {rental.petPolicy.restrictions}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Map */}
            {rental.coordinates && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Location
                  </Typography>
                  <Paper
                    sx={{
                      height: 200,
                      backgroundColor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <MapIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Interactive Map Coming Soon
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Lat: {rental.coordinates.lat}, Lng: {rental.coordinates.lng}
                      </Typography>
                    </Box>
                  </Paper>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Features & Amenities */}
        {(rental.features?.length > 0 || rental.amenities?.length > 0) && (
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {rental.features?.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Features
                    </Typography>
                    <List dense>
                      {rental.features.map((feature, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {rental.amenities?.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Amenities
                    </Typography>
                    <List dense>
                      {rental.amenities.map((amenity, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={amenity} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* Utilities */}
        {rental.utilities && (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Utilities
              </Typography>

              <Grid container spacing={3}>
                {rental.utilities.included?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main" gutterBottom>
                      Included
                    </Typography>
                    <List dense>
                      {rental.utilities.included.map((utility, index) => (
                        <ListItem key={index} sx={{ py: 0.25 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={utility} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}

                {rental.utilities.excluded?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="bold" color="error.main" gutterBottom>
                      Not Included
                    </Typography>
                    <List dense>
                      {rental.utilities.excluded.map((utility, index) => (
                        <ListItem key={index} sx={{ py: 0.25 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CloseIcon color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={utility} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>

              {rental.utilities.avgMonthlyCost && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>Average Monthly Utility Cost:</strong> {formatPrice(rental.utilities.avgMonthlyCost)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* View Count */}
        {rental.viewCount > 0 && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              This property has been viewed {rental.viewCount} times
            </Typography>
          </Box>
        )}
      </Container>
    </>
  )
}

export default RentalDetails
