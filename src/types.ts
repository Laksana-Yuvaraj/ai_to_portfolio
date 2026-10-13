/**
 * Core type definitions for Resume-to-Animated-Portfolio Generator
 */

export type ProfessionArchetype = 
  | 'developer' 
  | 'designer' 
  | 'data_scientist' 
  | 'product_manager' 
  | 'marketer' 
  | 'executive' 
  | 'general';

export type AvatarTheme = 'slate' | 'neon' | 'pastel' | 'midnight';
export type AnimationIntensity = 'calm' | 'balanced' | 'dynamic';

export type PortfolioAestheticStyle = 
  | 'modern'
  | 'minimalist'
  | 'corporate'
  | 'cosmic_stars'
  | 'golden_stardust'
  | 'violet_galaxy'
  | 'emerald_aurora'
  | 'crimson_starlight'
  | 'ocean_abyss'
  | 'solar_flare'
  | 'cyberpunk'
  | 'warm_editorial';

export type GenderType = 'female' | 'male';

export interface AvatarConfig {
  archetype: ProfessionArchetype;
  theme: AvatarTheme;
  intensity: AnimationIntensity;
  animationsEnabled: boolean;
  gender?: GenderType;
  hasGlasses?: boolean;
  primaryColor?: string;
  accessory?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  dates: string;
  location?: string;
  description: string;
  highlights: string[];
  skillsUsed: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  dates: string;
  gpa?: string;
  highlights?: string[];
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  demoUrl?: string;
  githubUrl?: string;
  metrics?: string;
  featured?: boolean;
}

export interface CertificationItem {
  title: string;
  issuer: string;
  date: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  location?: string;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  website?: string;
  twitter?: string;
  portfolio?: string;
}

export interface PortfolioData {
  name: string;
  title: string;
  summary: string;
  profession: ProfessionArchetype;
  avatarConfig: AvatarConfig;
  aestheticStyle?: PortfolioAestheticStyle;
  contact: ContactInfo;
  links: SocialLinks;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  projects: ProjectItem[];
  certifications?: CertificationItem[];
  customTagline?: string;
  openToWork?: boolean;
}

export interface PortfolioVersion {
  id: string; // e.g. "port_a1b2c3d4"
  userId: string;
  userEmail?: string;
  userName?: string;
  resumeId: string;
  versionNumber: number;
  createdAt: string; // ISO date
  sourceResumeUploadDate: string;
  sourceResumeFileName: string;
  sourceResumeDeleted: boolean;
  sourceResumeDeletedAt?: string;
  isCanonical: boolean;
  status: 'active' | 'archived';
  isDeleted?: boolean; // When deleted wantedly by user or automatically
  deletedAt?: string;
  deletedReason?: 'user_deleted' | 'automatic_cleanup';
  data: PortfolioData;
}

export interface ResumeRecord {
  id: string;
  userId: string;
  portfolioVersionId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  expiresAt: string; // ISO date (7 days from uploadedAt)
  isDeleted: boolean;
  deletedAt?: string;
  filePath?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  isCreator?: boolean;
  passwordHash?: string;
  createdAt?: string;
  canonicalPortfolioId?: string;
  portfolioCount?: number;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface CleanupStats {
  totalResumesUploaded: number;
  activeResumeFiles: number;
  autoDeletedResumeFiles: number;
  lastCleanupRunAt?: string;
  nextCleanupDueAt?: string;
}
