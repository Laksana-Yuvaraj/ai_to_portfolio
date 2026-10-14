import { GoogleGenAI } from '@google/genai';
import { PortfolioData, ProfessionArchetype } from '../src/types.js';
import mammoth from 'mammoth';

// Initialize SDK cleanly
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
export function cleanRepeats(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text
    .replace(/\b(\w+)(?:\s+\1\b){2,}/gi, '$1')
    .replace(/(\b[\w\s]{2,30}\b)(?:\s+\1\b){2,}/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  const standardMatches = cleaned.match(/\bstandard\b/gi);
  if (standardMatches && standardMatches.length > 3) {
    cleaned = cleaned.replace(/\bstandard\b/gi, '').replace(/\s+/g, ' ').trim();
  }

  return cleaned;
}
export async function parseResumeWithGemini(
  fileBuffer?: Buffer,
  mimeType?: string,
  fileName?: string,
  pastedText?: string
): Promise<PortfolioData> {
  const promptText = `You are an elite career intelligence AI and resume parser.
Analyze this uploaded resume and extract EVERY section into a rich, structured JSON object.

CRITICAL INSTRUCTIONS:
- Extract the ENTIRE resume thoroughly without omitting any section.
- Extract EVERY skill, EVERY job/internship, EVERY education degree, EVERY project, and EVERY certification.
- DO NOT repeat words or phrases in any field.
- The title must be a clean, concise professional headline (under 80 characters).
- Formulate a strong, detailed 2-4 sentence executive summary highlighting achievements and technical expertise.

Required JSON structure:
{
  "name": "Full Name",
  "title": "Professional Title / Target Role",
  "summary": "Compelling 2-4 sentence professional summary",
  "customTagline": "Punchy hero tagline",
  "profession": "One of: 'developer', 'designer', 'data_scientist', 'product_manager', 'marketer', 'executive', 'general'",
  "gender": "One of: 'female', 'male'",
  "contact": {
    "email": "email@example.com",
    "phone": "phone number",
    "location": "City, State / Country"
  },
  "links": {
    "github": "github.com/...",
    "linkedin": "linkedin.com/...",
    "website": "portfolio or personal site URL"
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "dates": "Start - End Date",
      "location": "Location",
      "description": "Concise summary of responsibilities and scope",
      "highlights": ["Key achievement 1", "Key achievement 2"],
      "skillsUsed": ["Skill 1", "Skill 2"]
    }
  ],
  "education": [
    {
      "institution": "School or University Name",
      "degree": "Degree (e.g. B.Sc., B.Tech, M.S.)",
      "field": "Field of Study",
      "dates": "Dates / Graduation Year",
      "gpa": "GPA or Score",
      "highlights": ["Honors, scholarships, activities"]
    }
  ],
  "skills": [
    {
      "category": "Category Name",
      "items": ["Item 1", "Item 2"]
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "Description of project",
      "tags": ["Tag 1", "Tag 2"],
      "demoUrl": "",
      "githubUrl": "",
      "metrics": ""
    }
  ],
  "certifications": [
    {
      "title": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Date or Year"
    }
  ]
}

Return ONLY valid JSON.`;

  const contents: any[] = [];
  const lowerFileName = (fileName || '').toLowerCase();

  if (pastedText && pastedText.trim().length > 0) {
    contents.push({ text: `Resume Content:\n${pastedText}\n\n${promptText}` });
  } else if (fileBuffer) {
    if (
      lowerFileName.endsWith('.docx') ||
      lowerFileName.endsWith('.doc') ||
      mimeType?.includes('word') ||
      mimeType?.includes('officedocument')
    ) {
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      contents.push({ text: `Resume Text (${fileName}):\n${docxResult.value}\n\n${promptText}` });
    } else if (
      lowerFileName.endsWith('.txt') ||
      mimeType?.startsWith('text/')
    ) {
      contents.push({ text: `Resume Text:\n${fileBuffer.toString('utf-8')}\n\n${promptText}` });
    } else {
      // PDF or Image
      const pdfBase64 = fileBuffer.toString('base64');
      contents.push({
        inlineData: {
          mimeType: (mimeType === 'application/pdf' || lowerFileName.endsWith('.pdf'))
            ? 'application/pdf'
            : 'image/jpeg',
          data: pdfBase64,
        },
      });
      contents.push({ text: promptText });
    }
  }

  const candidateModels = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
];
  let parsedRaw: any = null;
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      console.log(`🤖 Attempting resume parsing with ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim() || '';
      if (responseText.length > 0) {
        // Strip markdown backticks if returned
        const cleanedJson = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        parsedRaw = JSON.parse(cleanedJson);
        console.log(`✅ Successfully parsed resume using ${modelName}`);
        break;
      }
    } catch (err: any) {
      console.warn(`⚠️ Model ${modelName} parsing failed:`, err.message || err);
      lastError = err;
    }
  }

  if (!parsedRaw) {
    console.error('All AI models failed. Last error:', lastError);
    // Instead of silently giving Taylor Morgan, throw an explicit error or pass name if known
    throw new Error(`AI Parsing failed: ${lastError?.message || 'Check GEMINI_API_KEY in Vercel settings'}`);
  }

  return normalizePortfolioData(parsedRaw);
}
export function normalizePortfolioData(raw: any): PortfolioData {
  const name = cleanRepeats(raw.name) || 'Professional Portfolio';
  let title = cleanRepeats(raw.title) || 'AI & Data Science Specialist';
  // If title is excessively long or has runaway text, trim to first 90 chars
  if (title.length > 90) {
    title = title.split(/[|·•\n]/)[0].trim();
    if (title.length > 90) title = title.slice(0, 87) + '...';
  }

  const summary = cleanRepeats(raw.summary) || 'Experienced professional with a proven track record of driving technical impact and delivering results.';
  const customTagline = cleanRepeats(raw.customTagline) || `Innovating with ${title}`;

  // Archetype
  let profession: ProfessionArchetype = 'developer';
  const profLower = (raw.profession || '').toLowerCase();
  if (profLower.includes('data') || profLower.includes('ai') || profLower.includes('analyst') || profLower.includes('machine learning')) {
    profession = 'data_scientist';
  } else if (profLower.includes('design') || profLower.includes('ui') || profLower.includes('ux')) {
    profession = 'designer';
  } else if (profLower.includes('product') || profLower.includes('scrum') || profLower.includes('agile')) {
    profession = 'product_manager';
  } else if (profLower.includes('market') || profLower.includes('growth') || profLower.includes('seo')) {
    profession = 'marketer';
  } else if (profLower.includes('exec') || profLower.includes('director') || profLower.includes('cto') || profLower.includes('ceo')) {
    profession = 'executive';
  } else if (['developer', 'designer', 'data_scientist', 'product_manager', 'marketer', 'executive', 'general'].includes(profLower)) {
    profession = profLower as ProfessionArchetype;
  }

  // Gender detection
  const detectedGender: 'female' | 'male' =
    raw.gender === 'male' ? 'male' : 'female';

  // Normalize Skills
  let skills: { category: string; items: string[] }[] = [];
  if (Array.isArray(raw.skills)) {
    skills = raw.skills.map((cat: any) => ({
      category: cleanRepeats(cat.category || 'Core Skills'),
      items: Array.isArray(cat.items)
        ? cat.items.map((i: any) => cleanRepeats(String(i))).filter(Boolean)
        : [],
    })).filter((c) => c.items.length > 0);
  } else if (raw.skills && typeof raw.skills === 'object') {
    skills = Object.entries(raw.skills).map(([key, val]) => ({
      category: key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      items: Array.isArray(val)
        ? (val as any[]).map((i) => cleanRepeats(String(i))).filter(Boolean)
        : [],
    })).filter((c) => c.items.length > 0);
  }

  // Normalize Experience
  const rawExp = Array.isArray(raw.experience) ? raw.experience : [];
  const experience = rawExp.map((exp: any, index: number) => {
    const highlights = Array.isArray(exp.highlights)
      ? exp.highlights.map((h: any) => cleanRepeats(String(h))).filter(Boolean)
      : Array.isArray(exp.responsibilities)
      ? exp.responsibilities.map((r: any) => cleanRepeats(String(r))).filter(Boolean)
      : [];

    const description =
      cleanRepeats(exp.description) ||
      highlights[0] ||
      'Spearheaded development initiatives and delivered technical solutions.';

    const skillsUsed = Array.isArray(exp.skillsUsed)
      ? exp.skillsUsed.map((s: any) => cleanRepeats(String(s))).filter(Boolean)
      : [];

    return {
      id: `exp_${Date.now()}_${index}`,
      company: cleanRepeats(exp.company || 'Organization'),
      role: cleanRepeats(exp.role || exp.title || 'Specialist'),
      dates: cleanRepeats(exp.dates || exp.duration || '2023 - Present'),
      location: cleanRepeats(exp.location || ''),
      description,
      highlights,
      skillsUsed,
    };
  });

  // Normalize Education
  const rawEdu = Array.isArray(raw.education) ? raw.education : [];
  const education = rawEdu.map((edu: any, index: number) => {
    const highlights = Array.isArray(edu.highlights)
      ? edu.highlights.map((h: any) => cleanRepeats(String(h))).filter(Boolean)
      : edu.details
      ? [cleanRepeats(String(edu.details))]
      : [];

    return {
      id: `edu_${Date.now()}_${index}`,
      institution: cleanRepeats(edu.institution || edu.school || 'University'),
      degree: cleanRepeats(edu.degree || 'Degree'),
      field: cleanRepeats(edu.field || edu.major || ''),
      dates: cleanRepeats(edu.dates || edu.duration || ''),
      gpa: cleanRepeats(edu.gpa || edu.score || edu.grade || ''),
      highlights,
    };
  });

  // Normalize Projects
  const rawProj = Array.isArray(raw.projects) ? raw.projects : [];
  const projects = rawProj.map((proj: any, index: number) => {
    const tags = Array.isArray(proj.tags)
      ? proj.tags.map((t: any) => cleanRepeats(String(t))).filter(Boolean)
      : [];

    return {
      id: `proj_${Date.now()}_${index}`,
      title: cleanRepeats(proj.title || 'Project Title'),
      description: cleanRepeats(proj.description || 'Full-stack application and intelligence platform.'),
      tags,
      demoUrl: proj.demoUrl || '',
      githubUrl: proj.githubUrl || '',
      metrics: cleanRepeats(proj.metrics || ''),
      featured: index < 3,
    };
  });

  // Normalize Certifications
  const rawCerts = Array.isArray(raw.certifications) ? raw.certifications : [];
  const certifications = rawCerts.map((cert: any) => {
    if (typeof cert === 'string') {
      return {
        title: cleanRepeats(cert),
        issuer: 'Certification Authority',
        date: '',
      };
    }
    return {
      title: cleanRepeats(cert.title || cert.name || 'Certification'),
      issuer: cleanRepeats(cert.issuer || cert.organization || ''),
      date: cleanRepeats(cert.date || cert.year || ''),
    };
  });

  return {
    name,
    title,
    summary,
    customTagline,
    profession,
    avatarConfig: {
      archetype: profession,
      theme: profession === 'designer' ? 'pastel' : profession === 'executive' ? 'midnight' : profession === 'data_scientist' ? 'neon' : 'slate',
      intensity: 'balanced',
      animationsEnabled: true,
      gender: detectedGender,
    },
    contact: {
      email: raw.contact?.email ? cleanRepeats(raw.contact.email) : '',
      phone: raw.contact?.phone ? cleanRepeats(raw.contact.phone) : '',
      location: raw.contact?.location ? cleanRepeats(raw.contact.location) : '',
    },
    links: {
      github: raw.links?.github ? cleanRepeats(raw.links.github) : '',
      linkedin: raw.links?.linkedin ? cleanRepeats(raw.links.linkedin) : '',
      website: raw.links?.website ? cleanRepeats(raw.links.website) : '',
      twitter: raw.links?.twitter ? cleanRepeats(raw.links.twitter) : '',
    },
    experience,
    education,
    skills,
    projects,
    certifications,
  };
}

function createFallbackPortfolio(fileName?: string, textContent?: string): PortfolioData {
  return {
    name: 'Taylor Morgan',
    title: 'Senior Software Engineer & AI Systems Developer',
    summary: 'Full-stack software developer with expertise in scalable web applications, real-time data processing, and user-focused digital experiences.',
    profession: 'developer',
    customTagline: 'Engineering next-generation web platforms and AI agents.',
    avatarConfig: {
      archetype: 'developer',
      theme: 'slate',
      intensity: 'balanced',
      animationsEnabled: true,
      gender: 'female',
    },
    contact: {
      email: 'taylor.morgan@example.com',
      location: 'San Francisco, CA',
    },
    links: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
    experience: [
      {
        id: `exp_fallback_1`,
        company: 'Innovate Tech Corp',
        role: 'Senior Software Engineer',
        dates: '2023 - Present',
        description: 'Engineered mission-critical web platforms and REST microservices.',
        highlights: [
          'Reduced load times by 35% through bundle optimization.',
          'Built real-time data visualization pipelines.',
        ],
        skillsUsed: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      },
    ],
    education: [
      {
        id: `edu_fallback_1`,
        institution: 'Periyar University',
        degree: 'Bachelor of Science',
        field: 'Computer Science & AI',
        dates: '2020 - 2024',
        gpa: '8.8',
        highlights: ['Distinction with Honors'],
      },
    ],
    skills: [
      {
        category: 'Programming & Web',
        items: ['Python', 'TypeScript', 'React', 'Node.js', 'SQL', 'Tailwind CSS'],
      },
      {
        category: 'AI & Data Science',
        items: ['Machine Learning', 'Power BI', 'Pandas', 'NumPy', 'Data Visualization'],
      },
    ],
    projects: [
      {
        id: `proj_fallback_1`,
        title: 'Interactive AI Portfolio Platform',
        description: 'Automated portfolio website generator with animated vector avatars, voice narration, and live resume analytics.',
        tags: ['React', 'TypeScript', 'Tailwind CSS', 'AI'],
        featured: true,
      },
    ],
    certifications: [
      {
        title: 'AI & Machine Learning Foundations',
        issuer: 'AWS & IBM',
        date: '2025',
      },
    ],
  };
}
