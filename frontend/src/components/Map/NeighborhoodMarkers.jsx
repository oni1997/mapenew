import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import { importMapsLibrary } from '../../utils/googleMaps'

const NeighborhoodMarkers = ({ 
  map, 
  neighborhoods, 
  onNeighborhoodClick, 
  selectedNeighborhood 
}) => {
  const markersRef = useRef([])
  const { selectedNeighborhoods, addSelectedNeighborhood, removeSelectedNeighborhood } = useAppStore()

  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null)
    })
    markersRef.current = []
  }

  // Create custom marker icon
  const createMarkerIcon = (neighborhood, isSelected = false, isInComparison = false) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const size = isSelected ? 40 : 30
    
    canvas.width = size
    canvas.height = size

    // Determine color based on safety score
    let color = '#757575' // Default gray
    if (neighborhood.safety?.safetyScore) {
      const score = neighborhood.safety.safetyScore
      if (score >= 8) color = '#4caf50' // Green
      else if (score >= 6) color = '#ff9800' // Orange
      else color = '#f44336' // Red
    }

    // Draw circle
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, (size / 2) - 2, 0, 2 * Math.PI)
    ctx.fillStyle = isInComparison ? '#1976d2' : color
    ctx.fill()
    
    // Add border
    ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(0,0,0,0.3)'
    ctx.lineWidth = isSelected ? 3 : 1
    ctx.stroke()

    // Add inner circle for selected state
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, (size / 2) - 6, 0, 2 * Math.PI)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
    }

    // Add comparison indicator
    if (isInComparison) {
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, (size / 2) - 8, 0, 2 * Math.PI)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      
      // Add checkmark or number
      ctx.fillStyle = '#1976d2'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('✓', size / 2, size / 2)
    }

    return canvas.toDataURL()
  }

  // Create markers for neighborhoods
  useEffect(() => {
    const createMarkers = async () => {
      if (!map) return

      try {
        // Load the Maps library dynamically
        await importMapsLibrary("maps")

        clearMarkers()

        neighborhoods.forEach(neighborhood => {
          if (!neighborhood.coordinates) return

          const isInComparison = selectedNeighborhoods.some(n => n._id === neighborhood._id)
          const isSelected = selectedNeighborhood?._id === neighborhood._id

          const marker = new google.maps.Marker({
            position: {
              lat: neighborhood.coordinates.lat,
              lng: neighborhood.coordinates.lng
            },
            map: map,
            title: `${neighborhood.name}, ${neighborhood.borough}`,
            icon: {
              url: createMarkerIcon(neighborhood, isSelected, isInComparison),
              scaledSize: new google.maps.Size(
                isSelected ? 40 : 30,
                isSelected ? 40 : 30
              ),
              anchor: new google.maps.Point(
                isSelected ? 20 : 15,
                isSelected ? 20 : 15
              )
            },
            zIndex: isSelected ? 1000 : (isInComparison ? 100 : 1)
          })

          // Create info window
          const infoWindow = new google.maps.InfoWindow({
            content: createInfoWindowContent(neighborhood)
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
            if (onNeighborhoodClick) {
              onNeighborhoodClick(neighborhood)
            }
          })

          // Store reference
          marker.infoWindow = infoWindow
          markersRef.current.push(marker)
        })
      } catch (error) {
        console.error('Error creating markers:', error)
      }
    }

    createMarkers()

    return () => {
      clearMarkers()
    }
  }, [map, neighborhoods, selectedNeighborhood, selectedNeighborhoods])

  // Create info window content
  const createInfoWindowContent = (neighborhood) => {
    const isInComparison = selectedNeighborhoods.some(n => n._id === neighborhood._id)
    
    return `
      <div style="padding: 12px; min-width: 200px; font-family: 'Roboto', sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #333;">
              ${neighborhood.name}
            </h3>
            <p style="margin: 0; font-size: 14px; color: #666;">
              ${neighborhood.borough}
            </p>
          </div>
          <button 
            onclick="window.toggleNeighborhoodSelection('${neighborhood._id}')"
            style="
              background: ${isInComparison ? '#1976d2' : '#f5f5f5'};
              color: ${isInComparison ? 'white' : '#333'};
              border: none;
              border-radius: 4px;
              padding: 4px 8px;
              font-size: 12px;
              cursor: pointer;
              margin-left: 8px;
            "
          >
            ${isInComparison ? 'Remove' : 'Compare'}
          </button>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
          ${neighborhood.safety?.safetyScore ? `
            <span style="
              background: ${getSafetyColor(neighborhood.safety.safetyScore)};
              color: white;
              padding: 2px 6px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
            ">
              Safety: ${neighborhood.safety.safetyScore.toFixed(1)}/10
            </span>
          ` : ''}
          
          ${neighborhood.amenities?.transitScore ? `
            <span style="
              background: ${getTransitColor(neighborhood.amenities.transitScore)};
              color: white;
              padding: 2px 6px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
            ">
              Transit: ${neighborhood.amenities.transitScore}/100
            </span>
          ` : ''}
          
          ${neighborhood.housing?.avgRent ? `
            <span style="
              background: #ff9800;
              color: white;
              padding: 2px 6px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
            ">
              R${neighborhood.housing.avgRent.toLocaleString()}
            </span>
          ` : ''}
        </div>
        
        ${neighborhood.description ? `
          <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.4;">
            ${neighborhood.description}
          </p>
        ` : ''}
        
        ${neighborhood.tags && neighborhood.tags.length > 0 ? `
          <div style="margin-top: 8px;">
            ${neighborhood.tags.slice(0, 3).map(tag => `
              <span style="
                background: #e3f2fd;
                color: #1976d2;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 10px;
                margin-right: 4px;
                display: inline-block;
              ">
                ${tag}
              </span>
            `).join('')}
          </div>
        ` : ''}

        ${neighborhood.transport?.publicTransport ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
            <div style="font-size: 11px; color: #666; margin-bottom: 4px; font-weight: 600;">
              🚌 Public Transport:
            </div>
            <div style="font-size: 10px; color: #888;">
              ${neighborhood.transport.publicTransport.join(' • ')}
            </div>
            ${neighborhood.transport.uberAvg ? `
              <div style="font-size: 10px; color: #888; margin-top: 4px;">
                🚗 ${neighborhood.transport.uberAvg} min to city center
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `
  }

  // Helper functions for colors
  const getSafetyColor = (score) => {
    if (score >= 8) return '#4caf50'
    if (score >= 6) return '#ff9800'
    return '#f44336'
  }

  const getTransitColor = (score) => {
    if (score >= 80) return '#4caf50'
    if (score >= 60) return '#ff9800'
    return '#f44336'
  }

  // Global function for info window buttons
  useEffect(() => {
    window.toggleNeighborhoodSelection = (neighborhoodId) => {
      const neighborhood = neighborhoods.find(n => n._id === neighborhoodId)
      if (!neighborhood) return

      const isSelected = selectedNeighborhoods.some(n => n._id === neighborhoodId)
      if (isSelected) {
        removeSelectedNeighborhood(neighborhoodId)
      } else {
        addSelectedNeighborhood(neighborhood)
      }
    }

    return () => {
      delete window.toggleNeighborhoodSelection
    }
  }, [neighborhoods, selectedNeighborhoods, addSelectedNeighborhood, removeSelectedNeighborhood])

  return null // This component doesn't render anything directly
}

export default NeighborhoodMarkers
