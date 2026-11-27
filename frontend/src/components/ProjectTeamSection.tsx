import React, { useState } from "react";
import { Users, Mail, Phone, Award, Shield, Briefcase, ChevronRight, CheckCircle2 } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  designation: string;
  division: string;
  roleType: "Leadership" | "Admissions" | "Craft Instruction" | "DBT & Operations";
  photo: string;
  experience: string;
  email: string;
  responsibilities: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "tm-01",
    name: "Thokchom Basanta Singh",
    designation: "Managing Director",
    division: "Manipur Handloom & Handicrafts Development Corp. Ltd.",
    roleType: "Leadership",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    experience: "Corporate & Craft Sector Leadership",
    email: "Paona Bazar Head Office • Tel: 0385-245 1495",
    responsibilities: "Overall oversight of MHHDC skill training programmes, training centre partnerships, and strategic execution of allocated seats under the PM VIKAS Scheme.",
  },
  {
    id: "tm-02",
    name: "Dr. Ananya Devi Choudhury",
    designation: "Head of Weaving Technology & Clusters",
    division: "MHHDC Technical Operations Wing",
    roleType: "Leadership",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    experience: "19 Years Textile Research & NSQF",
    email: "MHHDC Technical Wing • Imphal 795001",
    responsibilities: "Modernization of jacquard and frame looms, NSQF Level 4 curriculum alignment, and master instructor capacity building.",
  },
  {
    id: "tm-03",
    name: "Shri Kh. Ratan Kumar",
    designation: "Admissions Controller & Registrar",
    division: "MHHDC Artisan Admission & Enrolment Cell",
    roleType: "Admissions",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    experience: "15 Years Academic & Enrolment Administration",
    email: "MHHDC Admissions Desk • Imphal 795001",
    responsibilities: "Supervision of candidate eligibility scrutiny, quota allocations across 9 craft trades, and training centre allotment.",
  },
  {
    id: "tm-04",
    name: "Smt. L. Memcha Devi",
    designation: "Master Craft Instructor",
    division: "Loin Loom & Traditional Weaving Training Unit",
    roleType: "Craft Instruction",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    experience: "32 Years Traditional Weaving & Master Mentorship",
    email: "MHHDC Craft Studio • Imphal",
    responsibilities: "Direct practical masterclasses in authentic tension back-strap loom weaving, natural plant dye chemistry, and indigenous motif design.",
  },
  {
    id: "tm-05",
    name: "Shri Debabrata Mukherjee",
    designation: "Lead Officer (Stipend & Accounts)",
    division: "MHHDC Finance & DBT Coordination Cell",
    roleType: "DBT & Operations",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    experience: "14 Years Financial & Stipend Operations",
    email: "MHHDC Finance Desk • Paona Bazar",
    responsibilities: "Trainee stipend coordination, Aadhaar-linked bank account cross-verification, and biometric attendance compliance.",
  },
  {
    id: "tm-06",
    name: "Ms. Priyanka Sen",
    designation: "Lead Consultant (Contemporary Design & Marketing)",
    division: "MHHDC Product Innovation & Market Linkage Cell",
    roleType: "Craft Instruction",
    photo: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=600&q=80",
    experience: "11 Years NIFT Alumni / Commercial Fashion",
    email: "MHHDC Design Studio • Imphal",
    responsibilities: "Connecting trained handloom & embroidery batches to retail channels, exhibitions, and commercial craft buyers.",
  },
  {
    id: "tm-07",
    name: "Shri M. Ibobi Meitei",
    designation: "Senior Verification Officer & Field Auditor",
    division: "MHHDC Scrutiny & Document Verification Cell",
    roleType: "Admissions",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    experience: "12 Years Field Verification & Document Scrutiny",
    email: "MHHDC Verification Cell • Imphal",
    responsibilities: "Rigorous document verification for Aadhaar, community/minority certificates, residential proofs, and eligibility screening.",
  },
  {
    id: "tm-08",
    name: "Smt. Anita Sharma",
    designation: "Lead Quality Officer & NSQF Assessor",
    division: "MHHDC Skill Assessment & Quality Unit",
    roleType: "Craft Instruction",
    photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80",
    experience: "13 Years Textile Skill Evaluation",
    email: "MHHDC Quality Cell • Imphal",
    responsibilities: "Terminal craft competency exams, practical warp/weft tension benchmarking, and NSQF assessment coordination.",
  },
];

export const ProjectTeamSection: React.FC = () => {
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const roles = ["ALL", "Leadership", "Admissions", "Craft Instruction", "DBT & Operations"];

  const filteredMembers = TEAM_MEMBERS.filter((m) => {
    if (filterRole === "ALL") return true;
    return m.roleType === filterRole;
  });

  return (
    <section id="project-team" className="scroll-mt-20 py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-3">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Program Operations &amp; Master Craft Team
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              MHHDC Admissions &amp; Training Team
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Meet the coordinators, master craft instructors, admissions controllers, and technical specialists managing training under Manipur Handloom &amp; Handicrafts Development Corporation Ltd.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {TEAM_MEMBERS.length} Key Program Personnel
            </span>
          </div>
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                filterRole === r
                  ? "bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white shadow-md shadow-blue-900/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {r === "ALL" ? "All Team Members" : r}
            </button>
          ))}
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="group bg-gradient-to-b from-white to-slate-50/70 rounded-3xl p-5 border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Photo & Role Badge */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden ring-4 ring-blue-100 group-hover:ring-blue-400 transition-all shadow-md bg-slate-200">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-900 text-white shadow-sm border border-blue-700 whitespace-nowrap">
                    {member.roleType}
                  </span>
                </div>

                {/* Name & Title */}
                <div className="text-center mt-3">
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition leading-snug">
                    {member.name}
                  </h3>
                  <p className="text-xs font-semibold text-blue-700 mt-1">{member.designation}</p>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{member.division}</p>
                </div>

                {/* Short Brief */}
                <p className="text-xs text-slate-600 mt-3 line-clamp-2 text-center leading-relaxed">
                  {member.responsibilities}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-4 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-medium">{member.experience}</span>
                <span className="text-blue-700 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Profile <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Member Detail Modal */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 relative">
              <div className="flex items-start gap-4 mb-5">
                <img
                  src={selectedMember.photo}
                  alt={selectedMember.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-600 shadow"
                />
                <div className="flex-1 pr-6">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {selectedMember.roleType}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1 leading-snug">{selectedMember.name}</h3>
                  <p className="text-xs font-bold text-blue-700">{selectedMember.designation}</p>
                  <p className="text-[11px] text-slate-500">{selectedMember.division}</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-5">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Key Responsibilities & Domain:</span>
                  <p className="leading-relaxed text-slate-600">{selectedMember.responsibilities}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-slate-600">
                  <Award className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Standing: {selectedMember.experience}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-mono text-[11px] text-blue-900 font-semibold">{selectedMember.email}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-5 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

