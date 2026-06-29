import "dotenv/config";

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

console.log('🚀 Starting server...');

import authRoutes from "./routes/auth.routes.js";
console.log('✅ Auth routes imported successfully');

import postRoutes from "./routes/post.routes.js";
console.log('✅ Post routes imported successfully');

import commentRoutes from "./routes/comment.routes.js";
console.log('✅ Comment routes imported successfully');

import tagRoutes from "./routes/tag.routes.js";
console.log('✅ Tag routes imported successfully');

import uploadRoutes from "./routes/upload.routes.js";
console.log('✅ Upload routes imported successfully');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ UPDATED CORS - Allow Vercel and localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://mediahub-frontend.vercel.app',
  'https://mediahub-frontend-git-main.vercel.app',
  process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : [],
].flat();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ✅ Add a test route BEFORE your auth routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ Test route works!',
    timestamp: new Date().toISOString()
  });
});

console.log('📝 Mounting routes...');
app.use("/api/auth", authRoutes);
console.log('✅ Auth routes mounted at /api/auth');

app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
  res.send("MediaHub API is running");
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Routes mounted: /api/auth, /api/posts, /api/comments, /api/tags, /api/upload`);
  });
});