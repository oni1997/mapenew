import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import {
  Home as HomeIcon,
  Bed as BedIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material'

const BedroomPricing = ({ neighborhood, compact = false }) => {
  if (!neighborhood?.housing?.rentByBedroom) {
    return null
  }

  const { rentByBedroom } = neighborhood.housing

  const bedroomTypes = [
    { key: 'studio', label: 'Studio', icon: '🏠' },
    { key: 'oneBed', label: '1 Bedroom', icon: '🛏️' },
    { key: 'twoBed', label: '2 Bedroom', icon: '🛏️🛏️' },
    { key: 'threeBed', label: '3 Bedroom', icon: '🛏️🛏️🛏️' },
    { key: 'fourBed', label: '4+ Bedroom', icon: '🏡' }
  ]

  const getAffordabilityColor = (avgPrice) => {
    if (avgPrice >= 50000) return 'error'      // Ultra-Luxury
    if (avgPrice >= 35000) return 'error'      // Luxury
    if (avgPrice >= 20000) return 'warning'    // Expensive
    if (avgPrice >= 12000) return 'info'       // Moderate
    if (avgPrice >= 8000) return 'success'     // Affordable
    return 'success'                           // Budget
  }

  if (compact) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HomeIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              Rental Prices by Bedroom
            </Typography>
          </Box>
          
          <Grid container spacing={1}>
            {bedroomTypes.map(({ key, label, icon }) => {
              const pricing = rentByBedroom[key]
              if (!pricing) return null
              
              return (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Box sx={{ 
                    p: 1.5, 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {icon} {label}
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      R{pricing.avg?.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      R{pricing.min?.toLocaleString()} - R{pricing.max?.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              )
            })}
          </Grid>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <HomeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            Rental Prices by Bedroom Type
          </Typography>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Property Type</strong></TableCell>
                <TableCell align="center"><strong>Average Rent</strong></TableCell>
                <TableCell align="center"><strong>Price Range</strong></TableCell>
                <TableCell align="center"><strong>Category</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bedroomTypes.map(({ key, label, icon }) => {
                const pricing = rentByBedroom[key]
                if (!pricing) return null
                
                return (
                  <TableRow key={key} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ mr: 1, fontSize: '1.2em' }}>
                          {icon}
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {label}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" fontWeight={600} color="primary.main">
                        R{pricing.avg?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        R{pricing.min?.toLocaleString()} - R{pricing.max?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          pricing.avg >= 50000 ? 'Ultra-Luxury' :
                          pricing.avg >= 35000 ? 'Luxury' :
                          pricing.avg >= 20000 ? 'Expensive' :
                          pricing.avg >= 12000 ? 'Moderate' :
                          pricing.avg >= 8000 ? 'Affordable' : 'Budget'
                        }
                        color={getAffordabilityColor(pricing.avg)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>💡 Tip:</strong> Prices vary based on specific location within {neighborhood.name}, 
            property condition, amenities, and seasonal demand. Contact local agents for current availability.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default BedroomPricing
