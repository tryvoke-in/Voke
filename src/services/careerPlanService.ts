import { supabase } from "@/integrations/supabase/client";

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface WeeklyTask {
  month: number;
  week: number;
  title: string;
  focus?: string;
  tasks: string[];
  task_items?: TaskItem[];
  completed: boolean;
}

export interface Resource {
  title: string;
  platform: string;
  type: "course" | "book" | "tutorial" | "documentation" | "practice";
  url: string;
  cost: "free" | "paid";
  priority: "high" | "medium" | "low";
  rating?: string;
  duration?: string;
  description: string;
  skills_covered?: string[];
}

export interface Milestone {
  month: number;
  week?: number;
  title: string;
  description: string;
  achieved: boolean;
}

export interface CareerPlanMeta {
  duration_weeks: number;
  duration_label: string;
  weekly_hours: number;
  focus_area?: string;
}

export interface CareerPlanData {
  target_role: string;
  current_skill_level: "entry" | "mid" | "senior";
  meta?: CareerPlanMeta;
  month_1_goals: {
    title: string;
    focus_areas: string[];
    milestone: string;
    meta?: CareerPlanMeta;
  };
  month_2_goals: {
    title: string;
    focus_areas: string[];
    milestone: string;
  };
  month_3_goals: {
    title: string;
    focus_areas: string[];
    milestone: string;
  };
  weekly_tasks: WeeklyTask[];
  resources: Resource[];
  milestones: Milestone[];
}

export interface CreatePlanOptions {
  durationWeeks?: number; // 2, 4, 8, 12
  experienceLevel?: "entry" | "mid" | "senior";
  weeklyHours?: number; // 10, 20
  focusArea?: string;
}

// ─── Domain Detection ─────────────────────────────────────────────────────────

type RoleDomain = "devex" | "frontend" | "backend" | "fullstack" | "mobile" | "ai_data" | "general";

function detectDomain(role: string, skills: string[]): RoleDomain {
  const r = role.toLowerCase();
  const s = skills.map(x => x.toLowerCase()).join(" ");

  if (r.includes("devex") || r.includes("devops") || r.includes("infra") || r.includes("sre") || r.includes("cloud") || r.includes("platform") || s.includes("kubernetes") || s.includes("terraform")) {
    return "devex";
  }
  if (r.includes("front") || r.includes("ui") || r.includes("react") || r.includes("web") || s.includes("react") || s.includes("vue") || s.includes("css")) {
    return "frontend";
  }
  if (r.includes("back") || r.includes("server") || r.includes("api") || r.includes("distributed") || s.includes("node") || s.includes("go") || s.includes("postgresql")) {
    return "backend";
  }
  if (r.includes("full") || r.includes("stack")) {
    return "fullstack";
  }
  if (r.includes("mobile") || r.includes("ios") || r.includes("android") || r.includes("flutter") || r.includes("swift")) {
    return "mobile";
  }
  if (r.includes("ai") || r.includes("data") || r.includes("ml") || r.includes("machine learning") || s.includes("python") || s.includes("pytorch")) {
    return "ai_data";
  }
  return "general";
}

// ─── Course & Resource Library Generator ─────────────────────────────────────

export function getCuratedRoleCourses(targetRole: string, skillsRequired: string[] = [], skillGaps: Array<{ skill: string }> = []): Resource[] {
  const domain = detectDomain(targetRole, skillsRequired);
  const gapSkills = skillGaps.map(g => g.skill);
  const primaryGapsStr = gapSkills.length > 0 ? gapSkills.slice(0, 3).join(", ") : "Core Architecture";

  // Base resources for all engineers
  const universalResources: Resource[] = [
    {
      title: "NeetCode Blind 75 / 150 Coding Interview Patterns",
      platform: "NeetCode",
      type: "practice",
      url: "https://neetcode.io/practice",
      cost: "free",
      priority: "high",
      rating: "4.9 ★",
      duration: "30 hours",
      description: "Step-by-step video explanations and optimal patterns for top tech coding interview rounds.",
      skills_covered: ["Algorithms", "Data Structures", "Problem Solving"],
    },
    {
      title: "System Design Primer & Architectural Blueprints",
      platform: "GitHub",
      type: "tutorial",
      url: "https://github.com/donnemartin/system-design-primer",
      cost: "free",
      priority: "high",
      rating: "4.9 ★",
      duration: "Self-paced",
      description: "The industry-standard open source guide to scalable system design, caching, and distributed architectures.",
      skills_covered: ["System Design", "Scalability", "Distributed Systems"],
    },
    {
      title: "Voke AI Interactive Mock Technical & Behavioral Rounds",
      platform: "Voke AI",
      type: "practice",
      url: "/interview",
      cost: "free",
      priority: "high",
      rating: "4.9 ★",
      duration: "Interactive (45 mins/session)",
      description: "Real-time AI voice-video feedback evaluating technical accuracy, delivery, and body language.",
      skills_covered: ["Technical Communication", "STAR Method", "Live Coding"],
    },
    {
      title: "Tech Interview Handbook: Curated Study & Screening Guide",
      platform: "Tech Interview Handbook",
      type: "book",
      url: "https://www.techinterviewhandbook.org",
      cost: "free",
      priority: "medium",
      rating: "4.8 ★",
      duration: "6 hours read",
      description: "Actionable roadmap covering recruiter screens, behavioral rounds, reverse-interview questions, and negotiation.",
      skills_covered: ["Behavioral Leadership", "Interview Strategy", "Negotiation"],
    },
  ];

  let domainCourses: Resource[] = [];

  switch (domain) {
    case "devex":
      domainCourses = [
        {
          title: "Developer Experience & Platform Engineering Bootcamp",
          platform: "freeCodeCamp",
          type: "course",
          url: "https://www.youtube.com/watch?v=SccZ1YI_b6I",
          cost: "free",
          priority: "high",
          rating: "4.9 ★",
          duration: "12 hours",
          description: "Internal developer platforms, CLI tooling, automated CI/CD pipelines, and observability benchmarks.",
          skills_covered: ["DevEx", "CI/CD", "Internal Tooling", "Automation"],
        },
        {
          title: "Go: The Complete Developer's Guide (Golang Systems)",
          platform: "Udemy",
          type: "course",
          url: "https://www.udemy.com/course/go-the-complete-developers-guide/",
          cost: "paid",
          priority: "high",
          rating: "4.8 ★",
          duration: "22 hours",
          description: "Production Go fundamentals, concurrency primitives (goroutines/channels), interface design, and testing.",
          skills_covered: ["Go", "Concurrency", "High Throughput", "CLI Tools"],
        },
        {
          title: "Docker & Kubernetes: The Practical Guide to Production Containers",
          platform: "Udemy",
          type: "course",
          url: "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/",
          cost: "paid",
          priority: "high",
          rating: "4.8 ★",
          duration: "24 hours",
          description: "Multi-stage Docker builds, Kubernetes manifests, cluster networking, Helm charts, and local dev environments.",
          skills_covered: ["Docker", "Kubernetes", "Containerization", "Deployment"],
        },
        {
          title: "AWS Cloud Technical Essentials & Scalable Infrastructure",
          platform: "Coursera",
          type: "course",
          url: "https://www.coursera.org/learn/aws-cloud-technical-essentials",
          cost: "free",
          priority: "medium",
          rating: "4.8 ★",
          duration: "14 hours",
          description: "Official AWS architecture essentials covering compute (EC2, ECS), storage, IAM, and VPC networking.",
          skills_covered: ["AWS", "Cloud Architecture", "IAM", "VPC"],
        },
        {
          title: "Terraform for Infrastructure as Code (IaC) Masterclass",
          platform: "freeCodeCamp",
          type: "course",
          url: "https://www.youtube.com/watch?v=7xngnjfIlK4",
          cost: "free",
          priority: "medium",
          rating: "4.8 ★",
          duration: "10 hours",
          description: "Automate cloud provisioning, manage state files, and architect reusable infrastructure modules.",
          skills_covered: ["Terraform", "Infrastructure as Code", "Cloud Automation"],
        },
        {
          title: "Site Reliability Engineering (SRE) by Google",
          platform: "Google Books",
          type: "book",
          url: "https://sre.google/sre-book/table-of-contents/",
          cost: "free",
          priority: "medium",
          rating: "4.9 ★",
          duration: "18 chapters",
          description: "Industry reference on SLIs/SLOs, incident management, reliability metrics, and reducing toil in engineering.",
          skills_covered: ["SRE", "SLOs/SLIs", "Observability", "Reliability"],
        },
      ];
      break;

    case "frontend":
      domainCourses = [
        {
          title: "Next.js 15 & React: The Complete Guide (App Router & Server Actions)",
          platform: "Udemy",
          type: "course",
          url: "https://www.udemy.com/course/nextjs-react-the-complete-guide/",
          cost: "paid",
          priority: "high",
          rating: "4.8 ★",
          duration: "32 hours",
          description: "Deep dive into Server Components, SSR/SSG caching strategies, routing, dynamic bundling, and authentication.",
          skills_covered: ["Next.js", "React", "Server Components", "Fullstack React"],
        },
        {
          title: "Advanced React & Component Architecture Patterns",
          platform: "Frontend Masters",
          type: "course",
          url: "https://frontendmasters.com/courses/advanced-react-patterns/",
          cost: "paid",
          priority: "high",
          rating: "4.9 ★",
          duration: "14 hours",
          description: "State management at scale, compound components, render props, custom hooks, and memoization optimization.",
          skills_covered: ["React", "Design Patterns", "State Architecture", "Performance"],
        },
        {
          title: "Understanding TypeScript: From Beginner to Advanced Architecture",
          platform: "Udemy",
          type: "course",
          url: "https://www.udemy.com/course/understanding-typescript/",
          cost: "paid",
          priority: "high",
          rating: "4.8 ★",
          duration: "15 hours",
          description: "Generics, conditional types, utility types, module resolution, and strict typing in large production codebases.",
          skills_covered: ["TypeScript", "Type Systems", "Generics"],
        },
        {
          title: "Web Performance & Core Web Vitals Deep Dive",
          platform: "web.dev",
          type: "documentation",
          url: "https://web.dev/learn/performance",
          cost: "free",
          priority: "medium",
          rating: "4.9 ★",
          duration: "Self-paced",
          description: "Optimizing LCP, INP, and CLS, image decoding, tree-shaking, code-splitting, and critical rendering paths.",
          skills_covered: ["Core Web Vitals", "LCP", "INP", "Performance Optimization"],
        },
        {
          title: "GreatFrontend Coding & UI System Design Sandbox",
          platform: "GreatFrontend",
          type: "practice",
          url: "https://www.greatfrontend.com",
          cost: "free",
          priority: "medium",
          rating: "4.9 ★",
          duration: "50+ problems",
          description: "Frontend system design interview blueprints (newsfeeds, autocomplete, rich text editors) and DOM challenges.",
          skills_covered: ["Frontend System Design", "DOM Challenges", "UI Engineering"],
        },
      ];
      break;

    case "backend":
      domainCourses = [
        {
          title: "Designing Data-Intensive Applications (DDIA Study Course)",
          platform: "YouTube / O'Reilly",
          type: "course",
          url: "https://www.youtube.com/watch?v=F_fP49L8cbg",
          cost: "free",
          priority: "high",
          rating: "4.9 ★",
          duration: "18 hours",
          description: "Storage engines, B-trees vs LSM-trees, replication, partition strategies, transactions, and consensus protocols.",
          skills_covered: ["Distributed Systems", "Database Internals", "Transactions", "Consensus"],
        },
        {
          title: "ByteByteGo: Master System Design for Senior Tech Roles",
          platform: "ByteByteGo",
          type: "course",
          url: "https://bytebytego.com",
          cost: "paid",
          priority: "high",
          rating: "4.9 ★",
          duration: "25 hours",
          description: "Real-world architectures: YouTube video streaming, Google Drive sync, rate limiters, and payment systems.",
          skills_covered: ["System Design", "Microservices", "Rate Limiting", "Caching"],
        },
        {
          title: "PostgreSQL Database Architecture, Indexing & Query Tuning",
          platform: "Coursera",
          type: "course",
          url: "https://www.coursera.org/learn/database-architecture",
          cost: "free",
          priority: "high",
          rating: "4.8 ★",
          duration: "14 hours",
          description: "EXPLAIN ANALYZE deep dive, composite B-tree/GIN indexing, connection pooling (PgBouncer), and partition pruning.",
          skills_covered: ["PostgreSQL", "SQL Optimization", "Connection Pooling", "Indexing"],
        },
        {
          title: "Backend Engineering: High Concurrency, Microservices & Caching",
          platform: "Udemy",
          type: "course",
          url: "https://www.udemy.com/course/fundamentals-of-backend-engineering/",
          cost: "paid",
          priority: "medium",
          rating: "4.8 ★",
          duration: "18 hours",
          description: "TCP/UDP, HTTP/2 & gRPC, reverse proxies (Nginx/Envoy), Redis caching strategies, and message queues (Kafka/RabbitMQ).",
          skills_covered: ["Backend Engineering", "gRPC", "Redis", "Kafka", "Protocols"],
        },
      ];
      break;

    case "ai_data":
      domainCourses = [
        {
          title: "DeepLearning.AI: Building Systems with LLMs & Agents",
          platform: "DeepLearning.AI",
          type: "course",
          url: "https://www.deeplearning.ai/short-courses/",
          cost: "free",
          priority: "high",
          rating: "4.9 ★",
          duration: "10 hours",
          description: "LangChain, LlamaIndex, RAG architectures, prompt chaining, function calling, and vector embeddings.",
          skills_covered: ["LLMs", "RAG", "Vector Search", "Agents"],
        },
        {
          title: "Vector Databases & Semantic Search Crash Course",
          platform: "freeCodeCamp",
          type: "course",
          url: "https://www.youtube.com/watch?v=klTvEwg3oJ4",
          cost: "free",
          priority: "high",
          rating: "4.8 ★",
          duration: "6 hours",
          description: "Cosine similarity, HNSW indexing, Pinecone, pgvector in PostgreSQL, and embedding fine-tuning.",
          skills_covered: ["pgvector", "Embeddings", "Semantic Search"],
        },
        {
          title: "Machine Learning Specialization by Andrew Ng",
          platform: "Coursera",
          type: "course",
          url: "https://www.coursera.org/specializations/machine-learning-introduction",
          cost: "free",
          priority: "medium",
          rating: "4.9 ★",
          duration: "30 hours",
          description: "Supervised and unsupervised learning, gradient descent, neural networks, decision trees, and model evaluation.",
          skills_covered: ["Machine Learning", "Python", "Neural Networks"],
        },
      ];
      break;

    default:
      domainCourses = [
        {
          title: "Full Stack Open: Modern JavaScript, Node.js & React Architecture",
          platform: "University of Helsinki",
          type: "course",
          url: "https://fullstackopen.com/en/",
          cost: "free",
          priority: "high",
          rating: "4.9 ★",
          duration: "60 hours",
          description: "World-class university course on modern web development, REST/GraphQL APIs, CI/CD, and automated testing.",
          skills_covered: ["Full Stack", "TypeScript", "Node.js", "CI/CD"],
        },
        {
          title: "Harvard CS50: Computer Science & Algorithmic Foundations",
          platform: "edX",
          type: "course",
          url: "https://cs50.harvard.edu/x/",
          cost: "free",
          priority: "high",
          rating: "4.9 ★",
          duration: "40 hours",
          description: "Foundational CS: memory management, pointer manipulation, time complexity, and data structures.",
          skills_covered: ["CS Fundamentals", "Algorithms", "Memory", "Data Structures"],
        },
      ];
  }

  // Combine and sort by priority (high first, then medium)
  return [...domainCourses, ...universalResources];
}

// ─── Dynamic Week-by-Week Curriculum Builder ─────────────────────────────────

export function buildDeterministicCareerPlan(
  targetRole: string,
  skillsRequired: string[] = [],
  skillGaps: Array<{ skill: string }> = [],
  options: CreatePlanOptions = {}
): CareerPlanData {
  const durationWeeks = options.durationWeeks && [2, 4, 8, 12].includes(options.durationWeeks) ? options.durationWeeks : 4;
  const weeklyHours = options.weeklyHours || 15;
  const roleLower = targetRole.toLowerCase();

  // Experience level inference if not supplied
  const level: "entry" | "mid" | "senior" =
    options.experienceLevel ||
    (roleLower.includes("senior") || roleLower.includes("staff") || roleLower.includes("lead") || roleLower.includes("principal")
      ? "senior"
      : roleLower.includes("junior") || roleLower.includes("entry") || roleLower.includes("intern") || roleLower.includes("associate")
      ? "entry"
      : "mid");

  const topGaps = skillGaps.map(g => g.skill).filter(Boolean);
  const primarySkills = skillsRequired.length > 0 ? skillsRequired : ["Core Architecture", "System Design", "Production Testing"];

  const gap1 = topGaps[0] || primarySkills[0] || "Advanced Systems Architecture";
  const gap2 = topGaps[1] || primarySkills[1] || "Scalable Infrastructure & Concurrency";
  const gap3 = topGaps[2] || primarySkills[2] || "Performance, Reliability & Testing";

  const durationLabels: Record<number, string> = {
    2: "2 Weeks (Sprint Prep)",
    4: "4 Weeks (30-Day Intensive)",
    8: "8 Weeks (2 Months Mastery)",
    12: "12 Weeks (3 Months Transformation)",
  };
  const durationLabel = durationLabels[durationWeeks] || `${durationWeeks} Weeks`;

  const meta: CareerPlanMeta = {
    duration_weeks: durationWeeks,
    duration_label: durationLabel,
    weekly_hours: weeklyHours,
    focus_area: options.focusArea || "Complete Interview Readiness",
  };

  // 12 master weeks pool tailored to role
  const allMasterWeeks: WeeklyTask[] = [
    {
      month: 1,
      week: 1,
      title: `Week 1: Core Fundamentals & ${gap1} Baseline`,
      focus: "Syntax, Memory Models & Algorithmic Warming",
      tasks: [
        `Complete diagnostic assessment of target competencies in ${gap1}`,
        `Solve 6 high-frequency coding patterns (Two Pointers, Hash Maps, Sliding Window)`,
        `Set up clean sandbox development repository with strict linting and test coverage`,
        `Study official documentation and style guides for ${gap1}`,
      ],
      completed: false,
    },
    {
      month: 1,
      week: 2,
      title: `Week 2: ${gap1} Deep Dive & Pattern Fluency`,
      focus: "Algorithmic Traversal & Internal Architecture",
      tasks: [
        `Implement core data structures from scratch (Binary Trees, Heaps, Graph traversals)`,
        `Build a functional micro-module exercising ${gap1} with unit test benchmarks`,
        `Solve 6 medium-level interview problems focusing on BFS/DFS traversal and Greedy algorithms`,
        `Analyze real-world open-source repositories built by top engineering teams in ${targetRole}`,
      ],
      completed: false,
    },
    {
      month: 1,
      week: 3,
      title: `Week 3: ${gap2} Foundations & Low-Level Design`,
      focus: "Object-Oriented Design & Microservice Primitives",
      tasks: [
        `Study object-oriented and functional architectural patterns relevant to ${targetRole}`,
        `Design and implement a clean API layer featuring concurrency and rate limiting`,
        `Practice interactive whiteboarding on Excalidraw explaining architectural trade-offs`,
        `Complete baseline Voke AI Mock Technical Interview to evaluate delivery and communication`,
      ],
      completed: false,
    },
    {
      month: 1,
      week: 4,
      title: `Week 4: Month 1 Benchmark & Milestone Checkpoint`,
      focus: "Comprehensive Code Review & ATS Resume Polish",
      tasks: [
        `Solve 5 timed interview questions under simulated 35-minute constraints`,
        `Audit and optimize resume ATS score to 85%+ incorporating quantified metrics in ${gap1}`,
        `Perform end-to-end integration and load testing on your micro-service prototype`,
        `Review recorded Voke AI interview feedback and identify communication filler words`,
      ],
      completed: false,
    },
    {
      month: 2,
      week: 5,
      title: "Week 5: Distributed Systems & Scalability Primitives",
      focus: "Caching, Partitioning & CAP Theorem",
      tasks: [
        `Deep dive into caching strategies (Write-through, Cache-aside) and Redis architectures`,
        `Architect the blueprint for a production-grade portfolio showcase targeting ${targetRole}`,
        `Solve Dynamic Programming and Backtracking interview questions`,
        `Study database sharding, replication topologies, and consistent hashing`,
      ],
      completed: false,
    },
    {
      month: 2,
      week: 6,
      title: "Week 6: Database Optimization & Cloud Containerization",
      focus: "PostgreSQL Tuning & Docker Workflows",
      tasks: [
        `Write and optimize complex database queries with EXPLAIN ANALYZE and composite indexing`,
        `Containerize the showcase project using multi-stage Dockerfiles and compose orchestration`,
        `Set up automated GitHub Actions CI/CD pipelines with linting and unit test gates`,
        `Conduct 2 mock System Design whiteboard interviews covering high-traffic services`,
      ],
      completed: false,
    },
    {
      month: 2,
      week: 7,
      title: `Week 7: ${gap3} & Resilience Engineering`,
      focus: "Circuit Breakers, Retries & Observability",
      tasks: [
        `Implement circuit breaking, graceful degradation, and structured logging in your application`,
        `Bench-test API endpoints under simulated concurrent traffic with k6 or Apache Bench`,
        `Solve hard-difficulty algorithmic challenges focusing on Graph algorithms and Tries`,
        `Conduct Voke AI Voice-Video Mock Interview and target 80%+ overall score`,
      ],
      completed: false,
    },
    {
      month: 2,
      week: 8,
      title: "Week 8: Portfolio Finalization & Production Deployment",
      focus: "Live Demos, README Documentation & Mid-Point Audit",
      tasks: [
        `Deploy showcase application to live cloud infrastructure with custom domain and SSL`,
        `Write comprehensive engineering README with system diagrams and benchmark charts`,
        `Conduct mid-point career self-evaluation against target job description requirements`,
        `Publish GitHub repository with clean commit history and documentation badges`,
      ],
      completed: false,
    },
    {
      month: 3,
      week: 9,
      title: "Week 9: Behavioral Leadership & STAR Method Mastery",
      focus: "Executive Presence & Communication",
      tasks: [
        `Draft 6 structured STAR-method stories covering leadership, conflict, deadlines, and failure`,
        `Practice behavioral responses with Voke AI Coach for audio-video confidence benchmarks`,
        `Audit LinkedIn and GitHub profiles for engineering manager discoverability`,
        `Prepare thoughtful reverse-interview questions assessing team culture and engineering rigor`,
      ],
      completed: false,
    },
    {
      month: 3,
      week: 10,
      title: "Week 10: Targeted Outreach & Recruiter Inbound Pipeline",
      focus: "Networking & Warm Referrals",
      tasks: [
        `Reach out to 10 alumni and tech engineering managers with tailored pitch notes`,
        `Apply to top 5 high-fit matched openings on Voke Job Recommendations`,
        `Complete 3 full-length timed mock technical interviews under exam conditions`,
        `Conduct live recruiter screening drills focusing on clear compensation and value propositions`,
      ],
      completed: false,
    },
    {
      month: 3,
      week: 11,
      title: "Week 11: Live Technical Screens & Take-Home Execution",
      focus: "Real-World Interviewing & Feedback Loops",
      tasks: [
        `Execute initial live technical screens with structured problem restatement and test-driven approach`,
        `Review recorded interview playback, analyze stumbling blocks, and patch edge cases`,
        `Practice fast-paced algorithmic pair programming on coderpad`,
        `Refine architectural answers focusing on business trade-offs and cost efficiency`,
      ],
      completed: false,
    },
    {
      month: 3,
      week: 12,
      title: "Week 12: Onsite Mastery, Offer Negotiation & Onboarding",
      focus: "Closing Offers & Strategic Career Transition",
      tasks: [
        `Perform comprehensive compensation research on Levels.fyi for ${targetRole} benchmarks`,
        `Execute final on-site virtual interview rounds with high confidence and structured communication`,
        `Formulate negotiation strategy to maximize base, equity, and sign-on bonuses`,
        `Celebrate milestones, evaluate competing offers, and finalize 90-day onboarding plan`,
      ],
      completed: false,
    },
  ];

  // Select appropriate weeks based on duration
  let selectedWeeks: WeeklyTask[] = [];

  if (durationWeeks === 2) {
    // 2 Weeks Sprint: Condensed, high-impact weeks
    selectedWeeks = [
      {
        month: 1,
        week: 1,
        title: `Week 1: High-Yield Skill Gap Triage & ${gap1} Mastery`,
        focus: "Rapid Coding Patterns & Core Architecture",
        tasks: [
          `Audit diagnostic competencies in ${gap1} and review top 10 syntax edge cases`,
          `Solve 10 high-frequency Blind 75 interview patterns (Arrays, Hash Maps, Sliding Window, Trees)`,
          `Review System Design Primer cheat sheets for caching, load balancing, and database indexing`,
          `Complete 1 full Voke AI Technical Mock Interview and review delivery score`,
          `Tailor resume bullet points specifically for ${targetRole} with quantified metrics`,
        ],
        completed: false,
      },
      {
        month: 1,
        week: 2,
        title: "Week 2: Mock Interview Drills, Behavioral Polish & Screening Execution",
        focus: "Mock Interviews, STAR Stories & Live Calls",
        tasks: [
          `Practice 5 STAR-method leadership stories covering difficult technical decisions and ownership`,
          `Conduct 2 full-length Voke AI Coding and System Design rounds targeting 85%+ score`,
          `Prepare thoughtful reverse-interview questions for engineering hiring managers`,
          `Perform compensation and leveling benchmark research on Levels.fyi`,
          `Apply directly to top matched opportunities with tailored outreach messages`,
        ],
        completed: false,
      },
    ];
  } else if (durationWeeks === 4) {
    // 4 Weeks (1 Month) Intensive: Weeks 1, 2, 5 (adapted), and 9/10 (condensed)
    selectedWeeks = [
      { ...allMasterWeeks[0], week: 1, month: 1 },
      { ...allMasterWeeks[1], week: 2, month: 1 },
      {
        month: 1,
        week: 3,
        title: `Week 3: System Design, ${gap2} & Portfolio Proof`,
        focus: "High-Level Architecture & Scaling",
        tasks: [
          `Study distributed systems primitives: caching, replication, and load balancing`,
          `Architect and build a showcase module exercising ${gap2}`,
          `Solve 6 medium-level interview problems focusing on Trees, Graphs, and DP`,
          `Conduct 2 mock System Design whiteboard interviews covering high-traffic services`,
        ],
        completed: false,
      },
      {
        month: 1,
        week: 4,
        title: "Week 4: Mock Interview Mastery & Strategic Applications",
        focus: "Voke AI Mock Rounds, STAR Stories & Applications",
        tasks: [
          `Complete 3 full-length Voke AI Mock Interviews (Technical, Coding, and Behavioral)`,
          `Finalize resume with 85%+ ATS score highlighting verified portfolio benchmarks`,
          `Prepare 6 STAR-method leadership stories covering technical trade-offs and conflict resolution`,
          `Submit applications to top 5 matched opportunities and initiate referral outreach`,
        ],
        completed: false,
      },
    ];
  } else if (durationWeeks === 8) {
    // 8 Weeks (2 Months): Weeks 1 to 8
    selectedWeeks = allMasterWeeks.slice(0, 8);
  } else {
    // 12 Weeks (3 Months): Full 12 weeks
    selectedWeeks = allMasterWeeks;
  }

  // Add task_items array with unique IDs to every week for granular tracking
  selectedWeeks = selectedWeeks.map(w => ({
    ...w,
    task_items: w.tasks.map((taskText, idx) => ({
      id: `w${w.week}_t${idx}`,
      text: taskText,
      completed: false,
    })),
  }));

  // Build curated courses and resources
  const resources = getCuratedRoleCourses(targetRole, skillsRequired, skillGaps);

  // Build Milestones matching duration
  let milestones: Milestone[] = [];
  if (durationWeeks === 2) {
    milestones = [
      {
        month: 1,
        week: 1,
        title: "Sprint Milestone 1: Algorithmic & Architectural Triage Complete",
        description: `Passed core coding patterns and refreshed system design fundamentals in ${gap1}.`,
        achieved: false,
      },
      {
        month: 1,
        week: 2,
        title: "Sprint Milestone 2: Interview Ready & Screening Pipeline Active",
        description: "Achieved 85%+ score in Voke AI mock rounds and actively executing hiring screens.",
        achieved: false,
      },
    ];
  } else if (durationWeeks === 4) {
    milestones = [
      {
        month: 1,
        week: 2,
        title: "30-Day Checkpoint 1: Technical Foundation Verified",
        description: `Mastered essential syntax, coding patterns, and primary competency in ${gap1}.`,
        achieved: false,
      },
      {
        month: 1,
        week: 4,
        title: "30-Day Checkpoint 2: Full Interview Mastery & Pipeline Launched",
        description: "Scored 85%+ across technical mock rounds and submitted applications to matched roles.",
        achieved: false,
      },
    ];
  } else if (durationWeeks === 8) {
    milestones = [
      {
        month: 1,
        title: "Month 1 Milestone: Core Foundation & Systems Verified",
        description: `Completed fundamental competencies in ${gap1} and solved 25 essential pattern problems.`,
        achieved: false,
      },
      {
        month: 2,
        title: "Month 2 Milestone: Production Portfolio & Interview Readiness",
        description: `Deployed production-grade showcase project demonstrating ${gap2} with active interviews.`,
        achieved: false,
      },
    ];
  } else {
    milestones = [
      {
        month: 1,
        title: "Month 1: Foundation & Algorithmic Competency",
        description: `Mastered core coding patterns and established strong proficiency in ${gap1}.`,
        achieved: false,
      },
      {
        month: 2,
        title: "Month 2: Systems Architecture & Showcase Portfolio",
        description: `Deployed production-grade portfolio demonstrating ${gap2} with benchmarked performance.`,
        achieved: false,
      },
      {
        month: 3,
        title: "Month 3: Interview Mastery & Offer Execution",
        description: "Consistently scoring 85%+ in mock rounds and actively interviewing with hiring teams.",
        achieved: false,
      },
    ];
  }

  // Month goals
  const month_1_goals = {
    title: durationWeeks <= 4 ? `${durationLabel} Goals` : "Foundation & Core Skills Acquisition",
    focus_areas: [gap1, "Data Structures & Coding Patterns", "System Design Primitives"],
    milestone: milestones[0]?.description || `Master foundational competencies in ${gap1}.`,
    meta,
  };

  const month_2_goals = {
    title: durationWeeks === 8 ? "Scalable Systems & Portfolio Showcase" : "Advanced Architecture & Scalability",
    focus_areas: [gap2, "Microservice Architecture", "Concurrency & Databases"],
    milestone: milestones[1]?.description || `Deploy a production-grade showcase demonstrating ${gap2}.`,
  };

  const month_3_goals = {
    title: "Mock Interview Mastery & Strategic Job Search",
    focus_areas: ["Voke AI Technical Mock Rounds", "Behavioral Leadership Stories", "Compensation Negotiation"],
    milestone: milestones[2]?.description || "Achieve 85%+ in consecutive mock rounds and land offers.",
  };

  return {
    target_role: targetRole,
    current_skill_level: level,
    meta,
    month_1_goals,
    month_2_goals,
    month_3_goals,
    weekly_tasks: selectedWeeks,
    resources,
    milestones,
  };
}

// ─── Gemini AI Generator ──────────────────────────────────────────────────────

async function generatePlanWithGemini(
  targetRole: string,
  skillsRequired: string[],
  skillGaps: Array<{ skill: string }>,
  options: CreatePlanOptions
): Promise<CareerPlanData | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") return null;

  const durationWeeks = options.durationWeeks || 4;
  const level = options.experienceLevel || "mid";

  try {
    const prompt = `You are an elite tech career coach. Create an actionable, tailored ${durationWeeks}-week career preparation plan for a candidate targeting:
Target Role: "${targetRole}"
Target Level: "${level}"
Duration: ${durationWeeks} Weeks
Required Skills: ${skillsRequired.join(", ") || "Full Software Stack"}
Identified Skill Gaps: ${skillGaps.map(g => g.skill).join(", ") || "Advanced System Design"}

Return a single JSON object strictly matching this schema:
{
  "target_role": "${targetRole}",
  "current_skill_level": "${level}",
  "month_1_goals": { "title": string, "focus_areas": string[], "milestone": string },
  "month_2_goals": { "title": string, "focus_areas": string[], "milestone": string },
  "month_3_goals": { "title": string, "focus_areas": string[], "milestone": string },
  "weekly_tasks": [
    // Generate EXACTLY ${durationWeeks} weeks from week 1 to week ${durationWeeks}!
    {
      "month": number,
      "week": number,
      "title": string,
      "tasks": string[],
      "completed": false
    }
  ],
  "resources": [
    {
      "title": string,
      "platform": string,
      "type": "course"|"book"|"tutorial"|"documentation"|"practice",
      "url": string,
      "cost": "free"|"paid",
      "priority": "high"|"medium"|"low",
      "rating": string,
      "duration": string,
      "description": string
    }
  ],
  "milestones": [
    { "month": number, "title": string, "description": string, "achieved": false }
  ]
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const json = await res.json();
    const textContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) return null;

    const parsed = JSON.parse(textContent);
    if (parsed.weekly_tasks && Array.isArray(parsed.weekly_tasks) && parsed.weekly_tasks.length >= durationWeeks) {
      // Ensure tasks have task_items
      parsed.weekly_tasks = parsed.weekly_tasks.map((w: any) => ({
        ...w,
        task_items: (w.tasks || []).map((t: string, i: number) => ({
          id: `w${w.week}_t${i}`,
          text: t,
          completed: false,
        })),
      }));

      // Enrich resources with role courses if less than 6
      if (!parsed.resources || parsed.resources.length < 6) {
        parsed.resources = getCuratedRoleCourses(targetRole, skillsRequired, skillGaps);
      }

      parsed.meta = {
        duration_weeks: durationWeeks,
        duration_label: `${durationWeeks} Weeks`,
        weekly_hours: options.weeklyHours || 15,
        focus_area: options.focusArea || "Complete Interview Readiness",
      };

      return parsed as CareerPlanData;
    }
  } catch (e) {
    console.warn("Client-side Gemini generation failed or timed out, using fallback generator:", e);
  }

  return null;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export async function createAndPersistCareerPlan(
  userId: string,
  targetRole: string,
  rec?: {
    id?: string;
    job_postings?: { skills_required?: string[]; title?: string };
    skill_gaps?: Array<{ skill: string }>;
  },
  options: CreatePlanOptions = {}
) {
  const skillsRequired = rec?.job_postings?.skills_required || [];
  const skillGaps = rec?.skill_gaps || [];

  // Try AI generation first
  let planData: CareerPlanData | null = await generatePlanWithGemini(targetRole, skillsRequired, skillGaps, options);

  // Fallback to deterministic role-tailored generator
  if (!planData) {
    planData = buildDeterministicCareerPlan(targetRole, skillsRequired, skillGaps, options);
  }

  // Insert into Supabase user_career_plans table
  const { data: insertedPlan, error: insertError } = await supabase
    .from("user_career_plans")
    .insert({
      user_id: userId,
      target_role: targetRole,
      current_skill_level: planData.current_skill_level || "mid",
      month_1_goals: planData.month_1_goals,
      month_2_goals: planData.month_2_goals,
      month_3_goals: planData.month_3_goals,
      weekly_tasks: planData.weekly_tasks as any,
      resources: planData.resources as any,
      milestones: planData.milestones as any,
      progress_percentage: 0,
      job_recommendation_id: rec?.id || null,
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return insertedPlan;
}
