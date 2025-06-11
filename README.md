# TheTruthSchool - AI-Powered Job Preparation Platform

> Comprehensive job preparation platform with AI-powered mock interviews, coding challenges, resume reviews, and personalized feedback.

![TheTruthSchool Banner](https://via.placeholder.com/1200x400/0ea5e9/ffffff?text=TheTruthSchool+-+AI-Powered+Job+Preparation)

## 🚀 Features

### 🎯 Core Features
- **AI-Powered Mock Interviews** - Real-time voice/video interviews with AI interviewer
- **Coding Challenges** - LeetCode-style problems with Judge0 integration
- **Resume Review** - AI-powered resume analysis and optimization
- **Mock Tests** - Comprehensive assessments with detailed feedback
- **Analytics Dashboard** - Track progress and get insights
- **Personalized Feedback** - AI-generated improvement suggestions

### 🔧 Technical Features
- **Real-time Communication** - LiveKit integration for video/audio
- **Code Execution** - Judge0 API for secure code running
- **AI Integration** - OpenAI GPT-4 and Google Gemini
- **OAuth Authentication** - Google and GitHub login
- **Role-based Access** - Student, Professional, Admin roles
- **Responsive Design** - Mobile-first approach with Tailwind CSS

## 📁 Project Structure

```
thetruthschool/
├── README.md
├── docker-compose.yml
├── package.json
├── frontend/                 # Next.js 13+ App Router Frontend
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── app/              # App Router pages
│       ├── components/       # Reusable React components
│       ├── lib/             # Utilities and configurations
│       ├── hooks/           # Custom React hooks
│       ├── types/           # TypeScript type definitions
│       └── styles/          # Global styles
├── backend/                 # FastAPI Python Backend
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── alembic.ini
│   └── app/
│       ├── main.py          # FastAPI application entry point
│       ├── core/            # Core configurations
│       ├── models/          # SQLAlchemy database models
│       ├── schemas/         # Pydantic schemas
│       ├── api/             # API route handlers
│       ├── services/        # Business logic services
│       ├── crud/            # Database operations
│       └── tests/           # Test files
└── docs/                    # Documentation
```

## 🛠️ Technology Stack

### Frontend (Next.js)
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **Authentication**: NextAuth.js
- **State Management**: React Query + Zustand
- **Code Editor**: Monaco Editor
- **Real-time**: LiveKit Components
- **Charts**: Recharts + Chart.js

### Backend (FastAPI)
- **Framework**: FastAPI
- **Language**: Python 3.10+
- **Database**: PostgreSQL + SQLAlchemy
- **Authentication**: fastapi-users with JWT
- **AI Integration**: OpenAI + Google Generative AI
- **Code Execution**: Judge0 API
- **Real-time**: LiveKit Agents
- **Task Queue**: Celery + Redis

### Infrastructure
- **Database**: PostgreSQL
- **Cache**: Redis
- **File Storage**: Google Cloud Storage
- **Deployment**: Vercel (Frontend) + Google Cloud Run (Backend)
- **Monitoring**: Sentry + Google Analytics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL 15+
- Redis
- Docker (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/thetruthschool.git
cd thetruthschool
```

### 2. Environment Setup
```bash
# Copy environment files
npm run setup:env

# Install dependencies
npm run install:all
```

### 3. Configure Environment Variables

#### Backend (.env)
```bash
cd backend
cp .env.example .env
# Edit .env with your configurations
```

Key variables to set:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SECRET_KEY` - JWT secret key
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key
- `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` - LiveKit credentials
- `JUDGE0_RAPID_API_KEY` - Judge0 API key

#### Frontend (.env.local)
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your configurations
```

Key variables to set:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXTAUTH_URL` - Frontend URL
- `NEXTAUTH_SECRET` - NextAuth secret
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` - OAuth credentials

### 4. Database Setup
```bash
# Start PostgreSQL and Redis (if using Docker)
docker-compose up postgres redis -d

# Run database migrations
cd backend
alembic upgrade head
```

### 5. Development Server
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:8000
```

## 🐳 Docker Development

### Start all services
```bash
docker-compose up --build
```

### Services
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 📝 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Backend (Google Cloud Run)
1. Build and push Docker image:
```bash
cd backend
docker build -t gcr.io/PROJECT_ID/truthschool-backend .
docker push gcr.io/PROJECT_ID/truthschool-backend
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy truthschool-backend \
  --image gcr.io/PROJECT_ID/truthschool-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   PostgreSQL    │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│   (Vercel)      │    │   (Cloud Run)   │    │   (Cloud SQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LiveKit       │    │   Judge0        │    │   Redis         │
│   (Real-time)   │    │   (Code Exec)   │    │   (Cache)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **User Authentication**: OAuth → NextAuth.js → FastAPI
2. **Mock Interviews**: Frontend → LiveKit → AI Agent → FastAPI
3. **Code Challenges**: Monaco Editor → Judge0 → FastAPI
4. **AI Reviews**: FastAPI → OpenAI/Gemini → Database

## 🔑 Key Integrations

### Judge0 Code Execution
- Secure sandboxed code execution
- Support for 60+ programming languages
- Real-time compilation and execution feedback

### LiveKit Real-time Communication
- Voice/video mock interviews
- AI agent integration
- Real-time collaboration features

### AI Services
- **OpenAI GPT-4**: Resume review and feedback generation
- **Google Gemini**: Interview question generation
- **Custom prompts**: Tailored for job preparation scenarios

## 🔒 Security Features

- **Authentication**: OAuth 2.0 + JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encrypted at rest and in transit
- **API Security**: Rate limiting + CORS protection
- **File Upload**: Secure file handling with type validation
- **Session Management**: Secure session handling

## 📊 Monitoring & Analytics

- **Error Tracking**: Sentry integration
- **Performance**: Web Vitals monitoring
- **User Analytics**: Google Analytics
- **API Monitoring**: FastAPI built-in metrics
- **Database**: PostgreSQL query performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use Prettier for code formatting
- Write tests for new features
- Update documentation as needed

## 📋 Roadmap

### Phase 1 (Current)
- [x] Core platform architecture
- [x] Authentication system
- [x] Basic mock interviews
- [x] Coding challenges
- [x] Resume review

### Phase 2 (Next)
- [ ] Advanced AI interview scenarios
- [ ] Team collaboration features
- [ ] Mobile app development
- [ ] Integration marketplace

### Phase 3 (Future)
- [ ] Machine learning personalization
- [ ] Advanced analytics dashboard
- [ ] Enterprise features
- [ ] API for third-party integrations

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development Team**: TheTruthSchool Engineering
- **AI Research**: TheTruthSchool AI Lab
- **Design**: TheTruthSchool Design Team

## 📞 Support

- **Documentation**: [docs.thetruthschool.com](https://docs.thetruthschool.com)
- **Email**: support@thetruthschool.com
- **Discord**: [Join our community](https://discord.gg/thetruthschool)
- **Issues**: [GitHub Issues](https://github.com/yourusername/thetruthschool/issues)

## 🎯 Key Features Implemented

### ✅ Authentication & Authorization
- OAuth integration (Google, GitHub)
- JWT token management
- Role-based access control
- Session management

### ✅ Database Models
- User management with profiles
- Coding challenges with test cases
- Interview sessions and feedback
- Resume storage and reviews
- Test creation and attempts
- Comprehensive feedback system

### ✅ API Endpoints
- RESTful API design
- OpenAPI documentation
- Rate limiting
- Error handling
- Security headers

### ✅ Frontend Components
- Responsive design
- Dark/light theme support
- Accessible UI components
- Real-time features
- Interactive dashboards

---

**Built with ❤️ by the TheTruthSchool team**

> Ready to transform your job preparation journey? Start building the future of career development today!