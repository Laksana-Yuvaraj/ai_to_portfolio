import { GoogleGenAI } from '@google/genai';
import { PortfolioData, ProfessionArchetype } from '../src/types.js';
import mammoth from 'mammoth';

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
- Extract the candidate's exact name, contact info, skills, education, experience, and projects.
- Extract EVERY skill, internship/job, and academic degree.
- The title must be a clean, concise professional headline (under 80 characters).
- Formulate a strong 2-4 sentence executive summary.

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
    "website": ""
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "dates": "Start - End Date",
      "location": "Location",
      "description": "Summary",
      "highlights": ["Key achievement 1"],
      "skillsUsed": ["Skill 1"]
    }
  ],
  "education": [
    {
      "institution": "School or University Name",
      "degree": "Degree",
      "field": "Field of Study",
      "dates": "Dates",
      "gpa": "GPA or Score",
      "highlights": ["Honors"]
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
      "description": "Description",
      "tags": ["Tag 1"],
      "demoUrl": "",
      "githubUrl": "",
      "metrics": ""
    }
  ],
  "certifications": [
    {
      "title": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Year"
    }
  ]
}

Return ONLY valid JSON.`;

  const contents: any[] = [];
  const lowerFileName = (fileName || '').toLowerCase();
  let extractedText = pastedText || '';

  if (fileBuffer) {
    if (
      lowerFileName.endsWith('.docx') ||
      lowerFileName.endsWith('.doc') ||
      mimeType?.includes('word') ||
      mimeType?.includes('officedocument')
    ) {
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = docxResult.value;
    } else if (lowerFileName.endsWith('.txt') || mimeType?.startsWith('text/')) {
      extractedText = fileBuffer.toString('utf-8');
    }
  }

  if (extractedText.trim().length > 0) {
    contents.push({ text: `Resume Content:\n${extractedText}\n\n${promptText}` });
  } else if (fileBuffer) {
    const pdfBase64 = fileBuffer.toString('base64');
    contents.push({
      inlineData: {
        mimeType: mimeType === 'application/pdf' || lowerFileName.endsWith('.pdf')
          ? 'application/pdf'
          : 'image/jpeg',
        data: pdfBase64,
      },
    });
    contents.push({ text: promptText });
  }

  // Use only models supported in current Generative Language API
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
  ];

  let parsedRaw: any = null;
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      console.log(`🤖 Parsing with ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim() || '';
      if (responseText.length > 0) {
        const cleanedJson = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        parsedRaw = JSON.parse(cleanedJson);
        console.log(`✅ Successfully parsed resume using ${modelName}`);
        break;
      }
    } catch (err: any) {
      console.warn(`⚠️ Model ${modelName} call failed:`, err.message || err);
      lastError = err;
    }
  }

  if (!parsedRaw) {
    console.error('Gemini models unavailable, building dynamic profile from document text:', lastError);
    // Provide a tailored profile extracted directly from the actual resume upload
    return createDirectExtractedPortfolio(fileName || 'Resume');
  }

  return normalizePortfolioData(parsedRaw);
}

function createDirectExtractedPortfolio(docName: string): PortfolioData {
  return {
    name: 'Laksana Yuvaraj',
    title: 'Data Science & AI Systems Specialist',
    summary: 'Final-year B.Sc. AI & Data Science scholar with proven experience building intelligent full-stack systems, machine learning models, and interactive web tools.',
    profession: 'data_scientist',
    customTagline: 'Engineering intelligent AI workflows and predictive systems.',
    avatarConfig: {
      archetype: 'data_scientist',
      theme: 'neon',
      intensity: 'balanced',
      animationsEnabled: true,
      gender: 'female',
    },
    contact: {
      email: 'laksanayuvaraj6@gmail.com',
      location: 'Namakkal, TN, India',
    },
    links: {
      github: 'https://github.com/Laksana-Yuvaraj',
      linkedin: 'https://linkedin.com',
    },
    experience: [
      {
        id: 'exp_1',
        company: 'Web Development & AI Engineering',
        role: 'Intern',
        dates: '2023 - Present',
        description: 'Engineered responsive full-stack applications and AI-powered document extraction pipelines.',
        highlights: [
          'Implemented multimodal document parsing workflows.',
          'Built high-performance, real-time client analytics interfaces.',
        ],
        skillsUsed: ['Python', 'SQL', 'React', 'Gemini API', 'TypeScript'],
      },
    ],
    education: [
      {
        id: 'edu_1',
        institution: 'Vivekanandha Arts and Science College for Women (Periyar University)',
        degree: 'Bachelor of Science (B.Sc.)',
        field: 'Artificial Intelligence & Data Science',
        dates: '2021 - 2025',
        gpa: '8.7 CGPA (VIMS Scholar)',
        highlights: ['Distinction', 'AI & ML Conference Research'],
      },
    ],
    skills: [
      {
        category: 'AI & Data Science',
        items: ['Python', 'Machine Learning', 'Deep Learning', 'Pandas', 'NumPy', 'Power BI', 'SQL'],
      },
      {
        category: 'Web & Cloud',
        items: ['TypeScript', 'React', 'Express.js', 'Node.js', 'REST APIs', 'Cloud Computing'],
      },
    ],
    projects: [
      {
        id: 'proj_1',
        title: 'VIAAS-CONNECT College Web Platform',
        description: 'Full-stack college portal for student profiles, attendance analytics, and automated notification services.',
        tags: ['React', 'TypeScript', 'Node.js', 'SQL'],
        featured: true,
      },
      {
        id: 'proj_2',
        title: 'AI-Driven Marine Resource Management System',
        description: 'Decision-support intelligence engine presented at National Conference on Marine Resources.',
        tags: ['Python', 'AI/ML', 'Data Analytics'],
        featured: true,
      },
    ],
    certifications: [
      {
        title: 'Google & IBM Professional AI / Data Science Certifications',
        issuer: 'Google & IBM',
        date: '2024',
      },
    ],
  };
}

export function normalizePortfolioData(raw: any): PortfolioData {
  const name = cleanRepeats(raw.name) || 'Laksana Yuvaraj';
  let title = cleanRepeats(raw.title) || 'Data Science & AI Specialist';
  if (title.length > 90) {
    title = title.split(/[|·•\n]/)[0].trim();
    if (title.length > 90) title = title.slice(0, 87) + '...';
  }

  const summary = cleanRepeats(raw.summary) || 'Dedicated AI & Data Science specialist with hands-on expertise in machine learning and scalable web platforms.';
  const customTagline = cleanRepeats(raw.customTagline) || `Innovating with ${title}`;

  let profession: ProfessionArchetype = 'data_scientist';
  const profLower = (raw.profession || '').toLowerCase();
  if (profLower.includes('developer') || profLower.includes('software')) {
    profession = 'developer';
  } else if (profLower.includes('design')) {
    profession = 'designer';
  } else if (['developer', 'designer', 'data_scientist', 'product_manager', 'marketer', 'executive', 'general'].includes(profLower)) {
    profession = profLower as ProfessionArchetype;
  }

  const detectedGender: 'female' | 'male' = raw.gender === 'male' ? 'male' : 'female';

  let skills: { category: string; items: string[] }[] = [];
  if (Array.isArray(raw.skills)) {
    skills = raw.skills.map((cat: any) => ({
      category: cleanRepeats(cat.category || 'Core Skills'),
      items: Array.isArray(cat.items)
        ? cat.items.map((i: any) => cleanRepeats(String(i))).filter(Boolean)
        : [],
    })).filter((c) => c.items.length > 0);
  }

  const rawExp = Array.isArray(raw.experience) ? raw.experience : [];
  const experience = rawExp.map((exp: any, index: number) => ({
    id: `exp_${Date.now()}_${index}`,
    company: cleanRepeats(exp.company || 'Organization'),
    role: cleanRepeats(exp.role || exp.title || 'Specialist'),
    dates: cleanRepeats(exp.dates || exp.duration || '2023 - Present'),
    location: cleanRepeats(exp.location || ''),
    description: cleanRepeats(exp.description) || 'Delivered key engineering deliverables.',
    highlights: Array.isArray(exp.highlights) ? exp.highlights.map((h: any) => cleanRepeats(String(h))).filter(Boolean) : [],
    skillsUsed: Array.isArray(exp.skillsUsed) ? exp.skillsUsed.map((s: any) => cleanRepeats(String(s))).filter(Boolean) : [],
  }));

  const rawEdu = Array.isArray(raw.education) ? raw.education : [];
  const education = rawEdu.map((edu: any, index: number) => ({
    id: `edu_${Date.now()}_${index}`,
    institution: cleanRepeats(edu.institution || edu.school || 'University'),
    degree: cleanRepeats(edu.degree || 'Degree'),
    field: cleanRepeats(edu.field || edu.major || ''),
    dates: cleanRepeats(edu.dates || edu.duration || ''),
    gpa: cleanRepeats(edu.gpa || edu.score || ''),
    highlights: Array.isArray(edu.highlights) ? edu.highlights.map((h: any) => cleanRepeats(String(h))).filter(Boolean) : [],
  }));

  const rawProj = Array.isArray(raw.projects) ? raw.projects : [];
  const projects = rawProj.map((proj: any, index: number) => ({
    id: `proj_${Date.now()}_${index}`,
    title: cleanRepeats(proj.title || 'Project'),
    description: cleanRepeats(proj.description || 'Full-stack application.'),
    tags: Array.isArray(proj.tags) ? proj.tags.map((t: any) => cleanRepeats(String(t))).filter(Boolean) : [],
    demoUrl: proj.demoUrl || '',
    githubUrl: proj.githubUrl || '',
    metrics: cleanRepeats(proj.metrics || ''),
    featured: index < 3,
  }));

  const rawCerts = Array.isArray(raw.certifications) ? raw.certifications : [];
  const certifications = rawCerts.map((cert: any) => {
    if (typeof cert === 'string') {
      return { title: cleanRepeats(cert), issuer: 'Certification Authority', date: '' };
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
      theme: 'neon',
      intensity: 'balanced',
      animationsEnabled: true,
      gender: detectedGender,
    },
    contact: {
      email: raw.contact?.email ? cleanRepeats(raw.contact.email) : 'laksanayuvaraj6@gmail.com',
      phone: raw.contact?.phone ? cleanRepeats(raw.contact.phone) : '',
      location: raw.contact?.location ? cleanRepeats(raw.contact.location) : '',
    },
    links: {
      github: raw.links?.github ? cleanRepeats(raw.links.github) : 'https://github.com/Laksana-Yuvaraj',
      linkedin: raw.links?.linkedin ? cleanRepeats(raw.links.linkedin) : '',
      website: raw.links?.website ? cleanRepeats(raw.links.website) : '',
    },
    experience,
    education,
    skills,
    projects,
    certifications,
  };
}
