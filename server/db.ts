import fs from 'fs';
import path from 'path';
import { PortfolioVersion, ResumeRecord, User, CleanupStats, PortfolioData } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface DatabaseSchema {
  users: User[];
  resumes: ResumeRecord[];
  portfolios: PortfolioVersion[];
  lastCleanupRunAt?: string;
}

// Seed Initial Sample Portfolio Data so the app comes alive instantly
const sampleDeveloperPortfolio: PortfolioData = {
  name: 'Alex Rivers',
  title: 'Senior Full-Stack & AI Systems Engineer',
  summary: 'Full-stack software architect specializing in scalable Node.js microservices, React 19, vector database search, and real-time LLM web applications.',
  profession: 'developer',
  customTagline: 'Building high-throughput AI interfaces and scalable distributed systems.',
  avatarConfig: {
    archetype: 'developer',
    theme: 'slate',
    intensity: 'balanced',
    animationsEnabled: true,
    primaryColor: '#3b82f6',
  },
  contact: {
    email: 'alex.rivers.dev@example.com',
    phone: '+1 (555) 382-9102',
    location: 'San Francisco, CA',
  },
  links: {
    github: 'https://github.com/alexrivers',
    linkedin: 'https://linkedin.com/in/alexrivers-dev',
    website: 'https://alexrivers.io',
    twitter: 'https://x.com/alexrivers_code',
  },
  experience: [
    {
      id: 'exp_1',
      company: 'Aether Cloud Systems',
      role: 'Lead AI Infrastructure Engineer',
      dates: '2023 - Present',
      location: 'San Francisco, CA',
      description: 'Directed the engineering team building automated Gemini AI agent pipelines serving 2M+ active sessions daily.',
      highlights: [
        'Reduced server latency by 42% by migrating sync APIs to streaming WebSockets and Edge workers.',
        'Architected real-time resume extraction engine processing 100k+ documents with 99.4% precision.',
        'Mentored a team of 8 full-stack engineers across React, TypeScript, and Node.js microservices.',
      ],
      skillsUsed: ['TypeScript', 'Node.js', 'React', 'Gemini API', 'Docker', 'Redis'],
    },
    {
      id: 'exp_2',
      company: 'Vanguard Cybernetics',
      role: 'Senior Full-Stack Developer',
      dates: '2021 - 2023',
      location: 'Austin, TX',
      description: 'Engineered high-performance client dashboards and microservices for real-time telemetry monitoring.',
      highlights: [
        'Developed interactive SVG canvas node graphs for infrastructure monitoring.',
        'Implemented end-to-end OAuth2 authentication with multi-tenant workspace permissions.',
      ],
      skillsUsed: ['React', 'Tailwind CSS', 'Express', 'PostgreSQL', 'GraphQL'],
    },
  ],
  education: [
    {
      id: 'edu_1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science & Artificial Intelligence',
      dates: '2017 - 2021',
      gpa: '3.92',
      highlights: ['Magna Cum Laude', 'President of ACM Chapter', 'Algorithms Research Assistant'],
    },
  ],
  skills: [
    {
      category: 'Core Engineering',
      items: ['TypeScript', 'JavaScript (ES2024)', 'Node.js', 'React 19', 'Python', 'Go', 'HTML5/CSS3'],
    },
    {
      category: 'AI & Backend',
      items: ['Gemini 3.6 API', 'Express.js', 'REST & GraphQL', 'WebSockets', 'Vector DBs (Qdrant)', 'PostgreSQL'],
    },
    {
      category: 'DevOps & Tooling',
      items: ['Docker & Cloud Run', 'Vite', 'Git/GitHub Actions', 'Tailwind CSS v4', 'Motion / Framer', 'Jest & Playwright'],
    },
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'NeuralSynth Live Audio Studio',
      description: 'Browser-based generative AI synth streaming 24kHz real-time audio over WebSockets with visual equalizer spectrum.',
      tags: ['React', 'TypeScript', 'Web Audio API', 'Gemini Live API'],
      demoUrl: 'https://example.com/neuralsynth',
      githubUrl: 'https://github.com/alexrivers/neuralsynth',
      metrics: 'Over 45,000 active monthly sessions',
      featured: true,
    },
    {
      id: 'proj_2',
      title: 'DocuPulse - Automated Document Parsing',
      description: 'High-speed OCR & structured JSON extraction service built with Node.js and Gemini Multimodal vision.',
      tags: ['Node.js', 'Gemini API', 'Express', 'Tailwind'],
      demoUrl: 'https://example.com/docupulse',
      githubUrl: 'https://github.com/alexrivers/docupulse',
      metrics: 'Processes 1,200 pages/min',
      featured: true,
    },
  ],
  certifications: [
    {
      title: 'Google Cloud Professional Cloud Architect',
      issuer: 'Google Cloud',
      date: '2024',
    },
    {
      title: 'AWS Certified Solutions Architect - Professional',
      issuer: 'Amazon Web Services',
      date: '2023',
    },
  ],
};

const sampleDesignerPortfolio: PortfolioData = {
  name: 'Maya Lin',
  title: 'Lead Product & Interactive Motion Designer',
  summary: 'Crafting spatial user experiences, fluid motion systems, and accessible design tokens for next-generation creative tools.',
  profession: 'designer',
  customTagline: 'Designing delightful interfaces and human-centered motion design.',
  avatarConfig: {
    archetype: 'designer',
    theme: 'pastel',
    intensity: 'dynamic',
    animationsEnabled: true,
    primaryColor: '#ec4899',
  },
  contact: {
    email: 'maya.lin.design@example.com',
    phone: '+1 (555) 839-2041',
    location: 'New York, NY',
  },
  links: {
    github: 'https://github.com/mayalin-design',
    linkedin: 'https://linkedin.com/in/mayalin-design',
    website: 'https://mayalin.design',
  },
  experience: [
    {
      id: 'exp_d1',
      company: 'Lumina Creative Labs',
      role: 'Staff Product Designer',
      dates: '2022 - Present',
      location: 'New York, NY',
      description: 'Led visual refresh and component design system for dynamic canvas editing platform.',
      highlights: [
        'Created a unified motion palette and token architecture used across 12 product surface teams.',
        'Increased user onboarding conversion by 34% through interactive micro-illustrations.',
      ],
      skillsUsed: ['Figma', 'Design Systems', 'Motion Graphics', 'SVG Animation', 'Tailwind'],
    },
  ],
  education: [
    {
      id: 'edu_d1',
      institution: 'Rhode Island School of Design (RISD)',
      degree: 'Bachelor of Fine Arts',
      field: 'Graphic & Interactive Media Design',
      dates: '2018 - 2022',
      highlights: ['First Class Honors', 'Annual Design Exhibition Winner'],
    },
  ],
  skills: [
    {
      category: 'Design & Motion',
      items: ['UX/UI Design', 'Figma', 'Interactive Prototyping', 'Design Systems', 'Lottie & Rive', 'SVG Animation'],
    },
    {
      category: 'Frontend Capabilities',
      items: ['HTML5/CSS3', 'Tailwind CSS', 'Framer Motion', 'Component Architecture', 'Accessibility (WCAG AA)'],
    },
  ],
  projects: [
    {
      id: 'proj_d1',
      title: 'Kinetix Design Token Studio',
      description: 'Open-source visual editor to create, test, and export animated CSS variables and tokens.',
      tags: ['Design System', 'Figma Plugin', 'React', 'Tailwind'],
      demoUrl: 'https://example.com/kinetix',
      metrics: 'Featured on Product Hunt Top 3',
      featured: true,
    },
  ],
};

function getInitialDB(): DatabaseSchema {
  const creatorUser: User = {
    id: 'usr_creator',
    email: 'laksanayuvaraj6@gmail.com',
    name: 'Laksana Yuvaraj',
    username: 'laksanayuvaraj',
    isCreator: true,
    canonicalPortfolioId: 'port_sample_dev',
  };

  const defaultUser: User = {
    id: 'usr_default',
    email: 'user@example.com',
    name: 'Alex Rivers',
    username: 'alexrivers',
    canonicalPortfolioId: 'port_sample_dev',
  };

  const sampleDevVersion: PortfolioVersion = {
    id: 'port_sample_dev',
    userId: 'usr_creator',
    userEmail: 'laksanayuvaraj6@gmail.com',
    userName: 'Laksana Yuvaraj',
    resumeId: 'res_sample_1',
    versionNumber: 1,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    sourceResumeUploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sourceResumeFileName: 'Alex_Rivers_Resume_2026.pdf',
    sourceResumeDeleted: false,
    isCanonical: true,
    status: 'active',
    isDeleted: false,
    data: sampleDeveloperPortfolio,
  };

  const sampleDesignVersion: PortfolioVersion = {
    id: 'port_sample_design',
    userId: 'usr_default',
    userEmail: 'user@example.com',
    userName: 'Alex Rivers',
    resumeId: 'res_sample_2',
    versionNumber: 2,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    sourceResumeUploadDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    sourceResumeFileName: 'Maya_Lin_Product_Design.docx',
    sourceResumeDeleted: true,
    sourceResumeDeletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isCanonical: false,
    status: 'active',
    isDeleted: true, // Example of deleted portfolio whose link remains live!
    deletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    deletedReason: 'automatic_cleanup',
    data: sampleDesignerPortfolio,
  };

  const sampleResumeDev: ResumeRecord = {
    id: 'res_sample_1',
    userId: 'usr_creator',
    portfolioVersionId: 'port_sample_dev',
    fileName: 'Alex_Rivers_Resume_2026.pdf',
    fileSize: 245100,
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // expires in 4 days
    isDeleted: false,
    filePath: path.join(UPLOADS_DIR, 'res_sample_1.pdf'),
  };

  const sampleResumeDesign: ResumeRecord = {
    id: 'res_sample_2',
    userId: 'usr_default',
    portfolioVersionId: 'port_sample_design',
    fileName: 'Maya_Lin_Product_Design.docx',
    fileSize: 182000,
    uploadedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // expired 1 day ago
    isDeleted: true,
    deletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return {
    users: [creatorUser, defaultUser],
    resumes: [sampleResumeDev, sampleResumeDesign],
    portfolios: [sampleDevVersion, sampleDesignVersion],
    lastCleanupRunAt: new Date().toISOString(),
  };
}

export function readDB(): DatabaseSchema {
  try {
    let db: DatabaseSchema;
    if (!fs.existsSync(DB_FILE)) {
      db = getInitialDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } else {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content) as DatabaseSchema;
    }

    // Ensure Creator user (Laksana Yuvaraj) exists and is marked as creator
    let creator = db.users.find((u) => u.email.toLowerCase() === 'laksanayuvaraj6@gmail.com');
    if (!creator) {
      creator = {
        id: 'usr_creator',
        email: 'laksanayuvaraj6@gmail.com',
        name: 'Laksana Yuvaraj',
        username: 'laksanayuvaraj',
        isCreator: true,
        canonicalPortfolioId: 'port_sample_dev',
      };
      db.users.unshift(creator);
    } else {
      creator.isCreator = true;
    }

    // Ensure all portfolios have proper user details and isDeleted flag
    db.portfolios.forEach((p) => {
      if (p.isDeleted === undefined) {
        p.isDeleted = false;
      }
      if (!p.userEmail || !p.userName) {
        const u = db.users.find((user) => user.id === p.userId);
        if (u) {
          p.userEmail = u.email;
          p.userName = u.name;
        }
      }
    });

    return db;
  } catch (err) {
    console.error('Error reading DB, re-initializing:', err);
    const initial = getInitialDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

export function writeDB(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

/**
 * Soft deletes a portfolio version (so its permanent link remains 100% live forever,
 * but it is moved to deleted/archived state and visible in the creator audit view).
 */
export function softDeletePortfolio(
  portfolioId: string,
  reason: 'user_deleted' | 'automatic_cleanup' = 'user_deleted'
): { success: boolean; portfolio?: PortfolioVersion } {
  const db = readDB();
  const portfolio = db.portfolios.find((p) => p.id === portfolioId);
  if (!portfolio) return { success: false };

  portfolio.isDeleted = true;
  portfolio.deletedAt = new Date().toISOString();
  portfolio.deletedReason = reason;

  // If was canonical, assign canonical to another non-deleted portfolio for user
  if (portfolio.isCanonical) {
    portfolio.isCanonical = false;
    const remaining = db.portfolios.filter((p) => p.userId === portfolio.userId && !p.isDeleted);
    if (remaining.length > 0) {
      remaining[0].isCanonical = true;
      const user = db.users.find((u) => u.id === portfolio.userId);
      if (user) user.canonicalPortfolioId = remaining[0].id;
    }
  }

  writeDB(db);
  return { success: true, portfolio };
}

/**
 * Restores a deleted portfolio back to active.
 */
export function restorePortfolio(portfolioId: string): { success: boolean; portfolio?: PortfolioVersion } {
  const db = readDB();
  const portfolio = db.portfolios.find((p) => p.id === portfolioId);
  if (!portfolio) return { success: false };

  portfolio.isDeleted = false;
  portfolio.deletedAt = undefined;
  portfolio.deletedReason = undefined;

  writeDB(db);
  return { success: true, portfolio };
}

/**
 * Executes the strict 7-day resume auto-deletion logic.
 * Checks all non-deleted resumes. If Date.now() >= expiresAt,
 * deletes file from disk, updates record to isDeleted = true,
 * and preserves minimal metadata while ensuring portfolio remains 100% active.
 */
export function run7DayResumeCleanup(): { deletedCount: number; deletedIds: string[] } {
  const db = readDB();
  const now = Date.now();
  const deletedIds: string[] = [];

  db.resumes.forEach((resume) => {
    if (!resume.isDeleted) {
      const expiryTime = new Date(resume.expiresAt).getTime();
      if (now >= expiryTime) {
        // Delete physical file if present
        if (resume.filePath && fs.existsSync(resume.filePath)) {
          try {
            fs.unlinkSync(resume.filePath);
          } catch (err) {
            console.error(`Failed to delete resume file ${resume.filePath}:`, err);
          }
        }

        // Mark as deleted in database
        resume.isDeleted = true;
        resume.filePath = undefined;
        resume.deletedAt = new Date().toISOString();
        deletedIds.push(resume.id);

        // Update corresponding portfolio record metadata
        const portfolio = db.portfolios.find((p) => p.id === resume.portfolioVersionId);
        if (portfolio) {
          portfolio.sourceResumeDeleted = true;
          portfolio.sourceResumeDeletedAt = resume.deletedAt;
        }
      }
    }
  });

  db.lastCleanupRunAt = new Date().toISOString();
  writeDB(db);

  return {
    deletedCount: deletedIds.length,
    deletedIds,
  };
}

/**
 * Manually deletes a resume file immediately (e.g. user clicks "Delete Resume Now").
 */
export function deleteResumeFileImmediately(resumeId: string): boolean {
  const db = readDB();
  const resume = db.resumes.find((r) => r.id === resumeId);
  if (!resume) return false;

  if (resume.filePath && fs.existsSync(resume.filePath)) {
    try {
      fs.unlinkSync(resume.filePath);
    } catch (err) {
      console.error(`Error deleting file ${resume.filePath}:`, err);
    }
  }

  resume.isDeleted = true;
  resume.filePath = undefined;
  resume.deletedAt = new Date().toISOString();

  const portfolio = db.portfolios.find((p) => p.id === resume.portfolioVersionId);
  if (portfolio) {
    portfolio.sourceResumeDeleted = true;
    portfolio.sourceResumeDeletedAt = resume.deletedAt;
  }

  writeDB(db);
  return true;
}

export function getCleanupStats(): CleanupStats {
  const db = readDB();
  const total = db.resumes.length;
  const active = db.resumes.filter((r) => !r.isDeleted).length;
  const autoDeleted = db.resumes.filter((r) => r.isDeleted).length;

  return {
    totalResumesUploaded: total,
    activeResumeFiles: active,
    autoDeletedResumeFiles: autoDeleted,
    lastCleanupRunAt: db.lastCleanupRunAt,
    nextCleanupDueAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour interval check
  };
}
