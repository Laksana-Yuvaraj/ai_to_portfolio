import { PortfolioData } from '../types';

/**
 * Utility to sanitize text for clean, natural speech synthesis without repetitions or placeholders.
 */
export const sanitizeNarrationText = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/\b(\w+)(?:\s+\1\b){2,}/gi, '$1') // remove 3+ repeated words
    .replace(/\bstandard\b/gi, '')             // remove aberrant standard repetitions
    .replace(/\s+/g, ' ')                      // normalize whitespace
    .replace(/\[.*?\]/g, '')                   // remove bracketed placeholders
    .trim();
};

export interface NarrationUnit {
  sectionId: 'hero' | 'about' | 'experience' | 'projects' | 'skills' | 'education' | 'contact';
  subIndex?: number;
  text: string;
}

/**
 * Parses the resume into structured narration units tagged with their matching DOM section ID
 * and sub-item indices for targeted visual section and card highlighting.
 */
export const parseStructuredResumeNarration = (data?: PortfolioData): NarrationUnit[] => {
  if (!data) {
    return [
      {
        sectionId: 'hero',
        text: 'Welcome to this interactive portfolio. Please explore the work experience, engineering projects, and technical skills below.'
      }
    ];
  }

  const units: NarrationUnit[] = [];
  const name = sanitizeNarrationText(data.name) || 'The candidate';
  const rawTitle = sanitizeNarrationText(data.title) || '';
  const cleanTitle = rawTitle.length > 85 ? rawTitle.split(/[|·•\n]/)[0].trim() : rawTitle;
  const summary = sanitizeNarrationText(data.summary);

  // 1. Hero / Introduction
  let intro = `Hello and welcome to my interactive portfolio. I am ${name}`;
  if (cleanTitle) intro += `, ${cleanTitle}`;
  intro += '.';
  units.push({ sectionId: 'hero', text: intro });

  // 2. About / Summary
  if (summary) {
    units.push({ sectionId: 'about', text: summary });
  }

  // 3. Work Experience (Item by item)
  if (data.experience && data.experience.length > 0) {
    units.push({
      sectionId: 'experience',
      text: 'Here is an overview of my professional career and work experience.'
    });

    data.experience.forEach((exp, idx) => {
      const role = sanitizeNarrationText(exp.role);
      const company = sanitizeNarrationText(exp.company);
      const dates = sanitizeNarrationText(exp.dates);
      const location = sanitizeNarrationText(exp.location);
      const desc = sanitizeNarrationText(exp.description);

      let expText = `${idx === 0 ? 'Most recently' : 'Additionally'}, I worked as ${role} at ${company}`;
      if (location) expText += ` in ${location}`;
      if (dates) expText += `, from ${dates}`;
      expText += '.';

      if (desc) {
        expText += ` ${desc}`;
        if (!desc.endsWith('.')) expText += '.';
      }

      if (exp.highlights && exp.highlights.length > 0) {
        const cleanHighlights = exp.highlights
          .map((h) => sanitizeNarrationText(h))
          .filter((h) => h.length > 0);
        if (cleanHighlights.length > 0) {
          expText += ` Key accomplishments included: ${cleanHighlights.join('. ')}.`;
        }
      }

      if (exp.skillsUsed && exp.skillsUsed.length > 0) {
        const cleanSkillsUsed = exp.skillsUsed
          .map((s) => sanitizeNarrationText(s))
          .filter((s) => s.length > 0);
        if (cleanSkillsUsed.length > 0) {
          expText += ` Technologies applied: ${cleanSkillsUsed.join(', ')}.`;
        }
      }

      units.push({ sectionId: 'experience', subIndex: idx, text: expText });
    });
  }

  // 4. Featured Projects (Item by item)
  if (data.projects && data.projects.length > 0) {
    units.push({
      sectionId: 'projects',
      text: "Now, let's explore my featured engineering projects and software products."
    });

    data.projects.forEach((proj, idx) => {
      const pTitle = sanitizeNarrationText(proj.title);
      const pDesc = sanitizeNarrationText(proj.description);
      const pMetrics = sanitizeNarrationText(proj.metrics);

      let projText = `Project ${idx + 1}: ${pTitle}.`;
      if (pMetrics) projText += ` Impact achieved: ${pMetrics}.`;
      if (pDesc) {
        projText += ` ${pDesc}`;
        if (!pDesc.endsWith('.')) projText += '.';
      }
      if (proj.tags && proj.tags.length > 0) {
        const cleanTags = proj.tags
          .map((t) => sanitizeNarrationText(t))
          .filter((t) => t.length > 0);
        if (cleanTags.length > 0) {
          projText += ` Engineered using ${cleanTags.join(', ')}.`;
        }
      }

      units.push({ sectionId: 'projects', subIndex: idx, text: projText });
    });
  }

  // 5. Skills
  if (data.skills && data.skills.length > 0) {
    data.skills.forEach((cat, idx) => {
      const catName = sanitizeNarrationText(cat.category);
      const items = cat.items
        ?.map((i) => sanitizeNarrationText(i))
        .filter((i) => i.length > 0);
      if (catName && items && items.length > 0) {
        units.push({
          sectionId: 'skills',
          subIndex: idx,
          text: `Under ${catName}, my technical proficiencies include ${items.join(', ')}.`
        });
      }
    });
  }

  // 6. Education & Certifications
  if (data.education && data.education.length > 0) {
    data.education.forEach((edu, idx) => {
      const degree = sanitizeNarrationText(edu.degree);
      const field = sanitizeNarrationText(edu.field);
      const inst = sanitizeNarrationText(edu.institution);
      const dates = sanitizeNarrationText(edu.dates);
      const gpa = sanitizeNarrationText(edu.gpa);

      let eduText = `In my education, I studied ${degree}`;
      if (field) eduText += ` in ${field}`;
      if (inst) eduText += ` at ${inst}`;
      if (dates) eduText += `, during ${dates}`;
      if (gpa) eduText += `, graduating with ${gpa}`;
      eduText += '.';
      units.push({ sectionId: 'education', subIndex: idx, text: eduText });
    });
  }

  if (data.certifications && data.certifications.length > 0) {
    const cleanCerts = data.certifications
      .map((c) => {
        const t = sanitizeNarrationText(c.title);
        const iss = sanitizeNarrationText(c.issuer);
        return iss ? `${t} issued by ${iss}` : t;
      })
      .filter((c) => c.length > 0);

    if (cleanCerts.length > 0) {
      units.push({
        sectionId: 'education',
        text: `I hold ${cleanCerts.length} industry certifications and simulations, including: ${cleanCerts.slice(0, 7).join('; ')}.`
      });
    }
  }

  // 7. Contact
  let closing = `Thank you for reviewing my full interactive portfolio.`;
  if (data.openToWork !== false) {
    closing += ` I am currently open to exciting new career opportunities and collaborations.`;
  }
  if (data.contact?.email) {
    closing += ` Feel free to contact me directly at ${data.contact.email} or connect through LinkedIn and GitHub.`;
  } else {
    closing += ` Please feel free to get in touch using the contact section below.`;
  }
  units.push({ sectionId: 'contact', text: closing });

  return units;
};

/**
 * Splits structured units into individual spoken sentence items, maintaining section tags.
 */
export interface SpokenSentenceItem {
  sectionId: 'hero' | 'about' | 'experience' | 'projects' | 'skills' | 'education' | 'contact';
  subIndex?: number;
  sentence: string;
}

export const getStructuredSentencesFromResume = (data?: PortfolioData, mode: 'full' | 'summary' = 'full'): SpokenSentenceItem[] => {
  if (mode === 'summary') {
    // Executive pitch structured into sections
    if (!data) return [{ sectionId: 'hero', sentence: 'Welcome to my interactive portfolio.' }];
    const name = sanitizeNarrationText(data.name) || 'The candidate';
    const rawTitle = sanitizeNarrationText(data.title) || '';
    const cleanTitle = rawTitle.length > 85 ? rawTitle.split(/[|·•\n]/)[0].trim() : rawTitle;
    const summary = sanitizeNarrationText(data.summary);

    const items: SpokenSentenceItem[] = [];
    items.push({
      sectionId: 'hero',
      sentence: `Hello! I am ${name}${cleanTitle ? `, ${cleanTitle}` : ''}.`
    });
    if (summary) {
      items.push({ sectionId: 'about', sentence: summary });
    }
    if (data.skills && data.skills.length > 0) {
      const topSkills = data.skills.flatMap((s) => s.items).slice(0, 8);
      if (topSkills.length > 0) {
        items.push({
          sectionId: 'skills',
          sentence: `My core technical competencies include ${topSkills.join(', ')}.`
        });
      }
    }
    if (data.experience && data.experience.length > 0) {
      const topExp = data.experience[0];
      const desc = sanitizeNarrationText(topExp.description) || (topExp.highlights && topExp.highlights[0]) || '';
      items.push({
        sectionId: 'experience',
        subIndex: 0,
        sentence: `In my recent professional work, I served as ${topExp.role} at ${topExp.company}${desc ? `, focusing on ${desc}` : ''}.`
      });
    }
    if (data.projects && data.projects.length > 0) {
      const topProj = data.projects[0];
      const pTitle = sanitizeNarrationText(topProj.title);
      const pDesc = sanitizeNarrationText(topProj.description);
      items.push({
        sectionId: 'projects',
        subIndex: 0,
        sentence: `One of my featured projects is ${pTitle}, where I worked on ${pDesc}.`
      });
    }
    if (data.education && data.education.length > 0) {
      const topEdu = data.education[0];
      const deg = sanitizeNarrationText(topEdu.degree);
      const field = sanitizeNarrationText(topEdu.field);
      const inst = sanitizeNarrationText(topEdu.institution);
      items.push({
        sectionId: 'education',
        subIndex: 0,
        sentence: `I completed my studies in ${field || deg} at ${inst}.`
      });
    }
    items.push({
      sectionId: 'contact',
      sentence: 'Thank you for reviewing my profile. Please feel free to explore my full showcase or get in touch!'
    });
    return items;
  }

  // Full mode
  const units = parseStructuredResumeNarration(data);
  const result: SpokenSentenceItem[] = [];

  units.forEach((u) => {
    const rawSentences = u.text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    rawSentences.forEach((sentence) => {
      result.push({
        sectionId: u.sectionId,
        subIndex: u.subIndex,
        sentence
      });
    });
  });

  return result;
};
export const parseFullResumeNarration = (data?: PortfolioData): string => {
  if (!data) {
    return 'Welcome to this interactive portfolio. Please explore the work experience, engineering projects, and technical skills below.';
  }

  const name = sanitizeNarrationText(data.name) || 'The candidate';
  const rawTitle = sanitizeNarrationText(data.title) || '';
  const cleanTitle = rawTitle.length > 85 ? rawTitle.split(/[|·•\n]/)[0].trim() : rawTitle;
  const summary = sanitizeNarrationText(data.summary);

  const sections: string[] = [];

  // 1. Introduction & Overview
  let intro = `Hello and welcome to my interactive portfolio. I am ${name}`;
  if (cleanTitle) {
    intro += `, ${cleanTitle}`;
  }
  intro += '.';
  if (summary) {
    intro += ` ${summary}`;
  }
  sections.push(intro);

  // 2. Comprehensive Work Experience (Every entry parsed!)
  if (data.experience && data.experience.length > 0) {
    sections.push(`Here is an overview of my professional career and work experience.`);
    
    data.experience.forEach((exp, idx) => {
      const role = sanitizeNarrationText(exp.role);
      const company = sanitizeNarrationText(exp.company);
      const dates = sanitizeNarrationText(exp.dates);
      const location = sanitizeNarrationText(exp.location);
      const desc = sanitizeNarrationText(exp.description);

      let expText = `${idx === 0 ? 'Most recently' : 'Additionally'}, I worked as ${role} at ${company}`;
      if (location) expText += ` in ${location}`;
      if (dates) expText += `, from ${dates}`;
      expText += '.';

      if (desc) {
        expText += ` ${desc}`;
        if (!desc.endsWith('.')) expText += '.';
      }

      // Parse all key bullet point highlights for this experience
      if (exp.highlights && exp.highlights.length > 0) {
        const cleanHighlights = exp.highlights
          .map((h) => sanitizeNarrationText(h))
          .filter((h) => h.length > 0);
        
        if (cleanHighlights.length > 0) {
          expText += ` Key accomplishments included: ${cleanHighlights.join('. ')}.`;
        }
      }

      // Parse technologies utilized in this role
      if (exp.skillsUsed && exp.skillsUsed.length > 0) {
        const cleanSkillsUsed = exp.skillsUsed
          .map((s) => sanitizeNarrationText(s))
          .filter((s) => s.length > 0);
        if (cleanSkillsUsed.length > 0) {
          expText += ` Technologies applied: ${cleanSkillsUsed.join(', ')}.`;
        }
      }

      sections.push(expText);
    });
  }

  // 3. Key Projects & Engineering Innovations (Every project parsed!)
  if (data.projects && data.projects.length > 0) {
    sections.push(`Now, let's explore my featured engineering projects and software products.`);

    data.projects.forEach((proj, idx) => {
      const pTitle = sanitizeNarrationText(proj.title);
      const pDesc = sanitizeNarrationText(proj.description);
      const pMetrics = sanitizeNarrationText(proj.metrics);

      let projText = `Project ${idx + 1}: ${pTitle}.`;
      if (pMetrics) {
        projText += ` Impact achieved: ${pMetrics}.`;
      }
      if (pDesc) {
        projText += ` ${pDesc}`;
        if (!pDesc.endsWith('.')) projText += '.';
      }

      if (proj.tags && proj.tags.length > 0) {
        const cleanTags = proj.tags
          .map((t) => sanitizeNarrationText(t))
          .filter((t) => t.length > 0);
        if (cleanTags.length > 0) {
          projText += ` Engineered using ${cleanTags.join(', ')}.`;
        }
      }

      sections.push(projText);
    });
  }

  // 4. Categorized Technical Capabilities (All categories parsed!)
  if (data.skills && data.skills.length > 0) {
    const skillSentences: string[] = [];
    data.skills.forEach((cat) => {
      const catName = sanitizeNarrationText(cat.category);
      const items = cat.items
        ?.map((i) => sanitizeNarrationText(i))
        .filter((i) => i.length > 0);
      if (catName && items && items.length > 0) {
        skillSentences.push(`Under ${catName}, my proficiencies include ${items.join(', ')}.`);
      }
    });

    if (skillSentences.length > 0) {
      sections.push(`Regarding my technical competencies: ${skillSentences.join(' ')}`);
    }
  }

  // 5. Academic Background (All education entries parsed!)
  if (data.education && data.education.length > 0) {
    const eduSentences: string[] = [];
    data.education.forEach((edu) => {
      const degree = sanitizeNarrationText(edu.degree);
      const field = sanitizeNarrationText(edu.field);
      const inst = sanitizeNarrationText(edu.institution);
      const dates = sanitizeNarrationText(edu.dates);
      const gpa = sanitizeNarrationText(edu.gpa);

      let eduText = `I studied ${degree}`;
      if (field) eduText += ` in ${field}`;
      if (inst) eduText += ` at ${inst}`;
      if (dates) eduText += `, during ${dates}`;
      if (gpa) eduText += `, graduating with ${gpa}`;
      eduText += '.';
      eduSentences.push(eduText);
    });

    if (eduSentences.length > 0) {
      sections.push(`In my academic background: ${eduSentences.join(' ')}`);
    }
  }

  // 6. Certifications & Professional Accreditations
  if (data.certifications && data.certifications.length > 0) {
    const cleanCerts = data.certifications
      .map((c) => {
        const t = sanitizeNarrationText(c.title);
        const iss = sanitizeNarrationText(c.issuer);
        return iss ? `${t} issued by ${iss}` : t;
      })
      .filter((c) => c.length > 0);

    if (cleanCerts.length > 0) {
      sections.push(
        `I hold ${cleanCerts.length} industry certifications and simulations, including: ${cleanCerts.slice(0, 7).join('; ')}.`
      );
    }
  }

  // 7. Contact & Conclusion
  let closing = `Thank you for reviewing my full interactive portfolio.`;
  if (data.openToWork !== false) {
    closing += ` I am currently open to exciting new career opportunities and collaborations.`;
  }
  if (data.contact?.email) {
    closing += ` Feel free to contact me directly at ${data.contact.email} or connect through LinkedIn and GitHub.`;
  } else {
    closing += ` Please feel free to get in touch using the contact section below.`;
  }
  sections.push(closing);

  return sections.join(' ').replace(/\s+/g, ' ').trim();
};

/**
 * Parses an executive elevator pitch summary (~45 seconds) from the resume.
 */
export const parseExecutiveSummaryNarration = (data?: PortfolioData): string => {
  if (!data) {
    return 'Welcome to my interactive portfolio. Feel free to explore my background, experience, and projects.';
  }

  const name = sanitizeNarrationText(data.name) || 'The candidate';
  const rawTitle = sanitizeNarrationText(data.title) || '';
  const cleanTitle = rawTitle.length > 85 ? rawTitle.split(/[|·•\n]/)[0].trim() : rawTitle;
  const summary = sanitizeNarrationText(data.summary);

  let text = `Hello! I am ${name}${cleanTitle ? `, ${cleanTitle}` : ''}. `;
  if (summary) {
    text += `${summary} `;
  }

  // Top Skills
  const topSkills = data.skills?.flatMap((s) => s.items).slice(0, 8);
  if (topSkills && topSkills.length > 0) {
    text += `My core technical competencies include ${topSkills.join(', ')}. `;
  }

  // Top Experience
  if (data.experience && data.experience.length > 0) {
    const topExp = data.experience[0];
    const role = sanitizeNarrationText(topExp.role);
    const comp = sanitizeNarrationText(topExp.company);
    const desc = sanitizeNarrationText(topExp.description) || (topExp.highlights && topExp.highlights[0]);
    text += `In my recent professional work, I served as ${role} at ${comp}${desc ? `, focusing on ${desc}` : ''}. `;
  }

  // Top Project
  if (data.projects && data.projects.length > 0) {
    const topProj = data.projects[0];
    const pTitle = sanitizeNarrationText(topProj.title);
    const pDesc = sanitizeNarrationText(topProj.description);
    text += `One of my featured projects is ${pTitle}, where I worked on ${pDesc}. `;
  }

  // Education
  if (data.education && data.education.length > 0) {
    const topEdu = data.education[0];
    const deg = sanitizeNarrationText(topEdu.degree);
    const field = sanitizeNarrationText(topEdu.field);
    const inst = sanitizeNarrationText(topEdu.institution);
    text += `I completed my studies in ${field || deg} at ${inst}. `;
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    text += `I have completed ${data.certifications.length} verified professional certifications and job simulations. `;
  }

  text += `Thank you for reviewing my profile. Please feel free to explore my full showcase or get in touch!`;
  return text.replace(/\s+/g, ' ').trim();
};
