# 🏙️ Cape Town Neighborhood Analytics
## AI-Powered Urban Intelligence Platform

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **🏆 Submission for Google Cloud AI in Action Hackathon - MongoDB Challenge**
>
> A revolutionary AI-powered platform that transforms how people discover, analyze, and choose neighborhoods in Cape Town using cutting-edge machine learning, comprehensive real-world data, and intelligent personalization.

## 🚀 **Revolutionary Features**

### **🧠 Advanced AI Personalization Engine**
- **Learns from every user interaction** to build detailed preference profiles
- **Collaborative filtering** to find users with similar preferences
- **Behavioral pattern recognition** for smart recommendations
- **Real-time adaptation** that improves with usage

### **🔮 Predictive Analytics Engine**
- **Housing price forecasting** up to 5 years with confidence intervals
- **Gentrification risk assessment** with timeline predictions
- **Infrastructure development impact** analysis
- **Market trend forecasting** with seasonal adjustments

### **🎯 Advanced Natural Language Processing**
- **Complex query parsing**: "Find family-friendly areas under R20k with good schools"
- **Intent recognition** with AI-powered entity extraction
- **Multi-criteria optimization** for search results
- **Natural language explanations** of recommendations

### **📊 Comprehensive Real-World Data Integration**
- **1,479 Public Schools** with types, districts, languages, locations
- **41 Healthcare Facilities** with classifications, districts, services
- **Taxi Route Network** with connectivity and destination mapping
- **18 Neighborhoods** with housing, safety, demographics, amenities

### **🗺️ Interactive Intelligence**
- **Smart neighborhood mapping** with affordability color-coding
- **Real-time infrastructure scoring** based on proximity analysis
- **Livability calculations** using multiple weighted factors
- **Distance-based accessibility** analysis for schools and hospitals

### 🛠 Tech Stack
- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express.js
- **Database**: MongoDB Atlas with Vector Search
- **AI**: Google Cloud Vertex AI (Gemini Pro/Flash)
- **Maps**: Google Maps JavaScript API
- **Charts**: Chart.js
- **Hosting**: Google Cloud Run

### 📁 Project Structure
```
city-insights-ai/
├── frontend/          # React.js application
├── backend/           # Node.js API server
├── data/             # Data processing scripts
├── docker-compose.yml
└── cloudbuild.yaml
```

### 🚀 Quick Start

#### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Cloud Platform account
- Google Maps API key

#### Installation
```bash
# Clone and setup
git clone <repository>
cd city-insights-ai

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development servers
npm run dev
```

#### Environment Variables
```env
# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cityinsights

# Google Maps
GOOGLE_MAPS_API_KEY=your-maps-api-key
```

### 📊 API Endpoints
- `GET /api/neighborhoods` - List all neighborhoods
- `POST /api/neighborhoods/similar` - Find similar neighborhoods
- `POST /api/chat` - AI chat interface
- `GET /api/analytics/trends/:neighborhood` - Get trend data
- `POST /api/analytics/compare` - Compare neighborhoods

### 🎯 Demo Features
1. **Interactive Map**: Explore neighborhoods visually
2. **AI Chat**: "Find family-friendly areas under $3500/month"
3. **Similarity Search**: Discover neighborhoods like SoHo or Greenwich Village
4. **Trend Analysis**: Visualize crime, housing, and demographic trends

### 🏗 Development Phases
- **Phase 1**: Foundation & Data Models
- **Phase 2**: Core Features & AI Integration
- **Phase 3**: Frontend & Visualization
- **Phase 4**: Deployment & Polish

### 📈 Success Metrics
- All core features functional
- API responses under 2 seconds
- Intuitive user experience
- Meaningful AI insights
- Scalable architecture

### 📜 License
This project is licensed under the MIT License.

Built for the MongoDB Track - Google Cloud Hackathon 2025