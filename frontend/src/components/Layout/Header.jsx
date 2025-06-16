import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  LocationCity as LocationCityIcon,
  Compare as CompareIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'

import { searchAPI } from '../../services/api'
import { useAppStore } from '../../store/appStore'

const Header = ({ onSidebarToggle }) => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const { selectedNeighborhoods, clearSelectedNeighborhoods } = useAppStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  
  // Get autocomplete suggestions
  useQuery(
    ['autocomplete', searchQuery],
    () => searchAPI.autocomplete(searchQuery),
    {
      enabled: searchQuery.length > 2,
      onSuccess: (response) => {
        setSearchResults(response.data.suggestions || [])
      }
    }
  )

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explorer?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleSuggestionClick = (suggestion) => {
    navigate(`/explorer?neighborhood=${encodeURIComponent(suggestion.name)}`)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleCompareClick = () => {
    if (selectedNeighborhoods.length > 1) {
      navigate('/compare')
    }
  }

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          {/* Menu button */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo and title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <LocationCityIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              City Insights AI
            </Typography>
          </Box>

          {/* Search bar */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, maxWidth: 400, mr: 2 }}>
              <form onSubmit={handleSearchSubmit}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search neighborhoods..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'grey.50',
                      '&:hover': {
                        backgroundColor: 'grey.100',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                      },
                    },
                  }}
                />
              </form>
              
              {/* Search suggestions dropdown */}
              {searchResults.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    boxShadow: 2,
                    borderRadius: 1,
                    mt: 0.5,
                    zIndex: 1000,
                    maxHeight: 300,
                    overflow: 'auto'
                  }}
                >
                  {searchResults.map((suggestion, index) => (
                    <MenuItem
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{ py: 1 }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {suggestion.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {suggestion.borough}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Selected neighborhoods indicator */}
          {selectedNeighborhoods.length > 0 && (
            <Box sx={{ mr: 2 }}>
              <Chip
                icon={<CompareIcon />}
                label={`${selectedNeighborhoods.length} selected`}
                color="primary"
                variant="outlined"
                onClick={handleCompareClick}
                clickable={selectedNeighborhoods.length > 1}
                onDelete={clearSelectedNeighborhoods}
                size="small"
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </>
  )
}

export default Header
