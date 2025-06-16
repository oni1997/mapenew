import { useEffect, useRef, useState } from 'react'
import { hospitalsAPI } from '../../services/api'
import { importMapsLibrary } from '../../utils/googleMaps'
import { logger } from '../../utils/logger'

const HospitalMarkers = ({ 
  map, 
  visible = true,
  classificationFilter = null,
  districtFilter = null,
  onHospitalClick = null 
}) => {
  const markersRef = useRef([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null)
    })
    markersRef.current = []
  }

  // Fetch hospitals
  const fetchHospitals = async () => {
    if (!map) return

    setLoading(true)
    setError(null)

    try {
      const params = {
        format: 'google-maps',
        limit: 500 // Get more hospitals for comprehensive coverage
      }

      if (classificationFilter) {
        params.classification = classificationFilter
      }
      if (districtFilter) {
        params.district = districtFilter
      }

      const response = await hospitalsAPI.getAll(params)
      setHospitals(response.data.hospitals)
    } catch (err) {
      logger.error('Error fetching hospitals:', err)
      setError('Failed to load hospitals')
    } finally {
      setLoading(false)
    }
  }

  // Create markers on the map
  const createMarkers = async () => {
    if (!map || !hospitals.length || !visible) return

    try {
      // Load the Maps library dynamically
      await importMapsLibrary("maps")

      clearMarkers()

      hospitals.forEach(hospital => {
        if (!hospital.position) return

        const marker = new google.maps.Marker({
          position: hospital.position,
          map: map,
          title: hospital.name,
          icon: getHospitalIcon(hospital.classification),
          zIndex: getZIndexByClassification(hospital.classification)
        })

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(hospital)
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
          if (onHospitalClick) {
            onHospitalClick(hospital)
          }
        })

        // Store reference
        marker.infoWindow = infoWindow
        markersRef.current.push(marker)
      })

    } catch (err) {
      logger.error('Error creating hospital markers:', err)
      setError('Failed to display hospitals on map')
    }
  }

  // Get hospital icon based on classification
  const getHospitalIcon = (classification) => {
    const iconMap = {
      'Hospital': {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#dc2626',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 8
      },
      'Clinic': {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#059669',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 6
      },
      'CHC': {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 6
      }
    }

    return iconMap[classification] || iconMap['Clinic']
  }

  // Get z-index based on classification (hospitals on top)
  const getZIndexByClassification = (classification) => {
    const zIndexMap = {
      'Hospital': 300,
      'CHC': 200,
      'Clinic': 100
    }
    return zIndexMap[classification] || 100
  }

  // Create info window content
  const createInfoWindowContent = (hospital) => {
    return `
      <div style="padding: 12px; font-family: Arial, sans-serif; max-width: 300px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${hospital.name}</h3>
        <div style="margin-bottom: 8px;">
          <span style="background: ${getClassificationColor(hospital.classification)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
            ${hospital.classification}
          </span>
          ${hospital.status === 'Active' ? 
            '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 4px;">Active</span>' : 
            '<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 4px;">Inactive</span>'
          }
        </div>
        <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
          <strong>Location:</strong> ${hospital.town}, ${hospital.district}
        </p>
        ${hospital.contact ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
          <strong>Contact:</strong> ${hospital.contact}
        </p>` : ''}
        ${hospital.operatingHours?.hours && hospital.operatingHours?.days ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
          <strong>Hours:</strong> ${hospital.operatingHours.hours} (${hospital.operatingHours.days})
        </p>` : ''}
        ${hospital.email ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
          <strong>Email:</strong> ${hospital.email}
        </p>` : ''}
      </div>
    `
  }

  // Get classification color
  const getClassificationColor = (classification) => {
    const colorMap = {
      'Hospital': '#dc2626',
      'Clinic': '#059669',
      'CHC': '#2563eb'
    }
    return colorMap[classification] || '#059669'
  }

  // Fetch hospitals when filters change
  useEffect(() => {
    fetchHospitals()
  }, [map, classificationFilter, districtFilter])

  // Create markers when hospitals data changes
  useEffect(() => {
    if (visible) {
      createMarkers()
    } else {
      clearMarkers()
    }

    return () => {
      clearMarkers()
    }
  }, [map, hospitals, visible])

  // Return null as this is a map overlay component
  return null
}

export default HospitalMarkers
