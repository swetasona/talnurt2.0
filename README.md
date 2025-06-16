# Talnurt Recruitment Portal

A modern recruitment portal built with Next.js and Tailwind CSS. This application provides a comprehensive platform for managing recruitment processes, including job postings, candidate management, and internal team communication.

## Features

### Public Frontend
- Job listings showcase
- Detailed job view pages
- Application submission form

### Admin Portal
- **Dashboard**: Overview with metrics, charts, and notifications
- **My Talent**: Candidate database with pipeline, relevancy testing, and multiple ways to add talents
- **TalNurt AI**: Resume parsing with OpenAI integration to extract structured data from resumes
- **Business Development**: Company search and management
- **Connect**: Internal communication tools including chat, email integration, and calendar
- **Job Post**: Post and manage job listings
- **Administration**: Performance tracking, task allocation, reports, and more
- **Profile**: User profile and account settings

## Technology Stack

- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenAI API for resume parsing
- **State Management**: React Hooks
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: React Icons
- **TypeScript**: For type safety and better developer experience

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/recruitment-portal.git
   cd recruitment-portal
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Set up the database:
   - Create a PostgreSQL database
   - Set the database URL in `.env` file
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/talnurt_db?schema=public"
     ```
   - Generate Prisma client
     ```
     npm run prisma:generate
     ```
   - Push the schema to the database
     ```
     npm run db:push
     ```
   - Seed the database with initial data
     ```
     npm run db:seed
     ```

4. Set up OpenAI API key:
   - Create a `.env.local` file in the project root
   - Add your OpenAI API key
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

5. Run the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the portal.

## Project Structure

```
recruitment-portal/
├── src/
│   ├── components/     # Reusable React components
│   │   ├── Dashboard/  # Dashboard-related components
│   │   ├── JobPost/    # Job posting components
│   │   ├── Layout/     # Layout components including sidebar
│   │   ├── Public/     # Public-facing components
│   │   ├── Talent/     # Talent management components
│   │   └── Connect/    # Communication components
│   ├── data/           # Mock data for demonstration
│   ├── lib/            # Utility functions and database operations
│   ├── pages/          # Next.js pages
│   │   ├── admin/      # Admin portal pages
│   │   ├── api/        # API routes for database operations
│   │   └── jobs/       # Public job detail pages
│   ├── styles/         # Global styles
│   └── types/          # TypeScript type definitions
├── prisma/             # Prisma schema and migrations
├── public/             # Static assets
└── ...configuration files
```

## Database Schema

The application uses PostgreSQL with Prisma ORM for data management. The main models include:

- **User**: Admin, employer, manager, and employee roles
- **JobPosting**: Job listings with requirements and details
- **JobApplication**: Candidate applications for specific jobs
- **Candidate**: Talent profiles with skills, experience, and education
- **Company**: Company profiles for placements
- **Placement**: Records of candidate placements at companies
- **Task**: Internal tasks for team members
- **Message/ChatGroup**: Internal communication system

## Usage

### Public Portal

- The homepage displays available job listings
- Click on a job to view details and apply
- Complete the application form to submit your resume

### Admin Portal

- Click "Admin Portal" from the homepage to access the admin section
- Navigate using the sidebar to access different features
- Dashboard provides an overview of key metrics
- Job Post section allows you to create and manage job postings
- My Talent section helps you manage candidate database

## Authentication

This prototype uses a simple toggle to switch between public and admin views. In a production environment, you would implement proper authentication with:

- User registration and login
- Role-based access control
- JWT or session-based authentication
- Password recovery

## Data Storage

The application uses PostgreSQL with Prisma ORM, providing:
- Type-safe database queries
- Schema migrations
- Relationship management
- Data validation

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Chart.js](https://www.chartjs.org/)
- [Prisma](https://www.prisma.io/)

## Resume Parsing

The resume parsing feature uses transformer-based models to extract structured information from resumes:

- **Transformer Models**: Uses `dslim/bert-base-NER` for named entity recognition and `ml6team/bart-large-resume-parser` for document segmentation
- **Local Caching**: Models are cached locally after first use for faster subsequent parsing
- **Fallback Mechanisms**: If model loading fails, falls back to regex-based extraction
- **Interactive JSON Display**: View parsed data in a collapsible, syntax-highlighted tree view or raw JSON

### Setup

Run the setup script to install dependencies and pre-cache models:

```bash
cd python
./setup.bat
```

### Features

- Extracts personal details (name, email, phone)
- Identifies education history with institutions and dates
- Captures work experience with companies, positions, and dates
- Extracts skills and competencies
- Provides a user-friendly interface to view the extracted data
- Interactive JSON explorer with syntax highlighting

### Removed Deprecated Parsers

The following deprecated parsers have been removed to simplify maintenance:
- Gemini API-based parser
- LayoutLM parser
- Legacy Python parser without transformer models

All functionality is now consolidated in the transformer-based parser.

## Deployment Instructions

### AWS Deployment

1. Clone the repository:
   ```
   git clone https://github.com/your-username/recruitment-portal.git
   cd recruitment-portal
   ```

2. Configure environment variables:
   ```
   cp .env.example .env.production
   nano .env.production
   ```
   Update the values to match your AWS environment.

3. Run the setup script:
   ```
   ./aws-setup.sh
   ```

4. Access the application at your server's IP address.

### Manual Deployment

1. Install dependencies:
   ```
   npm install
   ```

2. Build the application:
   ```
   npm run build
   ```

3. Start the application:
   ```
   ./start.sh
   ```

## Environment Variables

- `PORT`: The port to run the application on (default: 3001)
- `HOSTNAME`: The hostname to bind to (default: 0.0.0.0)
- `BASE_URL`: The base URL of the application
- `API_URL`: The API URL
- `DB_HOST`: Database host
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `DB_PORT`: Database port
- `NEXTAUTH_SECRET`: Secret for NextAuth authentication
- `NEXTAUTH_URL`: URL for NextAuth

## Troubleshooting

If you encounter issues:

1. Check the logs:
   ```
   pm2 logs talnurt
   ```

2. Verify the database connection:
   ```
   node -e "const { Pool } = require('pg'); const pool = new Pool({user: process.env.DB_USER || 'postgres', host: process.env.DB_HOST || 'localhost', database: process.env.DB_NAME || 'postgres', password: process.env.DB_PASSWORD || '12345678', port: parseInt(process.env.DB_PORT || '5432', 10)}); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err : res.rows[0]); pool.end(); });"
   ```

3. Check Nginx configuration:
   ```
   sudo nginx -t
   sudo systemctl status nginx
   ```