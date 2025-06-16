import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts'

const ComparisonChart = ({ neighborhoods, title, type = 'bar', metrics = [] }) => {
  if (!neighborhoods || neighborhoods.length === 0) return null

  // Prepare data for different chart types
  const prepareBarData = () => {
    return metrics.map(metric => {
      const dataPoint = { metric: metric.label }
      neighborhoods.forEach(neighborhood => {
        dataPoint[neighborhood.name] = metric.getValue(neighborhood) || 0
      })
      return dataPoint
    })
  }

  const prepareRadarData = () => {
    return neighborhoods.map(neighborhood => {
      const dataPoint = { neighborhood: neighborhood.name }
      metrics.forEach(metric => {
        dataPoint[metric.label] = metric.getValue(neighborhood) || 0
      })
      return dataPoint
    })
  }

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1, boxShadow: 3 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </Typography>
          ))}
        </Card>
      )
    }
    return null
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={prepareBarData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="metric" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {neighborhoods.map((neighborhood, index) => (
          <Bar
            key={neighborhood.name}
            dataKey={neighborhood.name}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )

  const renderRadarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={prepareRadarData()}>
        <PolarGrid />
        <PolarAngleAxis dataKey="neighborhood" />
        <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
        {metrics.map((metric, index) => (
          <Radar
            key={metric.label}
            name={metric.label}
            dataKey={metric.label}
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
        <Legend />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  )

  const renderScoreCards = () => (
    <Grid container spacing={2}>
      {neighborhoods.map((neighborhood, index) => (
        <Grid item xs={12} md={6} lg={4} key={neighborhood.name}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${colors[index % colors.length]}20, ${colors[index % colors.length]}10)`
          }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {neighborhood.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {neighborhood.borough}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                {metrics.map(metric => {
                  const value = metric.getValue(neighborhood)
                  const formattedValue = metric.format ? metric.format(value) : value
                  
                  return (
                    <Box key={metric.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {metric.label}:
                      </Typography>
                      <Chip
                        label={formattedValue}
                        size="small"
                        color={metric.getColor ? metric.getColor(value) : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  )
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          {title}
        </Typography>
        
        {type === 'bar' && renderBarChart()}
        {type === 'radar' && renderRadarChart()}
        {type === 'cards' && renderScoreCards()}
      </CardContent>
    </Card>
  )
}

export default ComparisonChart
