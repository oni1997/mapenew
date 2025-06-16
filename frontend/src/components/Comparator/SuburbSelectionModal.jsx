import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Box,
  Typography,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  DirectionsTransit as TransitIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { neighborhoodAPI } from '../../services/api'

const SuburbSelectionModal = ({ 
  open, 
  onClose, 
  onSelectSuburbs, 
  selectedNeighborhoods = [],
  maxSelections = 5 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [tempSelected, setTempSelected] = useState([])

  // Fetch all neighborhoods
  const { data: allNeighborhoods, isLoading } = useQuery(
    'all-neighborhoods-for-comparison',
    () => neighborhoodAPI.getAll({ limit: 50 }),
    {
      enabled: open,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Reset temp selection when modal opens
  useEffect(() => {
    if (open) {
      setTempSelected([])
      setSearchQuery('')
    }
  }, [open])

  const neighborhoods = allNeighborhoods?.data?.neighborhoods || []
  
  // Filter neighborhoods based on search and exclude already selected
  const filteredNeighborhoods = neighborhoods.filter(neighborhood => {
    const isAlreadySelected = selectedNeighborhoods.some(
      selected => selected._id === neighborhood._id
    )
    const matchesSearch = neighborhood.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         neighborhood.borough.toLowerCase().includes(searchQuery.toLowerCase())
    
    return !isAlreadySelected && matchesSearch
  })

  const handleToggleSelection = (neighborhood) => {
    setTempSelected(prev => {
      const isSelected = prev.some(n => n._id === neighborhood._id)
      if (isSelected) {
        return prev.filter(n => n._id !== neighborhood._id)
      } else {
        // Check if we're at the limit
        const totalSelected = selectedNeighborhoods.length + prev.length
        if (totalSelected >= maxSelections) {
          return prev // Don't add if at limit
        }
        return [...prev, neighborhood]
      }
    })
  }

  const handleConfirmSelection = () => {
    onSelectSuburbs(tempSelected)
    onClose()
  }

  const isNeighborhoodSelected = (neighborhood) => {
    return tempSelected.some(n => n._id === neighborhood._id)
  }

  const canSelectMore = selectedNeighborhoods.length + tempSelected.length < maxSelections

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Add Suburbs to Compare
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedNeighborhoods.length + tempSelected.length}/{maxSelections} selected
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search suburbs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />

        {/* Selected suburbs preview */}
        {tempSelected.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected for comparison:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tempSelected.map(neighborhood => (
                <Chip
                  key={neighborhood._id}
                  label={neighborhood.name}
                  onDelete={() => handleToggleSelection(neighborhood)}
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Neighborhoods list */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredNeighborhoods.length === 0 ? (
          <Alert severity="info">
            {searchQuery ? 'No suburbs found matching your search.' : 'No more suburbs available to add.'}
          </Alert>
        ) : (
          <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
            {filteredNeighborhoods.map((neighborhood) => (
              <ListItem key={neighborhood._id} disablePadding>
                <ListItemButton
                  onClick={() => handleToggleSelection(neighborhood)}
                  disabled={!canSelectMore && !isNeighborhoodSelected(neighborhood)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="subtitle1" fontWeight={500}>
                          {neighborhood.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          • {neighborhood.borough}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          {neighborhood.housing?.rentByBedroom?.oneBed && (
                            <Chip
                              label={`1-bed: R${neighborhood.housing.rentByBedroom.oneBed.avg?.toLocaleString()}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {neighborhood.housing?.rentByBedroom?.twoBed && (
                            <Chip
                              label={`2-bed: R${neighborhood.housing.rentByBedroom.twoBed.avg?.toLocaleString()}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {neighborhood.housing?.rentByBedroom?.threeBed && (
                            <Chip
                              label={`3-bed: R${neighborhood.housing.rentByBedroom.threeBed.avg?.toLocaleString()}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {neighborhood.safety?.safetyScore && (
                            <Chip
                              icon={<SecurityIcon />}
                              label={`${neighborhood.safety.safetyScore.toFixed(1)}`}
                              size="small"
                              color="success"
                            />
                          )}
                          {neighborhood.amenities?.transitScore && (
                            <Chip
                              icon={<TransitIcon />}
                              label={`${neighborhood.amenities.transitScore}`}
                              size="small"
                              color="info"
                            />
                          )}
                          <Chip
                            label={neighborhood.affordabilityCategory || 'Unknown'}
                            size="small"
                            color={
                              neighborhood.affordabilityCategory === 'Budget' ? 'success' :
                              neighborhood.affordabilityCategory === 'Affordable' ? 'success' :
                              neighborhood.affordabilityCategory === 'Moderate' ? 'info' :
                              neighborhood.affordabilityCategory === 'Expensive' ? 'warning' :
                              neighborhood.affordabilityCategory === 'Luxury' ? 'error' :
                              neighborhood.affordabilityCategory === 'Ultra-Luxury' ? 'error' : 'default'
                            }
                          />
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      checked={isNeighborhoodSelected(neighborhood)}
                      onChange={() => handleToggleSelection(neighborhood)}
                      disabled={!canSelectMore && !isNeighborhoodSelected(neighborhood)}
                    />
                  </ListItemSecondaryAction>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirmSelection}
          variant="contained"
          disabled={tempSelected.length === 0}
        >
          Add {tempSelected.length} Suburb{tempSelected.length !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SuburbSelectionModal
