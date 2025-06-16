import { useEffect, useRef, useState } from 'react'
import { taxiRoutesAPI } from '../../services/api'
import { logger } from '../../utils/logger'

const TaxiRoutes = ({ 
  map, 
  visible = true, 
  originFilter = null, 
  destinationFilter = null,
  onRouteClick = null 
}) => {
  const polylinesRef = useRef([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Clear existing polylines
  const clearPolylines = () => {
    polylinesRef.current.forEach(polyline => {
      polyline.setMap(null)
    })
    polylinesRef.current = []
  }

  // Fetch taxi routes
  const fetchRoutes = async () => {
    if (!map) return

    setLoading(true)
    setError(null)

    try {
      const params = {
        format: 'google-maps',
        limit: 200 // Limit for performance
      }

      if (originFilter) {
        params.origin = originFilter
      }
      if (destinationFilter) {
        params.destination = destinationFilter
      }

      const response = await taxiRoutesAPI.getAll(params)
      setRoutes(response.data.routes)
    } catch (err) {
      logger.error('Error fetching taxi routes:', err)
      setError('Failed to load taxi routes')
    } finally {
      setLoading(false)
    }
  }

  // Create polylines on the map
  const createPolylines = async () => {
    if (!map || !routes.length || !visible) return

    try {
      // Clear existing polylines
      clearPolylines()

      // Import Google Maps Polyline
      const { Polyline } = await google.maps.importLibrary("maps")

      routes.forEach(route => {
        const polyline = new Polyline({
          path: route.path,
          geodesic: true,
          strokeColor: route.strokeColor,
          strokeOpacity: route.strokeOpacity || 0.8,
          strokeWeight: route.strokeWeight || 3,
          clickable: true
        })

        polyline.setMap(map)

        // Add click listener if callback provided
        if (onRouteClick) {
          polyline.addListener('click', (event) => {
            onRouteClick(route, event)
          })
        }

        // Add info window on hover
        const infoWindow = new google.maps.InfoWindow()
        
        polyline.addListener('mouseover', (event) => {
          infoWindow.setContent(`
            <div style="padding: 8px; font-family: Arial, sans-serif;">
              <strong>${route.origin} → ${route.destination}</strong><br>
              <small>Distance: ${(route.distance * 111).toFixed(1)} km</small>
            </div>
          `)
          infoWindow.setPosition(event.latLng)
          infoWindow.open(map)
        })

        polyline.addListener('mouseout', () => {
          infoWindow.close()
        })

        polylinesRef.current.push(polyline)
      })

    } catch (err) {
      logger.error('Error creating polylines:', err)
      setError('Failed to display routes on map')
    }
  }

  // Fetch routes when filters change
  useEffect(() => {
    fetchRoutes()
  }, [map, originFilter, destinationFilter])

  // Create/update polylines when routes or visibility changes
  useEffect(() => {
    if (visible) {
      createPolylines()
    } else {
      clearPolylines()
    }

    // Cleanup on unmount
    return () => {
      clearPolylines()
    }
  }, [routes, visible, map])

  // Return null as this is a map overlay component
  return null
}

export default TaxiRoutes
