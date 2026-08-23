import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { College, collegeService } from "@/services/collegeService";

interface CollegeStudentBannerProps {
  userEmail?: string | null;
  userCollegeName?: string | null;
}

export const CollegeStudentBanner = ({ userEmail, userCollegeName }: CollegeStudentBannerProps) => {
  const [matchedCollege, setMatchedCollege] = useState<College | null>(null);

  useEffect(() => {
    if (!userEmail && !userCollegeName) return;

    let college: College | undefined;
    if (userEmail) {
      college = collegeService.getCollegeByEmail(userEmail);
    }

    if (!college && userCollegeName) {
      const colleges = collegeService.getColleges();
      college = colleges.find(c => 
        c.name.toLowerCase().includes(userCollegeName.toLowerCase()) ||
        c.shortName.toLowerCase() === userCollegeName.toLowerCase()
      );
    }

    if (college) {
      setMatchedCollege(college);
      if (userEmail) {
        collegeService.recordStudentRegistration({
          email: userEmail,
          fullName: userEmail.split('@')[0],
          targetRole: "Full Stack Developer",
          branch: "Computer Science & AI",
          batch: "2025"
        });
      }
    }
  }, [userEmail, userCollegeName]);

  if (!matchedCollege) return null;

  return (
    <div className="mb-4">
      {/* Compact Institutional Status Pill */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-violet-950/20 border border-violet-500/20 backdrop-blur-md text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
            <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="font-semibold text-white truncate text-xs">
            {matchedCollege.name}
          </span>
          <span className="text-gray-500 text-xs hidden sm:inline">•</span>
          <span className="text-gray-400 text-[11px] truncate hidden md:inline">
            Placement Portal ({userEmail})
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px] py-0 px-2 h-5 font-normal">
            <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> Campus License
          </Badge>
        </div>
      </div>
    </div>
  );
};
