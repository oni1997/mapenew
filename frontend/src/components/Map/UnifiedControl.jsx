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
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  DirectionsBus as BusIcon,
  LocalHospital as HospitalIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { taxiRoutesAPI, hospitalsAPI, schoolsAPI } from '../../services/api'

const UnifiedControl = ({
  // Taxi Routes Props
  taxiVisible,
  onTaxiVisibilityChange,
  originFilter,
  destinationFilter,
  onOriginFilterChange,
  onDestinationFilterChange,
  // Hospitals Props
  hospitalsVisible,
  onHospitalsVisibilityChange,
  classificationFilter,
  districtFilter,
  onClassificationFilterChange,
  onDistrictFilterChange,
  // Schools Props
  schoolsVisible,
  onSchoolsVisibilityChange,
  schoolTypeFilter,
  schoolDistrictFilter,
  schoolMediumFilter,
  onSchoolTypeFilterChange,
  onSchoolDistrictFilterChange,
  onSchoolMediumFilterChange
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState(0) // 0 = Taxi Routes, 1 = Hospitals, 2 = Schools
  const [loading, setLoading] = useState(false)

  // Taxi Routes State
  const [origins, setOrigins] = useState([])
  const [destinations, setDestinations] = useState([])
  const [taxiStats, setTaxiStats] = useState(null)

  // Hospitals State
  const [classifications, setClassifications] = useState([])
  const [districts, setDistricts] = useState([])
  const [hospitalStats, setHospitalStats] = useState(null)

  // Schools State
  const [schoolTypes, setSchoolTypes] = useState([])
  const [schoolDistricts, setSchoolDistricts] = useState([])
  const [schoolMediums, setSchoolMediums] = useState([])
  const [schoolStats, setSchoolStats] = useState(null)

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [
          originsRes,
          destinationsRes,
          taxiStatsRes,
          classificationsRes,
          districtsRes,
          hospitalStatsRes,
          schoolTypesRes,
          schoolDistrictsRes,
          schoolMediumsRes,
          schoolStatsRes
        ] = await Promise.all([
          taxiRoutesAPI.getOrigins(),
          taxiRoutesAPI.getDestinations(),
          taxiRoutesAPI.getStats(),
          hospitalsAPI.getClassifications(),
          hospitalsAPI.getDistricts(),
          hospitalsAPI.getStats(),
          schoolsAPI.getTypes(),
          schoolsAPI.getDistricts(),
          schoolsAPI.getMediums(),
          schoolsAPI.getStats()
        ])

        setOrigins(originsRes.data.origins)
        setDestinations(destinationsRes.data.destinations)
        setTaxiStats(taxiStatsRes.data)
        setClassifications(classificationsRes.data.classifications)
        setDistricts(districtsRes.data.districts)
        setHospitalStats(hospitalStatsRes.data)
        setSchoolTypes(schoolTypesRes.data.types)
        setSchoolDistricts(schoolDistrictsRes.data.districts)
        setSchoolMediums(schoolMediumsRes.data.mediums)
        setSchoolStats(schoolStatsRes.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handleClearTaxiFilters = () => {
    onOriginFilterChange(null)
    onDestinationFilterChange(null)
  }

  const handleClearHospitalFilters = () => {
    onClassificationFilterChange(null)
    onDistrictFilterChange(null)
  }

  const handleClearSchoolFilters = () => {
    onSchoolTypeFilterChange(null)
    onSchoolDistrictFilterChange(null)
    onSchoolMediumFilterChange(null)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (activeTab === 0) {
      if (originFilter) count++
      if (destinationFilter) count++
    } else if (activeTab === 1) {
      if (classificationFilter) count++
      if (districtFilter) count++
    } else {
      if (schoolTypeFilter) count++
      if (schoolDistrictFilter) count++
      if (schoolMediumFilter) count++
    }
    return count
  }

  const getCurrentVisibility = () => {
    if (activeTab === 0) return taxiVisible
    if (activeTab === 1) return hospitalsVisible
    return schoolsVisible
  }

  const handleVisibilityChange = (checked) => {
    if (activeTab === 0) {
      onTaxiVisibilityChange(checked)
    } else if (activeTab === 1) {
      onHospitalsVisibilityChange(checked)
    } else {
      onSchoolsVisibilityChange(checked)
    }
  }

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute',
        top: isMobile ? 8 : 16,
        right: isMobile ? 8 : 16,
        width: expanded ? (isMobile ? 'calc(100vw - 16px)' : 380) : (isMobile ? 280 : 340),
        maxWidth: isMobile ? 'calc(100vw - 16px)' : '90vw',
        zIndex: 1100, // Higher z-index to ensure it's above affordability legend
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        borderRadius: 3,
        border: `2px solid ${
          activeTab === 0
            ? 'rgba(25, 118, 210, 0.15)'
            : activeTab === 1
              ? 'rgba(220, 38, 38, 0.15)'
              : 'rgba(46, 125, 50, 0.15)'
        }`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px ${
          activeTab === 0
            ? 'rgba(25, 118, 210, 0.05)'
            : activeTab === 1
              ? 'rgba(220, 38, 38, 0.05)'
              : 'rgba(46, 125, 50, 0.05)'
        }`,
        transition: 'all 0.3s ease-in-out',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: expanded ? 2.5 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          borderBottom: expanded ? 1 : 0,
          borderColor: 'divider',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)'
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: expanded ? 40 : 32,
              height: expanded ? 40 : 32,
              borderRadius: '50%',
              backgroundColor: activeTab === 0 ? 'primary.main' : activeTab === 1 ? 'error.main' : 'success.main',
              color: 'white',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {activeTab === 0 ? (
              <BusIcon fontSize={expanded ? 'medium' : 'small'} />
            ) : activeTab === 1 ? (
              <HospitalIcon fontSize={expanded ? 'medium' : 'small'} />
            ) : (
              <SchoolIcon fontSize={expanded ? 'medium' : 'small'} />
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant={expanded ? "h6" : "subtitle1"} component="div" sx={{ fontWeight: 600 }}>
              {activeTab === 0 ? 'Transportation' : activeTab === 1 ? 'Healthcare' : 'Education'}
            </Typography>
            {getCurrentVisibility() && (
              <Typography
                variant="caption"
                sx={{
                  color: activeTab === 0 ? 'primary.main' : activeTab === 1 ? 'error.main' : 'success.main',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'currentColor'
                  }}
                />
                Active
              </Typography>
            )}
          </Box>
          {expanded && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getActiveFiltersCount() > 0 && (
                <Badge badgeContent={getActiveFiltersCount()} color="secondary">
                  <Box />
                </Badge>
              )}
              <Chip
                label={activeTab === 0
                  ? `${taxiStats?.totalRoutes || 0} routes`
                  : activeTab === 1
                    ? `${hospitalStats?.totalHospitals || 0} facilities`
                    : `${schoolStats?.totalSchools || 0} schools`
                }
                size="small"
                color={activeTab === 0 ? "primary" : activeTab === 1 ? "error" : "success"}
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {isMobile && expanded && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            sx={{
              backgroundColor: expanded ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.08)'
              }
            }}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Tab Selector */}
      <Box sx={{ px: expanded ? 2.5 : 2, pt: expanded ? 1 : 0.5 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          size="small"
          sx={{
            minHeight: isMobile ? 48 : 40,
            '& .MuiTab-root': {
              minHeight: isMobile ? 48 : 40,
              fontSize: expanded ? '0.875rem' : '0.75rem',
              fontWeight: 500,
              py: isMobile ? 1.5 : 1,
              px: 1,
              transition: 'all 0.2s ease-in-out',
              textTransform: 'none',
              '&.Mui-selected': {
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab
            label="Transport"
            sx={{
              color: taxiVisible ? 'primary.main' : 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main'
              }
            }}
          />
          <Tab
            label="Healthcare"
            sx={{
              color: hospitalsVisible ? 'error.main' : 'text.secondary',
              '&.Mui-selected': {
                color: 'error.main'
              }
            }}
          />
          <Tab
            label="Education"
            sx={{
              color: schoolsVisible ? 'success.main' : 'text.secondary',
              '&.Mui-selected': {
                color: 'success.main'
              }
            }}
          />
        </Tabs>
      </Box>

      {/* Main Toggle */}
      <Box sx={{ px: expanded ? 2 : 1.5, py: expanded ? 1.5 : 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            borderRadius: 2,
            backgroundColor: getCurrentVisibility()
              ? (activeTab === 0 ? 'primary.50' : activeTab === 1 ? 'error.50' : 'success.50')
              : 'grey.50',
            border: 1,
            borderColor: getCurrentVisibility()
              ? (activeTab === 0 ? 'primary.200' : activeTab === 1 ? 'error.200' : 'success.200')
              : 'grey.200',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: getCurrentVisibility()
                  ? (activeTab === 0 ? 'primary.main' : activeTab === 1 ? 'error.main' : 'success.main')
                  : 'grey.400'
              }}
            />
            <Typography
              variant={expanded ? "body2" : "caption"}
              sx={{
                fontWeight: 500,
                color: getCurrentVisibility() ? 'text.primary' : 'text.secondary'
              }}
            >
              Show {activeTab === 0 ? 'Routes' : activeTab === 1 ? 'Hospitals' : 'Schools'}
            </Typography>
          </Box>
          <Switch
            checked={getCurrentVisibility()}
            onChange={(e) => handleVisibilityChange(e.target.checked)}
            color={activeTab === 0 ? "primary" : activeTab === 1 ? "error" : "success"}
            size={expanded ? 'medium' : 'small'}
          />
        </Box>
      </Box>

      {/* Expanded Controls */}
      <Collapse in={expanded}>
        <Divider sx={{ mx: 2 }} />
        <Box sx={{ p: 2.5, pt: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              {/* Taxi Routes Filters */}
              {activeTab === 0 && (
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
                        onClick={handleClearTaxiFilters}
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

                  {/* Taxi Statistics */}
                  {taxiStats && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Route Statistics
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                          label={`${taxiStats.uniqueOrigins} Origins`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${taxiStats.uniqueDestinations} Destinations`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${(taxiStats.averageLength * 111).toFixed(1)}km Avg`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Active Taxi Filters */}
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

              {/* Hospital Filters */}
              {activeTab === 1 && (
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
                        onClick={handleClearHospitalFilters}
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

                  {/* Hospital Statistics */}
                  {hospitalStats && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Healthcare Statistics:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption">
                          Total Facilities: {hospitalStats.totalHospitals}
                        </Typography>
                        <Typography variant="caption">
                          Types: {hospitalStats.uniqueClassifications}
                        </Typography>
                        <Typography variant="caption">
                          Districts: {hospitalStats.uniqueDistricts}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Legend */}
                  <Box sx={{ mb: 2 }}>
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

                  {/* Active Hospital Filters */}
                  {(classificationFilter || districtFilter) && (
                    <Box>
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

              {/* School Filters */}
              {activeTab === 2 && (
                <>
                  {/* School Type Filter */}
                  <Box sx={{ mb: 2 }}>
                    <Autocomplete
                      options={schoolTypes}
                      value={schoolTypeFilter}
                      onChange={(event, newValue) => onSchoolTypeFilterChange(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Filter by School Type"
                          size="small"
                          placeholder="Select school type"
                        />
                      )}
                      clearOnEscape
                    />
                  </Box>

                  {/* School District Filter */}
                  <Box sx={{ mb: 2 }}>
                    <Autocomplete
                      options={schoolDistricts}
                      value={schoolDistrictFilter}
                      onChange={(event, newValue) => onSchoolDistrictFilterChange(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Filter by District"
                          size="small"
                          placeholder="Select education district"
                        />
                      )}
                      clearOnEscape
                    />
                  </Box>

                  {/* School Medium Filter */}
                  <Box sx={{ mb: 2 }}>
                    <Autocomplete
                      options={schoolMediums}
                      value={schoolMediumFilter}
                      onChange={(event, newValue) => onSchoolMediumFilterChange(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Filter by Language"
                          size="small"
                          placeholder="Select instruction medium"
                        />
                      )}
                      clearOnEscape
                    />
                  </Box>

                  {/* Clear Filters Button */}
                  {(schoolTypeFilter || schoolDistrictFilter || schoolMediumFilter) && (
                    <Box sx={{ mb: 2 }}>
                      <IconButton
                        onClick={handleClearSchoolFilters}
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

                  {/* School Statistics */}
                  {schoolStats && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Education Statistics:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption">
                          Total Schools: {schoolStats.totalSchools}
                        </Typography>
                        <Typography variant="caption">
                          Types: {schoolStats.uniqueTypes}
                        </Typography>
                        <Typography variant="caption">
                          Districts: {schoolStats.uniqueDistricts}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Legend */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      School Types:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: '#2563eb',
                            borderRadius: '50%',
                            border: '1px solid white'
                          }}
                        />
                        <Typography variant="caption">Secondary Schools</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            backgroundColor: '#7c3aed',
                            borderRadius: '50%',
                            border: '1px solid white'
                          }}
                        />
                        <Typography variant="caption">Combined Schools</Typography>
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
                        <Typography variant="caption">Primary Schools</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            backgroundColor: '#ea580c',
                            borderRadius: '50%',
                            border: '1px solid white'
                          }}
                        />
                        <Typography variant="caption">Intermediate Schools</Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Active School Filters */}
                  {(schoolTypeFilter || schoolDistrictFilter || schoolMediumFilter) && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Active Filters:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {schoolTypeFilter && (
                          <Chip
                            label={`Type: ${schoolTypeFilter}`}
                            size="small"
                            onDelete={() => onSchoolTypeFilterChange(null)}
                            color="success"
                          />
                        )}
                        {schoolDistrictFilter && (
                          <Chip
                            label={`District: ${schoolDistrictFilter}`}
                            size="small"
                            onDelete={() => onSchoolDistrictFilterChange(null)}
                            color="secondary"
                          />
                        )}
                        {schoolMediumFilter && (
                          <Chip
                            label={`Language: ${schoolMediumFilter}`}
                            size="small"
                            onDelete={() => onSchoolMediumFilterChange(null)}
                            color="info"
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  )
}

export default UnifiedControl
