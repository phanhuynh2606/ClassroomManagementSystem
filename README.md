Create a fullstack project with the following structure and configuration:

📁 Project Name: online-classroom-management

1. Backend (Express + MongoDB + Cloudinary):
- Tech Stack: Node.js, Express, MongoDB (with Mongoose), dotenv, cors, multer, cloudinary
- Structure:
  - /server
    - /config
      - db.config.js (MongoDB connection)
      - cloudinary.config.js (Cloudinary config)
    - /controllers
      - auth.controller.js
      - user.controller.js
    - /models
      - user.model.js
    - /routes
      - auth.routes.js
      - user.routes.js
    - /middlewares
      - authMiddleware.js
    - server.js (main entry)
- Features:
  - Register/Login with JWT
  - Upload files (images, docs) to Cloudinary
  - Use dotenv for environment config

2. Frontend (React Vite + Redux + Redux Persist + Axios):
- Tech Stack: React, Redux Toolkit, Redux Persist, Axios, React Router DOM, Tailwind CSS
- Structure:
  - /client
    - /src
      - /layouts
        - MainLayout.jsx
      - /pages
        - Login.jsx
        - Register.jsx
        - Dashboard.jsx
      - /redux
        - /slices
          - authSlice.js
        - store.js
      - /routes
        - index.jsx
      - /services
        - axiosClient.js (configured base Axios instance with interceptors)
      - App.jsx
      - main.jsx
- Features:
  - Auth flow with Redux + Redux Persist (store JWT)
  - Pages structured via layouts and route-based rendering
  - Example login + register form
  - Axios base instance with token support

3. Additional:
- .env file for both frontend and backend with:
  - MONGO_URI
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
  - JWT_SECRET
  - VITE_API_URL (frontend)

Please scaffold all boilerplate code with example route logic and dummy UI.
