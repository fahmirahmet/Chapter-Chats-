# Chapter and Chats 📚✨

[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20TailwindCSS-61DAFB?logo=react&logoColor=black)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-Django%20%7C%20DRF%20%7C%20JWT-092E20?logo=django&logoColor=white)](backend/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://python.org)
[![Node](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js&logoColor=white)](https://nodejs.org)

**Chapter and Chats** is an interactive, modern book club and literary community web application. Designed to connect avid readers, it provides reading cycle management, book discovery, meeting scheduling with passcode verification, community discussions, weekly storytelling prompts, reading quizzes, and Telegram bot authentication integration.

---

## 🏗️ Architecture Overview

The repository is organized into a decoupled frontend and backend architecture:

```text
Chapter and Chats/
├── backend/                  # Django REST API backend
│   ├── accounts/             # Authentication, profiles, roles, badges & Telegram auth
│   ├── activities/           # Story prompts, quizzes, discussions, polls & reports
│   ├── books/                # Book catalog, PDF reader/downloads & recommendations
│   ├── cycles/               # Reading cycles, club meetings, attendance & announcements
│   ├── config/               # Django project settings, routing (urls.py), WSGI/ASGI
│   ├── media/                # User media uploads (covers, guides, avatars - gitignored)
│   ├── manage.py             # Django management CLI
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend environment variables template
├── frontend/                 # React SPA built with Vite
│   ├── public/               # Static assets
│   ├── src/                  # React source code
│   │   ├── api/              # Axios HTTP client configured for JWT auth
│   │   ├── components/       # Reusable UI components & modals
│   │   ├── context/          # Authentication & application state providers
│   │   ├── pages/            # View pages (Home, BookHouse, Cycles, Discussions, etc.)
│   │   └── utils/            # Helper utilities (avatars, formatters)
│   ├── package.json          # Node dependencies and scripts
│   ├── vite.config.js        # Vite build tool configuration
│   ├── tailwind.config.js    # Tailwind styling tokens & themes
│   └── .env.example          # Frontend environment variables template
├── .gitignore                # Multi-tier git exclusion rules
├── .env.example              # Root environment variable reference
└── README.md                 # Project documentation
```

---

## 💻 Tech Stack

### Frontend
- **Framework & Tooling**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) icons
- **Routing & Networking**: [React Router](https://reactrouter.com/), [Axios](https://axios-http.com/)
- **State & Auth**: React Context API with JWT token refresh & storage

### Backend
- **Framework**: [Django 5/6](https://www.djangoproject.com/)
- **API Engine**: [Django REST Framework (DRF)](https://www.django-rest-framework.org/)
- **Authentication**: [SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/) (token rotation and blacklisting support)
- **Database**: SQLite (default for development), configurable for PostgreSQL/MySQL
- **CORS**: `django-cors-headers`
- **Media & File Handling**: Pillow, Django File Storage
- **External Integrations**: Requests (Telegram Bot API integration)

---

## 📋 Prerequisites

Ensure the following runtimes are installed on your machine:
- **Python**: `3.10+` (tested with Python 3.12 / 3.13)
- **Node.js**: `v18.0.0+` (or `v20+` LTS recommended)
- **Package Managers**: `pip` (Python) and `npm` (Node)

---

## 🚀 Quickstart Guide

### 1. Backend Setup (Django)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Copy the backend environment example:
   ```bash
   cp .env.example .env
   ```
   *(On Windows Command Prompt: `copy .env.example .env`)*

   Review `.env` to customize your `SECRET_KEY`, `DEBUG`, or add your Telegram bot token if testing Telegram features.

5. **Run database migrations**:
   ```bash
   python manage.py migrate
   ```

6. **(Optional) Seed sample club data**:
   Populate initial sample books, reading cycles, badges, and user accounts:
   ```bash
   python manage.py seed_club_data
   ```

7. **Start the Django development server**:
   ```bash
   python manage.py runserver
   ```
   The backend API will be available at: **`http://localhost:8000/api/`**  
   The Django admin panel is at: **`http://localhost:8000/admin/`**

---

### 2. Frontend Setup (React + Vite)

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node packages**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy the frontend environment template:
   ```bash
   cp .env.example .env
   ```
   *(On Windows Command Prompt: `copy .env.example .env`)*

   Default configuration:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

4. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   Open your browser to: **`http://localhost:5173/`**

---

## 🤖 Optional Services & Background Commands

### Telegram Bot Polling Listener
The platform includes an automated Telegram Bot integration for delivering login codes and syncing reader accounts:

```bash
cd backend
python manage.py run_bot
```

> **Note**: To utilize the bot, ensure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` are configured in your `backend/.env` file. Obtain a token by messaging [@BotFather](https://t.me/BotFather) on Telegram.

---

## 🔒 Security & Best Practices

- Never commit `.env` or sensitive credentials to git. Both root and subfolder `.env*` files are ignored in `.gitignore`.
- In production, set `DEBUG=False` in `backend/.env` and restrict `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` to your production domain names.
- Uploaded media (`backend/media/`) and build outputs (`frontend/dist/`) are untracked by default.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
