import React from 'react'
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Divider,
  useTheme
} from '@mui/material'
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocationOn as LocationIcon,
  Bed as BedIcon,
  Bathtub as BathtubIcon,
  DirectionsCar as ParkingIcon,
  SquareFoot as SizeIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'

const RentalCard = ({ 
  rental, 
  onFavorite, 
  onView, 
  isFavorited = false,
  showFullDetails = false 
}) => {
  const theme = useTheme()

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

  const getPropertyTypeIcon = (type) => {
    // You could add different icons for different property types
    return '🏠'
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8]
        }
      }}
    >
      {/* Property Image Placeholder */}
      <CardMedia
        sx={{
          height: 200,
          backgroundColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <Typography variant="h3" color="text.secondary">
          {getPropertyTypeIcon(rental.propertyType)}
        </Typography>
        
        {/* Favorite Button */}
        <IconButton
          onClick={() => onFavorite?.(rental)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)'
            }
          }}
        >
          {isFavorited ? (
            <FavoriteIcon color="error" />
          ) : (
            <FavoriteBorderIcon />
          )}
        </IconButton>

        {/* Category Badge */}
        <Chip
          label={rental.category}
          color={getCategoryColor(rental.category)}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8
          }}
        />
      </CardMedia>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title and Location */}
        <Typography variant="h6" component="h3" gutterBottom noWrap>
          {rental.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            {rental.location}
          </Typography>
        </Box>

        {/* Price */}
        <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
          {formatPrice(rental.price)}
          <Typography component="span" variant="body2" color="text.secondary">
            /month
          </Typography>
        </Typography>

        {/* Property Details */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BedIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {rental.bedrooms === 0 ? 'Studio' : `${rental.bedrooms} bed`}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BathtubIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {rental.bathrooms} bath
            </Typography>
          </Box>
          
          {rental.parking > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ParkingIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {rental.parking} parking
              </Typography>
            </Box>
          )}
          
          {rental.floorSize && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SizeIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {rental.floorSize}m²
              </Typography>
            </Box>
          )}
        </Box>

        {/* Features */}
        {rental.features && rental.features.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Features:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {rental.features.slice(0, 3).map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  size="small"
                  variant="outlined"
                />
              ))}
              {rental.features.length > 3 && (
                <Chip
                  label={`+${rental.features.length - 3} more`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
            </Box>
          </Box>
        )}

        {showFullDetails && rental.description && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary" paragraph>
              {rental.description}
            </Typography>
          </>
        )}

        {/* Price per sqm */}
        {rental.pricePerSqm && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            R{rental.pricePerSqm}/m²
          </Typography>
        )}

        {/* Action Buttons */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<ViewIcon />}
            onClick={() => onView?.(rental)}
          >
            View Details
          </Button>
        </Box>

        {/* View Count */}
        {rental.viewCount > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            {rental.viewCount} views
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default RentalCard
