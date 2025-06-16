import React from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  useTheme
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Security as SecurityIcon,
  DirectionsTransit as TransitIcon,
  AttachMoney as MoneyIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Star as StarIcon
} from '@mui/icons-material'

const InsightCards = ({ neighborhoods = [], comparisonData = null }) => {
  const theme = useTheme()

  // Calculate insights from neighborhoods data
  const calculateInsights = () => {
    if (!neighborhoods.length) return []

    const insights = []

    // Safety Analysis
    const safetyScores = neighborhoods
      .map(n => n.safety?.safetyScore)
      .filter(score => score != null)
    
    if (safetyScores.length > 0) {
      const avgSafety = safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length
      const maxSafety = Math.max(...safetyScores)
      const minSafety = Math.min(...safetyScores)
      const safestNeighborhood = neighborhoods.find(n => n.safety?.safetyScore === maxSafety)

      insights.push({
        title: 'Safety Analysis',
        icon: <SecurityIcon />,
        color: 'success',
        value: avgSafety.toFixed(1),
        unit: '/10 avg',
        description: `${safestNeighborhood?.name} is the safest with ${maxSafety}/10`,
        progress: (avgSafety / 10) * 100,
        trend: avgSafety > 7 ? 'up' : avgSafety < 5 ? 'down' : 'neutral'
      })
    }

    // Housing Cost Analysis
    const rentPrices = neighborhoods
      .map(n => n.housing?.avgRent)
      .filter(rent => rent != null)
    
    if (rentPrices.length > 0) {
      const avgRent = rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length
      const maxRent = Math.max(...rentPrices)
      const minRent = Math.min(...rentPrices)
      const cheapestNeighborhood = neighborhoods.find(n => n.housing?.avgRent === minRent)

      insights.push({
        title: 'Housing Costs',
        icon: <MoneyIcon />,
        color: 'warning',
        value: `R${Math.round(avgRent).toLocaleString()}`,
        unit: 'avg rent',
        description: `${cheapestNeighborhood?.name} is most affordable at R${minRent.toLocaleString()}`,
        progress: ((maxRent - avgRent) / (maxRent - minRent)) * 100,
        trend: avgRent > 25000 ? 'up' : avgRent < 15000 ? 'down' : 'neutral'
      })
    }

    // Transit Analysis
    const transitScores = neighborhoods
      .map(n => n.amenities?.transitScore)
      .filter(score => score != null)
    
    if (transitScores.length > 0) {
      const avgTransit = transitScores.reduce((a, b) => a + b, 0) / transitScores.length
      const maxTransit = Math.max(...transitScores)
      const bestTransitNeighborhood = neighborhoods.find(n => n.amenities?.transitScore === maxTransit)

      insights.push({
        title: 'Transit Access',
        icon: <TransitIcon />,
        color: 'info',
        value: Math.round(avgTransit).toString(),
        unit: '/100 avg',
        description: `${bestTransitNeighborhood?.name} has the best transit with ${maxTransit}/100`,
        progress: avgTransit,
        trend: avgTransit > 80 ? 'up' : avgTransit < 60 ? 'down' : 'neutral'
      })
    }

    // Population Density
    const populations = neighborhoods
      .map(n => n.demographics?.population)
      .filter(pop => pop != null)
    
    if (populations.length > 0) {
      const totalPop = populations.reduce((a, b) => a + b, 0)
      const avgPop = totalPop / populations.length
      const maxPop = Math.max(...populations)
      const mostPopulousNeighborhood = neighborhoods.find(n => n.demographics?.population === maxPop)

      insights.push({
        title: 'Population',
        icon: <PeopleIcon />,
        color: 'primary',
        value: Math.round(avgPop / 1000).toString() + 'K',
        unit: 'avg population',
        description: `${mostPopulousNeighborhood?.name} is most populous with ${Math.round(maxPop / 1000)}K residents`,
        progress: (avgPop / maxPop) * 100,
        trend: 'neutral'
      })
    }

    return insights
  }

  const insights = calculateInsights()

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon fontSize="small" color="success" />
      case 'down':
        return <TrendingDownIcon fontSize="small" color="error" />
      default:
        return null
    }
  }

  // Get color based on theme
  const getColor = (colorName) => {
    return theme.palette[colorName]?.main || theme.palette.primary.main
  }

  return (
    <Grid container spacing={2}>
      {insights.map((insight, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${getColor(insight.color)}15 0%, ${getColor(insight.color)}05 100%)`,
              border: 1,
              borderColor: `${insight.color}.light`
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: `${insight.color}.light`,
                    color: `${insight.color}.contrastText`,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {insight.icon}
                </Box>
                {getTrendIcon(insight.trend)}
              </Box>

              <Typography variant="h4" fontWeight={700} color={`${insight.color}.main`} gutterBottom>
                {insight.value}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {insight.unit}
              </Typography>

              <Typography variant="h6" fontWeight={600} gutterBottom>
                {insight.title}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                {insight.description}
              </Typography>

              {/* Progress Bar */}
              <Box sx={{ mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(insight.progress, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getColor(insight.color),
                      borderRadius: 3
                    }
                  }}
                />
              </Box>

              <Typography variant="caption" color="text.secondary">
                {Math.round(insight.progress)}% of maximum
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Overall Score Card */}
      {neighborhoods.length > 1 && (
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #1976d215 0%, #1976d205 100%)',
              border: 1,
              borderColor: 'primary.light'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <StarIcon />
                </Box>
              </Box>

              <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
                {neighborhoods.length}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                neighborhoods
              </Typography>

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Comparison Set
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                Analyzing {neighborhoods.length} neighborhoods across multiple metrics
              </Typography>

              {/* Borough Distribution */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {[...new Set(neighborhoods.map(n => n.borough))].map(borough => (
                  <Chip
                    key={borough}
                    label={borough}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Recommendation Card */}
      {neighborhoods.length > 0 && (
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                💡 Quick Insights
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">
                    <strong>Best for Safety:</strong> {
                      neighborhoods.reduce((best, current) => 
                        (current.safety?.safetyScore || 0) > (best.safety?.safetyScore || 0) ? current : best
                      ).name
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">
                    <strong>Most Affordable:</strong> {
                      neighborhoods.reduce((cheapest, current) => 
                        (current.housing?.avgRent || Infinity) < (cheapest.housing?.avgRent || Infinity) ? current : cheapest
                      ).name
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">
                    <strong>Best Transit:</strong> {
                      neighborhoods.reduce((best, current) => 
                        (current.amenities?.transitScore || 0) > (best.amenities?.transitScore || 0) ? current : best
                      ).name
                    }
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}

export default InsightCards
