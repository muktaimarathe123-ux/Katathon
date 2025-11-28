# Marg-Darshak - Project Documentation

## Overview
Marg-Darshak is a community-driven platform designed to map and share accessibility information about various locations. Users can view accessible places and obstacles on a map, submit new reports, and engage with the community.

## Technology Stack

### Frontend
- **Framework**: [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (based on Radix UI)
- **State Management & Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Routing**: [React Router](https://reactrouter.com/)
- **Maps**: [TomTom Maps SDK for Web](https://developer.tomtom.com/maps-sdk-web-js)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Language**: Python 3.x
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (NoSQL)
- **Storage**: [Firebase Storage](https://firebase.google.com/docs/storage)
- **AI/ML**: scikit-learn, pandas (Planned)

## Project Structure

```
src/
├── assets/             # Static assets (images, icons)
├── components/         # Reusable UI components
│   ├── ui/             # Shadcn UI primitive components
│   ├── AddMarkerDialog.tsx # Dialog for submitting new reports
│   ├── MapView.tsx     # Map component using TomTom SDK
│   ├── Navigation.tsx  # Main navigation bar
│   └── ...
├── integrations/
│   └── firebase/       # Firebase config and initialization
├── pages/              # Page components (routes)
│   ├── Index.tsx       # Home page with Map
│   ├── Community.tsx   # Community feed
│   ├── Admin.tsx       # Admin dashboard
│   ├── Login.tsx       # Authentication page
│   └── ...
├── App.tsx             # Main app component and routing
└── main.tsx            # Entry point

backend/
├── main.py             # FastAPI entry point and routes
├── models.py           # Pydantic models
└── requirements.txt    # Python dependencies
```

## Setup and Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/) (v3.8 or higher)
- [npm](https://www.npmjs.com/)

### Installation

#### Frontend
1.  Navigate to the project root.
2.  Install dependencies:
    ```bash
    npm install
    ```

#### Backend
1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### Firebase Setup (Required)
To run this project, you need to configure Firebase:

1.  **Create a Firebase Project**:
    - Go to the [Firebase Console](https://console.firebase.google.com/).
    - Click **"Add project"** and follow the setup steps.

2.  **Register the App**:
    - In the project overview, click the **Web icon (`</>`)** to add a web app.
    - Give it a nickname (e.g., "Marg-Darshak Web").
    - Click **"Register app"**.

3.  **Get Configuration Keys**:
    - After registering, you will see a code block with `firebaseConfig`.
    - **Copy the content** inside `const firebaseConfig = { ... };`.
    - Paste these values into `src/integrations/firebase/config.ts`.

4.  **Enable Authentication**:
    - Go to **Build > Authentication** in the sidebar.
    - Click **"Get Started"**.
    - Select **"Email/Password"** provider and enable it.
    - Click **"Save"**.

5.  **Enable Firestore Database**:
    - Go to **Build > Firestore Database**.
    - Click **"Create Database"**.
    - Choose a location and start in **Test Mode** (for development).

6.  **Enable Storage**:
    - Go to **Build > Storage**.
    - Click **"Get Started"** and follow the prompts (Test Mode recommended).

### Running the Project

1.  **Start the Backend**:
    ```bash
    cd backend
    uvicorn main:app --reload
    ```
    The backend will run on `http://localhost:8000`.

2.  **Start the Frontend**:
    ```bash
    # In a new terminal
    npm run dev
    ```
    The application will typically run on `http://localhost:8080`.

## Implementation Details

### Map Integration
The map is implemented in `src/components/MapView.tsx` using the TomTom Web SDK.
- **Initialization**: The map is initialized with a default center (Pune) and zoom level.
- **Markers**: Data is fetched from the Python Backend (which queries Firestore). Custom HTML markers are created using the project logo (`marg-darshak-icon.png`) with color-coded borders (Green for accessible places, Red for obstacles).
- **Interactivity**: Clicking a marker opens a popup with details about the location.

### Authentication
Authentication is handled using Firebase Auth.
- **Login Page**: `src/pages/Login.tsx` allows users to sign up or sign in using Email/Password.
- **Session Management**: `src/components/Navigation.tsx` listens for auth state changes using `onAuthStateChanged`.

### Data Flow
- **Frontend**: React components fetch data from the **Python Backend** endpoints (e.g., `/api/submit-report`).
- **Backend**: FastAPI receives requests, processes them (e.g., AI scoring), and interacts with **Firebase Firestore** to store/retrieve data.
- **AI/ML**: The backend is designed to integrate AI models for accessibility prediction and route optimization.

## Key Dependencies
- **Frontend**:
    - `firebase`: For Auth and Firestore SDK.
    - `@tomtom-international/web-sdk-maps`: For map rendering.
    - `@tanstack/react-query`: For efficient data fetching.
- **Backend**:
    - `fastapi`: Web framework.
    - `firebase-admin`: For server-side Firebase interaction.
    - `scikit-learn`: For AI models.
