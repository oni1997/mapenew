import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material'
import {
  Send as SendIcon,
  Clear as ClearIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material'
import { useQuery, useMutation } from 'react-query'
import { Helmet } from 'react-helmet-async'
import { v4 as uuidv4 } from 'uuid'

import { chatAPI } from '../services/api'
import { useAppStore } from '../store/appStore'
import ChatInterface from '../components/Chat/ChatInterface'
import MessageBubble from '../components/Chat/MessageBubble'

const ChatBot = () => {
  const {
    chatMessages,
    addChatMessage,
    clearChatMessages,
    chatSessionId,
    setChatSessionId
  } = useAppStore()

  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // Initialize session ID
  useEffect(() => {
    if (!chatSessionId) {
      setChatSessionId(uuidv4())
    }
  }, [chatSessionId, setChatSessionId])

  // Get chat suggestions
  const { data: suggestions } = useQuery('chat-suggestions', chatAPI.getSuggestions)

  // Send message mutation
  const sendMessageMutation = useMutation(
    ({ message, context, sessionId }) => chatAPI.sendMessage(message, context, sessionId),
    {
      onMutate: () => {
        setIsTyping(true)
      },
      onSuccess: (response) => {
        const aiMessage = {
          role: 'assistant',
          content: response.data.response,
          relevantNeighborhoods: response.data.relevantNeighborhoods,
          intent: response.data.intent
        }
        addChatMessage(aiMessage)
        setIsTyping(false)
      },
      onError: (error) => {
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          isError: true
        }
        addChatMessage(errorMessage)
        setIsTyping(false)
      }
    }
  )

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isTyping])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // Add user message
    const userMessage = {
      role: 'user',
      content: inputMessage.trim()
    }
    addChatMessage(userMessage)

    // Prepare context (last 5 messages)
    const context = chatMessages.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Send to API
    sendMessageMutation.mutate({
      message: inputMessage.trim(),
      context,
      sessionId: chatSessionId
    })

    setInputMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion)
  }

  const handleClearChat = () => {
    clearChatMessages()
    setChatSessionId(uuidv4())
  }

  const quickSuggestions = [
    "Find family-friendly neighborhoods under R3500/month",
    "Show me safe areas with good public transportation",
    "What are the best neighborhoods for young professionals?",
    "Find quiet residential areas with parks",
    "Which neighborhoods have the best restaurants?"
  ]

  return (
    <>
      <Helmet>
        <title>AI Chat Assistant - City Insights AI</title>
        <meta name="description" content="Ask questions about neighborhoods using natural language AI chat" />
      </Helmet>

      <Box sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Page Header - Compact */}
        <Box sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'white',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BotIcon color="primary" sx={{ fontSize: 24 }} />
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  AI Chat Assistant
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ask me anything about neighborhoods in natural language
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearChat}
              disabled={chatMessages.length === 0}
            >
              Clear Chat
            </Button>
          </Box>
        </Box>

        {/* Chat Content */}
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          overflow: 'hidden',
          minHeight: 0
        }}>
          {/* Main Chat Area */}
          <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden'
          }}>
            {/* Messages Area */}
            <Box sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              minHeight: 0
            }}>
              {chatMessages.length === 0 ? (
                // Welcome Screen
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <BotIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    Welcome to City Insights AI Chat!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                    I'm here to help you discover the perfect neighborhood. Ask me about safety, 
                    housing costs, amenities, or anything else you'd like to know!
                  </Typography>

                  {/* Quick Suggestions */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <LightbulbIcon /> Try asking:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 800, mx: 'auto' }}>
                      {quickSuggestions.map((suggestion, index) => (
                        <Chip
                          key={index}
                          label={suggestion}
                          clickable
                          onClick={() => handleSuggestionClick(suggestion)}
                          sx={{ 
                            height: 'auto', 
                            py: 1, 
                            px: 2,
                            '& .MuiChip-label': { 
                              whiteSpace: 'normal',
                              textAlign: 'left'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              ) : (
                // Chat Messages
                <Box sx={{ maxWidth: 800, mx: 'auto', width: '100%' }}>
                  {chatMessages.map((message, index) => (
                    <MessageBubble key={index} message={message} />
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <BotIcon color="primary" />
                      <Paper sx={{ p: 2, backgroundColor: 'grey.100' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <CircularProgress size={8} />
                          <CircularProgress size={8} sx={{ animationDelay: '0.2s' }} />
                          <CircularProgress size={8} sx={{ animationDelay: '0.4s' }} />
                        </Box>
                      </Paper>
                    </Box>
                  )}
                  
                  <div ref={messagesEndRef} />
                </Box>
              )}
            </Box>

            {/* Input Area */}
            <Box sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              backgroundColor: 'white',
              flexShrink: 0
            }}>
              <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Ask me about neighborhoods..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendMessageMutation.isLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3
                      }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || sendMessageMutation.isLoading}
                    sx={{ 
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark'
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'grey.300'
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
          </Box>

          {/* Sidebar with suggestions */}
          <Box sx={{
            width: 300,
            borderLeft: 1,
            borderColor: 'divider',
            p: 2,
            display: { xs: 'none', lg: 'block' },
            overflow: 'auto',
            flexShrink: 0
          }}>
            <Typography variant="h6" gutterBottom>
              Suggestions
            </Typography>
            
            {suggestions?.data?.suggestions && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Popular Questions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {suggestions.data.suggestions.slice(0, 5).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      size="small"
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{ 
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        height: 'auto',
                        py: 1,
                        whiteSpace: 'normal'
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Tips for Better Results
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                Be specific about your preferences (budget, lifestyle, etc.)
              </Alert>
              <Alert severity="success" sx={{ fontSize: '0.8rem' }}>
                Ask about specific neighborhoods for detailed insights
              </Alert>
              <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
                Mention your priorities (safety, transit, nightlife, etc.)
              </Alert>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default ChatBot
