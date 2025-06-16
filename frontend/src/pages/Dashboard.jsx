import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  useTheme
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  LocationCity as LocationCityIcon,
  Security as SecurityIcon,
  DirectionsTransit as TransitIcon,
  AttachMoney as MoneyIcon,
  Explore as ExploreIcon,
  Chat as ChatIcon,
  Compare as CompareIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'

import { analyticsAPI, neighborhoodAPI } from '../services/api'
import { useAppStore } from '../store/appStore'

const Dashboard = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { selectedNeighborhoods } = useAppStore()

  // Fetch general statistics
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    analyticsAPI.getStats,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  // Fetch featured neighborhoods (show all available suburbs)
  const { data: featuredNeighborhoods } = useQuery(
    'featured-neighborhoods',
    () => neighborhoodAPI.getAll({
      sortBy: 'safetyScore',
      sortOrder: 'desc',
      limit: 20 // Show more suburbs
    }),
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  )

  const quickActions = [
    {
      title: 'Explore Neighborhoods',
      description: 'Discover and filter neighborhoods by your preferences',
      icon: <ExploreIcon />,
      color: 'primary',
      action: () => navigate('/explorer')
    },
    {
      title: 'AI Chat Assistant',
      description: 'Ask questions about neighborhoods in natural language',
      icon: <ChatIcon />,
      color: 'secondary',
      action: () => navigate('/chat')
    },
    {
      title: 'Compare Areas',
      description: 'Side-by-side comparison of neighborhood metrics',
      icon: <CompareIcon />,
      color: 'success',
      action: () => navigate('/compare'),
      disabled: selectedNeighborhoods.length < 2
    }
  ]

  const statsCards = [
    {
      title: 'Total Neighborhoods',
      value: stats?.data?.totalNeighborhoods || 0,
      icon: <LocationCityIcon />,
      color: 'primary'
    },
    {
      title: 'Boroughs Covered',
      value: stats?.data?.boroughs || 0,
      icon: <TrendingUpIcon />,
      color: 'secondary'
    },
    {
      title: 'Avg Safety Score',
      value: stats?.data?.averages?.avgSafetyScore?.toFixed(1) || 'N/A',
      icon: <SecurityIcon />,
      color: 'success'
    },
    {
      title: 'Avg Transit Score',
      value: stats?.data?.averages?.avgTransitScore?.toFixed(0) || 'N/A',
      icon: <TransitIcon />,
      color: 'info'
    }
  ]

  return (
    <>
      <Helmet>
        <title>Dashboard - City Insights AI</title>
        <meta name="description" content="Urban analytics dashboard with neighborhood insights and AI-powered recommendations" />
      </Helmet>

      <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome to City Insights AI
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover neighborhoods with AI-powered insights and vector search technology
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: action.disabled ? 'not-allowed' : 'pointer',
                      opacity: action.disabled ? 0.6 : 1,
                      '&:hover': {
                        transform: action.disabled ? 'none' : 'translateY(-2px)',
                        boxShadow: action.disabled ? 1 : 4,
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onClick={action.disabled ? undefined : action.action}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            backgroundColor: `${action.color}.light`,
                            color: `${action.color}.contrastText`,
                            mr: 2
                          }}
                        >
                          {action.icon}
                        </Box>
                        <Typography variant="h6" fontWeight={600}>
                          {action.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                      {action.disabled && (
                        <Chip
                          label="Select 2+ neighborhoods"
                          size="small"
                          color="warning"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Platform Statistics
            </Typography>
            {statsLoading ? (
              <LinearProgress sx={{ mb: 2 }} />
            ) : (
              <Grid container spacing={2}>
                {statsCards.map((stat, index) => (
                  <Grid item xs={6} md={3} key={index}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box
                            sx={{
                              p: 0.5,
                              borderRadius: 1,
                              backgroundColor: `${stat.color}.light`,
                              color: `${stat.color}.contrastText`,
                              mr: 1
                            }}
                          >
                            {stat.icon}
                          </Box>
                          <Typography variant="h4" fontWeight={700}>
                            {stat.value}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {stat.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          {/* Featured Neighborhoods */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Featured Neighborhoods
              </Typography>
              <Button
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/explorer')}
              >
                View All
              </Button>
            </Box>
            <Grid container spacing={2}>
              {featuredNeighborhoods?.data?.neighborhoods?.slice(0, 12).map((neighborhood) => (
                <Grid item xs={12} sm={6} md={4} key={neighborhood._id}>
                  <Card 
                    className="neighborhood-card"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/explorer?neighborhood=${neighborhood.name}`)}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {neighborhood.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {neighborhood.borough}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <SecurityIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                          <Typography variant="body2">
                            Safety: {neighborhood.safety?.safetyScore?.toFixed(1) || 'N/A'}/10
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TransitIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                          <Typography variant="body2">
                            Transit: {neighborhood.amenities?.transitScore || 'N/A'}/100
                          </Typography>
                        </Box>
                        
                        {neighborhood.housing?.rentByBedroom ? (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                              Rental Prices:
                            </Typography>
                            {neighborhood.housing.rentByBedroom.oneBed && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                1-bed: R{neighborhood.housing.rentByBedroom.oneBed.avg?.toLocaleString()}
                              </Typography>
                            )}
                            {neighborhood.housing.rentByBedroom.twoBed && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                2-bed: R{neighborhood.housing.rentByBedroom.twoBed.avg?.toLocaleString()}
                              </Typography>
                            )}
                            {neighborhood.housing.rentByBedroom.threeBed && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                3-bed: R{neighborhood.housing.rentByBedroom.threeBed.avg?.toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        ) : neighborhood.housing?.avgRent && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <MoneyIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                            <Typography variant="body2">
                              Avg Rent: R{neighborhood.housing.avgRent.toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
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
                        sx={{ mt: 2 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Selected Neighborhoods */}
          {selectedNeighborhoods.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Selected for Comparison ({selectedNeighborhoods.length})
              </Typography>
              <Grid container spacing={2}>
                {selectedNeighborhoods.map((neighborhood) => (
                  <Grid item xs={12} sm={6} md={3} key={neighborhood._id}>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {neighborhood.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {neighborhood.borough}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              {selectedNeighborhoods.length >= 2 && (
                <Button
                  variant="contained"
                  startIcon={<CompareIcon />}
                  onClick={() => navigate('/compare')}
                  sx={{ mt: 2 }}
                >
                  Compare Selected Neighborhoods
                </Button>
              )}
            </Grid>
          )}
        </Grid>
      </Box>
    </>
  )
}

export default Dashboard
