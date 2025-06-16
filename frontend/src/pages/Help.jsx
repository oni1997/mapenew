import React from 'react'
import {
  Box,
  Typography,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  Compare as CompareIcon,
  Map as MapIcon,
  Security as SecurityIcon,
  Home as HomeIcon,
  School as SchoolIcon,
  DirectionsTransit as TransitIcon,
  Restaurant as RestaurantIcon,
  GitHub as GitHubIcon,
  Email as EmailIcon
} from '@mui/icons-material'
import { Helmet } from 'react-helmet-async'

const Help = () => {
  const faqData = [
    {
      question: "How do I search for neighborhoods?",
      answer: "You can search for neighborhoods in several ways: Use the search bar in the header to find specific areas, browse the Explorer page to filter by criteria like budget and safety, or ask our AI Chat assistant using natural language queries like 'Find family-friendly areas under R30,000/month'."
    },
    {
      question: "What does the AI Chat assistant do?",
      answer: "Our AI Chat assistant helps you find neighborhoods using natural language. You can ask questions like 'Where should a young professional live?' or 'Show me safe areas with good restaurants.' The AI understands your preferences and provides personalized recommendations with detailed explanations."
    },
    {
      question: "How do I compare neighborhoods?",
      answer: "Select neighborhoods by clicking the 'Add to Compare' button on neighborhood cards. Once you've selected 2 or more areas, click the comparison indicator in the header or visit the Compare page. You'll see side-by-side analysis of safety, housing costs, amenities, and more."
    },
    {
      question: "What do the safety scores mean?",
      answer: "Safety scores range from 1-10, with 10 being the safest. These scores are based on crime statistics, security features, and community safety measures. Scores above 7 indicate very safe areas, 5-7 are moderately safe, and below 5 may require extra caution."
    },
    {
      question: "How accurate is the rental pricing data?",
      answer: "Our rental data is sourced from Property24, Private Property, Seeff, and PayProp market reports for 2025. Prices are updated regularly and include bedroom-specific pricing (studio to 4-bedroom). Remember that actual prices may vary based on specific property features and market conditions."
    },
    {
      question: "What does 'Transit Score' mean?",
      answer: "Transit Score (0-100) measures how well-connected an area is to public transportation. Higher scores mean better access to buses, trains, and taxis. Scores above 70 indicate excellent public transport, 50-70 is good, and below 50 may require a car for convenient travel."
    },
    {
      question: "Can I save my favorite neighborhoods?",
      answer: "Currently, you can add neighborhoods to your comparison list during your session. For permanent saving and user accounts, this feature is planned for future updates. Use the comparison feature to keep track of areas you're interested in."
    },
    {
      question: "How do I interpret the demographic data?",
      answer: "Demographic data includes population size, median age, income levels, and ethnic composition. This helps you understand the community character. Median income is shown in ZAR annually, and education levels show the percentage with matric, diploma, and degree qualifications."
    }
  ]

  const features = [
    {
      icon: <SearchIcon />,
      title: "Smart Search",
      description: "Find neighborhoods using filters for budget, safety, amenities, and lifestyle preferences."
    },
    {
      icon: <ChatIcon />,
      title: "AI Assistant",
      description: "Ask questions in natural language and get personalized neighborhood recommendations."
    },
    {
      icon: <CompareIcon />,
      title: "Side-by-Side Comparison",
      description: "Compare multiple neighborhoods across all metrics to make informed decisions."
    },
    {
      icon: <MapIcon />,
      title: "Interactive Maps",
      description: "Explore Cape Town neighborhoods with detailed location and boundary information."
    },
    {
      icon: <SecurityIcon />,
      title: "Safety Insights",
      description: "Comprehensive safety scores based on crime data and security features."
    },
    {
      icon: <HomeIcon />,
      title: "Housing Market Data",
      description: "Real-time rental and sale prices with bedroom-specific breakdowns."
    }
  ]

  const tips = [
    "Start with the AI Chat if you're unsure what you're looking for - it's great for exploratory questions",
    "Use specific budget ranges when searching to get more relevant results",
    "Check both safety scores and crime types to understand neighborhood security",
    "Compare transit scores if you rely on public transportation",
    "Look at demographic data to find communities that match your lifestyle",
    "Use the map view to understand neighborhood locations and proximity to amenities",
    "Ask the AI about specific concerns like 'pet-friendly areas' or 'good for families with young children'"
  ]

  return (
    <>
      <Helmet>
        <title>Help & Support - City Insights AI</title>
        <meta name="description" content="Get help using City Insights AI - your guide to finding the perfect neighborhood in Cape Town" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <HelpIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Help & Support
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Everything you need to know about using City Insights AI to find your perfect neighborhood
          </Typography>
        </Box>

        {/* Quick Start Guide */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              🚀 Quick Start Guide
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemIcon><SearchIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="1. Explore Neighborhoods" 
                      secondary="Browse all Cape Town suburbs or use filters to narrow down options"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><ChatIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="2. Ask the AI Assistant" 
                      secondary="Get personalized recommendations by describing what you're looking for"
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemIcon><CompareIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="3. Compare Options" 
                      secondary="Add neighborhoods to comparison and analyze them side-by-side"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><MapIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="4. View on Map" 
                      secondary="See exact locations and understand neighborhood geography"
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
            🔧 Features Overview
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {feature.icon}
                      <Typography variant="h6" fontWeight={600} sx={{ ml: 1 }}>
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Pro Tips */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              💡 Pro Tips for Better Results
            </Typography>
            <Grid container spacing={2}>
              {tips.map((tip, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    {tip}
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
            ❓ Frequently Asked Questions
          </Typography>
          {faqData.map((faq, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={500}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Contact Support */}
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              📞 Need More Help?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Can't find what you're looking for? Get in touch with our developer for support.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                href="mailto:dzidzaimaenza@gmail.com"
                sx={{ minWidth: 200 }}
              >
                Contact Onesmus Maenzanise
              </Button>
              <Button
                variant="outlined"
                startIcon={<GitHubIcon />}
                href="https://github.com/oni1997"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ minWidth: 200 }}
              >
                GitHub: oni1997
              </Button>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="body2" color="text.secondary">
              This app was built for the MongoDB AI in Action Hackathon 2025
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </>
  )
}

export default Help
