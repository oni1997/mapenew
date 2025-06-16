import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material'
import { Helmet } from 'react-helmet-async'

const RentalExplorerSimple = () => {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const response = await fetch('/api/house-rentals?limit=12&offset=0&sortBy=price&sortOrder=asc')
        if (!response.ok) {
          throw new Error('Failed to fetch rentals')
        }
        const data = await response.json()
        setRentals(data.rentals || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRentals()
  }, [])

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">
          Error loading rentals: {error}
        </Alert>
      </Container>
    )
  }

  return (
    <>
      <Helmet>
        <title>Rental Explorer - City Insights AI</title>
        <meta name="description" content="Explore rental properties in Cape Town" />
      </Helmet>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          🏠 Rental Property Explorer
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Found {rentals.length} rental properties
        </Typography>

        <Box sx={{ mt: 3 }}>
          {rentals.map((rental, index) => (
            <Box 
              key={rental._id || index} 
              sx={{ 
                p: 2, 
                mb: 2, 
                border: '1px solid #ddd', 
                borderRadius: 1 
              }}
            >
              <Typography variant="h6">{rental.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {rental.location} • R{rental.price?.toLocaleString()}/month
              </Typography>
              <Typography variant="body2">
                {rental.bedrooms} bed • {rental.bathrooms} bath • {rental.category}
              </Typography>
            </Box>
          ))}
        </Box>

        {rentals.length === 0 && (
          <Typography variant="body1" color="text.secondary">
            No rental properties found.
          </Typography>
        )}
      </Container>
    </>
  )
}

export default RentalExplorerSimple
