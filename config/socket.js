import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

export function initSocket(httpServer, isOriginAllowed) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || isOriginAllowed(origin)) return cb(null, true);
        cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
    },
  });

  // Authenticate every socket with the same JWT the REST API uses
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const id = decoded.id || decoded._id || decoded.userId;
      if (!id) return next(new Error("Bad token"));
      socket.userId = String(id);
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  return io;
}

export function emitToUser(userId, event, payload = {}) {
  if (io) io.to(`user:${String(userId)}`).emit(event, payload);
}