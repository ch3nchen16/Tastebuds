# TasteBuds 

A cross-platform social media application for restaurant reviews and recipe sharing, built with Ionic (Angular) and Django.

---

## Prerequisites

Ensure the following are installed before proceeding:
- Python 3.x
- Node.js and npm
- Ionic CLI: `npm install -g @ionic/cli`

---

## Backend Setup (Django)

1. Navigate to the backend folder:
```bash
   cd tastebuds_backend
```

2. Create and activate a virtual environment:
```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Mac/Linux
   python -m venv venv
   source venv/bin/activate
```

3. Install dependencies:
```bash
   pip install -r requirements.txt
```

4. Create a `.env` file in the backend root and add:
SECRET_KEY=your_django_secret_key
DATABASE_URL=your_railway_postgresql_url
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FIREBASE_CREDENTIALS=path_to_firebase_json

5. Run migrations:
```bash
   python manage.py makemigrations
   python manage.py migrate
```

6. Start the backend server:
```bash
   python manage.py runserver
```
   Backend runs at: `http://127.0.0.1:8000`

---

## Frontend Setup (Ionic)

1. Navigate to the frontend folder:
```bash
   cd tastebuds_frontend
```

2. Install dependencies:
```bash
   npm install
```

3. Start the app in the browser:
```bash
   ionic serve
```
   App runs at: `http://localhost:8100`

---

## Important
Both the backend and frontend must be running simultaneously in **two separate terminals** for the application to function correctly.
