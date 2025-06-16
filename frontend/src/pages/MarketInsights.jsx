import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material'
// Removed unused icon imports
import { Helmet } from 'react-helmet-async'
import { useQuery } from 'react-query'
import ReactMarkdown from 'react-markdown'
import { neighborhoodAPI, houseRentalsAPI } from '../services/api'
import TrendChart from '../components/Analytics/TrendChart'

const MarketInsights = () => {

  // Fetch market insights
  const { data: marketData, isLoading, error } = useQuery(
    'market-insights',
    neighborhoodAPI.getMarketInsights,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  // Fetch rental statistics for charts
  const { data: rentalStats } = useQuery(
    'rental-stats',
    houseRentalsAPI.getStats,
    {
      staleTime: 5 * 60 * 1000
    }
  )

  // Fetch all neighborhoods for trend analysis
  const { data: neighborhoodsData, isLoading: neighborhoodsLoading, error: neighborhoodsError } = useQuery(
    'neighborhoods-all',
    () => neighborhoodAPI.getAll({ limit: 100 }),
    {
      staleTime: 10 * 60 * 1000
    }
  )

  // Extract the actual insights text from the response
  const insightsText = marketData?.aiAnalysis?.insights ||
                      marketData?.data?.aiAnalysis?.insights ||
                      marketData?.data?.insights ||
                      marketData?.insights

  // Ensure we have a string for ReactMarkdown
  const insights = typeof insightsText === 'string' ? insightsText :
                  typeof insightsText === 'object' && insightsText?.insights ? insightsText.insights :
                  'No detailed analysis available.'
  const dataPoints = marketData?.data?.dataPoints || marketData?.overview?.totalDataPoints
  const comprehensiveData = marketData?.data || marketData



  // Extract market data from comprehensive response
  const marketDataStats = comprehensiveData?.marketData || {
    averageRent: comprehensiveData?.rentals?.averagePrice || comprehensiveData?.neighborhoods?.averageRent,
    averageSafety: comprehensiveData?.crime?.overallSafetyScore ||
      (comprehensiveData?.neighborhoods?.safetyStats ?
        Object.keys(comprehensiveData.neighborhoods.safetyStats).reduce((sum, key) =>
          sum + (parseInt(key) * comprehensiveData.neighborhoods.safetyStats[key]), 0) /
        Object.values(comprehensiveData.neighborhoods.safetyStats).reduce((sum, count) => sum + count, 0) : null),
    rentRange: {
      min: comprehensiveData?.rentals?.locationStats?.reduce((min, loc) => Math.min(min, loc.avgPrice), Infinity) || 0,
      max: comprehensiveData?.rentals?.locationStats?.reduce((max, loc) => Math.max(max, loc.avgPrice), 0) || 0
    },
    boroughStats: comprehensiveData?.neighborhoods?.boroughStats || []
  }

  // Note: Using comprehensive data directly in components instead of extracted variables

  const formatCurrency = (amount) => {
    return `R${amount?.toLocaleString() || 'N/A'}`
  }

  // Prepare chart data
  const preparePriceByLocationChart = () => {
    if (!rentalStats?.locationStats) {
      // Return sample Cape Town data for demonstration
      return [
        { name: 'Camps Bay', value: 45000, count: 12 },
        { name: 'Clifton', value: 42000, count: 8 },
        { name: 'Sea Point', value: 28000, count: 25 },
        { name: 'Green Point', value: 25000, count: 18 },
        { name: 'Rondebosch', value: 22000, count: 15 },
        { name: 'Newlands', value: 20000, count: 12 },
        { name: 'Observatory', value: 15000, count: 20 },
        { name: 'Woodstock', value: 12000, count: 16 },
        { name: 'Salt River', value: 10000, count: 14 },
        { name: 'Athlone', value: 8000, count: 10 }
      ]
    }

    return rentalStats.locationStats
      .sort((a, b) => b.avgPrice - a.avgPrice)
      .slice(0, 10)
      .map(location => ({
        name: location._id,
        value: location.avgPrice,
        count: location.count
      }))
  }

  const prepareCategoryDistributionChart = () => {
    if (!rentalStats?.categoryStats) {
      // Return sample Cape Town property distribution
      return [
        { name: 'Budget', value: 35, percentage: '35.0' },
        { name: 'Moderate', value: 40, percentage: '40.0' },
        { name: 'Luxury', value: 20, percentage: '20.0' },
        { name: 'Ultra-Luxury', value: 5, percentage: '5.0' }
      ]
    }

    const totalProperties = rentalStats.totalProperties || rentalStats.categoryStats.reduce((sum, cat) => sum + cat.count, 0)

    return rentalStats.categoryStats.map(category => ({
      name: category._id,
      value: category.count,
      percentage: ((category.count / totalProperties) * 100).toFixed(1)
    }))
  }

  const prepareNeighborhoodSafetyChart = () => {
    if (!neighborhoodsData?.neighborhoods) {
      // Return sample Cape Town safety distribution
      return [
        { name: 'Very Safe (8-10)', value: 12 },
        { name: 'Safe (6-8)', value: 18 },
        { name: 'Moderate (4-6)', value: 15 },
        { name: 'Caution (2-4)', value: 8 },
        { name: 'High Risk (0-2)', value: 3 }
      ]
    }

    const safetyRanges = {
      'Very Safe (8-10)': 0,
      'Safe (6-8)': 0,
      'Moderate (4-6)': 0,
      'Caution (2-4)': 0,
      'High Risk (0-2)': 0
    }

    let processedCount = 0
    neighborhoodsData.neighborhoods.forEach(neighborhood => {
      // Check multiple possible locations for safety score
      const safety = neighborhood.safety?.safetyScore ||
                    neighborhood.safetyScore ||
                    0

      if (safety > 0) processedCount++

      if (safety >= 8) safetyRanges['Very Safe (8-10)']++
      else if (safety >= 6) safetyRanges['Safe (6-8)']++
      else if (safety >= 4) safetyRanges['Moderate (4-6)']++
      else if (safety >= 2) safetyRanges['Caution (2-4)']++
      else safetyRanges['High Risk (0-2)']++
    })

    // If no real safety data, return sample data
    if (processedCount === 0) {
      return [
        { name: 'Very Safe (8-10)', value: 12 },
        { name: 'Safe (6-8)', value: 18 },
        { name: 'Moderate (4-6)', value: 15 },
        { name: 'Caution (2-4)', value: 8 },
        { name: 'High Risk (0-2)', value: 3 }
      ]
    }

    // Filter out ranges with 0 values for cleaner chart
    return Object.entries(safetyRanges)
      .filter(([name, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value
      }))
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load market insights. Please try again later.
        </Alert>
      </Box>
    )
  }

  return (
    <>
      <Helmet>
        <title>Market Insights - City Insights AI</title>
        <meta name="description" content="AI-powered Cape Town real estate market insights and trends" />
      </Helmet>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          🏠 Cape Town Market Insights
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          AI-powered analysis of Cape Town's rental market trends and opportunities
        </Typography>

        {/* Market Trends Charts */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          📈 Market Trends & Analytics
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Price by Location Chart */}
          <Grid item xs={12} lg={6}>
            <TrendChart
              title="🏘️ Top 10 Areas by Average Rent"
              data={preparePriceByLocationChart()}
              type="bar"
              height={350}
              color="primary"
            />
          </Grid>

          {/* Property Category Distribution */}
          <Grid item xs={12} lg={6}>
            <TrendChart
              title="🏠 Property Categories Distribution"
              data={prepareCategoryDistributionChart()}
              type="doughnut"
              height={350}
              color="secondary"
            />
          </Grid>

          {/* Safety Score Distribution */}
          <Grid item xs={12}>
            <TrendChart
              title="🛡️ Neighborhood Safety Score Distribution"
              data={prepareNeighborhoodSafetyChart()}
              type="bar"
              height={300}
              color="success"
            />
          </Grid>
        </Grid>

        {/* Comprehensive Data Overview */}
        {comprehensiveData && (comprehensiveData.education || comprehensiveData.healthcare || comprehensiveData.rentals || comprehensiveData.transport || comprehensiveData.crime) && (
          <>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              📊 Comprehensive Data Overview
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Education Stats */}
              {comprehensiveData.education && (
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                    border: 1,
                    borderColor: 'success.light',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                  }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        🎓 Education
                      </Typography>
                      <Typography variant="h4" color="success.main" gutterBottom fontWeight={700}>
                        {comprehensiveData.education.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Public Schools
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {comprehensiveData.education.districtBreakdown?.length} Districts
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Healthcare Stats */}
              {comprehensiveData.healthcare && (
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{
                    background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%)',
                    border: 1,
                    borderColor: 'error.light',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                  }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        🏥 Healthcare
                      </Typography>
                      <Typography variant="h4" color="error.main" gutterBottom fontWeight={700}>
                        {comprehensiveData.healthcare.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Medical Facilities
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {comprehensiveData.healthcare.classificationBreakdown?.length} Types
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Rental Stats */}
              {comprehensiveData.rentals && (
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{
                    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
                    border: 1,
                    borderColor: 'primary.light',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                  }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        🏠 Rentals
                      </Typography>
                      <Typography variant="h4" color="primary.main" gutterBottom fontWeight={700}>
                        {comprehensiveData.rentals.totalProperties}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Properties
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {comprehensiveData.rentals.occupancyRate}% Unoccupied
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Transport Stats */}
              {comprehensiveData.transport && (
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{
                    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
                    border: 1,
                    borderColor: 'warning.light',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                  }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        🚌 Transport
                      </Typography>
                      <Typography variant="h4" color="warning.main" gutterBottom fontWeight={700}>
                        {comprehensiveData.transport.totalRoutes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Taxi Routes
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {comprehensiveData.transport.connectivity} Connections
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </>
        )}

        <Grid container spacing={3}>
          {/* Market Overview Cards */}
          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
              border: 1,
              borderColor: 'primary.light',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600, mb: 2 }}>
                  💰 Average Rent
                </Typography>
                <Typography variant="h3" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
                  {formatCurrency(marketDataStats?.averageRent)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Across {comprehensiveData?.neighborhoods?.totalNeighborhoods || 0} neighborhoods
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
              border: 1,
              borderColor: 'success.light',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" gutterBottom color="success.main" sx={{ fontWeight: 600, mb: 2 }}>
                  🛡️ Average Safety
                </Typography>
                <Typography variant="h3" fontWeight={700} color="success.main" sx={{ mb: 1 }}>
                  {comprehensiveData?.crime?.overallSafetyScore || marketDataStats?.averageSafety ?
                    (comprehensiveData?.crime?.overallSafetyScore || marketDataStats.averageSafety).toFixed(1) : 'N/A'}/10
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {comprehensiveData?.crime?.totalCrimes ?
                    `Based on ${comprehensiveData.crime.totalCrimes.toLocaleString()} incidents analyzed` :
                    'City-wide safety score'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
              border: 1,
              borderColor: 'warning.light',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" gutterBottom color="warning.main" sx={{ fontWeight: 600, mb: 2 }}>
                  📊 Price Range
                </Typography>
                <Typography variant="h5" fontWeight={700} color="warning.main" sx={{ mb: 1 }}>
                  {formatCurrency(marketDataStats?.rentRange?.min)} - {formatCurrency(marketDataStats?.rentRange?.max)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Market spread
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Trending Insights */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 152, 0, 0.02) 100%)',
              border: 1,
              borderColor: 'warning.light'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'warning.main',
                  fontWeight: 600,
                  mb: 3
                }}>
                  🔥 Market Trends & Hotspots
                </Typography>

                {/* Education Infrastructure */}
                {comprehensiveData?.education && (
                  <Box sx={{ mb: 2.5 }}>
                    <Paper sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      borderLeft: 4,
                      borderLeftColor: 'success.main',
                      borderRadius: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="success.dark">
                          🎓 Education Excellence
                        </Typography>
                        <Chip label="Strong" size="small" color="success" sx={{ ml: 'auto', fontWeight: 600 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {comprehensiveData.education.total} schools across {comprehensiveData.education.districtBreakdown?.length} districts
                      </Typography>
                      <Typography variant="caption" color="success.dark" sx={{ fontWeight: 500 }}>
                        Excellent educational infrastructure supports family-friendly neighborhoods
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Rental Market */}
                {comprehensiveData?.rentals && (
                  <Box sx={{ mb: 2.5 }}>
                    <Paper sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                      borderLeft: 4,
                      borderLeftColor: 'error.main',
                      borderRadius: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="error.dark">
                          🏠 Rental Market Heat
                        </Typography>
                        <Chip
                          label={parseFloat(comprehensiveData.rentals.occupancyRate) > 80 ? "Hot" : "Moderate"}
                          size="small"
                          color={parseFloat(comprehensiveData.rentals.occupancyRate) > 80 ? "error" : "warning"}
                          sx={{ ml: 'auto', fontWeight: 600 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {comprehensiveData.rentals.occupancyRate}% occupancy • R{Math.round(comprehensiveData.rentals.averagePrice).toLocaleString()} avg
                      </Typography>
                      <Typography variant="caption" color="error.dark" sx={{ fontWeight: 500 }}>
                        {parseFloat(comprehensiveData.rentals.occupancyRate) > 80 ?
                          "High demand market - act fast on good properties" :
                          "Balanced market with good opportunities"}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Infrastructure Leader */}
                {comprehensiveData?.infrastructure?.bestInfrastructure?.[0] && (
                  <Box sx={{ mb: 2.5 }}>
                    <Paper sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      borderLeft: 4,
                      borderLeftColor: 'primary.main',
                      borderRadius: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="primary.dark">
                          🏗️ Infrastructure Champion
                        </Typography>
                        <Chip label="Leader" size="small" color="primary" sx={{ ml: 'auto', fontWeight: 600 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {comprehensiveData.infrastructure.bestInfrastructure[0].neighborhood} leads with score {comprehensiveData.infrastructure.bestInfrastructure[0].infrastructureScore}
                      </Typography>
                      <Typography variant="caption" color="primary.dark" sx={{ fontWeight: 500 }}>
                        Top-tier access to schools, hospitals, and transport
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Transport Connectivity */}
                {comprehensiveData?.transport && (
                  <Box>
                    <Paper sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(156, 39, 176, 0.08)',
                      borderLeft: 4,
                      borderLeftColor: 'secondary.main',
                      borderRadius: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="secondary.dark">
                          🚌 Transport Network
                        </Typography>
                        <Chip label="Excellent" size="small" color="secondary" sx={{ ml: 'auto', fontWeight: 600 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {comprehensiveData.transport.totalRoutes} taxi routes • {comprehensiveData.transport.connectivity} connections
                      </Typography>
                      <Typography variant="caption" color="secondary.dark" sx={{ fontWeight: 500 }}>
                        Comprehensive connectivity across Cape Town
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Market Recommendations */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.02) 100%)',
              border: 1,
              borderColor: 'success.light'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'success.main',
                  fontWeight: 600,
                  mb: 3
                }}>
                  💡 Smart Investment Insights
                </Typography>

                {/* Investment Opportunities */}
                {comprehensiveData?.marketTrends?.valueOpportunities?.length > 0 && (
                  <Box sx={{ mb: 2.5 }}>
                    <Paper sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(255, 193, 7, 0.08)',
                      borderLeft: 4,
                      borderLeftColor: 'warning.main',
                      borderRadius: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="warning.dark">
                          💰 Value Investment Zones
                        </Typography>
                        <Chip label="Opportunity" size="small" color="warning" sx={{ ml: 'auto', fontWeight: 600 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {comprehensiveData.marketTrends.valueOpportunities.slice(0, 3).map(area => area.name).join(', ')}
                      </Typography>
                      <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 500 }}>
                        Good safety scores with affordable pricing - ideal for long-term growth
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Family-Friendly Areas */}
                {comprehensiveData?.infrastructure?.bestInfrastructure?.length > 0 && (
                  <Box sx={{ mb: 2.5 }}>
                    <Paper sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      borderLeft: 4,
                      borderLeftColor: 'success.main',
                      borderRadius: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="success.dark">
                          👨‍👩‍👧‍👦 Family-Friendly Champions
                        </Typography>
                        <Chip label="Top Choice" size="small" color="success" sx={{ ml: 'auto', fontWeight: 600 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {comprehensiveData.infrastructure.bestInfrastructure.slice(0, 3).map(area => area.neighborhood).join(', ')}
                      </Typography>
                      <Typography variant="caption" color="success.dark" sx={{ fontWeight: 500 }}>
                        Excellent schools, healthcare, and transport access for families
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Safety-First Areas */}
                {comprehensiveData?.crime?.safestAreas?.length > 0 && (
                  <Box sx={{ mb: 2.5 }}>
                    <Paper sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      borderLeft: 4,
                      borderLeftColor: 'primary.main',
                      borderRadius: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="primary.dark">
                          🛡️ Safest Neighborhoods
                        </Typography>
                        <Chip label="Secure" size="small" color="primary" sx={{ ml: 'auto', fontWeight: 600 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {comprehensiveData.crime.safestAreas.slice(0, 3).map(area => area._id).join(', ')}
                      </Typography>
                      <Typography variant="caption" color="primary.dark" sx={{ fontWeight: 500 }}>
                        Lowest crime rates with safety scores above {comprehensiveData.crime.safestAreas[0]?.safetyScore?.toFixed(1)}/10
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Transport Hubs */}
                {comprehensiveData?.transport?.originStats?.length > 0 && (
                  <Box>
                    <Paper sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(156, 39, 176, 0.08)',
                      borderLeft: 4,
                      borderLeftColor: 'secondary.main',
                      borderRadius: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="secondary.dark">
                          🚌 Transport Connectivity Hubs
                        </Typography>
                        <Chip label="Connected" size="small" color="secondary" sx={{ ml: 'auto', fontWeight: 600 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {comprehensiveData.transport.originStats.slice(0, 3).map(origin => origin._id).join(', ')}
                      </Typography>
                      <Typography variant="caption" color="secondary.dark" sx={{ fontWeight: 500 }}>
                        Major transport nodes with multiple route connections for easy commuting
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed AI Analysis */}
          <Grid item xs={12}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)',
              border: 1,
              borderColor: 'primary.light'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'primary.main',
                  fontWeight: 600
                }}>
                  🤖 Detailed AI Analysis
                </Typography>
                <Paper sx={{
                  p: 3,
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  color: 'text.primary',
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider'
                }}>
                  <Box
                    sx={{
                      '& h1, & h2, & h3, & h4, & h5, & h6': {
                        color: 'primary.main',
                        fontWeight: 600,
                        margin: 0,
                        marginBottom: 1.5,
                        '&:first-of-type': {
                          marginTop: 0
                        }
                      },
                      '& strong': {
                        fontWeight: 600,
                        color: 'primary.main'
                      },
                      '& ul, & ol': {
                        paddingLeft: 2,
                        margin: 0,
                        marginBottom: 1.5
                      },
                      '& li': {
                        marginBottom: 0.5,
                        lineHeight: 1.6
                      },
                      '& p': {
                        margin: 0,
                        marginBottom: 1.5,
                        lineHeight: 1.6,
                        '&:last-child': {
                          marginBottom: 0
                        }
                      },
                      '& em': {
                        fontStyle: 'italic',
                        color: 'text.secondary'
                      }
                    }}
                  >
                    <ReactMarkdown>
                      {insights}
                    </ReactMarkdown>
                  </Box>
                </Paper>
              </CardContent>
            </Card>
          </Grid>

          {/* Borough Statistics */}
          {marketDataStats?.boroughStats && marketDataStats.boroughStats.length > 0 && (
            <Grid item xs={12}>
              <Card sx={{
                background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(156, 39, 176, 0.02) 100%)',
                border: 1,
                borderColor: 'secondary.light'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'secondary.main',
                    fontWeight: 600,
                    mb: 3
                  }}>
                    📊 Borough Breakdown
                  </Typography>
                  <Grid container spacing={3}>
                    {marketDataStats.boroughStats.slice(0, 6).map((borough, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper sx={{
                          p: 2.5,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 2,
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 2,
                            borderColor: 'secondary.main'
                          }
                        }}>
                          <Typography variant="subtitle1" fontWeight={600} color="secondary.main" sx={{ mb: 1.5 }}>
                            {borough._id || borough.borough}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            📍 {borough.count} neighborhoods
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            💰 Avg Rent: {formatCurrency(borough.avgRent)}
                          </Typography>
                          {borough.avgSafety && (
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              🛡️ Safety: {borough.avgSafety}/10
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        <Paper sx={{
          mt: 4,
          p: 3,
          backgroundColor: 'rgba(25, 118, 210, 0.05)',
          borderRadius: 2,
          border: 1,
          borderColor: 'primary.light',
          textAlign: 'center'
        }}>
          <Typography variant="body2" color="text.secondary" sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              🕒 Last updated: {new Date(comprehensiveData?.overview?.lastUpdated || marketData?.data?.lastUpdated || Date.now()).toLocaleString()}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              📊 Data points: {comprehensiveData?.overview?.totalDataPoints || dataPoints || 0} total
            </Box>
            {comprehensiveData?.overview?.dataSourcesUsed && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                🗄️ Sources: {comprehensiveData.overview.dataSourcesUsed.length} databases
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              🤖 Powered by Gemini AI
            </Box>
          </Typography>
        </Paper>
      </Box>
    </>
  )
}

export default MarketInsights
