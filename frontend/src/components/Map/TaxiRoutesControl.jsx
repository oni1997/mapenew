import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Autocomplete,
  TextField,
  Chip,
  IconButton,
  Collapse,
  Divider,
  CircularProgress
} from '@mui/material'
import {
  DirectionsBus as BusIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import { taxiRoutesAPI } from '../../services/api'

const TaxiRoutesControl = ({
  visible,
  onVisibilityChange,
  originFilter,
  destinationFilter,
  onOriginFilterChange,
  onDestinationFilterChange
}) => {
  const [expanded, setExpanded] = useState(false)
  const [origins, setOrigins] = useState([])
  const [destinations, setDestinations] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch origins, destinations, and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [originsRes, destinationsRes, statsRes] = await Promise.all([
          taxiRoutesAPI.getOrigins(),
          taxiRoutesAPI.getDestinations(),
          taxiRoutesAPI.getStats()
        ])

        setOrigins(originsRes.data.origins)
        setDestinations(destinationsRes.data.destinations)
        setStats(statsRes.data)
      } catch (error) {
        console.error('Error fetching taxi route data:', error)
        setLoading(false)
        return
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleClearFilters = () => {
    onOriginFilterChange(null)
    onDestinationFilterChange(null)
  }



  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: expanded ? 320 : 280,
        maxWidth: '90vw',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(25, 118, 210, 0.2)', // Subtle blue border to match taxi theme
        transition: 'width 0.3s ease-in-out'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: expanded ? 2 : 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'padding 0.3s ease-in-out'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusIcon color="primary" fontSize={expanded ? 'medium' : 'small'} />
          <Typography variant={expanded ? "h6" : "subtitle1"} component="div">
            Taxi Routes
          </Typography>
          {stats && expanded && (
            <Chip
              label={`${stats.totalRoutes} routes`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Main Toggle */}
      <Box sx={{ px: expanded ? 2 : 1.5, pb: expanded ? 0 : 1.5 }}>
        <FormControlLabel
          control={
            <Switch
              checked={visible}
              onChange={(e) => onVisibilityChange(e.target.checked)}
              color="primary"
              size={expanded ? 'medium' : 'small'}
            />
          }
          label={
            <Typography variant={expanded ? "body2" : "caption"}>
              Show Taxi Routes
            </Typography>
          }
        />
      </Box>

      {/* Expanded Controls */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 2, space: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              {/* Origin Filter */}
              <Box sx={{ mb: 2 }}>
                <Autocomplete
                  options={origins}
                  value={originFilter}
                  onChange={(event, newValue) => onOriginFilterChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by Origin"
                      size="small"
                      placeholder="Select origin location"
                    />
                  )}
                  clearOnEscape
                />
              </Box>

              {/* Destination Filter */}
              <Box sx={{ mb: 2 }}>
                <Autocomplete
                  options={destinations}
                  value={destinationFilter}
                  onChange={(event, newValue) => onDestinationFilterChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by Destination"
                      size="small"
                      placeholder="Select destination location"
                    />
                  )}
                  clearOnEscape
                />
              </Box>

              {/* Clear Filters Button */}
              {(originFilter || destinationFilter) && (
                <Box sx={{ mb: 2 }}>
                  <IconButton
                    onClick={handleClearFilters}
                    size="small"
                    sx={{ 
                      border: 1, 
                      borderColor: 'grey.300',
                      borderRadius: 1
                    }}
                  >
                    <ClearIcon fontSize="small" />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      Clear Filters
                    </Typography>
                  </IconButton>
                </Box>
              )}

              {/* Statistics */}
              {stats && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Route Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={`${stats.uniqueOrigins} Origins`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${stats.uniqueDestinations} Destinations`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${(stats.averageLength * 111).toFixed(1)}km Avg`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              )}

              {/* Active Filters Display */}
              {(originFilter || destinationFilter) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Active Filters:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {originFilter && (
                      <Chip
                        label={`From: ${originFilter}`}
                        size="small"
                        onDelete={() => onOriginFilterChange(null)}
                        color="primary"
                      />
                    )}
                    {destinationFilter && (
                      <Chip
                        label={`To: ${destinationFilter}`}
                        size="small"
                        onDelete={() => onDestinationFilterChange(null)}
                        color="secondary"
                      />
                    )}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  )
}

export default TaxiRoutesControl
