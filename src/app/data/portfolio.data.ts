/**
 * Content TYPES + built-in fallback content.
 *
 * You normally don't edit this file: the live content is loaded at runtime
 * from public/content.json, and can be edited from the site itself via the
 * hidden editor (Ctrl+Alt+E, the faint edit icon in the footer, or ?edit in the URL).
 *
 * `slot` / `trueColor` values (0-5) pick which palette pigment a shape shows
 * in Colour mode before the visitor paints it.
 */

export interface SkillItem {
  name: string;
  /** 0-100 — how full the paint jar is. */
  level: number;
}

export interface SkillGroup {
  name: string;
  items: SkillItem[];
}

export interface Project {
  title: string;
  year: string;
  tagline: string;
  description: string;
  tech: string[];
  links: { label: string; url: string }[];
  slot: number;
}

export interface ExperienceItem {
  role: string;
  org: string;
  period: string;
  summary: string;
  highlights: string[];
}

export interface SocialLink {
  label: string;
  url: string;
  handle: string;
}

export interface Portfolio {
  name: string;
  initials: string;
  role: string;
  tagline: string;
  location: string;
  email: string;
  resumeUrl: string;
  about: string[];
  facts: { label: string; value: string }[];
  skills: SkillGroup[];
  projects: Project[];
  experience: ExperienceItem[];
  socials: SocialLink[];
}

export const PORTFOLIO: Portfolio = {
  name: 'Your Name',
  initials: 'YN',
  role: 'Frontend Developer & Designer',
  tagline: 'I build interfaces that feel hand-made — sketched in ink, finished in colour.',
  location: 'City, Country',
  email: 'hello@example.com',
  resumeUrl: '',
  about: [
    'This is where your story goes: a short paragraph about who you are, what you love building and the kind of problems you enjoy solving.',
    'A second paragraph can cover your background, what you are learning right now, or what you do when you are away from the keyboard.',
  ],
  facts: [
    { label: 'Based in', value: 'City, Country' },
    { label: 'Focus', value: 'Angular · UI engineering' },
    { label: 'Currently', value: 'Open to new projects' },
  ],
  skills: [
    {
      name: 'Frontend',
      items: [
        { name: 'Angular', level: 90 },
        { name: 'TypeScript', level: 85 },
        { name: 'HTML & CSS', level: 92 },
        { name: 'RxJS', level: 70 },
      ],
    },
    {
      name: 'Design',
      items: [
        { name: 'Figma', level: 75 },
        { name: 'SVG & Motion', level: 68 },
        { name: 'Accessibility', level: 72 },
      ],
    },
    {
      name: 'Tooling',
      items: [
        { name: 'Git', level: 80 },
        { name: 'Node.js', level: 60 },
        { name: 'Testing', level: 65 },
      ],
    },
  ],
  projects: [
    {
      title: 'Project One',
      year: '2026',
      tagline: 'One-line pitch of the project',
      description:
        'Two or three sentences on the problem, what you built and the result. Mention the part you are proudest of.',
      tech: ['Angular', 'TypeScript', 'SCSS'],
      links: [
        { label: 'Live', url: 'https://example.com' },
        { label: 'Code', url: 'https://github.com' },
      ],
      slot: 0,
    },
    {
      title: 'Project Two',
      year: '2025',
      tagline: 'One-line pitch of the project',
      description:
        'Two or three sentences on the problem, what you built and the result. Mention the part you are proudest of.',
      tech: ['Angular', 'Signals', 'Firebase'],
      links: [{ label: 'Code', url: 'https://github.com' }],
      slot: 3,
    },
    {
      title: 'Project Three',
      year: '2025',
      tagline: 'One-line pitch of the project',
      description:
        'Two or three sentences on the problem, what you built and the result. Mention the part you are proudest of.',
      tech: ['TypeScript', 'Canvas', 'Node.js'],
      links: [{ label: 'Live', url: 'https://example.com' }],
      slot: 1,
    },
    {
      title: 'Project Four',
      year: '2024',
      tagline: 'One-line pitch of the project',
      description:
        'Two or three sentences on the problem, what you built and the result. Mention the part you are proudest of.',
      tech: ['Figma', 'Design system'],
      links: [],
      slot: 4,
    },
  ],
  experience: [
    {
      role: 'Job Title',
      org: 'Company Name',
      period: '2025 — Present',
      summary: 'One sentence about the team and what you own there.',
      highlights: ['A measurable achievement', 'Something you shipped'],
    },
    {
      role: 'Job Title',
      org: 'Company Name',
      period: '2023 — 2025',
      summary: 'One sentence about the team and what you own there.',
      highlights: ['A measurable achievement', 'Something you shipped'],
    },
    {
      role: 'Degree / Course',
      org: 'University or School',
      period: '2019 — 2023',
      summary: 'What you studied and anything notable.',
      highlights: ['Award, project or club'],
    },
  ],
  socials: [
    { label: 'GitHub', url: 'https://github.com/', handle: '@username' },
    { label: 'LinkedIn', url: 'https://linkedin.com/', handle: 'in/username' },
  ],
};
