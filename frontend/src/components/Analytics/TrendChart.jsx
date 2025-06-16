import React, { useRef, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme
} from '@mui/material'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const TrendChart = ({
  title,
  data = [],
  type = 'bar',
  height = 300,
  showLegend = true,
  color = 'primary',
  timeSeriesData = null
}) => {
  const theme = useTheme()
  const chartRef = useRef(null)

  // Color palette based on theme
  const getColors = (colorType) => {
    const colors = {
      primary: [
        theme.palette.primary.main,
        theme.palette.primary.light,
        theme.palette.primary.dark,
        '#42a5f5',
        '#1e88e5'
      ],
      secondary: [
        theme.palette.secondary.main,
        '#f06292',
        '#e91e63',
        '#ad1457',
        '#880e4f'
      ],
      success: [
        theme.palette.success.main,
        '#66bb6a',
        '#4caf50',
        '#388e3c',
        '#2e7d32'
      ],
      warning: [
        theme.palette.warning.main,
        '#ffa726',
        '#ff9800',
        '#f57c00',
        '#ef6c00'
      ],
      error: [
        theme.palette.error.main,
        '#ef5350',
        '#f44336',
        '#d32f2f',
        '#c62828'
      ]
    }
    return colors[colorType] || colors.primary
  }

  // Prepare chart data
  const prepareChartData = () => {
    if (timeSeriesData) {
      // Time series data for line charts
      return {
        labels: timeSeriesData.map(item => item.date || item.label),
        datasets: [{
          label: title,
          data: timeSeriesData.map(item => item.value),
          borderColor: getColors(color)[0],
          backgroundColor: getColors(color)[0] + '20',
          borderWidth: 2,
          fill: type === 'line',
          tension: 0.4
        }]
      }
    }

    // Regular data
    const colors = getColors(color)
    return {
      labels: data.map(item => item.name || item.label),
      datasets: [{
        label: title,
        data: data.map(item => item.value),
        backgroundColor: type === 'doughnut' 
          ? colors.slice(0, data.length)
          : colors[0] + '80',
        borderColor: type === 'doughnut' 
          ? colors.slice(0, data.length)
          : colors[0],
        borderWidth: 1
      }]
    }
  }

  // Chart options
  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'top'
        },
        tooltip: {
          backgroundColor: theme.palette.background.paper,
          titleColor: theme.palette.text.primary,
          bodyColor: theme.palette.text.primary,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true
        }
      }
    }

    if (type === 'doughnut') {
      return {
        ...baseOptions,
        cutout: '60%',
        plugins: {
          ...baseOptions.plugins,
          legend: {
            ...baseOptions.plugins.legend,
            position: 'right'
          }
        }
      }
    }

    return {
      ...baseOptions,
      scales: {
        x: {
          grid: {
            color: theme.palette.divider,
            drawBorder: false
          },
          ticks: {
            color: theme.palette.text.secondary,
            maxRotation: 45
          }
        },
        y: {
          grid: {
            color: theme.palette.divider,
            drawBorder: false
          },
          ticks: {
            color: theme.palette.text.secondary,
            callback: function(value) {
              // Format large numbers
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M'
              }
              if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K'
              }
              return value
            }
          },
          beginAtZero: true
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  }

  // Render appropriate chart type
  const renderChart = () => {
    const chartData = prepareChartData()
    const options = getChartOptions()

    switch (type) {
      case 'line':
        return <Line ref={chartRef} data={chartData} options={options} />
      case 'doughnut':
        return <Doughnut ref={chartRef} data={chartData} options={options} />
      case 'bar':
      default:
        return <Bar ref={chartRef} data={chartData} options={options} />
    }
  }

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (!data.length && !timeSeriesData?.length) return null

    const values = (timeSeriesData || data).map(item => item.value).filter(v => v != null)
    if (!values.length) return null

    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)

    return { sum, avg, max, min, count: values.length }
  }

  const stats = getSummaryStats()

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          {stats && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Avg: {stats.avg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Max: {stats.max.toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ height: height, position: 'relative' }}>
          {data.length === 0 && !timeSeriesData?.length ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'text.secondary'
              }}
            >
              <Typography>No data available</Typography>
            </Box>
          ) : (
            renderChart()
          )}
        </Box>

        {/* Additional Stats */}
        {stats && type !== 'doughnut' && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {stats.count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Data Points
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {stats.max.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Maximum
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main">
                  {stats.min.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Minimum
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="info.main">
                  {stats.avg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Average
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default TrendChart
