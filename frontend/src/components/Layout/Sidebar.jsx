import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Explore as ExploreIcon,
  Compare as CompareIcon,
  Chat as ChatIcon,
  TrendingUp as TrendingUpIcon,
  Map as MapIcon,
  Analytics as AnalyticsIcon,
  Favorite as FavoriteIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  Home as HomeIcon
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

import { useAppStore } from '../../store/appStore'
import useFavoritesStore from '../../store/favoritesStore'

const DRAWER_WIDTH = 240

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    description: 'Overview and insights'
  },
  {
    text: 'Explorer',
    icon: <ExploreIcon />,
    path: '/explorer',
    description: 'Discover neighborhoods'
  },
  {
    text: 'Rentals',
    icon: <HomeIcon />,
    path: '/rentals',
    description: 'Find rental properties',
    badge: 'NEW'
  },
  {
    text: 'Compare',
    icon: <CompareIcon />,
    path: '/compare',
    description: 'Side-by-side analysis'
  },
  {
    text: 'AI Chat',
    icon: <ChatIcon />,
    path: '/chat',
    description: 'Ask questions',
    badge: 'AI'
  },
  {
    text: 'Market Insights',
    icon: <TrendingUpIcon />,
    path: '/insights',
    description: 'AI market analysis'
  },
  {
    text: 'Favorites',
    icon: <FavoriteIcon />,
    path: '/favorites',
    description: 'Saved properties & areas'
  }
]

const secondaryItems = [
  {
    text: 'Help & Support',
    icon: <HelpIcon />,
    path: '/help'
  },
  {
    text: 'About',
    icon: <InfoIcon />,
    path: '/about'
  }
]

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const { selectedNeighborhoods } = useAppStore()
  const { getFavoritesCount } = useFavoritesStore()
  const favoritesCount = getFavoritesCount()

  const handleItemClick = (path) => {
    navigate(path)
    if (isMobile) {
      onClose()
    }
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header space */}
      <Box sx={{ height: 64 }} />
      
      {/* Main navigation */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
          Navigation
        </Typography>
      </Box>
      
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleItemClick(item.path)}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive(item.path) ? 'white' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                secondary={item.description}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 600 : 500,
                  fontSize: '0.9rem',
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                  color: isActive(item.path) ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                }}
              />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  color="secondary"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
              {item.path === '/favorites' && favoritesCount.total > 0 && (
                <Chip
                  label={favoritesCount.total}
                  size="small"
                  color="error"
                  sx={{ height: 20, fontSize: '0.7rem', ml: 0.5 }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Selected neighborhoods section */}
      {selectedNeighborhoods.length > 0 && (
        <>
          <Divider sx={{ mx: 2, my: 2 }} />
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
              Selected ({selectedNeighborhoods.length})
            </Typography>
          </Box>
          <List sx={{ px: 1, maxHeight: 200, overflow: 'auto' }}>
            {selectedNeighborhoods.map((neighborhood) => (
              <ListItem key={neighborhood._id} disablePadding>
                <ListItemButton
                  onClick={() => handleItemClick(`/explorer?neighborhood=${neighborhood.name}`)}
                  sx={{
                    borderRadius: 1,
                    py: 0.5,
                    '&:hover': {
                      backgroundColor: 'grey.50',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <MapIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={neighborhood.name}
                    secondary={neighborhood.borough}
                    primaryTypographyProps={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.7rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Spacer */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Secondary navigation */}
      <Divider sx={{ mx: 2 }} />
      <List sx={{ px: 1, py: 1 }}>
        {secondaryItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleItemClick(item.path)}
              sx={{
                borderRadius: 1,
                py: 1,
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          City Insights AI v1.0
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          MongoDB Track Hackathon
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default Sidebar
