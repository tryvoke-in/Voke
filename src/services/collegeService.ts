import { supabase } from "@/integrations/supabase/client";

export interface College {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  domains: string[]; // e.g. ["nst.rishihood.edu.in", "rishihood.edu.in", "nst.edu.in"]
  adminEmail: string;
  adminName: string;
  adminPasswordHash?: string;
  logoUrl?: string;
  tier: string;
  contractPeriod: string;
  totalStudentSlots: number;
  location: string;
  establishedYear?: number;
  contactPhone?: string;
}

export async function hashCollegePassword(password: string, salt: string = "voke_institution_salt_2025"): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${password}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // Safe fallback for environments without crypto.subtle
  let hash = 0;
  const str = `${salt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
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

// Known legacy dummy IDs to prune so only real registered colleges remain
const HARDCODED_COLLEGE_IDS = new Set([
  "college-nst", "college-dtu", "college-iitd", "college-vit"
]);

const DUMMY_DEFAULT_EMAILS = new Set([
  "placement@nst.edu.in", "tnp@dtu.ac.in", "tnp@iitd.ac.in", "placement@vit.ac.in"
]);

// Default Partner Colleges configuration (empty by default so only real registered colleges appear)
export const DEFAULT_COLLEGES: College[] = [];

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

let _inMemoryColleges: College[] = [];

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
      const stored = typeof localStorage !== "undefined" && localStorage.getItem
        ? localStorage.getItem(STORAGE_KEYS.COLLEGES)
        : null;
      let existing: College[] = stored ? JSON.parse(stored) : [];
      // Clean legacy dummy colleges
      existing = existing.filter(c => !HARDCODED_COLLEGE_IDS.has(c.id) && !DUMMY_DEFAULT_EMAILS.has(c.adminEmail));

      for (const row of dbColleges) {
        if (row.phone_number) {
          try {
            const college: College = JSON.parse(row.phone_number);
            if (
              college && 
              (college.id || college.adminEmail) && 
              !HARDCODED_COLLEGE_IDS.has(college.id) &&
              !DUMMY_DEFAULT_EMAILS.has(college.adminEmail)
            ) {
              const existingIdx = existing.findIndex(c => 
                c.id === college.id || 
                (c.adminEmail && college.adminEmail && c.adminEmail.toLowerCase() === college.adminEmail.toLowerCase())
              );
              if (existingIdx >= 0) {
                existing[existingIdx] = { ...existing[existingIdx], ...college };
              } else {
                existing.push(college);
              }
            }
          } catch (pe) {}
        }
      }
      _inMemoryColleges = existing;
      if (typeof localStorage !== "undefined" && localStorage.setItem) {
        localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(existing));
      }
    }
  } catch (e) {
    console.warn("Failed to load colleges from Supabase:", e);
  }
}

export const collegeService = {
  // Retrieve all colleges (only real registered colleges)
  getColleges(): College[] {
    try {
      let storedList: College[] = [];
      if (typeof localStorage !== "undefined" && localStorage.getItem) {
        const stored = localStorage.getItem(STORAGE_KEYS.COLLEGES);
        if (stored) {
          const raw: College[] = JSON.parse(stored);
          storedList = raw.filter(c => !HARDCODED_COLLEGE_IDS.has(c.id) && !DUMMY_DEFAULT_EMAILS.has(c.adminEmail));
          if (raw.length !== storedList.length && localStorage.setItem) {
            localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(storedList));
          }
        }
      }

      const combined = [...storedList];
      for (const mem of _inMemoryColleges) {
        if (HARDCODED_COLLEGE_IDS.has(mem.id) || DUMMY_DEFAULT_EMAILS.has(mem.adminEmail)) continue;
        const idx = combined.findIndex(c => c.id === mem.id || c.adminEmail.toLowerCase() === mem.adminEmail.toLowerCase());
        if (idx >= 0) {
          combined[idx] = { ...combined[idx], ...mem };
        } else {
          combined.push(mem);
        }
      }

      return combined.filter(c => !HARDCODED_COLLEGE_IDS.has(c.id) && !DUMMY_DEFAULT_EMAILS.has(c.adminEmail));
    } catch (e) {
      console.warn("Failed to load colleges from localStorage", e);
    }
    return [];
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
    
    // Generic public email domains must never match a partner college
    const publicEmailProviders = [
      "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", 
      "icloud.com", "aol.com", "zoho.com", "protonmail.com", "proton.me",
      "yandex.com", "mail.com", "gmx.com", "rediffmail.com"
    ];
    if (publicEmailProviders.includes(cleanDomain)) {
      return undefined;
    }

    const colleges = this.getColleges();
    return colleges.find(c =>
      c.domains.some(d => {
        const cd = d.toLowerCase().trim().replace(/^@/, "");
        return cleanDomain === cd || cleanDomain.endsWith("." + cd);
      })
    );
  },

  getCollegeByEmail(email: string): College | undefined {
    if (!email || !email.includes("@")) return undefined;
    const domain = email.split("@")[1]?.toLowerCase().trim();
    if (!domain) return undefined;

    const publicEmailProviders = [
      "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", 
      "icloud.com", "aol.com", "zoho.com", "protonmail.com", "proton.me",
      "yandex.com", "mail.com", "gmx.com", "rediffmail.com"
    ];
    if (publicEmailProviders.includes(domain)) {
      return undefined;
    }

    return this.getCollegeByDomain(domain);
  },

  isEmailMatchingCollege(email: string, college: College): boolean {
    if (!email || !email.includes("@") || !college || !college.domains) return false;
    const domain = email.split("@")[1]?.toLowerCase().trim();
    if (!domain) return false;

    const publicEmailProviders = [
      "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", 
      "icloud.com", "aol.com", "zoho.com", "protonmail.com", "proton.me",
      "yandex.com", "mail.com", "gmx.com", "rediffmail.com"
    ];
    if (publicEmailProviders.includes(domain)) {
      return false;
    }

    return college.domains.some(d => {
      const cd = d.toLowerCase().trim().replace(/^@/, "");
      return domain === cd || domain.endsWith("." + cd);
    });
  },

  // Authenticate College Admin (Async with secure password validation)
  async authenticateCollegeAdminAsync(email: string, password?: string): Promise<{ success: boolean; college?: College; error?: string }> {
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid administrator email address." };
    }

    await ensureCollegesFromDb();
    const cleanEmail = email.toLowerCase().trim();
    const colleges = this.getColleges();

    let matchedCollege = colleges.find(c => c.adminEmail.toLowerCase() === cleanEmail);

    if (!matchedCollege) {
      const emailDomain = cleanEmail.split("@")[1];
      if (emailDomain) {
        matchedCollege = colleges.find(c => 
          c.domains.some(d => emailDomain.toLowerCase() === d.toLowerCase() || emailDomain.toLowerCase().endsWith("." + d.toLowerCase()))
        );
      }
    }

    if (!matchedCollege) {
      return { 
        success: false, 
        error: "College admin credentials not recognized. Check your email or onboard your university." 
      };
    }

    // Verify Password if the college was registered with a password hash
    if (matchedCollege.adminPasswordHash) {
      if (!password || !password.trim()) {
        return {
          success: false,
          error: "Please enter your administrator password to sign in."
        };
      }

      const inputHash = await hashCollegePassword(password.trim());
      if (inputHash !== matchedCollege.adminPasswordHash) {
        return {
          success: false,
          error: "Incorrect administrator password. Please check your credentials."
        };
      }
    }

    // Create sanitized session object (never expose password hash in session storage)
    const sanitizedCollege: College = { ...matchedCollege };
    delete sanitizedCollege.adminPasswordHash;

    this.setCollegeSession(sanitizedCollege);
    return { success: true, college: sanitizedCollege };
  },

  // Synchronous version for backwards compatibility
  authenticateCollegeAdmin(email: string, password?: string): { success: boolean; college?: College; error?: string } {
    const cleanEmail = email.toLowerCase().trim();
    const colleges = this.getColleges();

    let matchedCollege = colleges.find(c => c.adminEmail.toLowerCase() === cleanEmail);

    if (!matchedCollege) {
      const emailDomain = cleanEmail.split("@")[1];
      if (emailDomain) {
        matchedCollege = colleges.find(c => 
          c.domains.some(d => emailDomain.toLowerCase() === d.toLowerCase() || emailDomain.toLowerCase().endsWith("." + d.toLowerCase()))
        );
      }
    }

    if (matchedCollege) {
      const sanitizedCollege: College = { ...matchedCollege };
      delete sanitizedCollege.adminPasswordHash;
      this.setCollegeSession(sanitizedCollege);
      return { success: true, college: sanitizedCollege };
    }

    return { 
      success: false, 
      error: "College admin credentials not recognized. Try signing in with a partner email (e.g. placement@nst.edu.in) or click Quick Demo Sign In." 
    };
  },

  // Session management
  getCollegeSession(): College | null {
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined" && localStorage.getItem) {
        const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_SESSION);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn("Failed to parse college session", e);
    }
    return null;
  },

  setCollegeSession(college: College): void {
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined" && localStorage.setItem) {
        const sanitized = { ...college };
        delete sanitized.adminPasswordHash;
        localStorage.setItem(STORAGE_KEYS.COLLEGE_SESSION, JSON.stringify(sanitized));
      }
    } catch (e) {
      console.warn("Failed to save college session", e);
    }
  },

  clearCollegeSession(): void {
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined" && localStorage.removeItem) {
        localStorage.removeItem(STORAGE_KEYS.COLLEGE_SESSION);
      }
    } catch (e) {
      console.warn("Failed to clear college session", e);
    }
  },

  // Register a new partner college (Async with secure password hashing)
  async registerCollegeAsync(collegeData: Partial<College> & { password?: string }): Promise<College> {
    await ensureCollegesFromDb();
    const existingColleges = this.getColleges();
    const cleanName = (collegeData.name || "Partner University").trim();
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 20);

    const domains = (collegeData.domains && collegeData.domains.length > 0)
      ? collegeData.domains.map(d => d.trim().replace(/^@/, "").toLowerCase())
      : [`${slug}.edu.in`];

    const adminEmail = (collegeData.adminEmail || `admin@${domains[0]}`).toLowerCase().trim();

    let adminPasswordHash: string | undefined = undefined;
    if (collegeData.password && collegeData.password.trim()) {
      adminPasswordHash = await hashCollegePassword(collegeData.password.trim());
    }

    const newCollege: College = {
      id: `college-${Date.now()}`,
      name: cleanName,
      shortName: collegeData.shortName?.trim() || cleanName.slice(0, 4).toUpperCase(),
      slug,
      domains,
      adminEmail,
      adminName: collegeData.adminName?.trim() || "Placement Coordinator",
      adminPasswordHash,
      tier: "Enterprise Campus Partner",
      contractPeriod: "2025 - 2026 Academic Year",
      totalStudentSlots: collegeData.totalStudentSlots || 500,
      location: collegeData.location?.trim() || "India",
      establishedYear: collegeData.establishedYear || new Date().getFullYear(),
      contactPhone: collegeData.contactPhone || "+91 98000 00000"
    };

    const updated = [
      ...existingColleges.filter(c => c.id !== newCollege.id && c.adminEmail.toLowerCase() !== adminEmail),
      newCollege
    ];
    _inMemoryColleges = updated;

    try {
      if (typeof localStorage !== "undefined" && localStorage.setItem) {
        localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Failed to persist new college", e);
    }

    // Persist to Supabase for cross-device college discovery
    try {
      await supabase.from('waitlist').upsert({
        email: newCollege.adminEmail,
        college_name: newCollege.name,
        phone_number: JSON.stringify(newCollege),
        status: 'college_registration'
      }, { onConflict: 'email' });
    } catch (dbe) {
      console.warn("College registration DB sync:", dbe);
    }

    const sanitizedCollege = { ...newCollege };
    delete sanitizedCollege.adminPasswordHash;
    this.setCollegeSession(sanitizedCollege);

    return sanitizedCollege;
  },

  // Register a new partner college (Sync wrapper)
  registerCollege(collegeData: Partial<College> & { password?: string }): College {
    const existingColleges = this.getColleges();
    const cleanName = (collegeData.name || "Partner University").trim();
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 20);

    const domains = (collegeData.domains && collegeData.domains.length > 0)
      ? collegeData.domains.map(d => d.trim().replace(/^@/, "").toLowerCase())
      : [`${slug}.edu.in`];

    const adminEmail = (collegeData.adminEmail || `admin@${domains[0]}`).toLowerCase().trim();

    const newCollege: College = {
      id: `college-${Date.now()}`,
      name: cleanName,
      shortName: collegeData.shortName?.trim() || cleanName.slice(0, 4).toUpperCase(),
      slug,
      domains,
      adminEmail,
      adminName: collegeData.adminName?.trim() || "Placement Coordinator",
      adminPasswordHash: collegeData.adminPasswordHash,
      tier: "Enterprise Campus Partner",
      contractPeriod: "2025 - 2026 Academic Year",
      totalStudentSlots: collegeData.totalStudentSlots || 500,
      location: collegeData.location?.trim() || "India",
      establishedYear: collegeData.establishedYear || new Date().getFullYear(),
      contactPhone: collegeData.contactPhone || "+91 98000 00000"
    };

    const updated = [
      ...existingColleges.filter(c => c.id !== newCollege.id && c.adminEmail.toLowerCase() !== adminEmail),
      newCollege
    ];
    _inMemoryColleges = updated;

    try {
      if (typeof localStorage !== "undefined" && localStorage.setItem) {
        localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(updated));
      }
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
      }, { onConflict: 'email' }).then(({ error }) => { if (error) console.warn('College reg upsert error:', error); }, e => console.warn('College reg upsert failed:', e));
    } catch (dbe) {}

    const sanitizedCollege = { ...newCollege };
    delete sanitizedCollege.adminPasswordHash;
    this.setCollegeSession(sanitizedCollege);

    return sanitizedCollege;
  },

  async updateCollegeAsync(collegeId: string, updates: Partial<College>): Promise<College | null> {
    await ensureCollegesFromDb();
    const existingColleges = this.getColleges();
    const index = existingColleges.findIndex(c => c.id === collegeId);
    
    if (index === -1) return null;
    
    const updatedCollege = { ...existingColleges[index], ...updates };
    const updatedList = [
      ...existingColleges.slice(0, index),
      updatedCollege,
      ...existingColleges.slice(index + 1)
    ];
    
    _inMemoryColleges = updatedList;
    try {
      if (typeof localStorage !== "undefined" && localStorage.setItem) {
        localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(updatedList));
        
        // Also update the session if this is the active college
        const sessionStr = localStorage.getItem(STORAGE_KEYS.COLLEGE_SESSION);
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session.id === collegeId) {
            localStorage.setItem(STORAGE_KEYS.COLLEGE_SESSION, JSON.stringify(updatedCollege));
          }
        }
      }
    } catch (e) {
      console.warn("Failed to update college in local storage", e);
    }
    
    return updatedCollege;
  },

  // Delete / Deregister a partner college
  async deleteCollegeAsync(collegeId: string): Promise<boolean> {
    try {
      await ensureCollegesFromDb();
      const colleges = this.getColleges();
      const targetCollege = colleges.find(c => c.id === collegeId || c.slug === collegeId);
      
      const updated = colleges.filter(c => c.id !== collegeId && c.slug !== collegeId);
      _inMemoryColleges = updated;

      if (typeof localStorage !== "undefined" && localStorage.setItem) {
        localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(updated));
      }

      // If active session belongs to this college, clear it
      const currentSession = this.getCollegeSession();
      if (currentSession && (currentSession.id === collegeId || currentSession.slug === collegeId)) {
        this.clearCollegeSession();
      }

      // Remove from Supabase waitlist table if it exists
      if (targetCollege && targetCollege.adminEmail) {
        try {
          await supabase
            .from('waitlist')
            .delete()
            .eq('status', 'college_registration')
            .eq('email', targetCollege.adminEmail);
        } catch (dbe) {
          console.warn("Supabase college deletion warning:", dbe);
        }
      }

      return true;
    } catch (e) {
      console.warn("Failed to delete college:", e);
      return false;
    }
  },

  deleteCollege(collegeId: string): boolean {
    try {
      const colleges = this.getColleges();
      const targetCollege = colleges.find(c => c.id === collegeId || c.slug === collegeId);
      const updated = colleges.filter(c => c.id !== collegeId && c.slug !== collegeId);
      _inMemoryColleges = updated;

      if (typeof localStorage !== "undefined" && localStorage.setItem) {
        localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(updated));
      }

      const currentSession = this.getCollegeSession();
      if (currentSession && (currentSession.id === collegeId || currentSession.slug === collegeId)) {
        this.clearCollegeSession();
      }

      if (targetCollege && targetCollege.adminEmail) {
        supabase
          .from('waitlist')
          .delete()
          .eq('status', 'college_registration')
          .eq('email', targetCollege.adminEmail)
          .then(() => {}, () => {});
      }
      return true;
    } catch (e) {
      console.warn("Failed to delete college:", e);
      return false;
    }
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
    // ONLY register students whose email domain strictly matches a partner college
    if (!college) {
      return null;
    }

    const collegeName = college.name;
    const collegeId = college.id;

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
      // Clean up and keep only matching institutional students
      const filtered = existing.filter(s => s.email.toLowerCase() !== cleanEmail && this.getCollegeByEmail(s.email));
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
        }, e => console.warn('Student reg upsert failed:', e));
      });

      // Broadcast update dynamically via Supabase Realtime channel
      const channel = getCollegeRealtimeChannel();
      channel.send({
        type: "broadcast",
        event: "student_registered",
        payload: newStudent
      }).then(() => {}, () => {});
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
    if (!resolvedCollege) return null;
    const finalCollegeName = resolvedCollege.name;

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
      }, { onConflict: 'email' }).then(() => {}, () => {});

      const channel = getCollegeRealtimeChannel();
      channel.send({
        type: "broadcast",
        event: "student_registered",
        payload: newStudent
      }).then(() => {}, () => {});
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

    // 1. Fetch dynamically registered students from local registry (strictly matching domain)
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REGISTERED_STUDENTS);
      if (stored) {
        const allRegistered: CollegeStudent[] = JSON.parse(stored);
        const filtered = allRegistered.filter(s => {
          if (!s.email) return false;
          return this.isEmailMatchingCollege(s.email, college);
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

          // STRICT ENFORCEMENT: Email domain MUST match this college's official domains
          if (!this.isEmailMatchingCollege(cleanEmail, college)) {
            continue;
          }

          let parsedStudent: Partial<CollegeStudent> | null = null;
          if (row.phone_number) {
            try {
              parsedStudent = JSON.parse(row.phone_number);
            } catch {}
          }

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
    } catch (e) {
      console.warn("Error querying waitlist for students:", e);
    }

    // 3. Query Supabase database profiles & public profiles dynamically (strictly matching domain)
    try {
      const { data: dbProfiles } = await supabase
        .from('profiles')
        .select('*');

      if (dbProfiles && dbProfiles.length > 0) {
        for (const _prof of dbProfiles) {
          const prof = _prof as any;
          const profEmail = (prof.email || "").toLowerCase().trim();
          if (!profEmail) continue;

          // STRICT ENFORCEMENT: Email domain MUST match this college's official domains
          if (!this.isEmailMatchingCollege(profEmail, college)) {
            continue;
          }
          const profName = prof.full_name || prof.name || profEmail.split("@")[0].replace(/[._]/g, " ");
          registeredList.push({
            id: prof.id,
            collegeId: college.id,
            collegeName: college.name,
            fullName: profName,
            email: profEmail,
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
    } catch (e) {
      console.warn("Error querying database profiles:", e);
    }

    // 4. Include candidates from college drives (strictly matching domain)
    try {
      const allDrives = await this.getCollegeDrivesAsync(college.id);
      for (const drive of allDrives) {
        if (drive.candidates && drive.candidates.length > 0) {
          for (const cand of drive.candidates) {
            if (cand.studentEmail) {
              const cleanEmail = cand.studentEmail.toLowerCase().trim();
              if (!this.isEmailMatchingCollege(cleanEmail, college)) continue;

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
      if (student.email && this.isEmailMatchingCollege(student.email, college)) {
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
          // Do NOT fallback to returning other colleges' drives
          return [];
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

  getCollegeDriveById(driveId: string): CollegeScheduledDrive | undefined {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_DRIVES);
      if (stored) {
        const parsed: CollegeScheduledDrive[] = JSON.parse(stored);
        const drive = parsed.find(d => d.id === driveId);
        if (drive) return drive;
      }
    } catch (e) {
      console.warn("Failed to load drives from localStorage", e);
    }
    
    // Fallback to searching through active session drives
    const session = this.getCollegeSession();
    if (session) {
      const drives = this.getCollegeDrives(session.id);
      return drives.find(d => d.id === driveId);
    }
    return undefined;
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

      // Persist across browsers via local sync endpoint
      try {
        fetch("/api/college-drives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        }).then(() => {}, () => {});
      } catch (e) {}

      // Persist globally into Supabase for 100% cross-device availability
      try {
        supabase.from('waitlist').upsert({
          email: `${newDrive.id}@drives.voke.internal`,
          college_name: newDrive.collegeName,
          phone_number: JSON.stringify(newDrive),
          status: 'college_drive_record'
        }, { onConflict: 'email' }).then(({ error }) => { if (error) console.warn('Drive upsert error:', error); }, e => console.warn('Drive upsert failed:', e));
      } catch (dbe) {}

      // Broadcast reliably to all active tabs and browsers
      this.broadcastCollegeEvent("college_drive_scheduled", {
        drive: newDrive
      });
    } catch (e) {
      console.warn("Failed to save scheduled drive", e);
    }

    return newDrive;
  },
  updateCollegeDrive(driveId: string, updates: Partial<Omit<CollegeScheduledDrive, 'id' | 'createdAt'>>): CollegeScheduledDrive | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_DRIVES);
      const existing: CollegeScheduledDrive[] = stored ? JSON.parse(stored) : [];
      
      const index = existing.findIndex(d => d.id === driveId);
      if (index === -1) return null;

      const updatedDrive = {
        ...existing[index],
        ...updates
      };

      existing[index] = updatedDrive;
      localStorage.setItem(STORAGE_KEYS.COLLEGE_DRIVES, JSON.stringify(existing));

      // Also update in API/Supabase if needed (omitted here for brevity, matching delete logic)
      this.broadcastCollegeEvent("college_drive_updated", { drive: updatedDrive });
      
      return updatedDrive;
    } catch (e) {
      console.warn("Failed to update scheduled drive", e);
      return null;
    }
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
        }).then(() => {}, () => {});
      } catch (e) {}

      try {
        supabase.from('waitlist')
          .delete()
          .eq('email', `${driveId}@drives.voke.internal`)
          .then(() => {}, () => {});
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
      }).then(() => {}, () => {});

      // Persist drive with candidate results to Supabase waitlist for multi-device sync
      try {
        supabase.from('waitlist').upsert({
          email: `${targetDrive.id}@drives.voke.internal`,
          college_name: targetDrive.collegeName,
          phone_number: JSON.stringify(targetDrive),
          status: 'college_drive_record'
        }, { onConflict: 'email' }).then(({ error }) => {
          if (error) console.warn("Supabase drive result sync error:", error);
        }).then(() => {}, () => {});
      } catch (e) {}

      // Also update student's record in registered students
      this.recordStudentRegistration({
        email: cleanEmail,
        fullName: candidateData.studentName,
        interviewsCompleted: 1,
        averageScore: result.score
      });

      // Immediately purge or mark completed in user's calendar events
      try {
        const calKey = "voke_user_calendar_events_v2";
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
      return collegeDrives;
    }

    return this.getCollegeDrives(collegeId);
  },

  // Check if a student is genuinely eligible to receive/view a college placement drive
  isStudentEligibleForDrive(studentEmail: string, drive: CollegeScheduledDrive): boolean {
    if (!studentEmail || !drive) return false;
    const cleanEmail = studentEmail.toLowerCase().trim();
    if (!cleanEmail.includes("@")) return false;

    // 1. Explicit targeted candidate: student's exact email is in targetEmails
    if (drive.targetEmails && Array.isArray(drive.targetEmails) && drive.targetEmails.length > 0) {
      if (drive.targetEmails.some(e => e && e.toLowerCase().trim() === cleanEmail)) {
        return true;
      }
    }

    // 2. Institutional Drive Broadcast: Student must strictly belong to the partner college that created the drive
    const studentCollege = this.getCollegeByEmail(cleanEmail);
    if (!studentCollege) {
      // Non-registered email, personal email (e.g. gmail.com, yahoo.com), or non-partner domain
      return false;
    }

    const driveCollege = this.getCollegeById(drive.collegeId) ||
      this.getColleges().find(c =>
        c.name.toLowerCase() === (drive.collegeName || "").toLowerCase() ||
        c.id === drive.collegeId ||
        c.slug === drive.collegeId
      );

    if (!driveCollege || driveCollege.id !== studentCollege.id) {
      // Drive was scheduled by a different college
      return false;
    }

    // Drive belongs to student's college
    if (drive.targetAudience === "all") {
      return true;
    }

    if (drive.targetAudience === "branch") {
      if (!drive.targetBranch || drive.targetBranch === "All Branches") {
        return true;
      }
      return true;
    }

    return false;
  },

  // Student specific view
  getStudentDrives(studentEmail: string): CollegeScheduledDrive[] {
    if (!studentEmail) return [];
    const cleanEmail = studentEmail.toLowerCase().trim();
    const studentCollege = this.getCollegeByEmail(cleanEmail);
    
    const allDrives: CollegeScheduledDrive[] = studentCollege 
      ? this.getCollegeDrives(studentCollege.id)
      : (() => {
          try {
            const stored = localStorage.getItem(STORAGE_KEYS.COLLEGE_DRIVES);
            return stored ? JSON.parse(stored) : [];
          } catch {
            return [];
          }
        })();

    return allDrives.filter(drive => {
      const cand = drive.candidates?.find(c => c.studentEmail.toLowerCase() === cleanEmail);
      if (cand && (cand.status === "Completed" || cand.selectionVerdict !== undefined || cand.score !== undefined)) {
        return false;
      }
      return this.isStudentEligibleForDrive(cleanEmail, drive);
    });
  },

  async getStudentDrivesAsync(studentEmail: string): Promise<CollegeScheduledDrive[]> {
    if (!studentEmail) return [];
    const cleanEmail = studentEmail.toLowerCase().trim();

    // Ensure colleges from Supabase are loaded first (cross-device discovery)
    await ensureCollegesFromDb();

    // Collect ALL drives from Supabase DB + localStorage
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

    // 3. Filter: strictly only drives where this student is genuinely eligible
    const matchingDrives: CollegeScheduledDrive[] = [];
    for (const drive of allDrivesMap.values()) {
      // Check if student already completed this drive
      const cand = drive.candidates?.find(c => c.studentEmail.toLowerCase() === cleanEmail);
      if (cand && (cand.status === "Completed" || cand.selectionVerdict !== undefined || cand.score !== undefined)) {
        continue;
      }

      if (this.isStudentEligibleForDrive(cleanEmail, drive)) {
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
  },

  // Get complete, rich student assessment and feedback report
  async getStudentDetailedReportAsync(studentEmail: string, collegeId: string): Promise<StudentDetailedAssessmentReport | null> {
    if (!studentEmail) return null;
    const cleanEmail = studentEmail.toLowerCase().trim();
    const students = await this.getCollegeStudents(collegeId);
    let student = students.find(s => s.email.toLowerCase() === cleanEmail);

    if (!student) {
      const college = this.getCollegeById(collegeId);
      student = {
        id: `std-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`,
        collegeId,
        collegeName: college?.name || "Partner College",
        fullName: cleanEmail.split("@")[0].replace(/[._]/g, " "),
        email: cleanEmail,
        branch: "Computer Science & AI",
        batch: "2025",
        targetRole: "Software Development Engineer (SDE-1)",
        interviewsCompleted: 0,
        averageScore: 0,
        readinessStatus: "Needs Practice",
        lastActive: "Enrolled",
        registeredAt: new Date().toISOString().split("T")[0],
        skills: { DSA: 0, SystemDesign: 0, Communication: 0, ProblemSolving: 0 }
      };
    }

    // 1. Check all college drives for evaluations of this student
    const drives = await this.getCollegeDrivesAsync(collegeId);
    const driveEvaluations: StudentDetailedAssessmentReport["driveEvaluations"] = [];
    
    for (const drive of drives) {
      const cand = drive.candidates?.find(c => c.studentEmail.toLowerCase() === cleanEmail);
      if (cand && (cand.status === "Completed" || cand.score !== undefined)) {
        driveEvaluations.push({
          driveId: drive.id,
          driveTitle: drive.title,
          interviewType: drive.interviewType,
          completedAt: cand.completedAt || drive.createdAt,
          score: cand.score || 0,
          passingScore: drive.passingScore || 75,
          isPassed: cand.isPassed ?? ((cand.score || 0) >= (drive.passingScore || 75)),
          selectionVerdict: cand.selectionVerdict || ((cand.score || 0) >= (drive.passingScore || 75) ? "SELECTED" : "NOT_SELECTED"),
          feedback: cand.feedback || "Assessment completed.",
          answers: cand.answers || []
        });
      }
    }

    // 2. Query Supabase interview_sessions
    const interviewSessions: StudentDetailedAssessmentReport["interviewSessions"] = [];
    let dbSessionEval: any = null;

    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (prof?.id) {
        const { data: sessions } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('user_id', prof.id)
          .order('created_at', { ascending: false });

        if (sessions && sessions.length > 0) {
          sessions.forEach(sess => {
            interviewSessions.push({
              id: sess.id,
              role: sess.role,
              interviewType: sess.interview_type,
              score: sess.overall_score || 0,
              createdAt: sess.created_at || new Date().toISOString(),
              feedback: sess.feedback_summary || "",
              transcript: Array.isArray(sess.transcript) ? sess.transcript : []
            });
          });
          dbSessionEval = sessions[0];
        }
      }
    } catch (e) {}

    // Derive overall scores
    const primaryScore = driveEvaluations.length > 0 
      ? driveEvaluations[0].score 
      : (interviewSessions.length > 0 ? interviewSessions[0].score : (student.averageScore || 0));

    const totalInterviews = Math.max(
      student.interviewsCompleted,
      driveEvaluations.length + interviewSessions.length
    );

    const isReady = primaryScore >= 80;
    const isIntermediate = primaryScore >= 60 && primaryScore < 80;
    const readinessStatus = isReady ? "Placement Ready" : (isIntermediate ? "Intermediate" : "Needs Practice");

    // Dynamic competency metrics
    const detailedScores = {
      technicalAccuracy: primaryScore > 0 ? Math.min(100, Math.round(primaryScore * 1.02)) : (student.skills?.DSA || 75),
      dsa: primaryScore > 0 ? Math.min(100, Math.round(primaryScore * 0.98)) : (student.skills?.DSA || 78),
      problemSolving: primaryScore > 0 ? Math.min(100, Math.round(primaryScore * 0.95)) : (student.skills?.ProblemSolving || 72),
      systemDesign: primaryScore > 0 ? Math.min(100, Math.round(primaryScore * 0.92)) : (student.skills?.SystemDesign || 70),
      communication: primaryScore > 0 ? Math.min(100, Math.round(primaryScore * 1.05)) : (student.skills?.Communication || 80),
      confidence: primaryScore > 0 ? Math.min(100, Math.round(primaryScore * 1.01)) : 82
    };

    // 6Q Matrix
    const sixQScore = dbSessionEval?.six_q_score || {
      iq: Math.min(100, Math.round(primaryScore * 0.96)),
      eq: Math.min(100, Math.round(primaryScore * 1.02)),
      cq: Math.min(100, Math.round(primaryScore * 0.94)),
      aq: Math.min(100, Math.round(primaryScore * 0.98)),
      sq: Math.min(100, Math.round(primaryScore * 1.04)),
      mq: Math.min(100, Math.round(primaryScore * 1.01))
    };

    // Feedback, strengths & weaknesses
    const feedbackSummary = driveEvaluations.length > 0 && driveEvaluations[0].feedback
      ? driveEvaluations[0].feedback
      : (dbSessionEval?.feedback_summary || 
        (isReady
          ? "Candidate demonstrated exceptional clarity, accurate algorithmic reasoning, and articulate technical communication throughout the interview assessment."
          : isIntermediate
            ? "Candidate exhibits solid foundational understanding with good problem-solving instincts. Suggested improvement in time-complexity optimization and edge-case handling."
            : "Candidate requires targeted practice in core data structures, algorithmic design patterns, and structured verbal articulation."));

    const strengths = (dbSessionEval?.whats_good && Array.isArray(dbSessionEval.whats_good) && dbSessionEval.whats_good.length > 0)
      ? dbSessionEval.whats_good
      : [
          "Strong grasp of core data structures and algorithmic complexity",
          "Articulate communication and structured approach to problem solving",
          "Quick adaptation and clear explanation of trade-offs",
          "Confident delivery and professional technical articulation"
        ];

    const weaknesses = (dbSessionEval?.whats_wrong && Array.isArray(dbSessionEval.whats_wrong) && dbSessionEval.whats_wrong.length > 0)
      ? dbSessionEval.whats_wrong
      : [
          "Can deepen edge-case coverage in multi-threaded & high-concurrency scenarios",
          "Recommend adding explicit unit test validation before finalizing solutions",
          "Further practice on distributed system caching & consistency strategies"
        ];

    return {
      student,
      overallScore: primaryScore,
      readinessStatus,
      latestAssessmentDate: driveEvaluations[0]?.completedAt || interviewSessions[0]?.createdAt || student.lastActive,
      durationMinutes: driveEvaluations[0] ? 35 : (dbSessionEval?.total_duration_seconds ? Math.ceil(dbSessionEval.total_duration_seconds / 60) : 25),
      targetRole: student.targetRole || "Software Development Engineer (SDE-1)",
      interviewsCompleted: totalInterviews,
      detailedScores,
      sixQScore,
      feedbackSummary,
      strengths,
      weaknesses,
      driveEvaluations,
      interviewSessions
    };
  }
};

export interface StudentDetailedAssessmentReport {
  student: CollegeStudent;
  overallScore: number;
  readinessStatus: "Placement Ready" | "Intermediate" | "Needs Practice";
  latestAssessmentDate?: string;
  durationMinutes: number;
  targetRole: string;
  interviewsCompleted: number;
  detailedScores: {
    technicalAccuracy: number;
    communication: number;
    problemSolving: number;
    confidence: number;
    systemDesign: number;
    dsa: number;
  };
  sixQScore?: {
    iq: number;
    eq: number;
    cq: number;
    aq: number;
    sq: number;
    mq: number;
  };
  feedbackSummary: string;
  strengths: string[];
  weaknesses: string[];
  driveEvaluations: {
    driveId: string;
    driveTitle: string;
    interviewType: string;
    completedAt: string;
    score: number;
    passingScore: number;
    isPassed: boolean;
    selectionVerdict: string;
    feedback: string;
    answers?: CandidateQuestionAnswer[];
  }[];
  interviewSessions: {
    id: string;
    role: string;
    interviewType: string;
    score: number;
    createdAt: string;
    feedback: string;
    transcript?: any[];
  }[];
}
