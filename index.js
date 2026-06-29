import "dotenv/config";

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ UPDATED CORS - Allow Vercel and localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://mediahub-frontend.vercel.app', // Replace with your actual Vercel URL
  'https://mediahub-frontend-git-main.vercel.app', // Preview deployments
  process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : [],
].flat(); // Flatten the array

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked origin:', origin); // Debug log
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
  res.send("MediaHub API is running");
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});