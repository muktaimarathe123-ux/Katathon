# Marg-Darshak 🗺️

Marg-Darshak is a community-driven platform designed to map and share accessibility information about various locations. It empowers users to view accessible places and potential obstacles on an interactive map, submit new reports, and engage with the community to build a more inclusive world.

## 🚀 Features

- **Interactive Accessibility Map**: View accessible routes, ramps, tactile paths, and potential obstacles in real-time.
- **Community Reporting**: Users can submit reports for new accessible locations or obstacles, fostering a community-driven database.
- **AR View (Augmented Reality)**: Explore locations with an experimental AR interface for better spatial awareness.
- **Admin Dashboard**: Moderation tools for admins to approve, reject, or manage community submissions.
- **Analytics**: Insights and data visualization for accessibility trends in various areas.

## 🏗️ Architecture

The project follows a modern client-server architecture:

- **Frontend**: A Single Page Application (SPA) built with React and Vite, ensuring fast load times and a smooth user experience. State management and data fetching are optimized using TanStack Query.
- **Backend**: A robust REST API built with FastAPI (Python) that handles business logic, authentication validation, and AI/ML processing.
- **Database & Auth**: Firebase handles user authentication securely and stores dynamic community data in Firestore (NoSQL).
- **Mapping Service**: TomTom Web SDK is integrated for highly customizable and accurate map rendering.

## 💻 Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: Shadcn UI (Radix UI base)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Maps Integration**: TomTom Maps SDK for Web

### Backend
- **Framework**: FastAPI (Python 3.x)
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore (NoSQL)
- **Storage**: Firebase Storage

## 🛠️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Python](https://www.python.org/) (v3.8+)
- Firebase Project configured

### 1. Clone the repository
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
*Note: Ensure you add your Firebase and TomTom API keys to a `.env` file in the root directory.*

### 3. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload
```
*Note: You will need to place your Firebase `serviceAccountKey.json` in the backend directory to interact with Firestore.*

## 🚢 Deployment

- **Frontend**: Can be easily deployed to platforms like Vercel, Netlify, or Cloudflare Pages.
- **Backend**: Can be containerized with Docker or deployed directly to services like Render, Heroku, or Railway.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 

## 📝 License

This project is licensed under the MIT License.
