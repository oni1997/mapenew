import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import { importMapsLibrary } from '../../utils/googleMaps'

const NeighborhoodPolygons = ({ 
  map, 
  neighborhoods, 
  onNeighborhoodClick, 
  selectedNeighborhood 
}) => {
  const polygonsRef = useRef([])
  const { selectedNeighborhoods, addSelectedNeighborhood, removeSelectedNeighborhood } = useAppStore()

  // Clear existing polygons
  const clearPolygons = () => {
    polygonsRef.current.forEach(polygon => {
      polygon.setMap(null)
    })
    polygonsRef.current = []
  }

  // Get affordability category from neighborhood data
  const getAffordabilityCategory = (neighborhood) => {
    if (neighborhood.affordabilityCategory) {
      return neighborhood.affordabilityCategory
    }

    // Calculate from rent if not available
    const rent = neighborhood.housing?.avgRent
    if (!rent) return 'Unknown'

    if (rent >= 50000) return 'Ultra-Luxury'
    if (rent >= 35000) return 'Luxury'
    if (rent >= 20000) return 'Expensive'
    if (rent >= 12000) return 'Moderate'
    if (rent >= 8000) return 'Affordable'
    return 'Budget'
  }

  // Get color based on affordability category
  const getAffordabilityColor = (category, isSelected = false, isInComparison = false) => {
    const colors = {
      'Budget': '#4caf50',        // Green
      'Affordable': '#00bcd4',    // Cyan
      'Moderate': '#2196f3',      // Blue
      'Expensive': '#ff9800',     // Orange
      'Luxury': '#f44336',        // Red
      'Ultra-Luxury': '#9c27b0',  // Purple
      'Unknown': '#9e9e9e'        // Grey
    }

    let baseColor = colors[category] || colors['Unknown']
    
    // Adjust opacity and stroke for selection states
    if (isSelected) {
      return {
        fillColor: baseColor,
        fillOpacity: 0.8,
        strokeColor: '#000000',
        strokeWeight: 4,
        strokeOpacity: 1
      }
    } else if (isInComparison) {
      return {
        fillColor: baseColor,
        fillOpacity: 0.6,
        strokeColor: '#1976d2',
        strokeWeight: 3,
        strokeOpacity: 1
      }
    } else {
      return {
        fillColor: baseColor,
        fillOpacity: 0.4,
        strokeColor: baseColor,
        strokeWeight: 2,
        strokeOpacity: 0.8
      }
    }
  }

  // Create info window content
  const createInfoWindowContent = (neighborhood) => {
    const affordabilityCategory = neighborhood.affordabilityCategory || 'Unknown'
    const avgRent = neighborhood.housing?.avgRent
    const safetyScore = neighborhood.safety?.safetyScore
    const transitScore = neighborhood.amenities?.transitScore

    return `
      <div style="padding: 12px; min-width: 250px; font-family: 'Roboto', sans-serif;">
        <h3 style="margin: 0 0 8px 0; color: #1976d2; font-size: 16px; font-weight: 600;">
          ${neighborhood.name}
        </h3>
        <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">
          ${neighborhood.borough}
        </p>
        
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
          <span style="background: ${getAffordabilityColor(affordabilityCategory).fillColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
            ${affordabilityCategory}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
          ${avgRent ? `
            <div>
              <strong>Avg Rent:</strong><br>
              R${avgRent.toLocaleString()}/month
            </div>
          ` : ''}
          ${safetyScore ? `
            <div>
              <strong>Safety:</strong><br>
              ${safetyScore.toFixed(1)}/10
            </div>
          ` : ''}
          ${transitScore ? `
            <div>
              <strong>Transit:</strong><br>
              ${transitScore}/100
            </div>
          ` : ''}
          <div>
            <strong>Population:</strong><br>
            ${neighborhood.demographics?.population?.toLocaleString() || 'N/A'}
          </div>
        </div>

        ${neighborhood.transport?.publicTransport ? `
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee;">
            <div style="font-size: 12px; color: #666; margin-bottom: 4px; font-weight: 600;">
              🚌 Public Transport:
            </div>
            <div style="font-size: 11px; color: #888;">
              ${neighborhood.transport.publicTransport.join(' • ')}
            </div>
            ${neighborhood.transport.uberAvg ? `
              <div style="font-size: 11px; color: #888; margin-top: 4px;">
                🚗 ${neighborhood.transport.uberAvg} min to city center
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee;">
          <button
            onclick="window.addToComparison && window.addToComparison('${neighborhood._id}')"
            style="background: #1976d2; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;"
          >
            ${selectedNeighborhoods.some(n => n._id === neighborhood._id) ? 'Remove from Comparison' : 'Add to Comparison'}
          </button>
        </div>
      </div>
    `
  }

  // Generate sample polygon coordinates around the center point
  const generateSampleBoundary = (center, radiusKm = 1) => {
    const points = 8 // Number of points for the polygon
    const coordinates = []
    
    // Convert radius from km to degrees (rough approximation)
    const radiusLat = radiusKm / 111 // 1 degree lat ≈ 111 km
    const radiusLng = radiusKm / (111 * Math.cos(center.lat * Math.PI / 180))
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI
      const lat = center.lat + radiusLat * Math.sin(angle) * (0.5 + Math.random() * 0.5)
      const lng = center.lng + radiusLng * Math.cos(angle) * (0.5 + Math.random() * 0.5)
      coordinates.push({ lat, lng })
    }
    
    // Close the polygon by adding the first point at the end
    coordinates.push(coordinates[0])
    
    return coordinates
  }

  // Create polygons for neighborhoods
  useEffect(() => {
    const createPolygons = async () => {
      if (!map) return

      try {
        // Load the Maps library dynamically
        await importMapsLibrary("maps")

        clearPolygons()

        // Set up global function for info window buttons
        window.addToComparison = (neighborhoodId) => {
          const neighborhood = neighborhoods.find(n => n._id === neighborhoodId)
          if (!neighborhood) return

          const isInComparison = selectedNeighborhoods.some(n => n._id === neighborhood._id)
          if (isInComparison) {
            removeSelectedNeighborhood(neighborhood._id)
          } else {
            addSelectedNeighborhood(neighborhood)
          }
        }

        neighborhoods.forEach(neighborhood => {
          if (!neighborhood.coordinates) return

          const isInComparison = selectedNeighborhoods.some(n => n._id === neighborhood._id)
          const isSelected = selectedNeighborhood?._id === neighborhood._id
          const affordabilityCategory = getAffordabilityCategory(neighborhood)

          // Use boundary data if available, otherwise generate sample boundary
          let polygonCoords
          if (neighborhood.boundary?.coordinates?.[0]) {
            // Convert GeoJSON coordinates [lng, lat] to Google Maps format {lat, lng}
            polygonCoords = neighborhood.boundary.coordinates[0].map(coord => ({
              lat: coord[1],
              lng: coord[0]
            }))
          } else {
            // Generate sample boundary around the center point
            polygonCoords = generateSampleBoundary(neighborhood.coordinates, 0.8)
          }

          const polygon = new google.maps.Polygon({
            paths: polygonCoords,
            ...getAffordabilityColor(affordabilityCategory, isSelected, isInComparison),
            map: map,
            clickable: true,
            zIndex: isSelected ? 1000 : (isInComparison ? 100 : 1)
          })

          // Create info window
          const infoWindow = new google.maps.InfoWindow({
            content: createInfoWindowContent(neighborhood)
          })

          // Add click listener
          polygon.addListener('click', (event) => {
            // Close other info windows
            polygonsRef.current.forEach(p => {
              if (p.infoWindow) {
                p.infoWindow.close()
              }
            })

            // Open this info window at click position
            infoWindow.setPosition(event.latLng)
            infoWindow.open(map)

            // Notify parent component
            if (onNeighborhoodClick) {
              onNeighborhoodClick(neighborhood)
            }
          })

          // Add hover effects
          polygon.addListener('mouseover', () => {
            const hoverStyle = getAffordabilityColor(affordabilityCategory, isSelected, isInComparison)
            polygon.setOptions({
              ...hoverStyle,
              fillOpacity: Math.min(hoverStyle.fillOpacity + 0.2, 1),
              strokeWeight: hoverStyle.strokeWeight + 1
            })
          })

          polygon.addListener('mouseout', () => {
            polygon.setOptions(getAffordabilityColor(affordabilityCategory, isSelected, isInComparison))
          })

          // Store reference
          polygon.infoWindow = infoWindow
          polygonsRef.current.push(polygon)
        })
      } catch (error) {
        console.error('Error creating polygons:', error)
      }
    }

    createPolygons()

    return () => {
      clearPolygons()
      // Clean up global function
      if (window.addToComparison) {
        delete window.addToComparison
      }
    }
  }, [map, neighborhoods, selectedNeighborhood, selectedNeighborhoods, addSelectedNeighborhood, removeSelectedNeighborhood])

  return null // This component doesn't render anything directly
}

export default NeighborhoodPolygons
