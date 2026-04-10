# 🎓 SkillBarter - Peer-to-Peer Skill Exchange Platform

> **Connect. Learn. Teach. Grow Together.**

SkillBarter is a modern web platform that enables people to exchange skills and knowledge through live video sessions, structured learning paths, and interactive collaboration tools.

---

## 📚 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Feature Documentation](#feature-documentation)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## 🌟 Overview

SkillBarter is a **peer-to-peer skill exchange platform** where users can:
- **Teach** skills they know and **learn** skills they want
- Book **1-on-1 video sessions** with skill providers
- Follow **structured learning paths** with modules and lessons
- Collaborate using **real-time whiteboards** during sessions
- Earn **certificates** and **badges** for achievements
- Build a **professional network** of learners and teachers

### 💡 The Concept

Instead of traditional payment, users exchange skills through a **credit-based system**:
1. You teach someone guitar → Earn 10 credits
2. Use those credits to learn photography from someone else
3. Everyone benefits, everyone grows!

---

## ✨ Key Features

### 🎯 **Core Features**

1. **📝 Skill Marketplace**
   - Browse thousands of skills across 20+ categories
   - Filter by category, level, price, rating
   - Book sessions with providers
   - Leave reviews and ratings

2. **📹 Video Call Integration**
   - WebRTC-powered HD video calls
   - Screen sharing capabilities
   - In-call text chat
   - Recording support
   - Mute/unmute controls

3. **🎨 Collaborative Whiteboard**
   - Real-time drawing and sketching
   - Multiple drawing tools (pen, shapes, text)
   - Color picker and stroke width controls
   - Undo/redo functionality
   - Export to PNG
   - Multi-user collaboration

4. **🛤️ Learning Paths**
   - Structured skill curricula
   - Multiple lesson types (video, reading, quiz, project)
   - Progress tracking
   - Completion certificates
   - Personalized recommendations

5. **🏆 Gamification System**
   - XP and levels (Bronze → Platinum)
   - Achievement badges (60+ types)
   - Leaderboards
   - Daily/weekly challenges
   - Streak tracking

6. **📊 Analytics Dashboard**
   - Earnings and spending reports
   - Session statistics
   - Student/provider performance metrics
   - Revenue charts and graphs

7. **🎖️ Verification & Certificates**
   - Skill verification system
   - Portfolio showcase
   - Test-based verification
   - Endorsements from peers
   - Downloadable certificates

8. **🤝 Referral Program**
   - Unique referral codes
   - Credit rewards for referrals
   - Multi-tier rewards (Bronze/Silver/Gold)
   - Affiliate dashboard

---

## 🛠️ Tech Stack

### **Frontend**
```
React 18.2+                 - UI Framework
Vite                        - Build Tool
React Router 6              - Routing
Tailwind CSS 3              - Styling
Lucide React                - Icons
Socket.IO Client            - Real-time Communication
Recharts                    - Charts & Analytics
React Hot Toast             - Notifications
Axios                       - HTTP Client
```

### **Backend**
```
Node.js 18+                 - Runtime
Express.js 4.18+            - Web Framework
MongoDB 6+                  - Database
Mongoose 7+                 - ODM
Socket.IO 4+                - WebSocket Server
JWT                         - Authentication
Bcrypt                      - Password Hashing
Multer                      - File Upload
Nodemailer                  - Email Service
```

### **Real-Time Features**
```
WebRTC                      - Video Calling
Socket.IO                   - Real-time Sync
STUN/TURN Servers           - NAT Traversal
```

---

## 📁 Project Structure

```
skillbarter/
│
├── backend/                        # Backend Node.js/Express server
│   ├── config/                     # Configuration files
│   │   └── database.js             # MongoDB connection
│   │
│   ├── models/                     # Mongoose models (Database schemas)
│   │   ├── User.js                 # User accounts
│   │   ├── Skill.js                # Skills marketplace
│   │   ├── Booking.js              # Session bookings
│   │   ├── Transaction.js          # Credit transactions
│   │   ├── Review.js               # Reviews & ratings
│   │   ├── Achievement.js          # Gamification achievements
│   │   ├── Certificate.js          # Skill certificates
│   │   ├── VideoCall.js            # Video call sessions
│   │   ├── Whiteboard.js           # Whiteboard sessions
│   │   ├── LearningPath.js         # Learning paths
│   │   ├── PathEnrollment.js       # User progress in paths
│   │   └── Referral.js             # Referral system
│   │
│   ├── routes/                     # API route handlers
│   │   ├── auth.js                 # Authentication (login/signup)
│   │   ├── users.js                # User management
│   │   ├── skills.js               # Skill CRUD operations
│   │   ├── bookings.js             # Booking management
│   │   ├── transactions.js         # Credit transactions
│   │   ├── reviews.js              # Review system
│   │   ├── achievements.js         # Gamification
│   │   ├── certificates.js         # Certificates
│   │   ├── videoCalls.js           # Video call API
│   │   ├── whiteboards.js          # Whiteboard API
│   │   ├── learningPaths.js        # Learning paths API
│   │   └── referrals.js            # Referral program
│   │
│   ├── services/                   # Business logic layer
│   │   ├── achievementService.js   # Achievement logic
│   │   ├── notificationService.js  # Notifications
│   │   ├── emailService.js         # Email sending
│   │   ├── videoCallService.js     # Video call logic
│   │   ├── whiteboardService.js    # Whiteboard logic
│   │   └── learningPathService.js  # Learning path logic
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── auth.js                 # JWT authentication
│   │   ├── validate.js             # Input validation
│   │   └── errorHandler.js         # Error handling
│   │
│   ├── sockets/                    # Socket.IO handlers
│   │   ├── webrtcSignaling.js      # WebRTC signaling
│   │   └── whiteboardSignaling.js  # Whiteboard sync
│   │
│   ├── utils/                      # Utility functions
│   │   ├── generateToken.js        # JWT generation
│   │   └── helpers.js              # Helper functions
│   │
│   ├── uploads/                    # File upload directory
│   │   ├── avatars/                # User avatars
│   │   ├── skills/                 # Skill images
│   │   └── certificates/           # Certificate files
│   │
│   ├── .env                        # Environment variables
│   ├── .env.example                # Environment template
│   ├── server.js                   # Express server setup
│   └── package.json                # Dependencies
│
├── frontend/                       # React frontend application
│   ├── public/                     # Static assets
│   │   ├── favicon.ico
│   │   └── logo.png
│   │
│   ├── src/
│   │   ├── components/             # Reusable React components
│   │   │   ├── Layout/
│   │   │   │   ├── Navbar.jsx      # Top navigation
│   │   │   │   ├── Sidebar.jsx     # Side navigation
│   │   │   │   └── Footer.jsx      # Footer
│   │   │   │
│   │   │   ├── Skills/
│   │   │   │   ├── SkillCard.jsx   # Skill display card
│   │   │   │   ├── SkillForm.jsx   # Create/edit skill
│   │   │   │   └── SkillFilter.jsx # Filter controls
│   │   │   │
│   │   │   ├── Bookings/
│   │   │   │   ├── BookingCard.jsx # Booking display
│   │   │   │   └── Calendar.jsx    # Availability calendar
│   │   │   │
│   │   │   └── Common/
│   │   │       ├── Button.jsx      # Reusable button
│   │   │       ├── Modal.jsx       # Modal dialog
│   │   │       ├── Loading.jsx     # Loading spinner
│   │   │       └── ErrorBoundary.jsx # Error handling
│   │   │
│   │   ├── pages/                  # Page components (routes)
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Register.jsx        # Signup page
│   │   │   ├── Dashboard.jsx       # User dashboard
│   │   │   ├── SkillsPage.jsx      # Browse skills
│   │   │   ├── SkillDetails.jsx    # Single skill view
│   │   │   ├── CreateSkill.jsx     # Create new skill
│   │   │   ├── Profile.jsx         # User profile
│   │   │   ├── BookingsPage.jsx    # User bookings
│   │   │   ├── TransactionsPage.jsx # Credit history
│   │   │   ├── VideoCallRoom.jsx   # Video call interface
│   │   │   ├── WhiteboardPage.jsx  # Whiteboard interface
│   │   │   ├── LearningPathsPage.jsx # Browse learning paths
│   │   │   ├── AnalyticsDashboard.jsx # Analytics
│   │   │   ├── AchievementsPage.jsx # Gamification
│   │   │   └── ReferralDashboard.jsx # Referrals
│   │   │
│   │   ├── context/                # React Context (Global State)
│   │   │   ├── AuthContext.jsx     # Authentication state
│   │   │   └── ThemeContext.jsx    # Theme (dark/light mode)
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useAuth.js          # Auth hook
│   │   │   ├── useSocket.js        # Socket.IO hook
│   │   │   └── useDebounce.js      # Debounce hook
│   │   │
│   │   ├── utils/                  # Utility functions
│   │   │   ├── api.js              # Axios instance
│   │   │   ├── constants.js        # Constants
│   │   │   └── helpers.js          # Helper functions
│   │   │
│   │   ├── styles/                 # Global styles
│   │   │   ├── index.css           # Main CSS
│   │   │   └── tailwind.css        # Tailwind config
│   │   │
│   │   ├── App.jsx                 # Main App component
│   │   └── main.jsx                # React entry point
│   │
│   ├── .env                        # Frontend env variables
│   ├── .env.example                # Frontend env template
│   ├── index.html                  # HTML template
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind configuration
│   └── package.json                # Dependencies
│
├── docs/                           # Documentation
│   ├── API.md                      # API documentation
│   ├── DEPLOYMENT.md               # Deployment guide
│   ├── VIDEO-CALL-GUIDE.md         # Video call setup
│   ├── WHITEBOARD-GUIDE.md         # Whiteboard setup
│   └── LEARNING-PATH-GUIDE.md      # Learning paths setup
│
├── .gitignore                      # Git ignore rules
├── README.md                       # This file!
└── LICENSE                         # Project license
```

---

## 🚀 Getting Started

### **Prerequisites**

Make sure you have these installed:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 6+ ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/))

### **Installation**

#### **1. Clone the Repository**
```bash
git clone https://github.com/yourusername/skillbarter.git
cd skillbarter
```

#### **2. Install Backend Dependencies**
```bash
cd backend
npm install
```

#### **3. Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

---

## ⚙️ Environment Setup

### **Backend Environment Variables**

Create `backend/.env` file:

```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/skillbarter
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillbarter

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Email Service (for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# WebRTC (Optional - for better connectivity)
TURN_SERVER_URL=
TURN_SERVER_USERNAME=
TURN_SERVER_CREDENTIAL=
```

### **Frontend Environment Variables**

Create `frontend/.env` file:

```env
# Backend API URL
VITE_API_URL=http://localhost:5001/api
VITE_BACKEND_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001

# App Info
VITE_APP_NAME=SkillBarter
VITE_APP_VERSION=1.0.0
```

---

## ▶️ Running the Application

### **Option 1: Run Backend & Frontend Separately**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### **Option 2: Run Both Concurrently** (Recommended)

From the root directory:
```bash
# Install concurrently globally (one time)
npm install -g concurrently

# Run both
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

### **Access the Application**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5001/api
- **API Health Check:** http://localhost:5001/api/health

---

## 📖 Feature Documentation

### **1. User Authentication**

**Registration:**
```javascript
POST /api/auth/register
Body: {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  password: "securePassword123",
  bio: "Guitar teacher with 10 years experience"
}
```

**Login:**
```javascript
POST /api/auth/login
Body: {
  email: "john@example.com",
  password: "securePassword123"
}
Response: {
  token: "jwt_token_here",
  user: { ... }
}
```

**Using the Token:**
Add to all authenticated requests:
```javascript
Headers: {
  Authorization: "Bearer jwt_token_here"
}
```

### **2. Skills Marketplace**

**Browse Skills:**
```javascript
GET /api/skills?category=Music&level=intermediate&page=1&limit=12
```

**Create Skill:**
```javascript
POST /api/skills
Headers: { Authorization: "Bearer token" }
Body: {
  title: "Guitar Lessons for Beginners",
  description: "Learn guitar from scratch...",
  category: "Music",
  skillLevel: "beginner",
  creditPrice: 10,
  sessionDuration: 60
}
```

**Book Session:**
```javascript
POST /api/bookings
Body: {
  skill: "skillId",
  provider: "providerId",
  startTime: "2024-01-15T10:00:00Z",
  duration: 60
}
```

### **3. Video Calls**

**Start Call:**
```javascript
// Navigate to
/video-call/:roomId

// Or create from booking
POST /api/video-calls/create/:bookingId
```

**Controls:**
- 🎤 Toggle microphone (Mute/Unmute)
- 📹 Toggle camera (On/Off)
- 🖥️ Share screen
- 💬 Text chat
- ✏️ Open whiteboard
- 📞 End call

### **4. Collaborative Whiteboard**

**Open Whiteboard:**
```javascript
// Navigate to
/whiteboard/:roomId

// Or click whiteboard button in video call
```

**Drawing Tools:**
- ✏️ Pen - Freehand drawing
- 🧹 Eraser - Remove strokes
- ▭ Rectangle - Draw rectangles
- ○ Circle - Draw circles
- T Text - Add text
- ↔️ Move - Pan canvas

**Features:**
- 🎨 Color picker (8 presets + custom)
- 📏 Stroke width (1-20px)
- ↩️ Undo/Redo
- 🗑️ Clear board
- 💾 Export PNG

### **5. Learning Paths**

**Browse Paths:**
```javascript
GET /api/learning-paths?category=Web Development&level=beginner
```

**Enroll in Path:**
```javascript
POST /api/learning-paths/:pathId/enroll
```

**Complete Lesson:**
```javascript
POST /api/learning-paths/:pathId/lesson/:moduleIndex/:lessonIndex/complete
Body: { timeSpent: 45 }
```

**Submit Quiz:**
```javascript
POST /api/learning-paths/:pathId/quiz/:moduleIndex/:lessonIndex
Body: { answers: [0, 2, 1, 3, 0] }
```

### **6. Gamification**

**User Progress:**
```javascript
GET /api/achievements/progress
Response: {
  level: 5,
  currentXP: 1250,
  nextLevelXP: 1500,
  rank: "Silver",
  achievements: [...]
}
```

**Leaderboard:**
```javascript
GET /api/achievements/leaderboard?type=weekly&limit=10
```

### **7. Analytics**

**User Dashboard:**
```javascript
GET /api/analytics/dashboard
Response: {
  earnings: { total: 500, thisMonth: 120 },
  sessions: { completed: 25, upcoming: 3 },
  reviews: { average: 4.8, total: 18 }
}
```

---

## 🔌 API Documentation

### **Base URL**
```
http://localhost:5001/api
```

### **Authentication Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Create new account | No |
| POST | `/auth/login` | Login to account | No |
| GET | `/auth/me` | Get current user | Yes |
| PUT | `/auth/update-profile` | Update profile | Yes |

### **Skills Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/skills` | Get all skills | No |
| GET | `/skills/:id` | Get single skill | No |
| POST | `/skills` | Create skill | Yes |
| PUT | `/skills/:id` | Update skill | Yes |
| DELETE | `/skills/:id` | Delete skill | Yes |

### **Booking Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/bookings` | Get user bookings | Yes |
| POST | `/bookings` | Create booking | Yes |
| PUT | `/bookings/:id` | Update booking | Yes |
| DELETE | `/bookings/:id` | Cancel booking | Yes |

### **Video Call Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/video-calls/create/:bookingId` | Create call | Yes |
| GET | `/video-calls/room/:roomId` | Get call details | Yes |
| POST | `/video-calls/join/:roomId` | Join call | Yes |
| POST | `/video-calls/leave/:roomId` | Leave call | Yes |

### **Whiteboard Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/whiteboards` | Create whiteboard | Yes |
| GET | `/whiteboards/:identifier` | Get whiteboard | Yes |
| POST | `/whiteboards/:roomId/clear` | Clear board | Yes |
| POST | `/whiteboards/:roomId/export` | Export board | Yes |

### **Learning Path Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/learning-paths` | Get all paths | No |
| POST | `/learning-paths/:pathId/enroll` | Enroll in path | Yes |
| POST | `/learning-paths/:pathId/lesson/:m/:l/complete` | Complete lesson | Yes |
| POST | `/learning-paths/:pathId/quiz/:m/:l` | Submit quiz | Yes |

---

## 👥 Contributing

We welcome contributions! Here's how:

### **1. Fork the Repository**
Click the "Fork" button on GitHub

### **2. Create a Feature Branch**
```bash
git checkout -b feature/amazing-feature
```

### **3. Make Your Changes**
```bash
# Make changes to code
git add .
git commit -m "Add amazing feature"
```

### **4. Push to Your Fork**
```bash
git push origin feature/amazing-feature
```

### **5. Open a Pull Request**
Go to GitHub and click "New Pull Request"

### **Contribution Guidelines**

- ✅ Write clear commit messages
- ✅ Add comments to complex code
- ✅ Test your changes thoroughly
- ✅ Follow existing code style
- ✅ Update documentation if needed
- ✅ One feature per pull request

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. MongoDB Connection Failed**
```
Error: MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Make sure MongoDB is running: `mongod`
- Check MongoDB URI in `.env`
- Try: `mongodb://127.0.0.1:27017/skillbarter` instead of `localhost`

#### **2. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5001
```
**Solution:**
- Change PORT in `backend/.env` to different number (e.g., 5002)
- Or kill the process using port: `lsof -ti:5001 | xargs kill -9` (Mac/Linux)

#### **3. CORS Errors**
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution:**
- Check `CLIENT_URL` in `backend/.env` matches your frontend URL
- Restart backend server after changing `.env`

#### **4. JWT Token Expired**
```
Error: jwt expired
```
**Solution:**
- Clear localStorage in browser
- Log in again to get new token

#### **5. Video Call Not Connecting**
**Solution:**
- Check if both users are on same network or have TURN server configured
- Ensure HTTPS in production (WebRTC requires secure context)
- Allow camera/microphone permissions in browser

#### **6. Whiteboard Not Syncing**
**Solution:**
- Check Socket.IO connection in browser console
- Ensure backend Socket.IO server is running
- Check firewall settings

---

## 📱 User Guide

### **For Students (Learning Skills)**

1. **Sign Up** → Create your account
2. **Browse Skills** → Find what you want to learn
3. **Check Credits** → View your credit balance
4. **Book Session** → Select time slot
5. **Join Call** → Click "Join Video Call" at booking time
6. **Learn** → Attend session, ask questions
7. **Review** → Rate your experience
8. **Repeat** → Book more sessions!

### **For Teachers (Providing Skills)**

1. **Sign Up** → Create your account
2. **Create Skill** → Add your teaching skills
3. **Set Availability** → Define your free time slots
4. **Get Booked** → Students book your sessions
5. **Join Call** → Meet students at booking time
6. **Teach** → Share your knowledge
7. **Earn Credits** → Get paid in platform credits
8. **Use Credits** → Learn from others!

### **For Both**

**Video Call Features:**
- Toggle camera/microphone
- Share your screen
- Send chat messages
- Open collaborative whiteboard
- End call when done

**Whiteboard Features:**
- Draw with pen tool
- Add shapes (rectangle, circle)
- Add text labels
- Choose colors and stroke width
- Undo/redo changes
- Clear board
- Export as image

---

## 🔒 Security Best Practices

### **For Developers**

- ✅ Never commit `.env` files
- ✅ Use strong JWT secret
- ✅ Hash all passwords with bcrypt
- ✅ Validate all user inputs
- ✅ Sanitize database queries
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Keep dependencies updated

### **For Users**

- ✅ Use strong passwords
- ✅ Don't share account credentials
- ✅ Log out after sessions
- ✅ Report suspicious activity
- ✅ Keep browser updated

---

## 📊 Database Schema Overview

### **Users Collection**
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  avatar: String (URL),
  bio: String,
  credits: Number (default: 50),
  role: String (user/admin),
  skills: [Skill IDs],
  level: Number,
  xp: Number,
  achievements: [Achievement IDs]
}
```

### **Skills Collection**
```javascript
{
  title: String,
  description: String,
  category: String,
  skillLevel: String,
  creditPrice: Number,
  sessionDuration: Number,
  provider: User ID,
  rating: Number,
  reviews: [Review IDs]
}
```

### **Bookings Collection**
```javascript
{
  student: User ID,
  provider: User ID,
  skill: Skill ID,
  startTime: Date,
  endTime: Date,
  status: String,
  creditAmount: Number
}
```

---

## 🎯 Roadmap

### **Phase 1: Core Features** ✅ COMPLETED
- [x] User authentication
- [x] Skill marketplace
- [x] Booking system
- [x] Credit transactions
- [x] Reviews & ratings

### **Phase 2: Real-Time Features** ✅ COMPLETED
- [x] Video call integration
- [x] Collaborative whiteboard
- [x] Text chat
- [x] Screen sharing

### **Phase 3: Learning Platform** ✅ COMPLETED
- [x] Learning paths
- [x] Progress tracking
- [x] Quizzes & projects
- [x] Certificates

### **Phase 4: Engagement** ✅ COMPLETED
- [x] Gamification (XP, levels, badges)
- [x] Analytics dashboard
- [x] Referral program
- [x] Leaderboards

### **Phase 5: Community** 🚧 IN PROGRESS
- [ ] Group sessions & workshops
- [ ] Discussion forums
- [ ] Social feed
- [ ] Direct messaging

### **Phase 6: Mobile** 📅 PLANNED
- [ ] React Native mobile app
- [ ] Push notifications
- [ ] Offline mode

---


### **Report Bugs**
Open an issue on GitHub with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## 🙏 Acknowledgments

- **Socket.IO** for real-time communication
- **WebRTC** for video calling
- **MongoDB** for flexible data storage
- **React** & **Tailwind** for beautiful UI
- All contributors who helped build this platform

---

## ⭐ Show Your Support

If you like this project, please give it a ⭐ on GitHub!

---

**Made with ❤️ by the SkillBarter Team**

