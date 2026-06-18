# 🚀 DevSync - Real-time Project Management Tool

DevSync ek modern, full-stack Project Management application hai jise teams aur developers ke liye workflow asaan banane ke liye design kiya gaya hai. Isme real-time data synchronization aur ek interactive Kanban Board hai, jo users ko bina page refresh kiye collaboration karne ki suvidha deta hai.

## ✨ Features

- **🔐 Secure Authentication:** User registration, traditional login, aur secure Google & GitHub OAuth integration.
- **📊 Real-time Interactive Dashboard:** Project statistics aur metrics ko analyze karne ke liye dynamic charts (Recharts) jo automatic update hote hain.
- **📋 Kanban Board (Drag & Drop):** Tasks ko seamlessly different stages (To Do, In Progress, Review, Done) mein drag aur drop karne ki facility.
- **⚡ Real-time Live Sync:** Socket.io ke use se ek browser mein kiye gaye changes (jaise task updates ya project deletion) doosre browser par instantly bina refresh kiye dikhte hain.
- **🔔 Live Notifications:** Team members ko task assignment aur project updates par instant real-time notifications milti hain.
- **👤 Profile Management:** Users apni profile picture upload (via Cloudinary), update, aur delete kar sakte hain, jo pure application mein instantly sync ho jati hai.

## 🛠️ Tech Stack

**Frontend:**
- React.js (Vite)
- Tailwind CSS (For Modern UI)
- Recharts (For Dashboard Analytics)
- Socket.io-client (For Live Connection)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (Database)
- Socket.io (Real-time Event Handling)
- JSON Web Tokens (JWT) & BcryptJS (Security & Auth)
- Multer & Cloudinary (Image Uploading)

## 🚀 Getting Started

Project ko apne local machine par chalane ke liye niche diye gaye steps follow karein:

### 1. Repository Clone Karein
```bash
git clone [https://github.com/Rajat4007/DevSync.git](https://github.com/Rajat4007/DevSync.git)
cd DevSync

```
### 2.Setup Backend
```bash
cd backend
npm install
```
`backend` folder mein ek `.env` file banayein aur ye variables daalein:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GITHUB_CLIENT_ID=your_github_id
GITHUB_CLIENT_SECRET=your_github_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Backend server start karein:
```bash
npm start
```

### 3.Setup Frontend
```bash
cd ../frontend
npm install
```


Frontend development server start karein:

```bash
npm run dev
```
