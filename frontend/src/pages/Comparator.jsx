import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  DirectionsTransit as TransitIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  CompareArrows as CompareArrowsIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'

import { neighborhoodAPI, analyticsAPI } from '../services/api'
import { useAppStore } from '../store/appStore'
import ComparisonTable from '../components/Analytics/ComparisonTable'
import TrendChart from '../components/Analytics/TrendChart'
import InsightCards from '../components/Analytics/InsightCards'
import ComparisonChart from '../components/Analytics/ComparisonChart'
import SuburbSelectionModal from '../components/Comparator/SuburbSelectionModal'

const Comparator = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { selectedNeighborhoods, addSelectedNeighborhood, removeSelectedNeighborhood, clearSelectedNeighborhoods } = useAppStore()

  const [activeTab, setActiveTab] = useState(0)
  const [comparisonData, setComparisonData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [suburbModalOpen, setSuburbModalOpen] = useState(false)
  const [headerMinimized, setHeaderMinimized] = useState(false)

  // Fetch comparison data when neighborhoods change
  const { data: comparison, isLoading: comparisonLoading } = useQuery(
    ['neighborhood-comparison', selectedNeighborhoods.map(n => n._id)],
    () => neighborhoodAPI.compare(selectedNeighborhoods.map(n => n._id)),
    {
      enabled: selectedNeighborhoods.length >= 2,
      onSuccess: (data) => {
        setComparisonData(data.data)
      }
    }
  )

  // Fetch analytics comparison
  const { data: analyticsComparison } = useQuery(
    ['analytics-comparison', selectedNeighborhoods.map(n => n.name)],
    () => analyticsAPI.compare(
      selectedNeighborhoods.map(n => n.name),
      ['housing', 'safety', 'amenities', 'demographics']
    ),
    {
      enabled: selectedNeighborhoods.length >= 2
    }
  )

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handleRemoveNeighborhood = (neighborhoodId) => {
    removeSelectedNeighborhood(neighborhoodId)
  }

  const handleAddMore = () => {
    setSuburbModalOpen(true)
  }

  const handleSelectSuburbs = (newSuburbs) => {
    // Add the new suburbs to the selected neighborhoods
    newSuburbs.forEach(suburb => {
      addSelectedNeighborhood(suburb)
    })
  }

  const handleClearAll = () => {
    clearSelectedNeighborhoods()
  }

  if (selectedNeighborhoods.length < 2) {
    return (
      <>
        <Helmet>
          <title>Compare Neighborhoods - City Insights AI</title>
        </Helmet>
        
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Select at least 2 neighborhoods to compare them side by side.
          </Alert>
          
          {selectedNeighborhoods.length === 1 && (
            <Card sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              <CardContent>
                <Typography variant="h6">
                  {selectedNeighborhoods[0].name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedNeighborhoods[0].borough}
                </Typography>
                <Button
                  startIcon={<DeleteIcon />}
                  onClick={() => handleRemoveNeighborhood(selectedNeighborhoods[0]._id)}
                  sx={{ mt: 1 }}
                >
                  Remove
                </Button>
              </CardContent>
            </Card>
          )}
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddMore}
            size="large"
          >
            Explore Neighborhoods
          </Button>
        </Box>

        {/* Suburb Selection Modal */}
        <SuburbSelectionModal
          open={suburbModalOpen}
          onClose={() => setSuburbModalOpen(false)}
          onSelectSuburbs={handleSelectSuburbs}
          selectedNeighborhoods={selectedNeighborhoods}
        />
      </>
    )
  }

  const tabLabels = [
    { label: 'Overview', icon: <TrendingUpIcon /> },
    { label: 'Housing', icon: <HomeIcon /> },
    { label: 'Safety', icon: <SecurityIcon /> },
    { label: 'Transit & Amenities', icon: <TransitIcon /> },
    { label: 'Demographics', icon: <PeopleIcon /> }
  ]

  return (
    <>
      <Helmet>
        <title>Compare Neighborhoods - City Insights AI</title>
        <meta name="description" content="Side-by-side comparison of neighborhood metrics and insights" />
      </Helmet>

      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          {/* Minimized Header */}
          {headerMinimized && isMobile && (
            <Box sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
            onClick={() => setHeaderMinimized(false)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompareArrowsIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Comparing {selectedNeighborhoods.length} neighborhoods
                </Typography>
              </Box>
              <IconButton size="small">
                <ExpandMoreIcon />
              </IconButton>
            </Box>
          )}

          {/* Full Header */}
          <Collapse in={!headerMinimized || !isMobile}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 0 },
                mb: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant={{ xs: 'h5', sm: 'h4' }} fontWeight={700}>
                    Neighborhood Comparison
                  </Typography>
                  {isMobile && (
                    <IconButton
                      size="small"
                      onClick={() => setHeaderMinimized(true)}
                      sx={{ ml: 1 }}
                    >
                      <ExpandLessIcon />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  flexDirection: { xs: 'column', sm: 'row' },
                  width: { xs: '100%', sm: 'auto' }
                }}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddMore}
                    disabled={selectedNeighborhoods.length >= 5}
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Add More
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAll}
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Clear All
                  </Button>
                </Box>
              </Box>

              {/* Selected Neighborhoods */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {selectedNeighborhoods.map((neighborhood) => (
                  <Card key={neighborhood._id} variant="outlined">
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {neighborhood.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {neighborhood.borough}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveNeighborhood(neighborhood._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          </Collapse>
        </Box>

        {/* Tabs */}
        <Box sx={{
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 200,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: { xs: 56, sm: 64 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            {tabLabels.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 3 }, // Proper spacing below sticky tabs
          position: 'relative'
        }}>
          {comparisonLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  {/* AI Insights */}
                  {analyticsComparison?.data?.insights && (
                    <Grid item xs={12}>
                      <Card sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              borderRadius: '50%',
                              p: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              🤖
                            </Box>
                            <Typography variant="h5" fontWeight={700}>
                              AI Comparison Analysis
                            </Typography>
                          </Box>

                          <Paper sx={{
                            p: 3,
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            color: 'text.primary',
                            borderRadius: 2
                          }}>
                            <Box
                              sx={{
                                '& h1, & h2, & h3, & h4, & h5, & h6': {
                                  color: 'primary.main',
                                  fontWeight: 600,
                                  margin: 0,
                                  marginBottom: 1
                                },
                                '& strong': {
                                  fontWeight: 600,
                                  color: 'primary.main'
                                },
                                '& ul, & ol': {
                                  paddingLeft: 2,
                                  margin: 0,
                                  marginBottom: 1
                                },
                                '& li': {
                                  marginBottom: 0.5
                                },
                                '& p': {
                                  margin: 0,
                                  marginBottom: 1,
                                  '&:last-child': {
                                    marginBottom: 0
                                  }
                                }
                              }}
                            >
                              <ReactMarkdown>{analyticsComparison.data.insights}</ReactMarkdown>
                            </Box>
                          </Paper>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Quick Comparison Score Cards */}
                  <Grid item xs={12}>
                    <ComparisonChart
                      neighborhoods={selectedNeighborhoods}
                      title="📊 Quick Comparison Overview"
                      type="cards"
                      metrics={[
                        {
                          label: 'Rent',
                          getValue: (n) => n.housing?.avgRent || 0,
                          format: (v) => `R${v.toLocaleString()}`,
                          getColor: (v) => v < 15000 ? 'success' : v < 25000 ? 'warning' : 'error'
                        },
                        {
                          label: 'Safety',
                          getValue: (n) => n.safety?.safetyScore || 0,
                          format: (v) => `${v.toFixed(1)}/10`,
                          getColor: (v) => v >= 8 ? 'success' : v >= 6 ? 'warning' : 'error'
                        },
                        {
                          label: 'Transit',
                          getValue: (n) => n.amenities?.transitScore || 0,
                          format: (v) => `${v}/100`,
                          getColor: (v) => v >= 80 ? 'success' : v >= 60 ? 'warning' : 'error'
                        },
                        {
                          label: 'Walkability',
                          getValue: (n) => n.amenities?.walkabilityScore || 0,
                          format: (v) => `${v}/100`,
                          getColor: (v) => v >= 85 ? 'success' : v >= 70 ? 'warning' : 'error'
                        }
                      ]}
                    />
                  </Grid>

                  {/* Housing Comparison */}
                  <Grid item xs={12} md={6}>
                    <ComparisonChart
                      neighborhoods={selectedNeighborhoods}
                      title="🏠 Housing Costs"
                      type="bar"
                      metrics={[
                        {
                          label: 'Avg Rent (R)',
                          getValue: (n) => n.housing?.avgRent || 0
                        }
                      ]}
                    />
                  </Grid>

                  {/* Safety Comparison */}
                  <Grid item xs={12} md={6}>
                    <ComparisonChart
                      neighborhoods={selectedNeighborhoods}
                      title="🛡️ Safety Scores"
                      type="bar"
                      metrics={[
                        {
                          label: 'Safety Score (0-10)',
                          getValue: (n) => n.safety?.safetyScore || 0
                        }
                      ]}
                    />
                  </Grid>

                  {/* Transit & Walkability */}
                  <Grid item xs={12} md={6}>
                    <ComparisonChart
                      neighborhoods={selectedNeighborhoods}
                      title="🚇 Transit & Walkability"
                      type="bar"
                      metrics={[
                        {
                          label: 'Transit Score (0-100)',
                          getValue: (n) => n.amenities?.transitScore || 0
                        },
                        {
                          label: 'Walkability Score (0-100)',
                          getValue: (n) => n.amenities?.walkabilityScore || 0
                        }
                      ]}
                    />
                  </Grid>

                  {/* Local Amenities */}
                  <Grid item xs={12} md={6}>
                    <ComparisonChart
                      neighborhoods={selectedNeighborhoods}
                      title="🍽️ Local Amenities"
                      type="bar"
                      metrics={[
                        {
                          label: 'Restaurants',
                          getValue: (n) => n.amenities?.restaurants || 0
                        },
                        {
                          label: 'Schools',
                          getValue: (n) => n.amenities?.schools || 0
                        },
                        {
                          label: 'Parks',
                          getValue: (n) => n.amenities?.parks || 0
                        }
                      ]}
                    />
                  </Grid>

                  {/* Summary Table */}
                  <Grid item xs={12}>
                    <ComparisonTable
                      neighborhoods={selectedNeighborhoods}
                      metrics={['housing', 'safety', 'amenities']}
                    />
                  </Grid>
                </Grid>
              )}

              {/* Housing Tab */}
              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TrendChart
                      title="Average Rent Comparison"
                      data={selectedNeighborhoods.map(n => ({
                        name: n.name,
                        value: n.housing?.avgRent || 0
                      }))}
                      type="bar"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TrendChart
                      title="Home Ownership Rate"
                      data={selectedNeighborhoods.map(n => ({
                        name: n.name,
                        value: n.housing?.homeOwnershipRate || 0
                      }))}
                      type="bar"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ComparisonTable
                      neighborhoods={selectedNeighborhoods}
                      metrics={['housing']}
                    />
                  </Grid>
                </Grid>
              )}

              {/* Safety Tab */}
              {activeTab === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TrendChart
                      title="Safety Score Comparison"
                      data={selectedNeighborhoods.map(n => ({
                        name: n.name,
                        value: n.safety?.safetyScore || 0
                      }))}
                      type="bar"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TrendChart
                      title="Crime Rate (per 1000)"
                      data={selectedNeighborhoods.map(n => ({
                        name: n.name,
                        value: n.safety?.crimeRate || 0
                      }))}
                      type="bar"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ComparisonTable
                      neighborhoods={selectedNeighborhoods}
                      metrics={['safety']}
                    />
                  </Grid>
                </Grid>
              )}

              {/* Transit & Amenities Tab */}
              {activeTab === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TrendChart
                      title="Transit Score"
                      data={selectedNeighborhoods.map(n => ({
                        name: n.name,
                        value: n.amenities?.transitScore || 0
                      }))}
                      type="bar"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TrendChart
                      title="Walkability Score"
                      data={selectedNeighborhoods.map(n => ({
                        name: n.name,
                        value: n.amenities?.walkabilityScore || 0
                      }))}
                      type="bar"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ComparisonTable
                      neighborhoods={selectedNeighborhoods}
                      metrics={['amenities']}
                    />
                  </Grid>
                </Grid>
              )}

              {/* Demographics Tab */}
              {activeTab === 4 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TrendChart
                      title="Population"
                      data={selectedNeighborhoods.map(n => ({
                        name: n.name,
                        value: n.demographics?.population || 0
                      }))}
                      type="bar"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TrendChart
                      title="Median Income"
                      data={selectedNeighborhoods.map(n => ({
                        name: n.name,
                        value: n.demographics?.medianIncome || 0
                      }))}
                      type="bar"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ComparisonTable
                      neighborhoods={selectedNeighborhoods}
                      metrics={['demographics']}
                    />
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </Box>
      </Box>
    </>
  )
}

export default Comparator
