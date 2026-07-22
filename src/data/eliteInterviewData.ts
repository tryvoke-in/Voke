export interface InterviewTypeItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  active: boolean;
  iconName: string;
  description: string;
}

export interface RoleItem {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  skills: string[];
  level: string;
}

export interface CompanyItem {
  id: string;
  name: string;
  logo: string;
  tier: 'FAANG' | 'Unicorn' | 'FinTech' | 'Enterprise' | 'AI Pioneer';
  domain: string;
  hq: string;
  description: string;
}

export interface InterviewRoundDef {
  roundId: string;
  roundNumber: number;
  title: string;
  subtitle: string;
  questionCount: number; // 8-9 questions
  durationMins: number;
  focusAreas: string[];
  description: string;
}

export const INTERVIEW_TYPES: InterviewTypeItem[] = [
  {
    id: 'internship',
    title: 'Internship Interview',
    subtitle: 'Entry Level & Student Campus Track',
    active: true,
    iconName: 'GraduationCap',
    description: 'Tailored for university students and early-career candidates aiming for summer or co-op engineering internships.'
  },
  {
    id: 'full-time',
    title: 'Full Time Interview',
    subtitle: 'New Grad & Associate Engineer Track',
    badge: 'Coming Soon',
    active: false,
    iconName: 'Briefcase',
    description: 'Comprehensive evaluation for full-time entry to mid-level engineering positions.'
  },
  {
    id: 'experienced',
    title: 'Experienced Interview',
    subtitle: 'Senior, Staff & Lead Engineer Track',
    badge: 'Coming Soon',
    active: false,
    iconName: 'Award',
    description: 'High-bar assessment for senior, staff, and principal engineers focusing on system design and leadership.'
  }
];

export const ELITE_ROLES: RoleItem[] = [
  {
    id: 'frontend-developer',
    title: 'Frontend Developer',
    category: 'Web Development',
    description: 'React, HTML/CSS, JavaScript/TypeScript, DOM Manipulation, Web Performance & Component Design.',
    iconName: 'Layout',
    skills: ['React', 'JavaScript / TypeScript', 'CSS & Web Perf', 'DOM Architecture'],
    level: 'Internship / Entry'
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    category: 'Software Engineering',
    description: 'API Design, Node.js/Python/Java, Databases, Data Structures, Server Logic & SQL.',
    iconName: 'Server',
    skills: ['Node.js / Python', 'REST APIs', 'SQL / Databases', 'Algorithms & Logic'],
    level: 'Internship / Entry'
  },
  {
    id: 'fullstack-developer',
    title: 'Full Stack Developer',
    category: 'Full Stack Engineering',
    description: 'End-to-End Web Development, Client-Server Communication, Databases & Modern Web Frameworks.',
    iconName: 'Layers',
    skills: ['React & Node.js', 'Database Integration', 'Full Stack Architecture', 'REST & GraphQL'],
    level: 'Internship / Entry'
  }
];

export const TOP_COMPANIES: CompanyItem[] = [
  {
    id: 'google',
    name: 'Google',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    tier: 'FAANG',
    domain: 'google.com',
    hq: 'Mountain View, CA',
    description: 'World-leading search, cloud, AI research, and high-scale infrastructure.'
  },
  {
    id: 'meta',
    name: 'Meta',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png',
    tier: 'FAANG',
    domain: 'meta.com',
    hq: 'Menlo Park, CA',
    description: 'Global social graph, virtual reality, open-source AI, and extreme scale systems.'
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
    tier: 'FAANG',
    domain: 'amazon.com',
    hq: 'Seattle, WA',
    description: 'E-commerce, AWS Cloud Computing, Leadership Principles & Customer Obsession.'
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    tier: 'FAANG',
    domain: 'microsoft.com',
    hq: 'Redmond, WA',
    description: 'Azure Cloud, Enterprise Platforms, Copilot AI, and OS systems.'
  },
  {
    id: 'apple',
    name: 'Apple',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg',
    tier: 'FAANG',
    domain: 'apple.com',
    hq: 'Cupertino, CA',
    description: 'Consumer hardware, iOS ecosystems, privacy, and precision engineering.'
  },
  {
    id: 'netflix',
    name: 'Netflix',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Netflix_icon.svg',
    tier: 'FAANG',
    domain: 'netflix.com',
    hq: 'Los Gatos, CA',
    description: 'Global media streaming, microservice resilience, Freedom & Responsibility culture.'
  },
  {
    id: 'uber',
    name: 'Uber',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png',
    tier: 'Unicorn',
    domain: 'uber.com',
    hq: 'San Francisco, CA',
    description: 'Real-time routing, dynamic pricing algorithms, and high-frequency dispatch engines.'
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg',
    tier: 'Unicorn',
    domain: 'airbnb.com',
    hq: 'San Francisco, CA',
    description: 'Global marketplace, craft engineering, search ranking, and modern frontend architecture.'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    tier: 'FinTech',
    domain: 'stripe.com',
    hq: 'San Francisco, CA',
    description: 'Financial infrastructure, API design excellence, idempotency, and extreme reliability.'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    tier: 'AI Pioneer',
    domain: 'openai.com',
    hq: 'San Francisco, CA',
    description: 'State-of-the-art AI models, ChatGPT scale, GPU cluster infrastructure, and frontier research.'
  }
];

export const getInterviewRounds = (typeId: string, companyId: string, roleId: string): InterviewRoundDef[] => {
  const company = TOP_COMPANIES.find(c => c.id === companyId) || { name: companyId.toUpperCase() };
  const role = ELITE_ROLES.find(r => r.id === roleId) || { title: roleId.replace('-', ' ').toUpperCase() };
  const typeItem = INTERVIEW_TYPES.find(t => t.id === typeId) || { title: 'Internship' };

  return [
    {
      roundId: `${typeId}_${companyId}_${roleId}_r1`,
      roundNumber: 1,
      title: 'Round 1: Screening & Core Fundamentals',
      subtitle: '8-9 Questions • Initial Technical & Behavioral Screening',
      questionCount: 9,
      durationMins: 15,
      focusAreas: ['Background & Projects', 'Data Structures Fundamentals', 'Problem Solving Logic', 'Company Values'],
      description: `First round ${typeItem.title} screening at ${company.name} for ${role.title}. Focuses on verifying resume skills, fundamental CS concepts, and communication over 8-9 voice/video questions.`
    },
    {
      roundId: `${typeId}_${companyId}_${roleId}_r2`,
      roundNumber: 2,
      title: 'Round 2: Technical & Problem Solving',
      subtitle: '8-9 Questions • Practical Coding & Logic Deep Dive',
      questionCount: 8,
      durationMins: 20,
      focusAreas: [`${role.title} Technical Depth`, 'Algorithms & Complexity', 'Edge Case Reasoning', 'Code Architecture'],
      description: `Deep technical evaluation for ${role.title} at ${company.name}. Assesses core algorithms, coding logic, and technical problem-solving across 8-9 voice/video questions.`
    },
    {
      roundId: `${typeId}_${companyId}_${roleId}_r3`,
      roundNumber: 3,
      title: 'Round 3: System Concepts & Domain Mastery',
      subtitle: '8-9 Questions • Architecture & Web Fundamentals',
      questionCount: 9,
      durationMins: 20,
      focusAreas: ['Web Performance', 'API Design & Integration', 'State & Data Flow', 'Debugging Scenarios'],
      description: `Domain-specific round tailored to ${company.name}'s technical standards for ${role.title}. Tests system awareness, API understanding, and component lifecycle across 8-9 questions.`
    },
    {
      roundId: `${typeId}_${companyId}_${roleId}_r4`,
      roundNumber: 4,
      title: 'Round 4: Engineering Manager & Team Fit',
      subtitle: '8-9 Questions • Behavioral, Conflict & Bar Raiser',
      questionCount: 8,
      durationMins: 20,
      focusAreas: [`${company.name} Core Values`, 'Project Ownership', 'Team Collaboration', 'Career Goals'],
      description: `Final interview round at ${company.name}. Conducted by engineering managers to test leadership, ownership, and culture fit for the ${role.title} position across 8-9 questions.`
    }
  ];
};
