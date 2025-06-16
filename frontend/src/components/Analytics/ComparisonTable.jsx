import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  TableSortLabel,
  useTheme
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Info as InfoIcon
} from '@mui/icons-material'

const ComparisonTable = ({ 
  neighborhoods = [], 
  metrics = ['housing', 'safety', 'amenities', 'demographics'],
  showRanking = true 
}) => {
  const theme = useTheme()
  const [sortBy, setSortBy] = useState(null)
  const [sortOrder, setSortOrder] = useState('asc')

  // Define metric configurations
  const metricConfigs = {
    housing: {
      label: 'Housing',
      fields: [
        { key: 'avgRent', label: 'Avg Rent', format: 'currency', sortable: true },
        { key: 'avgSalePrice', label: 'Avg Sale Price', format: 'currency', sortable: true },
        { key: 'homeOwnershipRate', label: 'Ownership Rate', format: 'percentage', sortable: true },
        { key: 'pricePerSqFt', label: 'Price/SqFt', format: 'currency', sortable: true }
      ]
    },
    safety: {
      label: 'Safety',
      fields: [
        { key: 'safetyScore', label: 'Safety Score', format: 'score', max: 10, sortable: true },
        { key: 'crimeRate', label: 'Crime Rate', format: 'decimal', sortable: true, inverse: true }
      ]
    },
    amenities: {
      label: 'Amenities',
      fields: [
        { key: 'transitScore', label: 'Transit Score', format: 'score', max: 100, sortable: true },
        { key: 'walkabilityScore', label: 'Walkability', format: 'score', max: 100, sortable: true },
        { key: 'bikeScore', label: 'Bike Score', format: 'score', max: 100, sortable: true },
        { key: 'restaurants', label: 'Restaurants', format: 'number', sortable: true },
        { key: 'parks', label: 'Parks', format: 'number', sortable: true }
      ]
    },
    demographics: {
      label: 'Demographics',
      fields: [
        { key: 'population', label: 'Population', format: 'number', sortable: true },
        { key: 'medianAge', label: 'Median Age', format: 'number', sortable: true },
        { key: 'medianIncome', label: 'Median Income', format: 'currency', sortable: true }
      ]
    }
  }

  // Format value based on type
  const formatValue = (value, format, max = null) => {
    if (value == null || value === undefined) return 'N/A'

    switch (format) {
      case 'currency':
        return `R${value.toLocaleString()}`
      case 'percentage':
        return `${value}%`
      case 'score':
        return max ? `${value}/${max}` : value.toString()
      case 'decimal':
        return value.toFixed(1)
      case 'number':
      default:
        return value.toLocaleString()
    }
  }

  // Get value from nested object
  const getValue = (neighborhood, metric, field) => {
    const metricData = neighborhood[metric]
    return metricData ? metricData[field] : null
  }

  // Calculate ranking for a field
  const getRanking = (neighborhoods, metric, field, inverse = false) => {
    const values = neighborhoods
      .map((n, index) => ({ index, value: getValue(n, metric, field) }))
      .filter(item => item.value != null)
      .sort((a, b) => inverse ? a.value - b.value : b.value - a.value)

    const rankings = {}
    values.forEach((item, rank) => {
      rankings[item.index] = rank + 1
    })

    return rankings
  }

  // Get color for ranking
  const getRankingColor = (rank, total) => {
    if (rank === 1) return theme.palette.success.main
    if (rank === total) return theme.palette.error.main
    if (rank <= Math.ceil(total / 3)) return theme.palette.warning.main
    return theme.palette.text.secondary
  }

  // Handle sorting
  const handleSort = (metric, field) => {
    const key = `${metric}.${field}`
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  // Sort neighborhoods if sorting is active
  const sortedNeighborhoods = React.useMemo(() => {
    if (!sortBy) return neighborhoods

    const [metric, field] = sortBy.split('.')
    return [...neighborhoods].sort((a, b) => {
      const valueA = getValue(a, metric, field) || 0
      const valueB = getValue(b, metric, field) || 0
      
      if (sortOrder === 'asc') {
        return valueA - valueB
      } else {
        return valueB - valueA
      }
    })
  }, [neighborhoods, sortBy, sortOrder])

  return (
    <Box>
      {metrics.map(metric => {
        const config = metricConfigs[metric]
        if (!config) return null

        return (
          <Box key={metric} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {config.label}
              <Tooltip title={`Comparison of ${config.label.toLowerCase()} metrics across neighborhoods`}>
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Typography>

            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Neighborhood
                      </Typography>
                    </TableCell>
                    {config.fields.map(field => (
                      <TableCell key={field.key} align="center">
                        {field.sortable ? (
                          <TableSortLabel
                            active={sortBy === `${metric}.${field.key}`}
                            direction={sortBy === `${metric}.${field.key}` ? sortOrder : 'asc'}
                            onClick={() => handleSort(metric, field.key)}
                          >
                            <Typography variant="subtitle2" fontWeight={600}>
                              {field.label}
                            </Typography>
                          </TableSortLabel>
                        ) : (
                          <Typography variant="subtitle2" fontWeight={600}>
                            {field.label}
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedNeighborhoods.map((neighborhood, index) => {
                    return (
                      <TableRow key={neighborhood._id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {neighborhood.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {neighborhood.borough}
                            </Typography>
                          </Box>
                        </TableCell>
                        {config.fields.map(field => {
                          const value = getValue(neighborhood, metric, field.key)
                          const rankings = showRanking ? getRanking(neighborhoods, metric, field.key, field.inverse) : {}
                          const rank = rankings[neighborhoods.indexOf(neighborhood)]
                          
                          return (
                            <TableCell key={field.key} align="center">
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2">
                                  {formatValue(value, field.format, field.max)}
                                </Typography>
                                {showRanking && rank && (
                                  <Chip
                                    label={`#${rank}`}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      backgroundColor: getRankingColor(rank, neighborhoods.length),
                                      color: 'white'
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Best/Worst Summary */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {config.fields.slice(0, 2).map(field => {
                const rankings = getRanking(neighborhoods, metric, field.key, field.inverse)
                const bestIndex = Object.keys(rankings).find(key => rankings[key] === 1)
                const worstIndex = Object.keys(rankings).find(key => rankings[key] === neighborhoods.length)
                
                if (!bestIndex || !worstIndex) return null

                const bestNeighborhood = neighborhoods[parseInt(bestIndex)]
                const worstNeighborhood = neighborhoods[parseInt(worstIndex)]
                const bestValue = getValue(bestNeighborhood, metric, field.key)
                const worstValue = getValue(worstNeighborhood, metric, field.key)

                return (
                  <Box key={field.key} sx={{ minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      {field.label}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <TrendingUpIcon fontSize="small" color="success" />
                      <Typography variant="body2">
                        <strong>{bestNeighborhood.name}</strong>: {formatValue(bestValue, field.format, field.max)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingDownIcon fontSize="small" color="error" />
                      <Typography variant="body2">
                        <strong>{worstNeighborhood.name}</strong>: {formatValue(worstValue, field.format, field.max)}
                      </Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

export default ComparisonTable
