import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  readDB,
  writeDB,
  run7DayResumeCleanup,
  deleteResumeFileImmediately,
  getCleanupStats,
  softDeletePortfolio,
  restorePortfolio,
} from './server/db.js';
import { parseResumeWithGemini } from './server/geminiParser';
import { PortfolioVersion, ResumeRecord } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multer storage setup
const uploadsDir = path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `resume-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// Run 7-day cleanup on startup and schedule hourly check
console.log('🚀 Running initial 7-Day Resume Auto-Cleanup check...');
const initialCleanup = run7DayResumeCleanup();
if (initialCleanup.deletedCount > 0) {
  console.log(`🧹 Auto-deleted ${initialCleanup.deletedCount} expired resume file(s).`);
}

setInterval(() => {
  console.log('⏰ Executing scheduled 7-Day Resume Auto-Cleanup...');
  const res = run7DayResumeCleanup();
  if (res.deletedCount > 0) {
    console.log(`🧹 Scheduled job auto-deleted ${res.deletedCount} expired resume file(s).`);
  }
}, 60 * 60 * 1000); // Check every 1 hour

// --- API ROUTES ---

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- AUTHENTICATION & PERSONALISED ACCESS ROUTES ---

// List all available profiles (for easy account switching)
app.get('/api/auth/users', (req, res) => {
  const db = readDB();
  const usersWithCounts = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    createdAt: u.createdAt,
    portfolioCount: db.portfolios.filter((p) => p.userId === u.id).length,
  }));
  res.json({ users: usersWithCounts });
});

// Register new personalized user
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = readDB();

  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  const userId = `usr_${crypto.randomBytes(5).toString('hex')}`;
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

  const newUser = {
    id: userId,
    email: cleanEmail,
    name: name.trim(),
    username: cleanEmail.split('@')[0],
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  console.log(`👤 New user created: ${newUser.name} (${newUser.id})`);
  res.json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      username: newUser.username,
      createdAt: newUser.createdAt,
      portfolioCount: 0,
    },
  });
});

// Login existing user
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(401).json({ error: 'No account found with this email. Please create an account.' });
  }

  if (user.passwordHash && password) {
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    if (inputHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
  }

  const userPortfolios = db.portfolios.filter((p) => p.userId === user.id);

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
      portfolioCount: userPortfolios.length,
    },
  });
});

// Get currently authenticated user details
app.get('/api/auth/me', (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  if (!userId) {
    return res.status(401).json({ error: 'User ID is required.' });
  }

  const db = readDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const userPortfolios = db.portfolios.filter((p) => p.userId === user.id);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
      portfolioCount: userPortfolios.length,
    },
  });
});

// Get Cleanup Engine Status
app.get('/api/cleanup/status', (req, res) => {
  const stats = getCleanupStats();
  res.json(stats);
});

// Manually Trigger 7-Day Cleanup Worker (for live UI demonstration)
app.post('/api/admin/run-cleanup', (req, res) => {
  const result = run7DayResumeCleanup();
  const stats = getCleanupStats();
  res.json({
    success: true,
    message: `Cleanup completed. Auto-deleted ${result.deletedCount} expired resume file(s).`,
    result,
    stats,
  });
});

// Upload Resume & Parse into Portfolio Version
app.post('/api/resumes/upload', upload.single('resumeFile'), async (req, res) => {
  try {
    const file = req.file;
    const pastedText = req.body.pastedText as string;
    const userId = (req.body.userId as string) || 'usr_default';

    if (!file && (!pastedText || pastedText.trim().length === 0)) {
      return res.status(400).json({ error: 'Please upload a resume file (PDF/DOCX/TXT) or paste resume text.' });
    }

    let fileBuffer: Buffer | undefined;
    if (file) {
      fileBuffer = fs.readFileSync(file.path);
    }

    const fileName = file ? file.originalname : 'Pasted_Resume.txt';
    const mimeType = file ? file.mimetype : 'text/plain';

    console.log(`📄 Parsing resume "${fileName}" with Gemini AI...`);
    const parsedData = await parseResumeWithGemini(fileBuffer, mimeType, fileName, pastedText);

    const db = readDB();

    // Unique Portfolio ID
    const portfolioId = `port_${crypto.randomBytes(4).toString('hex')}`;
    const resumeId = `res_${crypto.randomBytes(4).toString('hex')}`;

    // Calculate version number for user
    const userPortfolios = db.portfolios.filter((p) => p.userId === userId);
    const versionNumber = userPortfolios.length + 1;
    const user = db.users.find((u) => u.id === userId);

    // 7 Days Expiration Timestamp
    const uploadedAtDate = new Date();
    const expiresAtDate = new Date(uploadedAtDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const newPortfolio: PortfolioVersion = {
      id: portfolioId,
      userId,
      userEmail: user?.email || '',
      userName: user?.name || '',
      resumeId,
      versionNumber,
      createdAt: uploadedAtDate.toISOString(),
      sourceResumeUploadDate: uploadedAtDate.toISOString(),
      sourceResumeFileName: fileName,
      sourceResumeDeleted: false,
      isCanonical: userPortfolios.length === 0, // Make canonical if first portfolio
      status: 'active',
      isDeleted: false,
      data: parsedData,
    };

    const newResumeRecord: ResumeRecord = {
      id: resumeId,
      userId,
      portfolioVersionId: portfolioId,
      fileName,
      fileSize: file ? file.size : Buffer.byteLength(pastedText || '', 'utf-8'),
      uploadedAt: uploadedAtDate.toISOString(),
      expiresAt: expiresAtDate.toISOString(),
      isDeleted: false,
      filePath: file ? file.path : undefined,
    };

    // If this is set as canonical, unmark others for user
    if (newPortfolio.isCanonical) {
      db.portfolios.forEach((p) => {
        if (p.userId === userId) p.isCanonical = false;
      });
      if (user) user.canonicalPortfolioId = portfolioId;
    }

    db.portfolios.unshift(newPortfolio);
    db.resumes.unshift(newResumeRecord);

    writeDB(db);

    console.log(`✅ Portfolio ${portfolioId} generated successfully!`);
    return res.json({
      success: true,
      portfolioVersion: newPortfolio,
      resumeRecord: newResumeRecord,
    });
  } catch (err: any) {
    console.error('Error during resume upload & parsing:', err);
    return res.status(500).json({ error: err.message || 'Failed to process resume.' });
  }
});

// List all portfolio versions for dashboard (STRICT USER ISOLATION + CREATOR AUDIT VISIBILITY)
app.get('/api/portfolios', (req, res) => {
  const db = readDB();
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  const user = db.users.find((u) => u.id === userId);
  const isCreator = Boolean(user?.isCreator || user?.email?.toLowerCase() === 'laksanayuvaraj6@gmail.com' || req.query.isCreator === 'true');
  const viewAll = req.query.viewAll === 'true';
  const includeDeleted = req.query.includeDeleted === 'true';

  // If creator requests Master View (all created & deleted portfolios), return complete database
  if (isCreator && viewAll) {
    return res.json({
      portfolios: db.portfolios,
      resumes: db.resumes,
      isCreator: true,
      isMasterView: true,
    });
  }

  if (!userId) {
    return res.json({
      portfolios: [],
      resumes: [],
      isCreator,
    });
  }

  // Strictly return portfolios belonging to this user
  // Non-deleted by default; if includeDeleted=true (or creator), include deleted versions too
  const portfolios = db.portfolios.filter((p) => {
    if (p.userId !== userId) return false;
    if (!includeDeleted && p.isDeleted) return false;
    return true;
  });
  const resumes = db.resumes.filter((r) => r.userId === userId);

  res.json({
    portfolios,
    resumes,
    isCreator,
  });
});

// Creator Master Audit endpoint: gives the app creator full visibility of all portfolios ever created & deleted
app.get('/api/creator/audit', (req, res) => {
  const db = readDB();
  const total = db.portfolios.length;
  const active = db.portfolios.filter((p) => !p.isDeleted).length;
  const deletedByUser = db.portfolios.filter((p) => p.isDeleted && p.deletedReason !== 'automatic_cleanup').length;
  const autoCleaned = db.portfolios.filter((p) => p.isDeleted && p.deletedReason === 'automatic_cleanup').length;

  res.json({
    summary: {
      totalPortfolios: total,
      activePortfolios: active,
      deletedByUser,
      autoCleaned,
      totalUsers: db.users.length,
    },
    portfolios: db.portfolios,
    users: db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      isCreator: u.isCreator,
    })),
    resumes: db.resumes,
  });
});

// Get single portfolio version by ID (Permanent URL Endpoint - REMAINS LIVE EVEN IF DELETED!)
app.get('/api/portfolios/:id', (req, res) => {
  const db = readDB();
  const portfolio = db.portfolios.find((p) => p.id === req.params.id);
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio version not found.' });
  }
  const resume = db.resumes.find((r) => r.id === portfolio.resumeId);

  res.json({
    portfolio,
    isDeleted: Boolean(portfolio.isDeleted),
    deletedAt: portfolio.deletedAt,
    deletedReason: portfolio.deletedReason,
    resumeDeleted: portfolio.sourceResumeDeleted,
    resumeDeletedAt: portfolio.sourceResumeDeletedAt,
    expiresAt: resume?.expiresAt,
  });
});

// Get user canonical portfolio
app.get('/api/canonical/:userId', (req, res) => {
  const db = readDB();
  const userId = req.params.userId;
  const portfolio = db.portfolios.find((p) => p.userId === userId && p.isCanonical) || db.portfolios.find((p) => p.userId === userId);
  
  if (!portfolio) {
    return res.status(404).json({ error: 'No portfolio found for user.' });
  }

  res.json({ portfolio });
});

// Mark portfolio version as Canonical
app.post('/api/portfolios/:id/canonical', (req, res) => {
  const db = readDB();
  const portfolioId = req.params.id;
  const target = db.portfolios.find((p) => p.id === portfolioId);

  if (!target) {
    return res.status(404).json({ error: 'Portfolio not found.' });
  }

  db.portfolios.forEach((p) => {
    if (p.userId === target.userId) {
      p.isCanonical = p.id === portfolioId;
    }
  });

  const user = db.users.find((u) => u.id === target.userId);
  if (user) {
    user.canonicalPortfolioId = portfolioId;
  }

  writeDB(db);
  res.json({ success: true, canonicalPortfolioId: portfolioId });
});

// Update Portfolio Data & Avatar/Theme Config
app.put('/api/portfolios/:id/data', (req, res) => {
  const db = readDB();
  const portfolio = db.portfolios.find((p) => p.id === req.params.id);

  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio not found.' });
  }

  if (req.body.data) {
    portfolio.data = {
      ...portfolio.data,
      ...req.body.data,
      avatarConfig: {
        ...portfolio.data.avatarConfig,
        ...(req.body.data.avatarConfig || {}),
      },
    };
  }

  writeDB(db);
  res.json({ success: true, portfolio });
});

// Manually Delete Resume File Immediately
app.delete('/api/resumes/:id', (req, res) => {
  const resumeId = req.params.id;
  const success = deleteResumeFileImmediately(resumeId);

  if (!success) {
    return res.status(404).json({ error: 'Resume record not found.' });
  }

  res.json({
    success: true,
    message: 'Resume file deleted immediately. Associated portfolio remains active and accessible forever.',
  });
});

// Delete Portfolio Version (SOFT DELETION: permanent link remains active and accessible forever!)
app.delete('/api/portfolios/:id', (req, res) => {
  const portfolioId = req.params.id;
  const reason = (req.body?.reason as any) || 'user_deleted';
  const result = softDeletePortfolio(portfolioId, reason);

  if (!result.success) {
    return res.status(404).json({ error: 'Portfolio not found.' });
  }

  res.json({
    success: true,
    message: 'Portfolio removed from active list. The public link remains live forever and record is saved in creator audit!',
    portfolio: result.portfolio,
  });
});

// Restore a deleted portfolio back to active dashboard
app.post('/api/portfolios/:id/restore', (req, res) => {
  const portfolioId = req.params.id;
  const result = restorePortfolio(portfolioId);

  if (!result.success) {
    return res.status(404).json({ error: 'Portfolio not found.' });
  }

  res.json({
    success: true,
    message: 'Portfolio restored to active dashboard.',
    portfolio: result.portfolio,
  });
});

// Simulate / trigger auto-cleanup on a portfolio version
app.post('/api/portfolios/:id/auto-clean', (req, res) => {
  const portfolioId = req.params.id;
  const result = softDeletePortfolio(portfolioId, 'automatic_cleanup');

  if (!result.success) {
    return res.status(404).json({ error: 'Portfolio not found.' });
  }

  res.json({
    success: true,
    message: 'Portfolio marked as automatically cleaned. Public link remains live forever!',
    portfolio: result.portfolio,
  });
});

// --- VITE / STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
