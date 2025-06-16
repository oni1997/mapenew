import React from 'react'
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper
} from '@mui/material'
import {
  Info as InfoIcon,
  Home as HomeIcon,
  Psychology as PsychologyIcon,
  Security as SecurityIcon,
  Map as MapIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  DirectionsTransit as TransitIcon,
  Restaurant as RestaurantIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon,
  Favorite as FavoriteIcon,
  LocationCity as LocationCityIcon
} from '@mui/icons-material'
import { Helmet } from 'react-helmet-async'

const About = () => {
  const features = [
    {
      icon: <PsychologyIcon />,
      title: "AI-Powered Insights",
      description: "Advanced Gemini AI understands your needs and provides personalized neighborhood recommendations in natural language."
    },
    {
      icon: <SecurityIcon />,
      title: "Safety First",
      description: "Comprehensive safety scores and crime data to help you make informed decisions about where to live."
    },
    {
      icon: <HomeIcon />,
      title: "Real Housing Data",
      description: "Up-to-date rental and sale prices from trusted sources like Property24, Private Property, and Seeff."
    },
    {
      icon: <MapIcon />,
      title: "Interactive Maps",
      description: "Explore neighborhoods visually with detailed maps showing exact locations and boundaries."
    },
    {
      icon: <TransitIcon />,
      title: "Transport Insights",
      description: "Transit scores and public transport information to help you understand connectivity."
    },
    {
      icon: <PeopleIcon />,
      title: "Community Data",
      description: "Demographics, education levels, and community characteristics to find your perfect fit."
    }
  ]

  const techStack = [
    { name: "React", category: "Frontend" },
    { name: "Node.js", category: "Backend" },
    { name: "MongoDB Atlas", category: "Database" },
    { name: "Google Gemini AI", category: "AI/ML" },
    { name: "Google Cloud Run", category: "Hosting" },
    { name: "Material-UI", category: "UI Framework" },
    { name: "Google Maps API", category: "Maps" },
    { name: "Vector Search", category: "Search" }
  ]

  const stats = [
    { number: "19", label: "Cape Town Neighborhoods", icon: <LocationCityIcon /> },
    { number: "5", label: "Borough Areas Covered", icon: <MapIcon /> },
    { number: "100%", label: "Real Market Data", icon: <TrendingUpIcon /> },
    { number: "24/7", label: "AI Assistant Available", icon: <PsychologyIcon /> }
  ]

  return (
    <>
      <Helmet>
        <title>About - City Insights AI</title>
        <meta name="description" content="Learn about City Insights AI - helping people find their perfect neighborhood in Cape Town with AI-powered insights" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <LocationCityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" fontWeight={700} gutterBottom>
            About City Insights AI
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', lineHeight: 1.6 }}>
            Making one of life's biggest decisions a little easier, one neighborhood at a time
          </Typography>
        </Box>

        {/* Mission Statement */}
        <Card sx={{ mb: 6, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FavoriteIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h4" fontWeight={600}>
                Our Mission
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ lineHeight: 1.8, mb: 2 }}>
              Finding a place to call home shouldn't be overwhelming. We believe everyone deserves to live in a neighborhood that truly fits their lifestyle, budget, and dreams.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, opacity: 0.9 }}>
              City Insights AI was born from the simple idea that choosing where to live is deeply personal. Whether you're a young professional seeking vibrant nightlife, a family looking for safe schools and parks, or someone wanting a quiet retreat with mountain views, we're here to help you discover your perfect Cape Town neighborhood through the power of AI and comprehensive data.
            </Typography>
          </CardContent>
        </Card>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                {stat.icon}
                <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ my: 1 }}>
                  {stat.number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* What Makes Us Different */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
            What Makes Us Different
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        backgroundColor: 'primary.light', 
                        color: 'primary.contrastText',
                        mr: 2
                      }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" fontWeight={600}>
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Technology Stack */}
        <Card sx={{ mb: 6 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
              🛠️ Built with Modern Technology
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              City Insights AI leverages cutting-edge technologies to provide fast, accurate, and intelligent neighborhood insights. 
              Built for the MongoDB AI in Action Hackathon 2025, showcasing the power of modern AI and database technologies.
            </Typography>
            <Grid container spacing={1}>
              {techStack.map((tech, index) => (
                <Grid item key={index}>
                  <Chip 
                    label={`${tech.name} (${tech.category})`} 
                    variant="outlined" 
                    sx={{ m: 0.5 }}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Developer Section */}
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 4 }}>
              👨‍💻 Meet the Developer
            </Typography>
            
            <Avatar 
              sx={{ 
                width: 120, 
                height: 120, 
                mx: 'auto', 
                mb: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '3rem'
              }}
            >
              OM
            </Avatar>
            
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Onesmus Maenzanise
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
              A passionate developer who believes technology should make life easier and more meaningful. 
              Onesmus created City Insights AI to help people make one of life's most important decisions - 
              where to live - with confidence and clarity.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 4 }}>
              <Button
                variant="outlined"
                startIcon={<GitHubIcon />}
                href="https://github.com/oni1997"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub: oni1997
              </Button>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                href="mailto:dzidzaimaenza@gmail.com"
              >
                Get in Touch
              </Button>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="body2" color="text.secondary">
              "Every neighborhood has a story. Every person has unique needs. 
              Technology should help us find where these stories and needs beautifully intersect."
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
              - Onesmus Maenzanise
            </Typography>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <Box sx={{ textAlign: 'center', mt: 6, p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Built with ❤️ for the MongoDB AI in Action Hackathon 2025
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Helping Cape Town residents find their perfect neighborhood through AI and data
          </Typography>
        </Box>
      </Container>
    </>
  )
}

export default About
