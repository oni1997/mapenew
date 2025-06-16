import React, { useEffect, useRef, useState } from 'react'
import { Box, Paper, Typography, Chip, IconButton, Tooltip, useTheme, useMediaQuery } from '@mui/material'
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  MyLocation as MyLocationIcon,
  Layers as LayersIcon
} from '@mui/icons-material'

import { useAppStore } from '../../store/appStore'
import NeighborhoodMarkers from './NeighborhoodMarkers'
import NeighborhoodPolygons from './NeighborhoodPolygons'
import TaxiRoutes from './TaxiRoutes'
import HospitalMarkers from './HospitalMarkers'
import SchoolMarkers from './SchoolMarkers'
import UnifiedControl from './UnifiedControl'
import { importMapsLibrary } from '../../utils/googleMaps'

const MapContainer = ({ neighborhoods = [], height = '100%' }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null)
  const [showPolygons, setShowPolygons] = useState(true) // Default to polygons

  // Taxi routes state
  const [showTaxiRoutes, setShowTaxiRoutes] = useState(false)
  const [taxiOriginFilter, setTaxiOriginFilter] = useState(null)
  const [taxiDestinationFilter, setTaxiDestinationFilter] = useState(null)

  // Hospitals state
  const [showHospitals, setShowHospitals] = useState(false)
  const [hospitalClassificationFilter, setHospitalClassificationFilter] = useState(null)
  const [hospitalDistrictFilter, setHospitalDistrictFilter] = useState(null)

  // Schools state
  const [showSchools, setShowSchools] = useState(false)
  const [schoolTypeFilter, setSchoolTypeFilter] = useState(null)
  const [schoolDistrictFilter, setSchoolDistrictFilter] = useState(null)
  const [schoolMediumFilter, setSchoolMediumFilter] = useState(null)

  const { mapCenter, mapZoom, setMapCenter, setMapZoom } = useAppStore()

  // Initialize Google Map with dynamic library import
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return

      try {
        // Load the Maps library dynamically
        const { Map } = await importMapsLibrary("maps")

        const map = new Map(mapRef.current, {
          center: mapCenter,
          zoom: mapZoom,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false
        })

        mapInstanceRef.current = map
        setMapLoaded(true)

        // Listen for map changes
        map.addListener('center_changed', () => {
          const center = map.getCenter()
          setMapCenter({
            lat: center.lat(),
            lng: center.lng()
          })
        })

        map.addListener('zoom_changed', () => {
          setMapZoom(map.getZoom())
        })

      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(mapInstanceRef.current)
      }
    }
  }, [])

  // Update map when neighborhoods change
  useEffect(() => {
    const updateBounds = async () => {
      if (!mapInstanceRef.current || !neighborhoods.length) return

      try {
        // Load the Maps library to access LatLngBounds
        await importMapsLibrary("maps")

        // Fit bounds to show all neighborhoods
        const bounds = new google.maps.LatLngBounds()
        neighborhoods.forEach(neighborhood => {
          if (neighborhood.coordinates) {
            bounds.extend({
              lat: neighborhood.coordinates.lat,
              lng: neighborhood.coordinates.lng
            })
          }
        })

        if (!bounds.isEmpty()) {
          mapInstanceRef.current.fitBounds(bounds)
          // Add some padding
          const padding = { top: 50, right: 50, bottom: 50, left: 50 }
          mapInstanceRef.current.fitBounds(bounds, padding)
        }
      } catch (error) {
        console.error('Error updating map bounds:', error)
      }
    }

    updateBounds()
  }, [neighborhoods])

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom()
      mapInstanceRef.current.setZoom(currentZoom + 1)
    }
  }

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom()
      mapInstanceRef.current.setZoom(currentZoom - 1)
    }
  }

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(mapCenter)
      mapInstanceRef.current.setZoom(11)
    }
  }

  const handleNeighborhoodClick = (neighborhood) => {
    setSelectedNeighborhood(neighborhood)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({
        lat: neighborhood.coordinates.lat,
        lng: neighborhood.coordinates.lng
      })
      mapInstanceRef.current.setZoom(14)
    }
  }

  const handleTaxiRouteClick = (route, event) => {
    // Create info window for taxi route
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; font-family: 'Roboto', sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #1976d2; font-size: 16px;">
            Taxi Route
          </h3>
          <p style="margin: 0 0 4px 0; font-size: 14px;">
            <strong>From:</strong> ${route.origin}
          </p>
          <p style="margin: 0 0 4px 0; font-size: 14px;">
            <strong>To:</strong> ${route.destination}
          </p>
          <p style="margin: 0; font-size: 14px;">
            <strong>Distance:</strong> ${(route.distance * 111).toFixed(1)} km
          </p>
        </div>
      `,
      position: event.latLng
    })

    infoWindow.open(mapInstanceRef.current)
  }

  const handleHospitalClick = (hospital) => {
    console.log('Hospital clicked:', hospital)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(hospital.position)
      mapInstanceRef.current.setZoom(15)
    }
  }

  const handleSchoolClick = (school) => {
    console.log('School clicked:', school)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(school.position)
      mapInstanceRef.current.setZoom(15)
    }
  }

  const getScoreColor = (score, max = 10) => {
    const percentage = score / max
    if (percentage >= 0.8) return '#4caf50' // Green
    if (percentage >= 0.6) return '#ff9800' // Orange
    return '#f44336' // Red
  }

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px'
        }}
      />

      {/* Map Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1000
        }}
      >
        <Paper sx={{ p: 0.5 }}>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={handleZoomIn}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
        </Paper>
        <Paper sx={{ p: 0.5 }}>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={handleZoomOut}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
        </Paper>
        <Paper sx={{ p: 0.5 }}>
          <Tooltip title="Recenter">
            <IconButton size="small" onClick={handleRecenter}>
              <MyLocationIcon />
            </IconButton>
          </Tooltip>
        </Paper>
        <Paper sx={{ p: 0.5 }}>
          <Tooltip title={showPolygons ? "Show Markers" : "Show Boundaries"}>
            <IconButton
              size="small"
              onClick={() => setShowPolygons(!showPolygons)}
              sx={{
                backgroundColor: showPolygons ? 'primary.main' : 'inherit',
                color: showPolygons ? 'white' : 'inherit',
                '&:hover': {
                  backgroundColor: showPolygons ? 'primary.dark' : 'grey.100'
                }
              }}
            >
              <LayersIcon />
            </IconButton>
          </Tooltip>
        </Paper>
      </Box>

      {/* Neighborhood Info Panel */}
      {selectedNeighborhood && (
        <Paper
          sx={{
            position: 'absolute',
            bottom: { xs: showPolygons ? 140 : 16, sm: 16 }, // More space on mobile when legend is shown
            left: { xs: 8, sm: 16 },
            right: { xs: 8, sm: showPolygons ? 240 : 16 }, // Leave space for affordability legend
            p: { xs: 1.5, sm: 2 },
            maxWidth: { xs: 'none', sm: 400 },
            mx: 'auto',
            zIndex: 1000
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {selectedNeighborhood.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedNeighborhood.borough}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setSelectedNeighborhood(null)}
            >
              ×
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            {selectedNeighborhood.safety?.safetyScore && (
              <Chip
                label={`Safety: ${selectedNeighborhood.safety.safetyScore.toFixed(1)}/10`}
                size="small"
                sx={{ 
                  backgroundColor: getScoreColor(selectedNeighborhood.safety.safetyScore),
                  color: 'white'
                }}
              />
            )}
            {selectedNeighborhood.amenities?.transitScore && (
              <Chip
                label={`Transit: ${selectedNeighborhood.amenities.transitScore}/100`}
                size="small"
                sx={{ 
                  backgroundColor: getScoreColor(selectedNeighborhood.amenities.transitScore, 100),
                  color: 'white'
                }}
              />
            )}
            {selectedNeighborhood.housing?.avgRent && (
              <Chip
                label={`Rent: R${selectedNeighborhood.housing.avgRent.toLocaleString()}`}
                size="small"
                color="info"
              />
            )}
          </Box>

          {selectedNeighborhood.description && (
            <Typography variant="body2" color="text.secondary">
              {selectedNeighborhood.description}
            </Typography>
          )}
        </Paper>
      )}

      {/* Affordability Legend */}
      {showPolygons && (
        <Paper
          elevation={2}
          sx={{
            position: 'absolute',
            bottom: { xs: 80, sm: 16 }, // Move up on mobile to avoid overlap
            right: { xs: 8, sm: 16 },
            left: { xs: 8, sm: 'auto' }, // Full width on mobile
            p: 1.5,
            minWidth: { xs: 'auto', sm: 180 },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.1)',
            zIndex: 998 // Lower than UnifiedControl
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
            Affordability Categories
          </Typography>

          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'column' },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: { xs: 1, sm: 0.5 },
            justifyContent: { xs: 'space-between', sm: 'flex-start' }
          }}>
            {[
              { category: 'Budget', color: '#4caf50', range: '< R8,000' },
              { category: 'Affordable', color: '#00bcd4', range: 'R8,000 - R12,000' },
              { category: 'Moderate', color: '#2196f3', range: 'R12,000 - R20,000' },
              { category: 'Expensive', color: '#ff9800', range: 'R20,000 - R35,000' },
              { category: 'Luxury', color: '#f44336', range: 'R35,000 - R50,000' },
              { category: 'Ultra-Luxury', color: '#9c27b0', range: '> R50,000' }
            ].map(({ category, color, range }) => (
              <Box key={category} sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 1 },
                minWidth: { xs: 'calc(50% - 4px)', sm: 'auto' },
                mb: { xs: 0.5, sm: 0 }
              }}>
                <Box
                  sx={{
                    width: { xs: 8, sm: 12 },
                    height: { xs: 8, sm: 12 },
                    backgroundColor: color,
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    flexShrink: 0
                  }}
                />
                <Typography variant="caption" sx={{
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: { xs: 'nowrap', sm: 'normal' }
                }}>
                  <strong>{category}</strong> {!isMobile && range}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Unified Transport, Healthcare & Education Control */}
      {mapLoaded && (
        <UnifiedControl
          // Taxi Routes Props
          taxiVisible={showTaxiRoutes}
          onTaxiVisibilityChange={setShowTaxiRoutes}
          originFilter={taxiOriginFilter}
          destinationFilter={taxiDestinationFilter}
          onOriginFilterChange={setTaxiOriginFilter}
          onDestinationFilterChange={setTaxiDestinationFilter}
          // Hospitals Props
          hospitalsVisible={showHospitals}
          onHospitalsVisibilityChange={setShowHospitals}
          classificationFilter={hospitalClassificationFilter}
          districtFilter={hospitalDistrictFilter}
          onClassificationFilterChange={setHospitalClassificationFilter}
          onDistrictFilterChange={setHospitalDistrictFilter}
          // Schools Props
          schoolsVisible={showSchools}
          onSchoolsVisibilityChange={setShowSchools}
          schoolTypeFilter={schoolTypeFilter}
          schoolDistrictFilter={schoolDistrictFilter}
          schoolMediumFilter={schoolMediumFilter}
          onSchoolTypeFilterChange={setSchoolTypeFilter}
          onSchoolDistrictFilterChange={setSchoolDistrictFilter}
          onSchoolMediumFilterChange={setSchoolMediumFilter}
        />
      )}

      {/* Neighborhood Visualization */}
      {mapLoaded && mapInstanceRef.current && (
        <>
          {showPolygons ? (
            <NeighborhoodPolygons
              map={mapInstanceRef.current}
              neighborhoods={neighborhoods}
              onNeighborhoodClick={handleNeighborhoodClick}
              selectedNeighborhood={selectedNeighborhood}
            />
          ) : (
            <NeighborhoodMarkers
              map={mapInstanceRef.current}
              neighborhoods={neighborhoods}
              onNeighborhoodClick={handleNeighborhoodClick}
              selectedNeighborhood={selectedNeighborhood}
            />
          )}

          {/* Taxi Routes Overlay */}
          <TaxiRoutes
            map={mapInstanceRef.current}
            visible={showTaxiRoutes}
            originFilter={taxiOriginFilter}
            destinationFilter={taxiDestinationFilter}
            onRouteClick={handleTaxiRouteClick}
          />

          {/* Hospital Markers Overlay */}
          <HospitalMarkers
            map={mapInstanceRef.current}
            visible={showHospitals}
            classificationFilter={hospitalClassificationFilter}
            districtFilter={hospitalDistrictFilter}
            onHospitalClick={handleHospitalClick}
          />

          {/* School Markers Overlay */}
          <SchoolMarkers
            map={mapInstanceRef.current}
            visible={showSchools}
            typeFilter={schoolTypeFilter}
            districtFilter={schoolDistrictFilter}
            mediumFilter={schoolMediumFilter}
            onSchoolClick={handleSchoolClick}
          />
        </>
      )}

      {/* Loading State */}
      {!mapLoaded && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)'
          }}
        >
          <Typography>Loading map...</Typography>
        </Box>
      )}
    </Box>
  )
}

export default MapContainer
