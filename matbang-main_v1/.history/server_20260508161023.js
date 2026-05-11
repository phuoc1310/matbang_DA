import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import testRoutes from "./routes/test.js";
import userRoutes from "./routes/user.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import listingRoutes from "./routes/listing.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
const app = express();
// allow overriding port via environment (useful to run multiple instances)
let PORT = process.env.PORT ? Number(process.env.PORT) : 3033;
// Duplicate console output into a server.log file for easier debugging
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
  // ignore logging setup failures
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/js/views/Trangchu.html"));
});

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ===== Routes =====
app.use("/api", testRoutes); // test
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/listings", listingRoutes); // 🔥 sửa ở đây
app.use("/api/favorites", favoriteRoutes);
// ===== Chotot API =====
app.get("/api/ads", async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const url = `https://gateway.chotot.com/v1/public/ad-listing?cg=1000&limit=${limit}&offset=${offset}`;

    const r = await fetch(url);
    const json = await r.json();

    res.json({ ads: json.ads || [] });
  } catch (err) {
    res.status(500).json({ error: "Fetch API error" });
  }
});

// ===== START =====
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