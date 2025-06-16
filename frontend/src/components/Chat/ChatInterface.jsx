import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress
} from '@mui/material'
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  Stop as StopIcon
} from '@mui/icons-material'

import MessageBubble from './MessageBubble'

const ChatInterface = ({
  messages = [],
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
  suggestions = [],
  height = '400px'
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return

    onSendMessage(inputValue.trim())
    setInputValue('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  const handleVoiceRecord = () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true)
      // TODO: Implement voice recording functionality
      console.log('Starting voice recording...')
    } else {
      // Stop recording
      setIsRecording(false)
      // TODO: Process voice input
      console.log('Stopping voice recording...')
    }
  }

  return (
    <Box
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          backgroundColor: 'grey.50'
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Start a conversation
            </Typography>
            <Typography variant="body2">
              Ask me anything about neighborhoods!
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: 'white',
                    borderRadius: 2,
                    maxWidth: '70%'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Thinking...
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'white' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Suggestions:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                size="small"
                clickable
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'white'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: 'grey.50'
              }
            }}
          />
          
          {/* Voice Recording Button */}
          <IconButton
            onClick={handleVoiceRecord}
            disabled={isLoading}
            color={isRecording ? 'error' : 'default'}
            sx={{
              backgroundColor: isRecording ? 'error.light' : 'grey.100',
              '&:hover': {
                backgroundColor: isRecording ? 'error.main' : 'grey.200'
              }
            }}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </IconButton>

          {/* Send Button */}
          <IconButton
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            color="primary"
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark'
              },
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Press Enter to send, Shift+Enter for new line
        </Typography>
      </Box>
    </Box>
  )
}

export default ChatInterface
