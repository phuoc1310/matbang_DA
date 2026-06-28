import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import db from "./config/db.js";

import userRoutes from "./routes/user.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import listingRoutes from "./routes/listing.routes.js";
import interactionRoutes from "./routes/interaction.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

let PORT = process.env.PORT ? Number(process.env.PORT) : 3033;

try {
  const logStream = fs.createWriteStream('server.log', { flags: 'a' });
  const _log = console.log;
  const _err = console.error;
  console.log = (...args) => {
    try { logStream.write(new Date().toISOString() + ' ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n'); } catch(e){}
    _log(...args);
  };
  console.error = (...args) => {
    try { logStream.write(new Date().toISOString() + ' ERROR ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n'); } catch(e){}
    _err(...args);
  };
} catch (e) {
  
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
  res.redirect("/js/views/Trangchu.html");
});


app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.endsWith('.html')) {
    db.query(`INSERT INTO site_stats (key, value) VALUES ('visits', 1) ON CONFLICT (key) DO UPDATE SET value = site_stats.value + 1`)
      .catch(() => {});
  }
  next();
});

app.use(express.static(path.join(__dirname, "../FE")));

import uploadRoutes from "./routes/upload.routes.js";


app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/listings", listingRoutes); 
app.use("/api/interactions", interactionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));


app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
});


function startServer(port, maxRetries = 10) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use. Start aborted.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer(PORT);