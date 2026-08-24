require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./database');
const { initBlockchain } = require('./blockchain');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', routes);

// Serve static frontend files (React dist build)
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Fallback to React index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      // If index.html doesn't exist yet, return a simple welcome message
      res.status(200).send("Environmental Provenance Network API. (Frontend build not deployed yet)");
    }
  });
});

async function startServer() {
  // Connect to DB and initialize Blockchain
  await connectDB();
  await initBlockchain();

  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  Environmental Provenance Server running on port ${PORT}`);
    console.log(`  API Base URL: http://localhost:${PORT}/api`);
    console.log(`  Frontend:     http://localhost:${PORT}/`);
    console.log(`==================================================`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
