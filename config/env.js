import "dotenv/config";

const required = (key, fallback = undefined) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: (process.env.NODE_ENV || "development") === "production",
  port: parseInt(process.env.PORT || "5000", 10),

  mongoUrl: required("MONGO_URI"),
  frontendURI: process.env.FRONTEND_URI || "http://localhost:5173",
  clientUrl: process.env.FRONTEND_URI || "http://localhost:5173",

  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  jwtAccessSecret: required("JWT_SECRET"),

  cloudinaryApiKey: required("CLOUD_API_KEY"),
  cloudinaryApiSecret: required("CLOUD_API_SECRET"),
  cloudinaryCloudName: required("CLOUD_NAME"),

  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER,
};