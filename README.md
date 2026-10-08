# StoryTeacher - Teach Any Topic Through a Story

An AI-powered educational application that teaches school concepts through engaging, age-appropriate stories.

## Features

- **Story Generation**: Enter a topic and child's age → AI generates an educational story
- **Age Adaptation**: Content automatically adapts to ages 6-12 (vocabulary, complexity, characters)
- **Interactive Assessment**: 5-10 concept-linked questions test real understanding
- **Learning Reports**: Detailed analysis of strong/weak concepts with recommendations
- **Parent/Teacher Dashboards**: Progress tracking, assignment management, class overview

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy 2.0
- **Database**: PostgreSQL 15
- **AI**: OpenAI GPT-4 / Anthropic Claude
- **Auth**: JWT with bcrypt password hashing

## Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenAI API key or Anthropic API key

### 1. Clone and Configure

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# Required: OPENAI_API_KEY or ANTHROPIC_API_KEY
# Required: SECRET_KEY (generate with: openssl rand -hex 32)
```

### 2. Start with Docker Compose

```bash
docker-compose up -d --build
```

This starts:
- PostgreSQL on port 5432
- Backend API on http://localhost:8000
- Frontend on http://localhost:3000

### 3. Access the Application

Open http://localhost:3000 in your browser.

## Manual Setup (Development)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up database
cp ../.env.example .env
# Edit .env with your settings

# Run migrations (when implemented)
# alembic upgrade head

# Start server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
story/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Configuration
│   │   ├── db/           # Database session
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts (Auth, Children)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Helper functions
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Children
- `POST /api/children` - Create child profile
- `GET /api/children` - List children
- `GET /api/children/{id}` - Get child
- `PATCH /api/children/{id}` - Update child
- `DELETE /api/children/{id}` - Delete child

### Stories
- `POST /api/stories/generate` - Generate new story
- `GET /api/stories?child_id={id}` - List stories
- `GET /api/stories/{id}` - Get story with questions
- `POST /api/stories/{id}/complete` - Mark complete
- `GET /api/stories/{id}/questions` - Get assessment questions
- `POST /api/stories/{id}/assess` - Submit assessment

### Reports
- `GET /api/reports/child/{id}` - Child progress report
- `GET /api/reports/teacher/dashboard` - Teacher dashboard

### Assignments (Teacher only)
- `POST /api/assignments` - Create assignment
- `GET /api/assignments` - List assignments

## AI Configuration

The system supports two AI providers:

1. **OpenAI** (default): Set `AI_PROVIDER=openai` and `OPENAI_API_KEY`
2. **Anthropic**: Set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`

The AI generates:
- Age-appropriate educational stories
- Learning objectives
- Concept-linked assessment questions
- Personalized recommendations

## Development

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run lint
```

### Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://postgres:postgres@localhost:5432/storyteacher` |
| `SECRET_KEY` | JWT signing key | Required |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `ANTHROPIC_API_KEY` | Anthropic API key | Optional |
| `AI_PROVIDER` | AI provider to use | `openai` |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:3000"]` |

## MVP Checklist

- [x] Topic + Age input
- [x] AI-generated age-appropriate story
- [x] Learning objectives
- [x] Story reading interface
- [x] 5-10 concept-linked questions
- [x] Automatic scoring
- [x] Strong/weak concept analysis
- [x] Basic parent/teacher report
- [x] Next-learning recommendation

## License

MIT License - feel free to use for hackathons and learning projects!