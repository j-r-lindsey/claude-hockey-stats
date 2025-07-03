# 🏒 Hockey Stats Tracker

A full-stack web application for tracking and analyzing hockey game statistics from Hockey Reference box scores.

## Features

- **🔐 User Authentication**: Secure email/password authentication with JWT tokens
- **📊 Game Import**: Automatically parse Hockey Reference URLs to extract game data
- **👤 Player Statistics**: Aggregated player stats across all games attended
- **🏒 Team Statistics**: Team records, points, goals for/against with NHL-style standings
- **📱 Responsive Design**: Material-UI components with compact, data-dense tables
- **🔄 Data Management**: Re-parse games, view original sources, manage your game library

## Tech Stack

### Backend
- **FastAPI** - Python web framework
- **Supabase** - PostgreSQL database hosting
- **Beautiful Soup** - HTML parsing for Hockey Reference data
- **JWT Authentication** - Secure user sessions
- **Pandas** - Data processing and aggregation

### Frontend  
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **Vite** - Build tool and dev server
- **Axios** - HTTP client

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd hockey-stats-app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Copy environment file and configure
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Database Setup**
   - Create a Supabase project
   - Run the migration files in order from `database/migrations/`:
     1. `001_initial_schema.sql` - Core tables and indexes
     2. `002_disable_rls.sql` - Disable Row Level Security  
     3. `003_create_aggregated_views.sql` - Performance optimization views
   - See `database/README.md` for detailed instructions

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Configure VITE_API_URL if needed
   ```

5. **Start Development Servers**
   ```bash
   # Backend (Terminal 1)
   cd backend && python main.py
   
   # Frontend (Terminal 2)  
   cd frontend && npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Usage

1. **Register/Login**: Create an account or log in
2. **Add Games**: Paste Hockey Reference box score URLs 
3. **View Statistics**: Browse aggregated player and team stats
4. **Manage Games**: Re-parse, view original sources, or delete games

### Supported URLs
The app works with Hockey Reference box score URLs like:
```
https://www.hockey-reference.com/boxscores/20250225CHI.html
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions on Render.com.

### Quick Deploy to Render.com

1. Push code to GitHub
2. Connect repository to Render
3. Use the included `render.yaml` for automatic setup
4. Configure environment variables in Render dashboard

## Project Structure

```
hockey-stats-app/
├── backend/              # FastAPI backend
│   ├── config/          # Database configuration  
│   ├── models/          # Pydantic schemas
│   ├── routers/         # API endpoints
│   ├── services/        # Business logic
│   ├── main.py          # Application entry point
│   └── requirements.txt # Python dependencies
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components  
│   │   ├── services/    # API clients
│   │   └── types/       # TypeScript definitions
│   ├── package.json     # Node dependencies
│   └── vite.config.ts   # Vite configuration
├── database/            # SQL schema and migrations
├── render.yaml          # Render.com deployment config
└── README.md           # This file
```

## API Documentation

When running locally, visit http://localhost:8000/docs for interactive API documentation.

### Key Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login  
- `POST /games/` - Add new game from Hockey Reference URL
- `GET /stats/players` - Get aggregated player statistics
- `GET /stats/teams` - Get aggregated team statistics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please create an issue in the GitHub repository.