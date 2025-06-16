import { useEffect, useRef, useState } from 'react'
import { schoolsAPI } from '../../services/api'
import { importMapsLibrary } from '../../utils/googleMaps'
import { logger } from '../../utils/logger'

const SchoolMarkers = ({ 
  map, 
  visible = true,
  typeFilter = null,
  districtFilter = null,
  mediumFilter = null,
  onSchoolClick = null 
}) => {
  const markersRef = useRef([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null)
    })
    markersRef.current = []
  }

  // Fetch schools
  const fetchSchools = async () => {
    if (!map) return

    setLoading(true)
    setError(null)

    try {
      const params = {
        format: 'google-maps',
        limit: 500 // Get more schools for comprehensive coverage
      }

      if (typeFilter) {
        params.type = typeFilter
      }
      if (districtFilter) {
        params.district = districtFilter
      }
      if (mediumFilter) {
        params.medium = mediumFilter
      }

      const response = await schoolsAPI.getAll(params)
      setSchools(response.data.schools)
    } catch (err) {
      logger.error('Error fetching schools:', err)
      setError('Failed to load schools')
    } finally {
      setLoading(false)
    }
  }

  // Create markers on the map
  const createMarkers = async () => {
    if (!map || !schools.length || !visible) return

    try {
      // Load the Maps library dynamically
      await importMapsLibrary("maps")

      clearMarkers()

      schools.forEach(school => {
        if (!school.position) return

        const marker = new google.maps.Marker({
          position: school.position,
          map: map,
          title: school.name,
          icon: getSchoolIcon(school.type),
          zIndex: getZIndexByType(school.type)
        })

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(school)
        })

        // Add click listener
        marker.addListener('click', () => {
          // Close other info windows
          markersRef.current.forEach(m => {
            if (m.infoWindow) {
              m.infoWindow.close()
            }
          })

          // Open this info window
          infoWindow.open(map, marker)

          // Notify parent component
          if (onSchoolClick) {
            onSchoolClick(school)
          }
        })

        // Store reference
        marker.infoWindow = infoWindow
        markersRef.current.push(marker)
      })

    } catch (err) {
      logger.error('Error creating school markers:', err)
      setError('Failed to display schools on map')
    }
  }

  // Get school icon based on type
  const getSchoolIcon = (schoolType) => {
    const iconMap = {
      'Primary School': {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#059669',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 6
      },
      'Secondary School': {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 8
      },
      'Combined School': {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#7c3aed',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 7
      },
      'Intermediate School': {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#ea580c',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 7
      }
    }

    return iconMap[schoolType] || iconMap['Primary School']
  }

  // Get z-index based on type (secondary schools on top)
  const getZIndexByType = (schoolType) => {
    const zIndexMap = {
      'Secondary School': 300,
      'Combined School': 250,
      'Intermediate School': 200,
      'Primary School': 100
    }
    return zIndexMap[schoolType] || 100
  }

  // Create info window content
  const createInfoWindowContent = (school) => {
    return `
      <div style="padding: 12px; font-family: Arial, sans-serif; max-width: 300px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${school.name}</h3>
        <div style="margin-bottom: 8px;">
          <span style="background: ${getTypeColor(school.type)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
            ${school.type}
          </span>
          ${school.status === 'Operational' ? 
            '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 4px;">Active</span>' : 
            '<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 4px;">Inactive</span>'
          }
        </div>
        <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
          <strong>District:</strong> ${school.district}
        </p>
        ${school.circuit ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
          <strong>Circuit:</strong> ${school.circuit}
        </p>` : ''}
        <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
          <strong>Sector:</strong> ${school.sector}
        </p>
        <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
          <strong>Language:</strong> ${school.medium}
        </p>
        ${school.id ? `<p style="margin: 4px 0; color: #6b7280; font-size: 12px;">
          <strong>EMIS:</strong> ${school.id}
        </p>` : ''}
      </div>
    `
  }

  // Get type color
  const getTypeColor = (schoolType) => {
    const colorMap = {
      'Primary School': '#059669',
      'Secondary School': '#2563eb',
      'Combined School': '#7c3aed',
      'Intermediate School': '#ea580c'
    }
    return colorMap[schoolType] || '#059669'
  }

  // Fetch schools when filters change
  useEffect(() => {
    fetchSchools()
  }, [map, typeFilter, districtFilter, mediumFilter])

  // Create markers when schools data changes
  useEffect(() => {
    if (visible) {
      createMarkers()
    } else {
      clearMarkers()
    }

    return () => {
      clearMarkers()
    }
  }, [map, schools, visible])

  // Return null as this is a map overlay component
  return null
}

export default SchoolMarkers
