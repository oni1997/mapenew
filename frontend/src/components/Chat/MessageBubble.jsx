import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Person as PersonIcon,
  SmartToy as BotIcon,
  ContentCopy as CopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  DirectionsTransit as TransitIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

import { useAppStore } from '../../store/appStore'

const MessageBubble = ({ message }) => {
  const navigate = useNavigate()
  const { addSelectedNeighborhood } = useAppStore()
  
  const isUser = message.role === 'user'
  const isError = message.isError

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content)
  }

  const handleNeighborhoodClick = (neighborhood) => {
    addSelectedNeighborhood(neighborhood)
    navigate('/explorer')
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    return format(new Date(timestamp), 'HH:mm')
  }

  const renderNeighborhoodCards = (neighborhoods) => {
    if (!neighborhoods || neighborhoods.length === 0) return null

    return (
      <Box sx={{
        mt: 2,
        p: 2,
        backgroundColor: 'grey.50',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 2 }}>
          📍 Relevant neighborhoods:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {neighborhoods.slice(0, 3).map((neighborhood, index) => (
            <Card
              key={index}
              variant="outlined"
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'translateY(-1px)',
                  boxShadow: 2
                }
              }}
              onClick={() => handleNeighborhoodClick(neighborhood)}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                      {neighborhood.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {neighborhood.borough}
                    </Typography>
                  </Box>
                  <IconButton size="small" color="primary">
                    <LocationIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {neighborhood.safety?.safetyScore && (
                    <Chip
                      icon={<SecurityIcon />}
                      label={`Safety: ${neighborhood.safety.safetyScore.toFixed(1)}/10`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {neighborhood.amenities?.transitScore && (
                    <Chip
                      icon={<TransitIcon />}
                      label={`Transit: ${neighborhood.amenities.transitScore}/100`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  )}
                  {neighborhood.housing?.avgRent && (
                    <Chip
                      icon={<MoneyIcon />}
                      label={`R${neighborhood.housing.avgRent.toLocaleString()}/mo`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        alignItems: 'flex-start',
        gap: 1
      }}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: isError ? 'error.main' : 'primary.main'
          }}
        >
          <BotIcon fontSize="small" />
        </Avatar>
      )}

      {/* Message Content */}
      <Box sx={{ maxWidth: '70%', minWidth: '200px' }}>
        <Paper
          sx={{
            p: 2,
            backgroundColor: isUser
              ? 'primary.main'
              : isError
                ? 'error.light'
                : 'white',
            color: isUser
              ? 'primary.contrastText'
              : isError
                ? 'error.contrastText'
                : 'text.primary',
            borderRadius: 2,
            boxShadow: 1
          }}
        >
          {/* Message Text */}
          {isUser ? (
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.5
              }}
            >
              {message.content}
            </Typography>
          ) : (
            <Box
              sx={{
                '& p': {
                  margin: 0,
                  marginBottom: 1,
                  '&:last-child': {
                    marginBottom: 0
                  }
                },
                '& strong': {
                  fontWeight: 600,
                  color: 'primary.main'
                },
                '& ul, & ol': {
                  paddingLeft: 2,
                  margin: 0,
                  marginBottom: 1
                },
                '& li': {
                  marginBottom: 0.5
                },
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  margin: 0,
                  marginBottom: 1,
                  fontWeight: 600
                },
                '& code': {
                  backgroundColor: 'grey.100',
                  padding: '2px 4px',
                  borderRadius: 1,
                  fontSize: '0.875em'
                },
                '& pre': {
                  backgroundColor: 'grey.100',
                  padding: 1,
                  borderRadius: 1,
                  overflow: 'auto'
                }
              }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Box>
          )}

          {/* Intent Information */}
          {!isUser && message.intent && message.intent.isSearchQuery && (
            <Box sx={{ mt: 1 }}>
              <Chip
                label={`Search confidence: ${(message.intent.confidence * 100).toFixed(0)}%`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>
          )}

          {/* Message Actions */}
          {!isUser && !isError && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
              <Tooltip title="Copy message">
                <IconButton size="small" onClick={handleCopyMessage}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Helpful">
                <IconButton size="small" color="success">
                  <ThumbUpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Not helpful">
                <IconButton size="small" color="error">
                  <ThumbDownIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Paper>

        {/* Relevant Neighborhoods - Now outside the message Paper */}
        {!isUser && message.relevantNeighborhoods && (
          renderNeighborhoodCards(message.relevantNeighborhoods)
        )}

        {/* Timestamp */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: isUser ? 'right' : 'left',
            mt: 0.5,
            px: 1
          }}
        >
          {formatTimestamp(message.timestamp)}
        </Typography>
      </Box>

      {/* Avatar for user */}
      {isUser && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: 'grey.400'
          }}
        >
          <PersonIcon fontSize="small" />
        </Avatar>
      )}
    </Box>
  )
}

export default MessageBubble
