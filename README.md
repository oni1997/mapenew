# 🏙️ Cape Town Insights
## AI-Powered Urban Analytics Platform

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Vector Search](https://img.shields.io/badge/Vector%20Search-00ED64?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/products/platform/atlas-vector-search)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Google AI](https://img.shields.io/badge/Google%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google/)

> **🏆 Google Cloud AI in Action Hackathon - MongoDB Challenge Submission**
>
> **Cape Town Insights** transforms urban decision-making by integrating **6 real public datasets** with **MongoDB Atlas Vector Search** and **Google Cloud AI**. Using **8,000+ data points**, we help users make informed housing, investment, and lifestyle decisions through comprehensive data analysis and AI-powered insights.

## 🎯 **MongoDB Challenge Perfect Match**

**Challenge Requirement**: *"Select any public dataset that sparks your interest and, using AI for analysis and generation— alongside MongoDB's powerful search and vector search and our Google integrations— create a solution that helps users understand, interact with, or gain new perspectives from the data that shapes our world."*

✅ **Public Datasets**: 6 Cape Town datasets (schools, hospitals, crime, transport, rentals, neighborhoods)
✅ **AI Analysis**: Google Gemini AI generating comprehensive insights
✅ **MongoDB Vector Search**: 768-dimension neighborhood similarity matching
✅ **Google Integrations**: Cloud Run deployment + AI Studio API
✅ **Real Understanding**: Data-driven housing and investment decisions

## 🚀 **Core Features**

### **🤖 AI-Powered Neighborhood Discovery**
- **MongoDB Vector Search**: 768-dimension embeddings for semantic neighborhood matching
- **Natural Language Queries**: "Find me a safe, family-friendly area under R25,000 with good schools"
- **Real-time AI Analysis**: Google Gemini processes all 6 databases simultaneously
- **Contextual Recommendations**: AI understands user preferences and maps to data patterns

### **📊 Comprehensive Market Insights**
- **Multi-Database Analytics**: Real-time analysis across **8,000+ data points**
- **Crime-Based Safety Scoring**: Analysis of **6,568 actual crime incidents**
- **Education Infrastructure**: **1,479 schools** across 8 education districts
- **Transport Connectivity**: **1,466 taxi routes** for accessibility analysis
- **Rental Market Intelligence**: **86 properties** with occupancy and pricing trends

### **🗺️ Interactive Geospatial Platform**
- **MongoDB Geospatial Queries**: $near operations for location-based searches
- **Smart Mapping**: Color-coded neighborhoods based on affordability and safety
- **Infrastructure Overlay**: Schools, hospitals, and transport routes visualization
- **Distance Analysis**: Proximity calculations using geospatial indexing

### **📈 Real-World Data Integration (All Public Datasets)**
- **🎓 Cape Town Schools**: 1,479 public schools with geospatial data
- **🏥 Public Hospitals**: 41 medical facilities with classifications
- **🚌 Taxi Routes**: 1,466 transport routes for connectivity analysis
- **🛡️ Crime Data**: 6,568 incidents for safety scoring and trend analysis
- **🏠 Neighborhoods**: 18 Cape Town areas with demographics and housing
- **💰 Rental Properties**: 86 real estate listings with market data

## 🛠 **Technical Architecture**

### **🗄️ MongoDB Atlas Features**
- **Vector Search**: 768-dimension embeddings with cosine similarity for neighborhood matching
- **Geospatial Indexing**: $near queries for location-based searches within specified distances
- **Complex Aggregations**: Multi-stage pipelines for real-time analytics across 6 collections
- **Atlas Search**: Combined text and vector search for natural language querying
- **Multiple Databases**: `cityinsights` (main) and `houseRentals` (property data)

### **☁️ Google Cloud Integration**
- **Cloud Run**: Containerized deployment for scalable backend services
- **Gemini AI**: Natural language processing via Google AI Studio API
- **Cloud Build**: Automated CI/CD pipeline for continuous deployment

### **💻 Application Stack**
- **Frontend**: React.js with TypeScript, Material-UI for responsive design
- **Backend**: Node.js with Express.js RESTful API architecture
- **Maps**: Google Maps JavaScript API for geospatial visualization
- **Charts**: Chart.js for data visualization and trend analysis
- **State Management**: React Query for efficient data fetching and caching

### 📁 Project Structure
```
cape-town-insights/
├── frontend/                    # React.js application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Main application pages
│   │   ├── services/          # API integration services
│   │   └── utils/             # Helper functions
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilities and helpers
├── scripts/                   # Data processing and setup
└── docker-compose.yml         # Development environment
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- MongoDB Atlas account with Vector Search enabled
- Google Cloud Platform account
- Google AI Studio API key
- Google Maps API key

### **Installation**
```bash
# Clone repository
git clone https://github.com/oni1997/mapenew.git
cd mapenew

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup environment variables
touch backend/.env
# Edit backend/.env with your credentials

# Start development servers
cd backend && npm run dev &
cd frontend && npm run dev
```

### **Environment Variables**
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cityinsights
MONGODB_DB_NAME=cityinsights

# Google AI Studio (for Gemini AI)
GEMINI_API_KEY=your-gemini-api-key

# Google Cloud (optional for advanced features)
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Google Maps
GOOGLE_MAPS_API_KEY=your-maps-api-key
```

### **MongoDB Atlas Setup**
1. Create MongoDB Atlas cluster
2. Enable Vector Search in Atlas Search
3. Create vector index with 768 dimensions, cosine similarity
4. Import Cape Town datasets (scripts provided)

## 📊 **API Endpoints**

### **Core Features**
- `GET /api/neighborhoods` - List all neighborhoods with filtering
- `POST /api/chat` - AI-powered neighborhood queries with vector search
- `GET /api/neighborhoods/market-insights` - Comprehensive market analysis
- `POST /api/neighborhoods/compare` - Multi-criteria neighborhood comparison

### **Data Access**
- `GET /api/schools` - Public schools with geospatial search
- `GET /api/hospitals` - Healthcare facilities with proximity analysis
- `GET /api/taxi-routes` - Transport connectivity data
- `GET /api/house-rentals` - Rental market properties and trends

### **Analytics**
- `GET /api/analytics/stats` - Overall platform statistics
- `GET /api/analytics/trends/:neighborhood` - Neighborhood trend analysis
- `GET /api/insights/livability-rankings` - AI-powered livability scores

## 🎯 **Live Demo Features**

### **🤖 AI Chat Interface**
Try queries like:
- "Find me a safe, family-friendly area under R25,000 with good schools"
- "What are the best neighborhoods for young professionals?"
- "Show me areas with low crime rates and good transport"

### **📊 Market Insights Dashboard**
- **Comprehensive Data Overview**: 8,000+ data points across 6 databases
- **Safety Intelligence**: Real crime data analysis with neighborhood scoring
- **Education Excellence**: School density and quality analysis
- **Transport Connectivity**: Taxi route accessibility mapping
- **Investment Insights**: AI-generated recommendations for different user types

### **🗺️ Interactive Mapping**
- **Neighborhood Boundaries**: Polygon visualization with color-coded affordability
- **Infrastructure Overlay**: Schools, hospitals, and transport routes
- **Geospatial Search**: Find amenities within specified distances
- **Comparative Analysis**: Side-by-side neighborhood evaluation

## 🏆 **Hackathon Alignment**

### **MongoDB Challenge Requirements** ✅
- ✅ **Public Datasets**: 6 verified Cape Town datasets
- ✅ **AI Analysis**: Google Gemini AI integration
- ✅ **MongoDB Vector Search**: Semantic neighborhood matching
- ✅ **Google Integrations**: Cloud Run + AI Studio
- ✅ **User Understanding**: Clear housing decision value

### **Technical Excellence** ⭐⭐⭐⭐⭐
- **MongoDB Atlas Features**: Vector Search, Geospatial, Aggregations
- **Production Deployment**: Google Cloud Run with CI/CD
- **Real Data Integration**: 8,000+ verified data points
- **AI-Powered Insights**: Comprehensive analysis across all databases

## 📈 **Impact & Results**

- **🎯 Problem Solved**: Data-driven urban decision-making for Cape Town residents
- **📊 Data Scale**: 8,000+ data points from 6 public datasets
- **🤖 AI Integration**: Real-time analysis using Google Gemini AI
- **🗄️ MongoDB Showcase**: Advanced Atlas features in production use
- **🌍 Real-World Value**: Helping housing, investment, and lifestyle decisions

---

## 📄 **License**

MIT License for original code. Third-party integrations (MongoDB Atlas, Google Cloud) remain under their respective licenses.

---

**🏆 Built for Google Cloud AI in Action Hackathon 2025 - MongoDB Challenge**
**🔗 Live Demo**: [Cape Town Insights](https://city-insights-backend-91202037874.us-central1.run.app)
**👨‍💻 Developer**: [Onesmus Maenzanise](https://github.com/oni1997)