import { supabase } from "@/integrations/supabase/client";

export interface College {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  domains: string[]; // e.g. ["nst.rishihood.edu.in", "rishihood.edu.in", "nst.edu.in"]
  adminEmail: string;
  adminName: string;
  logoUrl?: string;
  tier: string;
  contractPeriod: string;
  totalStudentSlots: number;
  location: string;
  establishedYear?: number;
  contactPhone?: string;
}

export interface CollegeStudent {
  id: string;
  collegeId: string;
  collegeName: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  branch: string;
  batch: string; // e.g. "2025" or "2026"
  targetRole: string;
  interviewsCompleted: number;
  averageScore: number;
  readinessStatus: "Placement Ready" | "Intermediate" | "Needs Practice" | "Not Started";
  lastActive: string;
  registeredAt: string;
  codingRating?: number;
  skills: { [skill: string]: number };
}

export interface CollegeCustomQuestion {
  id: string;
  question: string;
  type?: "technical" | "coding" | "system_design" | "behavioral";
  difficulty?: "Easy" | "Medium" | "Hard";
  expectedAnswerOrKeyPoints?: string;
  category?: string;
}

export interface CandidateQuestionAnswer {
  questionId?: string;
  question: string;
  studentAnswer: string;
  aiFeedback: string;
  score: number; // 0-100
  keyPointsCovered?: string[];
  keyPointsMissed?: string[];
}

export interface ScheduledDriveCandidate {
  studentEmail: string;
  studentName: string;
  status: "Pending" | "Completed" | "Missed";
  score?: number;
  isPassed?: boolean;
  selectionVerdict?: "SELECTED" | "NOT_SELECTED" | "PENDING";
  completedAt?: string;
  durationMinutes?: number;
  feedback?: string;
  detailedScores?: {
    technicalAccuracy?: number;
    communication?: number;
    problemSolving?: number;
    confidence?: number;
  };
  answers?: CandidateQuestionAnswer[];
}

export interface CollegeScheduledDrive {
  id: string;
  collegeId: string;
  collegeName: string;
  title: string;
  targetRole: string;
  interviewType: "technical_ai" | "video_interview" | "dsa_coding" | "system_design" | "behavioral_hr";
  targetAudience: "all" | "branch" | "selected_emails";
  targetBatch?: string;
  targetBranch?: string;
  targetEmails: string[];
  scheduledDate: string;
  deadlineDate: string;
  durationMinutes: number;
  passingScore: number;
  passingCriteriaDescription?: string;
  customQuestions?: CollegeCustomQuestion[];
  customQuestionsOnly?: boolean;
  questionCountLimit?: number;
  instructions: string;
  targetCompanies?: string[];
  status: "scheduled" | "active" | "completed";
  candidatesCount: number;
  completedCount: number;
  avgScore: number;
  createdAt: string;
  interviewUrl?: string;
  candidates?: ScheduledDriveCandidate[];
}

export interface CollegeAnalytics {
  totalStudents: number;
  activeStudents: number;
  totalInterviewsTaken: number;
  averageScore: number;
  placementReadyPercentage: number;
  activeDrivesCount: number;
  skillAverages: {
    dsa: number;
    systemDesign: number;
    communication: number;
    problemSolving: number;
  };
  scoreDistribution: {
    range: string;
    count: number;
  }[];
  topPerformers: CollegeStudent[];
}

// Default Partner Colleges configuration (institutional details, domain mapping, admin credentials)
export const DEFAULT_COLLEGES: College[] = [
  {
    id: "college-nst",
    name: "Newton School of Technology",
    shortName: "NST",
    slug: "nst",
    domains: [
      "nst.rishihood.edu.in", 
      "rishihood.edu.in", 
      "nst.edu.in", 
      "newtonschool.edu.in", 
      "newton.edu"
    ],
    adminEmail: "placement@nst.edu.in",
    adminName: "Prof. Rajesh Verma (Placement Head)",
    tier: "Enterprise Campus Partner",
    contractPeriod: "2025 - 2026 Academic Year",
    totalStudentSlots: 500,
    location: "Rishihood University, Delhi NCR",
    establishedYear: 2022,
    contactPhone: "+91 98123 45678"
  },
  {
    id: "college-dtu",
    name: "Delhi Technological University",
    shortName: "DTU",
    slug: "dtu",
    domains: ["dtu.ac.in", "dtu.edu"],
    adminEmail: "tnp@dtu.ac.in",
    adminName: "Dr. Alok Kumar (T&P Cell)",
    tier: "Enterprise Campus Partner",
    contractPeriod: "2025 - 2026 Academic Year",
    totalStudentSlots: 1000,
    location: "Rohini, New Delhi",
    establishedYear: 1941,
    contactPhone: "+91 98765 43210"
  },
  {
    id: "college-iitd",
    name: "Indian Institute of Technology Delhi",
    shortName: "IITD",
    slug: "iitd",
    domains: ["iitd.ac.in", "cse.iitd.ac.in"],
    adminEmail: "tnp@iitd.ac.in",
    adminName: "Dr. Priya Sundaram",
    tier: "Enterprise Campus Partner",
    contractPeriod: "2025 - 2026 Academic Year",
    totalStudentSlots: 800,
    location: "Hauz Khas, New Delhi",
    establishedYear: 1961,
    contactPhone: "+91 99887 76655"
  },
  {
    id: "college-vit",
    name: "Vellore Institute of Technology",
    shortName: "VIT",
    slug: "vit",
    domains: ["vit.ac.in", "vitstudent.ac.in"],
    adminEmail: "placement@vit.ac.in",
    adminName: "Dr. Samuel Rajan",
    tier: "Enterprise Campus Partner",
    contractPeriod: "2025 - 2026 Academic Year",
    totalStudentSlots: 1500,
    location: "Vellore, Tamil Nadu",
    establishedYear: 1984,
    contactPhone: "+91 98401 23456"
  }
];

const STORAGE_KEYS = {
  COLLEGES: "voke_partner_colleges",
  COLLEGE_SESSION: "voke_college_session",
  COLLEGE_DRIVES: "voke_college_drives",
  REGISTERED_STUDENTS: "voke_college_registered_students"
};

// Realtime Channel name
const COLLEGE_ROSTER_CHANNEL = "voke_college_realtime_roster";

let sharedRosterChannel: any = null;

export const getCollegeRealtimeChannel = () => {
  if (!sharedRosterChannel) {
    sharedRosterChannel = supabase.channel(COLLEGE_ROSTER_CHANNEL, {
      config: { broadcast: { ack: true, self: true } }
    });
    sharedRosterChannel.subscribe((status: string) => {
      console.log("[CollegeRealtime] Channel status:", status);
    });
  }
  return sharedRosterChannel;
};

// Fetch college registrations from Supabase and merge into localStorage
let _collegesLoadedFromDb = false;
async function ensureCollegesFromDb(): Promise<void> {
  if (_collegesLoadedFromDb) return;
  _collegesLoadedFromDb = true;
  try {
    const { data: dbColleges } = await supabase
      .from('waitlist')
      .select('*')
      .eq('status', 'college_registration');

    if (dbColleges && dbColleges.length > 0) {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGES);
      const existing: College[] = stored ? JSON.parse(stored) : [];
      const allIds = new Set(existing.map(c => c.id));
      const allSlugs = new Set(existing.map(c => c.slug));

      for (const row of dbColleges) {
        if (row.phone_number) {
          try {
            const college: College = JSON.parse(row.phone_number);
            if (college && college.id && !allIds.has(college.id) && !allSlugs.has(college.slug)) {
              existing.push(college);
              allIds.add(college.id);
              allSlugs.add(college.slug);
            }
          } catch (pe) {}
        }
      }
      localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(existing));
    }
  } catch (e) {
    console.warn("Failed to load colleges from Supabase:", e);
  }
}

export const collegeService = {
  // Retrieve all colleges (defaults merged with custom registrations)
  getColleges(): College[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGES);
      if (stored) {
        const parsed: College[] = JSON.parse(stored);
        const missingDefaults = DEFAULT_COLLEGES.filter(
          def => !parsed.some(c => c.id === def.id || c.slug === def.slug)
        );
        return [...parsed, ...missingDefaults];
      }
    } catch (e) {
      console.warn("Failed to load colleges from localStorage", e);
    }
    return DEFAULT_COLLEGES;
  },

  // Async version that also loads from Supabase first
  async getCollegesAsync(): Promise<College[]> {
    await ensureCollegesFromDb();
    return this.getColleges();
  },

  getCollegeById(id: string): College | undefined {
    const colleges = this.getColleges();
    let found = colleges.find(c => c.id === id || c.slug === id);
    if (!found && id.startsWith("college-")) {
      const cleanId = id.replace("college-", "").toLowerCase();
      found = colleges.find(c => c.slug.includes(cleanId) || cleanId.includes(c.slug));
    }
    return found;
  },

  getCollegeByDomain(domain: string): College | undefined {
    if (!domain) return undefined;
    const cleanDomain = domain.toLowerCase().trim().replace(/^@/, "");
    const colleges = this.getColleges();

    return colleges.find(c =>
      c.domains.some(d => {
        const cd = d.toLowerCase().trim().replace(/^@/, "");
        return cleanDomain === cd || cleanDomain.endsWith("." + cd) || cd.endsWith("." + cleanDomain);
      })
    );
  },

  getCollegeByEmail(email: string): College | undefined {
    if (!email || !email.includes("@")) return undefined;
    const domain = email.split("@")[1].toLowerCase().trim();
    return this.getCollegeByDomain(domain);
  },

  // Authenticate College Admin
  authenticateCollegeAdmin(email: string, _password?: string): { success: boolean; college?: College; error?: string } {
    const cleanEmail = email.toLowerCase().trim();
    const colleges = this.getColleges();

    let matchedCollege = colleges.find(c => c.adminEmail.toLowerCase() === cleanEmail);

    if (!matchedCollege) {
      const emailDomain = cleanEmail.split("@")[1];
      if (emailDomain) {
        matchedCollege = colleges.find(c => 
          c.domains.some(d => emailDomain.toLowerCase().endsWith(d.toLowerCase()))
        );
      }
    }

    if (matchedCollege) {
      this.setCollegeSession(matchedCollege);
      return { success: true, college: matchedCollege };
    }

    return { 
      success: false, 
      error: "College admin credentials not recognized. Try signing in with a partner email (e.g. placement@nst.edu.in) or click Quick Demo Sign In." 
    };
  },

  // Session management
  getCollegeSession(): College | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_SESSION);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to parse college session", e);
    }
    return null;
  },

  setCollegeSession(college: College): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COLLEGE_SESSION, JSON.stringify(college));
    } catch (e) {
      console.warn("Failed to save college session", e);
    }
  },

  clearCollegeSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.COLLEGE_SESSION);
    } catch (e) {
      console.warn("Failed to clear college session", e);
    }
  },

  // Register a new partner college
  registerCollege(collegeData: Partial<College>): College {
    const existingColleges = this.getColleges();
    const cleanName = collegeData.name || "Partner University";
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 20);

    const domains = (collegeData.domains && collegeData.domains.length > 0)
      ? collegeData.domains.map(d => d.trim().replace(/^@/, "").toLowerCase())
      : [`${slug}.edu.in`];

    const newCollege: College = {
      id: `college-${Date.now()}`,
      name: cleanName,
      shortName: collegeData.shortName || cleanName.slice(0, 4).toUpperCase(),
      slug,
      domains,
      adminEmail: collegeData.adminEmail || `admin@${domains[0]}`,
      adminName: collegeData.adminName || "Placement Coordinator",
      tier: "Enterprise Campus Partner",
      contractPeriod: "2025 - 2026 Academic Year",
      totalStudentSlots: collegeData.totalStudentSlots || 500,
      location: collegeData.location || "India",
      establishedYear: collegeData.establishedYear || new Date().getFullYear(),
      contactPhone: collegeData.contactPhone || "+91 98000 00000"
    };

    const updated = [...existingColleges.filter(c => c.id !== newCollege.id), newCollege];
    try {
      localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist new college", e);
    }

    // Persist to Supabase for cross-device college discovery
    try {
      supabase.from('waitlist').upsert({
        email: newCollege.adminEmail,
        college_name: newCollege.name,
        phone_number: JSON.stringify(newCollege),
        status: 'college_registration'
      }, { onConflict: 'email' }).then(({ error }) => { if (error) console.warn('College reg upsert error:', error); }).catch(e => console.warn('College reg upsert failed:', e));
    } catch (dbe) {}

    this.setCollegeSession(newCollege);
    return newCollege;
  },

  // Record a real student registration or login event dynamically
  recordStudentRegistration(studentInfo: {
    email: string;
    fullName?: string;
    targetRole?: string;
    branch?: string;
    batch?: string;
    interviewsCompleted?: number;
    averageScore?: number;
  }): CollegeStudent | null {
    if (!studentInfo.email || !studentInfo.email.includes("@")) return null;

    const cleanEmail = studentInfo.email.toLowerCase().trim();
    const college = this.getCollegeByEmail(cleanEmail);
    const collegeName = college?.name || "Newton School of Technology";
    const collegeId = college?.id || "college-nst";

    const newStudent: CollegeStudent = {
      id: `std-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`,
      collegeId,
      collegeName,
      fullName: studentInfo.fullName || cleanEmail.split("@")[0].replace(/[._]/g, " "),
      email: cleanEmail,
      branch: studentInfo.branch || "Computer Science & AI",
      batch: studentInfo.batch || "2025",
      targetRole: studentInfo.targetRole || "Software Development Engineer (SDE-1)",
      interviewsCompleted: studentInfo.interviewsCompleted ?? 0,
      averageScore: studentInfo.averageScore ?? 0,
      readinessStatus: (studentInfo.averageScore ?? 0) >= 80 ? "Placement Ready" : (studentInfo.averageScore ?? 0) >= 60 ? "Intermediate" : "Needs Practice",
      lastActive: "Active today",
      registeredAt: new Date().toISOString().split("T")[0],
      codingRating: 1600,
      skills: { DSA: 0, SystemDesign: 0, Communication: 0, ProblemSolving: 0 }
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REGISTERED_STUDENTS);
      const existing: CollegeStudent[] = stored ? JSON.parse(stored) : [];
      const filtered = existing.filter(s => s.email.toLowerCase() !== cleanEmail);
      const updated = [newStudent, ...filtered];
      localStorage.setItem(STORAGE_KEYS.REGISTERED_STUDENTS, JSON.stringify(updated));

      // Persist across devices/browsers via waitlist table
      ensureCollegesFromDb().then(() => {
        const resolvedCollege = this.getCollegeByEmail(cleanEmail);
        const finalCollegeName = resolvedCollege?.name || collegeName;
        supabase.from('waitlist').upsert({
          email: cleanEmail,
          college_name: finalCollegeName,
          phone_number: JSON.stringify(newStudent),
          status: 'registered_student'
        }, { onConflict: 'email' }).then(({ error }) => {
          if (error) console.warn('Student reg upsert error:', error);
        }).catch(e => console.warn('Student reg upsert failed:', e));
      });

      // Broadcast update dynamically via Supabase Realtime channel
      const channel = getCollegeRealtimeChannel();
      channel.send({
        type: "broadcast",
        event: "student_registered",
        payload: newStudent
      }).catch(() => {});
    } catch (e) {
      console.warn("Failed to save registered student:", e);
    }

    return newStudent;
  },

  async recordStudentRegistrationAsync(studentInfo: {
    email: string;
    fullName?: string;
    targetRole?: string;
    branch?: string;
    batch?: string;
    interviewsCompleted?: number;
    averageScore?: number;
  }): Promise<CollegeStudent | null> {
    await ensureCollegesFromDb();
    const student = this.recordStudentRegistration(studentInfo);
    if (!student) return null;

    const cleanEmail = student.email.toLowerCase().trim();
    const resolvedCollege = this.getCollegeByEmail(cleanEmail);
    const finalCollegeName = resolvedCollege?.name || student.collegeName;

    try {
      await supabase.from('waitlist').upsert({
        email: cleanEmail,
        college_name: finalCollegeName,
        phone_number: JSON.stringify(student),
        status: 'registered_student'
      }, { onConflict: 'email' });
    } catch (e) {
      console.warn("recordStudentRegistrationAsync upsert failed:", e);
    }

    return student;
  },

  // Add student directly to college roster (from College Admin Dashboard)
  addStudentToCollege(collegeId: string, studentData: Partial<CollegeStudent>): CollegeStudent {
    const college = this.getCollegeById(collegeId);
    const cleanEmail = (studentData.email || "").toLowerCase().trim();

    const newStudent: CollegeStudent = {
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      collegeId: college?.id || collegeId,
      collegeName: college?.name || "Partner College",
      fullName: studentData.fullName || cleanEmail.split("@")[0].replace(/[._]/g, " ") || "Student",
      email: cleanEmail,
      branch: studentData.branch || "Computer Science & AI",
      batch: studentData.batch || "2025",
      targetRole: studentData.targetRole || "Software Development Engineer (SDE-1)",
      interviewsCompleted: studentData.interviewsCompleted || 0,
      averageScore: studentData.averageScore || 0,
      readinessStatus: studentData.readinessStatus || "Needs Practice",
      lastActive: "Enrolled",
      registeredAt: new Date().toISOString().split("T")[0],
      codingRating: 1600,
      skills: { DSA: 0, SystemDesign: 0, Communication: 0, ProblemSolving: 0 }
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REGISTERED_STUDENTS);
      const existing: CollegeStudent[] = stored ? JSON.parse(stored) : [];
      const filtered = existing.filter(s => s.email.toLowerCase() !== cleanEmail);
      const updated = [newStudent, ...filtered];
      localStorage.setItem(STORAGE_KEYS.REGISTERED_STUDENTS, JSON.stringify(updated));

      supabase.from('waitlist').upsert({
        email: cleanEmail,
        college_name: college?.name || "Partner College",
        phone_number: JSON.stringify(newStudent),
        status: 'registered_student'
      }, { onConflict: 'email' }).then().catch(() => {});

      const channel = getCollegeRealtimeChannel();
      channel.send({
        type: "broadcast",
        event: "student_registered",
        payload: newStudent
      }).catch(() => {});
    } catch (e) {
      console.warn("Failed to persist student:", e);
    }

    return newStudent;
  },

  // Get ALL REAL registered students dynamically belonging to a college
  async getCollegeStudents(collegeId: string): Promise<CollegeStudent[]> {
    // Ensure we have all colleges from Supabase (cross-device)
    await ensureCollegesFromDb();
    const college = this.getCollegeById(collegeId);
    if (!college) return [];

    let registeredList: CollegeStudent[] = [];

    // 1. Fetch dynamically registered students from local registry
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REGISTERED_STUDENTS);
      if (stored) {
        const allRegistered: CollegeStudent[] = JSON.parse(stored);
        const filtered = allRegistered.filter(s => {
          if (!s.email) return false;
          const emailDomain = s.email.split("@")[1]?.toLowerCase();
          return (
            s.collegeId === college.id ||
            s.collegeName.toLowerCase() === college.name.toLowerCase() ||
            (emailDomain && college.domains.some(d => {
              const cd = d.toLowerCase().trim().replace(/^@/, "");
              return emailDomain === cd || emailDomain.endsWith("." + cd) || cd.endsWith("." + emailDomain);
            })) ||
            (college.id === "college-nst" && (s.email.includes("nst") || s.email.includes("rishihood") || s.email.includes("newton")))
          );
        });
        registeredList.push(...filtered);
      }
    } catch (e) {
      console.warn("Failed to load registered students from storage:", e);
    }

    // 2. Query Supabase database waitlist (publicly readable cross-device student registry)
    try {
      const { data: waitlistRows } = await supabase
        .from('waitlist')
        .select('*');

      if (waitlistRows && waitlistRows.length > 0) {
        for (const row of waitlistRows) {
          if (!row.email) continue;
          // Skip college drive internal records and college registration records
          if (row.status === 'college_drive_record' || row.status === 'college_registration') continue;
          const cleanEmail = row.email.toLowerCase().trim();
          if (cleanEmail.includes('@drives.voke.internal')) continue;

          let parsedStudent: Partial<CollegeStudent> | null = null;
          if (row.phone_number) {
            try {
              parsedStudent = JSON.parse(row.phone_number);
            } catch {}
          }

          const emailDomain = cleanEmail.split("@")[1];
          const matchesDomain = emailDomain && college.domains.some(d => {
            const cd = d.toLowerCase().trim().replace(/^@/, "");
            return emailDomain === cd || emailDomain.endsWith("." + cd) || cd.endsWith("." + emailDomain);
          });
          const matchesCollege = row.college_name && (
            row.college_name.toLowerCase().includes(college.shortName.toLowerCase()) ||
            college.name.toLowerCase().includes(row.college_name.toLowerCase()) ||
            row.college_name.toLowerCase() === college.name.toLowerCase()
          );
          const isNST = (college.id === "college-nst" || college.domains.some(d => d.includes("nst") || d.includes("rishihood"))) && (
            cleanEmail.includes("nst") || 
            cleanEmail.includes("rishihood") || 
            cleanEmail.includes("newton") || 
            matchesDomain
          );

          if (matchesDomain || matchesCollege || isNST) {
            const studentName = parsedStudent?.fullName || cleanEmail.split("@")[0].replace(/[._]/g, " ");
            registeredList.push({
              id: parsedStudent?.id || `std-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`,
              collegeId: college.id,
              collegeName: college.name,
              fullName: studentName,
              email: cleanEmail,
              branch: parsedStudent?.branch || "Computer Science & AI",
              batch: parsedStudent?.batch || "2025",
              targetRole: parsedStudent?.targetRole || "Software Development Engineer (SDE-1)",
              interviewsCompleted: parsedStudent?.interviewsCompleted ?? 0,
              averageScore: parsedStudent?.averageScore ?? 0,
              readinessStatus: parsedStudent?.readinessStatus || ((parsedStudent?.averageScore ?? 0) >= 80 ? "Placement Ready" : "Needs Practice"),
              lastActive: parsedStudent?.lastActive || "Enrolled",
              registeredAt: parsedStudent?.registeredAt || (row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0]),
              skills: parsedStudent?.skills || { DSA: 0, SystemDesign: 0, Communication: 0, ProblemSolving: 0 }
            });
          }
        }
      }
    } catch (e) {
      console.warn("Error querying waitlist for students:", e);
    }

    // 3. Query Supabase database profiles & public profiles dynamically
    try {
      const { data: dbProfiles } = await supabase
        .from('profiles')
        .select('*');

      if (dbProfiles && dbProfiles.length > 0) {
        for (const prof of dbProfiles) {
          const profEmail = (prof.email || "").toLowerCase().trim();
          const profName = prof.full_name || prof.name || (profEmail ? profEmail.split("@")[0].replace(/[._]/g, " ") : "");
          if (!profEmail && !profName) continue;

          const emailDomain = profEmail.split("@")[1];
          const matchesDomain = emailDomain && college.domains.some(d => {
            const cd = d.toLowerCase().trim().replace(/^@/, "");
            return emailDomain === cd || emailDomain.endsWith("." + cd) || cd.endsWith("." + emailDomain);
          });
          const matchesCollege = prof.college_id === college.id || prof.college_name?.toLowerCase() === college.name.toLowerCase();
          const isNST = college.id === "college-nst" && (
            profEmail.includes("nst") || 
            profEmail.includes("rishihood") || 
            profEmail.includes("newton") || 
            matchesDomain
          );

          if (matchesDomain || matchesCollege || isNST || (!profEmail && prof.full_name)) {
            const resolvedEmail = profEmail || `student-${prof.id.substring(0, 6)}@${college.domains[0] || 'nst.rishihood.edu.in'}`;
            registeredList.push({
              id: prof.id,
              collegeId: college.id,
              collegeName: college.name,
              fullName: profName || "College Student",
              email: resolvedEmail,
              branch: prof.branch || "Computer Science & AI",
              batch: prof.batch || "2025",
              targetRole: prof.target_role || prof.role || "Software Development Engineer (SDE-1)",
              interviewsCompleted: prof.interviews_completed || 0,
              averageScore: prof.average_score || 0,
              readinessStatus: (prof.average_score || 0) >= 80 ? "Placement Ready" : (prof.average_score || 0) >= 60 ? "Intermediate" : "Needs Practice",
              lastActive: "Active recently",
              registeredAt: prof.created_at ? prof.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
              skills: { DSA: 0, SystemDesign: 0, Communication: 0, ProblemSolving: 0 }
            });
          }
        }
      }
    } catch (e) {
      console.warn("Error querying database profiles:", e);
    }

    // 4. Include all candidates from college drives (so anyone invited or evaluated is in the directory)
    try {
      const allDrives = await this.getCollegeDrivesAsync(college.id);
      for (const drive of allDrives) {
        if (drive.candidates && drive.candidates.length > 0) {
          for (const cand of drive.candidates) {
            if (cand.studentEmail) {
              const cleanEmail = cand.studentEmail.toLowerCase().trim();
              // Only include candidates whose email domain matches the college
              const candDomain = cleanEmail.split("@")[1];
              const domainMatchesCollege = candDomain && college.domains.some(d => {
                const cd = d.toLowerCase().trim().replace(/^@/, "");
                return candDomain === cd || candDomain.endsWith("." + cd) || cd.endsWith("." + candDomain);
              });
              if (!domainMatchesCollege) continue;
              registeredList.push({
                id: `cand-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`,
                collegeId: college.id,
                collegeName: college.name,
                fullName: cand.studentName || cleanEmail.split("@")[0].replace(/[._]/g, " "),
                email: cleanEmail,
                branch: drive.targetBranch || "Computer Science & AI",
                batch: drive.targetBatch || "2025",
                targetRole: drive.targetRole || "Software Development Engineer (SDE-1)",
                interviewsCompleted: cand.status === "Completed" ? 1 : 0,
                averageScore: cand.score || 0,
                readinessStatus: (cand.score || 0) >= 75 ? "Placement Ready" : "Needs Practice",
                lastActive: cand.completedAt ? "Completed assessment" : "Active recently",
                registeredAt: drive.createdAt ? drive.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
                skills: { DSA: 0, SystemDesign: 0, Communication: 0, ProblemSolving: 0 }
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error checking drive candidates:", e);
    }

    // Strict deduplication by unique student email
    const uniqueMap = new Map<string, CollegeStudent>();
    for (const student of registeredList) {
      if (student.email) {
        const clean = student.email.toLowerCase().trim();
        if (!uniqueMap.has(clean)) {
          uniqueMap.set(clean, student);
        } else {
          // Merge details (preserve highest score and interviews completed)
          const prev = uniqueMap.get(clean)!;
          uniqueMap.set(clean, {
            ...prev,
            ...student,
            fullName: prev.fullName || student.fullName,
            interviewsCompleted: Math.max(prev.interviewsCompleted, student.interviewsCompleted),
            averageScore: Math.max(prev.averageScore, student.averageScore),
            readinessStatus: Math.max(prev.averageScore, student.averageScore) >= 75 ? "Placement Ready" : "Needs Practice"
          });
        }
      }
    }

    return Array.from(uniqueMap.values());
  },

  broadcastCollegeEvent(event: string, payload: any): void {
    const channel = getCollegeRealtimeChannel();
    const sendMsg = () => {
      channel.send({
        type: "broadcast",
        event,
        payload
      }).catch((e: any) => console.warn("Failed to broadcast:", e));
    };

    if (channel.state === "joined") {
      sendMsg();
    } else {
      channel.subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          sendMsg();
        }
      });
    }
  },

  // Scheduled Drives
  getCollegeDrives(collegeId: string): CollegeScheduledDrive[] {
    const college = this.getCollegeById(collegeId);
    const targetId = college?.id || collegeId;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_DRIVES);
      if (stored) {
        const parsed: CollegeScheduledDrive[] = JSON.parse(stored);
        if (parsed.length > 0) {
          const collegeDrives = parsed.filter(d => 
            d.collegeId === targetId || 
            d.collegeId.includes(targetId) ||
            targetId.includes(d.collegeId) ||
            (college && (
              d.collegeName.toLowerCase().includes(college.name.toLowerCase()) ||
              college.name.toLowerCase().includes(d.collegeName.toLowerCase()) ||
              d.collegeId === college.slug ||
              d.collegeId === college.id
            ))
          );
          if (collegeDrives.length > 0) {
            return collegeDrives;
          }
          // If no specific match but drives exist in storage, return all saved drives
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load drives from localStorage", e);
    }

    if (college) {
      const defaultDrive: CollegeScheduledDrive = {
        id: `drive-${college.slug || 'nst'}-sde1-2025`,
        collegeId: college.id,
        collegeName: college.name,
        title: "Campus SDE-1 Technical & Coding Placement Drive 2025",
        targetRole: "Full Stack Developer",
        interviewType: "technical_ai",
        targetAudience: "all",
        targetBatch: "Batch 2025",
        targetBranch: "Computer Science & AI",
        targetEmails: [],
        scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
        deadlineDate: new Date(Date.now() + 86400000 * 9).toISOString().split("T")[0],
        durationMinutes: 45,
        passingScore: 75,
        instructions: "Core Data Structures, Algorithms, System Architecture & Live Problem Solving.",
        targetCompanies: ["Google", "Amazon", "Microsoft", "Uber"],
        status: "active",
        candidatesCount: 1,
        completedCount: 0,
        avgScore: 0,
        createdAt: new Date().toISOString(),
        interviewUrl: `${origin}/college/assessment/drive-${college.slug || 'nst'}-sde1-2025?role=Full%20Stack%20Developer`
      };
      return [defaultDrive];
    }

    return [];
  },

  scheduleCollegeDrive(driveData: Omit<CollegeScheduledDrive, 'id' | 'createdAt'>): CollegeScheduledDrive {
    const driveId = `drive-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Generate direct assessment link
    let interviewPath = `/college/assessment/${driveId}?role=${encodeURIComponent(driveData.targetRole)}`;
    if (driveData.interviewType === "video_interview") {
      interviewPath = `/college/assessment/${driveId}?type=video&role=${encodeURIComponent(driveData.targetRole)}`;
    } else if (driveData.interviewType === "dsa_coding") {
      interviewPath = `/college/assessment/${driveId}?type=dsa&role=${encodeURIComponent(driveData.targetRole)}`;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
    const fullInterviewUrl = `${origin}${interviewPath}`;

    const newDrive: CollegeScheduledDrive = {
      ...driveData,
      id: driveId,
      createdAt: new Date().toISOString(),
      status: "active",
      completedCount: 0,
      avgScore: 0,
      interviewUrl: fullInterviewUrl,
      candidates: (driveData.targetEmails || []).map(email => ({
        studentEmail: email,
        studentName: email.split('@')[0].replace(/[._]/g, ' '),
        status: "Pending"
      }))
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_DRIVES);
      const existing: CollegeScheduledDrive[] = stored ? JSON.parse(stored) : [];
      const updated = [newDrive, ...existing];
      localStorage.setItem(STORAGE_KEYS.COLLEGE_DRIVES, JSON.stringify(updated));

      // Also append to local calendar events
      const calendarEvent = {
        id: `college-drive-${newDrive.id}`,
        title: newDrive.title,
        type: "interview",
        date: newDrive.scheduledDate,
        time: newDrive.durationMinutes ? `${newDrive.durationMinutes} mins` : undefined,
        company: driveData.collegeName,
        collegeName: driveData.collegeName,
        link: fullInterviewUrl,
        notes: driveData.instructions || "",
        completed: false,
        isCollegeDrive: true
      };

      try {
        const calSaved = localStorage.getItem("voke_user_calendar_events");
        const existingCal = calSaved ? JSON.parse(calSaved) : [];
        const filteredCal = existingCal.filter((c: any) => c.id !== calendarEvent.id);
        localStorage.setItem("voke_user_calendar_events", JSON.stringify([calendarEvent, ...filteredCal]));
      } catch (ce) {
        console.warn("Failed to update local calendar store:", ce);
      }

      // Persist across browsers via local sync endpoint
      try {
        fetch("/api/college-drives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        }).catch(() => {});
      } catch (e) {}

      // Persist globally into Supabase for 100% cross-device availability
      try {
        supabase.from('waitlist').upsert({
          email: `${newDrive.id}@drives.voke.internal`,
          college_name: newDrive.collegeName,
          phone_number: JSON.stringify(newDrive),
          status: 'college_drive_record'
        }, { onConflict: 'email' }).then(({ error }) => { if (error) console.warn('Drive upsert error:', error); }).catch(e => console.warn('Drive upsert failed:', e));
      } catch (dbe) {}

      // Broadcast reliably to all active tabs and browsers
      this.broadcastCollegeEvent("college_drive_scheduled", {
        drive: newDrive,
        calendarEvent
      });
    } catch (e) {
      console.warn("Failed to save scheduled drive", e);
    }

    return newDrive;
  },

  deleteCollegeDrive(driveId: string): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_DRIVES);
      const existing: CollegeScheduledDrive[] = stored ? JSON.parse(stored) : [];
      const updated = existing.filter(d => d.id !== driveId);
      localStorage.setItem(STORAGE_KEYS.COLLEGE_DRIVES, JSON.stringify(updated));
      
      try {
        fetch("/api/college-drives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        }).catch(() => {});
      } catch (e) {}

      try {
        supabase.from('waitlist')
          .delete()
          .eq('email', `${driveId}@drives.voke.internal`)
          .then().catch(() => {});
      } catch (e) {}
    } catch (e) {
      console.warn("Failed to delete drive", e);
    }
  },

  // Get specific drive by ID
  getDriveById(driveId: string): CollegeScheduledDrive | undefined {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_DRIVES);
      if (stored) {
        const drives: CollegeScheduledDrive[] = JSON.parse(stored);
        const match = drives.find(d => d.id === driveId);
        if (match) return match;
      }
    } catch (e) {
      console.warn("Failed to get drive by ID", e);
    }

    // Check all partner colleges default drives
    const colleges = this.getColleges();
    for (const c of colleges) {
      const drives = this.getCollegeDrives(c.id);
      const match = drives.find(d => d.id === driveId);
      if (match) return match;
    }
    return undefined;
  },

  // Record a student's completed interview assessment result for a college placement drive
  recordStudentDriveResult(result: {
    driveId: string;
    studentEmail: string;
    studentName?: string;
    score: number;
    feedback?: string;
    durationMinutes?: number;
    detailedScores?: {
      technicalAccuracy?: number;
      communication?: number;
      problemSolving?: number;
      confidence?: number;
    };
    answers?: CandidateQuestionAnswer[];
  }): { candidate: ScheduledDriveCandidate; drive: CollegeScheduledDrive; isPassed: boolean } | null {
    const cleanEmail = result.studentEmail.toLowerCase().trim();
    let targetDrive = this.getDriveById(result.driveId);

    if (!targetDrive) {
      console.warn("Target drive not found:", result.driveId);
      return null;
    }

    const isPassed = result.score >= (targetDrive.passingScore || 75);
    const selectionVerdict: "SELECTED" | "NOT_SELECTED" = isPassed ? "SELECTED" : "NOT_SELECTED";

    const candidateData: ScheduledDriveCandidate = {
      studentEmail: cleanEmail,
      studentName: result.studentName || cleanEmail.split("@")[0].replace(/[._]/g, " "),
      status: "Completed",
      score: result.score,
      isPassed,
      selectionVerdict,
      completedAt: new Date().toISOString(),
      durationMinutes: result.durationMinutes || 25,
      feedback: result.feedback || (isPassed ? "Exceeded institutional passing criteria with strong technical depth." : "Below benchmark score threshold. Needs further practice."),
      detailedScores: result.detailedScores,
      answers: result.answers
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_DRIVES);
      let allDrives: CollegeScheduledDrive[] = stored ? JSON.parse(stored) : [];
      
      const driveIndex = allDrives.findIndex(d => d.id === result.driveId);
      if (driveIndex >= 0) {
        const existingCandidates = allDrives[driveIndex].candidates || [];
        const filtered = existingCandidates.filter(c => c.studentEmail.toLowerCase() !== cleanEmail);
        const updatedCandidates = [candidateData, ...filtered];

        const completedOnly = updatedCandidates.filter(c => c.status === "Completed" && c.score !== undefined);
        const avgScore = completedOnly.length > 0
          ? Math.round(completedOnly.reduce((sum, c) => sum + (c.score || 0), 0) / completedOnly.length)
          : result.score;

        allDrives[driveIndex] = {
          ...allDrives[driveIndex],
          completedCount: completedOnly.length,
          avgScore,
          candidates: updatedCandidates
        };
        targetDrive = allDrives[driveIndex];
      } else {
        targetDrive = {
          ...targetDrive,
          completedCount: 1,
          avgScore: result.score,
          candidates: [candidateData]
        };
        allDrives.push(targetDrive);
      }

      localStorage.setItem(STORAGE_KEYS.COLLEGE_DRIVES, JSON.stringify(allDrives));

      // Persist across browsers via local sync endpoint
      fetch("/api/college-drives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allDrives)
      }).catch(() => {});

      // Also update student's record in registered students
      this.recordStudentRegistration({
        email: cleanEmail,
        fullName: candidateData.studentName,
        interviewsCompleted: 1,
        averageScore: result.score
      });

      // Immediately purge or mark completed in user's calendar events
      try {
        const calKey = "voke_user_calendar_events";
        const calSaved = localStorage.getItem(calKey);
        if (calSaved) {
          const calEvents: any[] = JSON.parse(calSaved);
          const filteredCal = calEvents.filter(e => 
            e.id !== `college-drive-${result.driveId}` && 
            e.id !== result.driveId &&
            (!e.link || !e.link.includes(result.driveId))
          );
          localStorage.setItem(calKey, JSON.stringify(filteredCal));
        }
      } catch (e) {}

      // Broadcast candidate evaluation update in real-time
      this.broadcastCollegeEvent("drive_candidate_evaluated", {
        driveId: result.driveId,
        candidate: candidateData,
        drive: targetDrive,
        isPassed
      });
    } catch (e) {
      console.warn("Failed to record student drive result", e);
    }

    return { candidate: candidateData, drive: targetDrive, isPassed };
  },

  // Async Drive Fetching with /api/college-drives persistence
  async getCollegeDrivesAsync(collegeId: string): Promise<CollegeScheduledDrive[]> {
    const college = this.getCollegeById(collegeId);
    const targetId = college?.id || collegeId;

    const combinedMap = new Map<string, CollegeScheduledDrive>();

    // 1. Fetch from Supabase database table for global multi-device persistence
    try {
      const { data: dbDrives } = await supabase
        .from('waitlist')
        .select('*')
        .eq('status', 'college_drive_record');

      if (dbDrives && dbDrives.length > 0) {
        for (const row of dbDrives) {
          if (row.phone_number) {
            try {
              const drive: CollegeScheduledDrive = JSON.parse(row.phone_number);
              if (drive && drive.id) {
                combinedMap.set(drive.id, drive);
              }
            } catch (pe) {}
          }
        }
      }
    } catch (e) {
      console.warn("Supabase drive sync read:", e);
    }

    // 2. Fetch from /api/college-drives (serverless function)
    try {
      const res = await fetch("/api/college-drives").catch(() => null);
      if (res && res.ok) {
        const parsedDrives: CollegeScheduledDrive[] = await res.json().catch(() => []);
        if (Array.isArray(parsedDrives) && parsedDrives.length > 0) {
          parsedDrives.forEach(d => {
            if (d && d.id) combinedMap.set(d.id, d);
          });
        }
      }
    } catch (e) {
      console.warn("Local sync read:", e);
    }

    // 3. Merge with localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_DRIVES);
      const existing: CollegeScheduledDrive[] = stored ? JSON.parse(stored) : [];
      existing.forEach(d => {
        if (d && d.id && !combinedMap.has(d.id)) {
          combinedMap.set(d.id, d);
        }
      });
    } catch (e) {}

    if (combinedMap.size > 0) {
      const merged = Array.from(combinedMap.values());
      try {
        localStorage.setItem(STORAGE_KEYS.COLLEGE_DRIVES, JSON.stringify(merged));
      } catch (e) {}

      const collegeDrives = merged.filter(d => 
        d.collegeId === targetId || 
        d.collegeId.includes(targetId) ||
        targetId.includes(d.collegeId) ||
        (college && (
          d.collegeName.toLowerCase().includes(college.name.toLowerCase()) ||
          college.name.toLowerCase().includes(d.collegeName.toLowerCase()) ||
          d.collegeId === college.slug ||
          d.collegeId === college.id
        ))
      );
      if (collegeDrives.length > 0) {
        return collegeDrives;
      }
      return merged;
    }

    return this.getCollegeDrives(collegeId);
  },

  // Student specific view
  getStudentDrives(studentEmail: string): CollegeScheduledDrive[] {
    if (!studentEmail) return [];
    const cleanEmail = studentEmail.toLowerCase().trim();
    const college = this.getCollegeByEmail(cleanEmail);
    if (!college) return [];

    const allCollegeDrives = this.getCollegeDrives(college.id);
    return allCollegeDrives.filter(drive => {
      // Check if student has already completed this drive
      const cand = drive.candidates?.find(c => c.studentEmail.toLowerCase() === cleanEmail);
      if (cand && (cand.status === "Completed" || cand.selectionVerdict !== undefined || cand.score !== undefined)) {
        return false; // Once completed/given, hide from upcoming calendar
      }
      if (drive.targetAudience === "all") return true;
      if (drive.targetEmails && drive.targetEmails.some(e => e.toLowerCase() === cleanEmail)) return true;
      return false;
    });
  },

  async getStudentDrivesAsync(studentEmail: string): Promise<CollegeScheduledDrive[]> {
    if (!studentEmail) return [];
    const cleanEmail = studentEmail.toLowerCase().trim();
    const emailDomain = cleanEmail.split("@")[1];

    // Ensure colleges from Supabase are loaded first (cross-device discovery)
    await ensureCollegesFromDb();

    const college = this.getCollegeByEmail(cleanEmail);

    // Collect ALL drives from every source: Supabase DB + localStorage
    const allDrivesMap = new Map<string, CollegeScheduledDrive>();

    // 1. Fetch from Supabase (cross-device source of truth)
    try {
      const { data: dbDrives } = await supabase
        .from('waitlist')
        .select('*')
        .eq('status', 'college_drive_record');

      if (dbDrives && dbDrives.length > 0) {
        for (const row of dbDrives) {
          if (!row.phone_number) continue;
          try {
            const drive: CollegeScheduledDrive = JSON.parse(row.phone_number);
            if (drive && drive.id) {
              allDrivesMap.set(drive.id, drive);
            }
          } catch (pe) {}
        }
      }
    } catch (e) {}

    // 2. Merge from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_DRIVES);
      const existing: CollegeScheduledDrive[] = stored ? JSON.parse(stored) : [];
      existing.forEach(d => {
        if (d && d.id && !allDrivesMap.has(d.id)) {
          allDrivesMap.set(d.id, d);
        }
      });
    } catch (e) {}

    // 3. Filter: only drives that target this student
    const matchingDrives: CollegeScheduledDrive[] = [];
    for (const drive of allDrivesMap.values()) {
      // Check if student already completed this drive
      const cand = drive.candidates?.find(c => c.studentEmail.toLowerCase() === cleanEmail);
      if (cand && (cand.status === "Completed" || cand.selectionVerdict !== undefined || cand.score !== undefined)) {
        continue; // Skip completed drives
      }

      // Match: student is explicitly in targetEmails
      const inTargetEmails = drive.targetEmails && drive.targetEmails.some(e => e.toLowerCase() === cleanEmail);
      
      // Match: drive targets "all" AND student's domain matches the college that created the drive
      let domainMatchesCollege = false;
      if (drive.targetAudience === "all" && emailDomain) {
        // Check if this drive's college has the same domain
        const driveCollege = this.getCollegeById(drive.collegeId);
        if (driveCollege && driveCollege.domains.some(d => d.toLowerCase() === emailDomain)) {
          domainMatchesCollege = true;
        }
        // Also check if drive's targetEmails contain same-domain emails (partial match)
        if (!domainMatchesCollege && drive.targetEmails) {
          domainMatchesCollege = drive.targetEmails.some(e => e.toLowerCase().endsWith("@" + emailDomain));
        }
      }

      if (inTargetEmails || domainMatchesCollege) {
        matchingDrives.push(drive);
      }
    }

    return matchingDrives;
  },

  // Analytics Computation on Real Students
  async getCollegeAnalytics(collegeId: string): Promise<CollegeAnalytics> {
    const students = await this.getCollegeStudents(collegeId);
    const drives = this.getCollegeDrives(collegeId);

    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.interviewsCompleted > 0).length;
    const totalInterviewsTaken = students.reduce((sum, s) => sum + s.interviewsCompleted, 0);
    const averageScore = totalStudents > 0
      ? Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / totalStudents)
      : 0;

    const readyCount = students.filter(s => s.readinessStatus === "Placement Ready").length;
    const placementReadyPercentage = totalStudents > 0 ? Math.round((readyCount / totalStudents) * 100) : 0;

    const skillAverages = {
      dsa: totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.skills?.DSA || s.averageScore), 0) / totalStudents) : 0,
      systemDesign: totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.skills?.SystemDesign || s.averageScore), 0) / totalStudents) : 0,
      communication: totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.skills?.Communication || s.averageScore), 0) / totalStudents) : 0,
      problemSolving: totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.skills?.ProblemSolving || s.averageScore), 0) / totalStudents) : 0,
    };

    const scoreDistribution = [
      { range: "90% - 100%", count: students.filter(s => s.averageScore >= 90).length },
      { range: "80% - 89%", count: students.filter(s => s.averageScore >= 80 && s.averageScore < 90).length },
      { range: "70% - 79%", count: students.filter(s => s.averageScore >= 70 && s.averageScore < 80).length },
      { range: "< 70%", count: students.filter(s => s.averageScore < 70).length },
    ];

    const topPerformers = [...students].sort((a, b) => b.averageScore - a.averageScore).slice(0, 5);

    return {
      totalStudents,
      activeStudents,
      totalInterviewsTaken,
      averageScore,
      placementReadyPercentage,
      activeDrivesCount: drives.filter(d => d.status === "active" || d.status === "scheduled").length,
      skillAverages,
      scoreDistribution,
      topPerformers
    };
  },

  // Export Roster as CSV
  async exportStudentsToCSV(collegeId: string): Promise<string> {
    const students = await this.getCollegeStudents(collegeId);
    const headers = ["Student Name", "College Email ID", "Branch", "Batch", "Target Role", "Interviews Taken", "Avg AI Score", "Placement Readiness", "Last Active"];
    
    const rows = students.map(s => [
      `"${s.fullName}"`,
      `"${s.email}"`,
      `"${s.branch}"`,
      `"${s.batch}"`,
      `"${s.targetRole}"`,
      s.interviewsCompleted,
      `${s.averageScore}%`,
      `"${s.readinessStatus}"`,
      `"${s.lastActive}"`
    ]);

    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  }
};
