# VaizAI — AI-Powered Customer Support Automation Platform

VaizAI is an enterprise-grade AI customer support platform designed to streamline support ticket management, leverage Retrieval-Augmented Generation (RAG) for automated responses, analyze client sentiment dynamically, build custom automation workflows visually, and manage messaging channels and subscriptions.

---

## 🏗️ Architecture Overview

The system is split into a **FastAPI backend** (providing Python services, RAG, database management, and sentiment checks) and a **Next.js frontend** (providing a premium responsive workspace interface for customers, agents, and administrators).

```mermaid
graph TD
    subgraph Frontend [Next.js Web Client]
        UI[Workspace Views]
        Chat[RAG Chatbot Assistant]
        Flow[Workflow Visualizer Canvas]
        Razor[Razorpay Integration SDK]
    end

    subgraph Backend [FastAPI API Gateway]
        API[FastAPI Router]
        Auth[JWT Security / RBAC]
        Sentiment[Sentiment Engine]
        RAG[RAG & Embedding Service]
        Sched[APScheduler Quota Manager]
    end

    subgraph Database [PostgreSQL with pgvector]
        DB[(Tables & Vector Index)]
    end

    subgraph AI_Service [Google Gemini API]
        Gemini[Gemini 2.0 Flash]
    end

    UI -->|HTTP requests| API
    Chat -->|SSE Streaming /chat/stream| API
    Razor -->|API checkout| API
    API -->|Auth check| Auth
    API -->|Text processing| Sentiment
    API -->|Retrieval / Vector search| RAG
    RAG -->|Similarity Query| DB
    RAG -->|Generate content / Embeddings| Gemini
    API -->|CRUD operations| DB
```

---

## 🛠️ Technology Stack

### Backend
- **Core Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.13)
- **Database ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **Database Engine**: PostgreSQL with `pgvector` (Vector database extension) or fallback SQLite database (`vaizai_support.db`)
- **AI Processing**: Google Gemini API (`gemini-2.5-flash` & `gemini-embedding-2`)
- **Task Scheduling**: `APScheduler` (handles daily reset for ticketing plans)
- **JWT & Password Security**: `python-jose` (for tokens) and `passlib` with bcrypt/Argon2 (for password hashes)
- **Payment Processing**: Razorpay Python SDK

### Frontend
- **Framework**: [Next.js 14+](https://nextjs.org/) (React, TypeScript)
- **Styling**: Tailwind CSS
- **Authentication Client**: Supabase JS (for storage / file attachments)
- **Interactive UI Components**: Lucide React Icons
- **Payment Checkout UI**: Razorpay Checkout SDK

---

## 📂 Project Structure

```
vaizai/
├── backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── core/             # Configuration & security setups
│   │   ├── database.py       # Database connections and vector initialization
│   │   ├── models.py         # SQLAlchemy schema models (Users, Tickets, Articles, Workflows, etc.)
│   │   ├── schemas.py        # Pydantic data schemas
│   │   └── services/         # Business logic
│   │       ├── rag.py        # Gemini RAG, vector search, SSE streaming, offline suggestions
│   │       └── sentiment.py  # Regex and score-based sentiment engine
│   ├── .env                  # Backend environment secrets
│   ├── requirements.txt      # Python dependencies
│   ├── main.py               # API gateway routes & database seeder
│   └── test_gemini2.py       # Gemini API validation script
│
├── frontend/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router (pages and layouts)
│   │   ├── components/       # Premium UI components representing each view
│   │   └── lib/              # Supabase API client library
│   ├── postcss.config.js
│   ├── tailwind.config.js    # Tailwind styling tokens
│   ├── tsconfig.json
│   └── package.json          # Node dependencies
│
└── docker-compose.yml        # Development environment configuration
```

---

## 🖥️ Screen & Page Breakdown (Frontend Components)

The frontend is built as a single-page app workspace featuring a dynamic sidebar controller. Depending on the logged-in user's role (Admin, Lead, Agent, Customer), different modules are activated:

### 1. 🔐 Login & Signup (`LoginSignup.tsx`)
- Handles email-password credentials authentication and JWT token validation.
- Automatically maps user privileges based on role definitions (`admin`, `lead`, `agent`, `customer`).
- Contains a fast "Switch Role" interface in the [Header](file:///e:/vaizai/frontend/src/components/Header.tsx) for demo and debugging purposes.

### 2. 📊 Agent Dashboard (`AgentDashboardView.tsx`)
- Displays an overview of all active customer tickets.
- Features search and status filters (`ALL`, `Open`, `Pending`, `Escalated`, `CLOSED`).
- Displays priority labels (`LOW`, `MEDIUM`, `HIGH`) and dynamic SLA timers tracking remaining time.

### 3. 🎫 Ticket Workspace (`TicketWorkspaceView.tsx`)
- Displays the detailed timeline of selected tickets.
- Features rich support for messaging, internal notes addition (only visible to staff), and file attachments uploaded through Supabase Storage.
- Allows updating a ticket's priority, status, or assignee, or closing it directly.

### 4. 🤖 AI Support Chatbot (`AIChatbotView.tsx`)
- An automated client help assistant.
- Communicates directly with backend RAG endpoints to fetch contextual knowledge base solutions.
- Employs **SSE (Server-Sent Events) streaming** for token-by-token real-time AI replies.
- Features **Security Guardrails** preventing prompt injection hacks (e.g. *"ignore previous instructions"*).

### 5. 📚 Knowledge Base Manager (`KnowledgeBaseView.tsx`)
- Allows administrators and agents to search, view, and read documentation guides.
- Supports creating new guides, calculating search embedding dimensions dynamically, and visualizing tag overlaps.

### 6. 📈 Platform Analytics (`PlatformAnalyticsView.tsx`)
- Visualizes key metrics like ticket statuses, SLA breaches, and priority distributions.
- Monitors backend infrastructure health (CPU Load, API Latency, Cache Hit Rates).

### 7. 😠 Sentiment Audit Logs (`SentimentLogsView.tsx`)
- Audits incoming queries for user anger.
- Messages scoring above **0.75** trigger automated priority upgrades, routing logs to team leads.

### 8. 🔀 Workflow Rules Canvas (`WorkflowRulesView.tsx`)
- An interactive visual node editor (triggers, conditions, and actions).
- Admins can customize automated workflows (e.g. *IF Ticket Created AND Sentiment = Negative THEN Escalate to Team Lead*).

### 9. 🔌 Messaging Channel Integrations (`IntegrationsView.tsx`)
- Configures webhook settings for channels like Slack, WhatsApp, Twilio, and Email.
- Monitors incoming payloads and activity logs.

### 10. 👤 Profile & Staff Settings (`MyProfileView.tsx`)
- Configures user parameters, displays MFA security status, and allows admins to add or manage team members.

### 11. 💳 Subscription Quotas (`SubscriptionView.tsx`)
- Integrates Razorpay checkout to purchase plans (`basic_daily` or `pro_unlimited`).
- Enforces strict ticket quota checks on API level.

---

## 🚀 Setting Up the Project

### 1. Environment Variables Setup
Create a `.env` file in the `backend/` directory with the following variables:
```env
# Database connection string
DATABASE_URL=postgresql://username:password@localhost:5432/vaizai_support

# JWT Signature Key
JWT_SECRET=your_jwt_signing_key_here

# Google Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here

# Razorpay Keys (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxx
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Running the Backend (FastAPI)
Navigate to the `backend/` folder:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*On start, the backend will auto-seed default credentials (`admin@vaizai.com` / `admin123`) and create standard databases.*

### 3. Running the Frontend (Next.js)
Navigate to the `frontend/` folder:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the client.
