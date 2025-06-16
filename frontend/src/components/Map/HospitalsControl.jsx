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
  LocalHospital as HospitalIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import { hospitalsAPI } from '../../services/api'

const HospitalsControl = ({
  visible,
  onVisibilityChange,
  classificationFilter,
  districtFilter,
  onClassificationFilterChange,
  onDistrictFilterChange,
  taxiRoutesVisible = false
}) => {
  const [expanded, setExpanded] = useState(false)
  const [classifications, setClassifications] = useState([])
  const [districts, setDistricts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch classifications, districts, and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [classificationsRes, districtsRes, statsRes] = await Promise.all([
          hospitalsAPI.getClassifications(),
          hospitalsAPI.getDistricts(),
          hospitalsAPI.getStats()
        ])

        setClassifications(classificationsRes.data.classifications)
        setDistricts(districtsRes.data.districts)
        setStats(statsRes.data)
      } catch (error) {
        console.error('Error fetching hospital data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleClearFilters = () => {
    onClassificationFilterChange(null)
    onDistrictFilterChange(null)
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: taxiRoutesVisible ? 120 : 16, // Adjust position based on taxi routes visibility
        right: 16,
        width: expanded ? 320 : 280,
        maxWidth: '90vw',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(220, 38, 38, 0.2)', // Subtle red border to match hospital theme
        transition: 'all 0.3s ease-in-out'
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
          <HospitalIcon color="error" fontSize={expanded ? 'medium' : 'small'} />
          <Typography variant={expanded ? "h6" : "subtitle1"} component="div">
            Hospitals
          </Typography>
          {stats && expanded && (
            <Chip
              label={`${stats.totalHospitals} facilities`}
              size="small"
              color="error"
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
              color="error"
              size={expanded ? 'medium' : 'small'}
            />
          }
          label={
            <Typography variant={expanded ? "body2" : "caption"}>
              Show Hospitals
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
              {/* Classification Filter */}
              <Box sx={{ mb: 2 }}>
                <Autocomplete
                  options={classifications}
                  value={classificationFilter}
                  onChange={(event, newValue) => onClassificationFilterChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by Type"
                      size="small"
                      placeholder="Select facility type"
                    />
                  )}
                  clearOnEscape
                />
              </Box>

              {/* District Filter */}
              <Box sx={{ mb: 2 }}>
                <Autocomplete
                  options={districts}
                  value={districtFilter}
                  onChange={(event, newValue) => onDistrictFilterChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by District"
                      size="small"
                      placeholder="Select district"
                    />
                  )}
                  clearOnEscape
                />
              </Box>

              {/* Clear Filters Button */}
              {(classificationFilter || districtFilter) && (
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
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Healthcare Statistics:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption">
                      Total Facilities: {stats.totalHospitals}
                    </Typography>
                    <Typography variant="caption">
                      Types: {stats.uniqueClassifications}
                    </Typography>
                    <Typography variant="caption">
                      Districts: {stats.uniqueDistricts}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Legend */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Facility Types:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: '#dc2626',
                        borderRadius: '50%',
                        border: '1px solid white'
                      }}
                    />
                    <Typography variant="caption">Hospitals</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        backgroundColor: '#059669',
                        borderRadius: '50%',
                        border: '1px solid white'
                      }}
                    />
                    <Typography variant="caption">Clinics</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        backgroundColor: '#2563eb',
                        borderRadius: '50%',
                        border: '1px solid white'
                      }}
                    />
                    <Typography variant="caption">CHC</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Active Filters Display */}
              {(classificationFilter || districtFilter) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Active Filters:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {classificationFilter && (
                      <Chip
                        label={`Type: ${classificationFilter}`}
                        size="small"
                        onDelete={() => onClassificationFilterChange(null)}
                        color="error"
                      />
                    )}
                    {districtFilter && (
                      <Chip
                        label={`District: ${districtFilter}`}
                        size="small"
                        onDelete={() => onDistrictFilterChange(null)}
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

export default HospitalsControl
