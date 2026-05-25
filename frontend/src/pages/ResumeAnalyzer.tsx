import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Atom,
  Award,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Cloud,
  Code2,
  Coffee,
  Database,
  Eye,
  FileCode2,
  FileText,
  Folder,
  Leaf,
  Server,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import ApplyDialog from "@/components/ApplyDialog";
import { apiFetchForm, getApiBaseUrl, getAuthToken } from "@/lib/api";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

type RecommendedJob = {
  _id: string;
  title: string;
  location: string;
  jobType: string;
  salaryRange: string;
  employer: string;
  companyName?: string;
  companyLogoUrl?: string;
  matchScore: number;
  matchedSkills: string[];
};

type AnalysisResult = {
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  skillsDetected: string[];
  recommendedJobs?: RecommendedJob[];
};

type SkillCard = {
  name: string;
  level: "Proficient" | "Intermediate" | "Basic";
  icon: typeof Code2;
  tone: string;
};

const sampleSkills: SkillCard[] = [
  { name: "C/C++", level: "Proficient", icon: Code2, tone: "text-cyan-300 bg-cyan-400/10" },
  { name: "AWS", level: "Intermediate", icon: Cloud, tone: "text-cyan-300 bg-cyan-400/10" },
  { name: "React", level: "Intermediate", icon: Atom, tone: "text-cyan-300 bg-cyan-400/10" },
  { name: "Node.js", level: "Proficient", icon: Server, tone: "text-emerald-300 bg-emerald-400/10" },
  { name: "MongoDB", level: "Intermediate", icon: Leaf, tone: "text-emerald-300 bg-emerald-400/10" },
  { name: "PostgreSQL", level: "Basic", icon: Database, tone: "text-blue-300 bg-blue-400/10" },
  { name: "Python", level: "Intermediate", icon: FileCode2, tone: "text-yellow-300 bg-yellow-400/10" },
  { name: "Java", level: "Basic", icon: Coffee, tone: "text-orange-300 bg-orange-400/10" },
  { name: "Go", level: "Basic", icon: Code2, tone: "text-cyan-300 bg-cyan-400/10" },
];

const sampleJobs: RecommendedJob[] = [
  {
    _id: "sample-fullstack",
    title: "Full Stack Developer",
    employer: "DataPulse",
    companyName: "DataPulse",
    location: "Remote",
    jobType: "Full-time",
    salaryRange: "Competitive",
    matchScore: 94,
    matchedSkills: ["AWS", "React", "Node.js", "PostgreSQL"],
  },
  {
    _id: "sample-backend",
    title: "Backend Engineer",
    employer: "CloudNova",
    companyName: "CloudNova",
    location: "Bengaluru, IN",
    jobType: "Full-time",
    salaryRange: "Competitive",
    matchScore: 85,
    matchedSkills: ["Node.js", "MongoDB", "Go"],
  },
  {
    _id: "sample-devops",
    title: "DevOps Engineer",
    employer: "DevSphere",
    companyName: "DevSphere",
    location: "Remote",
    jobType: "Full-time",
    salaryRange: "Competitive",
    matchScore: 72,
    matchedSkills: ["AWS", "Docker", "Kubernetes", "Python"],
  },
  {
    _id: "sample-junior",
    title: "Junior Engineer",
    employer: "Amazon",
    companyName: "Amazon",
    location: "Remote",
    jobType: "Full-time",
    salaryRange: "Competitive",
    matchScore: 61,
    matchedSkills: ["Java", "DSA", "System Design"],
  },
];

const scoreBreakdown = [
  { label: "Skills", value: 80, color: "bg-emerald-400" },
  { label: "Experience", value: 70, color: "bg-yellow-300" },
  { label: "Projects", value: 65, color: "bg-yellow-300" },
  { label: "Education", value: 75, color: "bg-emerald-400" },
  { label: "Keywords", value: 60, color: "bg-red-400" },
];

const strengths = [
  "Good technical skills coverage",
  "Relevant work experience",
  "Strong project portfolio",
  "Proper use of action verbs",
];

const fallbackImprovements = [
  "Add more quantifiable achievements",
  "Include more relevant keywords",
  "Add certifications",
  "Improve section formatting",
];

const experienceStats = [
  { label: "Total Experience", value: "2.3 years", icon: Briefcase },
  { label: "Relevant Experience", value: "1.8 years", icon: Briefcase },
  { label: "Projects", value: "6", icon: Folder },
  { label: "Certifications", value: "3", icon: Award },
];

const rejectedApplications = [
  { role: "React Developer", company: "RapidSoft", date: "May 20, 2025", reason: "Not enough relevant experience" },
];

const levelClass: Record<SkillCard["level"], string> = {
  Proficient: "bg-emerald-400/12 text-emerald-300",
  Intermediate: "bg-yellow-400/12 text-yellow-300",
  Basic: "bg-blue-400/12 text-blue-300",
};

const ResumeAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<RecommendedJob | null>(null);
  const navigate = useNavigate();

  const score = result?.score ?? 72;
  const suggestions = result?.suggestions?.length ? result.suggestions : fallbackImprovements;
  const jobs = result?.recommendedJobs?.length ? result.recommendedJobs : sampleJobs;
  const skills = useMemo(() => {
    if (!result?.skillsDetected?.length) return sampleSkills;
    return result.skillsDetected.slice(0, 12).map((skill, index) => ({
      name: skill,
      level: index % 3 === 0 ? "Proficient" : index % 3 === 1 ? "Intermediate" : "Basic",
      icon: sampleSkills[index % sampleSkills.length].icon,
      tone: sampleSkills[index % sampleSkills.length].tone,
    })) satisfies SkillCard[];
  }, [result?.skillsDetected]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Please upload a PDF resume.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume PDF must be smaller than 5 MB.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF resume to analyze.");
      return;
    }

    if (!getAuthToken()) {
      toast.error("Please sign in to analyze your resume.");
      navigate("/login");
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);

      const data = await apiFetchForm<AnalysisResult>("/api/resume/analyze", formData, {
        method: "POST",
      });

      if (data?.score !== undefined) {
        localStorage.setItem("rolelink_resume_score", data.score.toString());
      }
      setResult(data);
      toast.success("Resume analyzed successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resume analysis failed.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyRecommended = (job: RecommendedJob) => {
    if (!getAuthToken()) {
      toast.error("Please sign in to apply for jobs.");
      navigate("/login");
      return;
    }

    setSelectedJob(job);
    setApplyOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="page-wrap max-w-[1500px] space-y-4 text-slate-100">
        <section className="rounded-lg border border-slate-700/70 bg-slate-950/80 p-4 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Job seeker / Resume Analyzer</p>
              <h2 className="mt-1 text-xl font-bold text-white">Resume Analyzer</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-300 hover:border-blue-400/70">
                <Upload className="h-4 w-4 text-blue-300" />
                <span className="max-w-[220px] truncate">{selectedFile?.name || "Upload PDF resume"}</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
              </label>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !selectedFile}
                className="h-10 rounded-md bg-blue-500 px-4 text-white hover:bg-blue-400"
              >
                {analyzing ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.58fr)_minmax(360px,0.72fr)]">
          <div className="space-y-4">
            <Panel
              number="1"
              title="Detected Skills"
              action={`${skills.length} skills detected`}
            >
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {skills.map((skill) => {
                  const Icon = skill.icon;
                  return (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 rounded-lg border border-slate-700/60 bg-slate-800/55 p-4"
                    >
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${skill.tone}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{skill.name}</p>
                        <span className={`mt-1 inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${levelClass[skill.level]}`}>
                          {skill.level}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Panel>

            <Panel
              number="2"
              title="Recommended Jobs"
              action={
                <Link to="/jobs" className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200">
                  View all jobs <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {jobs.slice(0, 4).map((job) => (
                  <JobCard key={job._id} job={job} onApply={() => handleApplyRecommended(job)} />
                ))}
              </div>
            </Panel>

            <Panel number="3" title="Experience Summary">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {experienceStats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-900/65 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-300">{item.label}</p>
                        <p className="text-sm font-bold text-white">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 border-t border-slate-700/60 pt-4">
                <p className="text-base font-bold text-white">Work Experience</p>
                <div className="mt-4 border-l border-blue-400/70 pl-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-white">Software Developer</p>
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">Current</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">TechNova Solutions</p>
                  <p className="mt-1 text-xs text-slate-400">Jun 2023 - Present - 1 yr 11 mos</p>
                  <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-300">
                    <li>Developed and maintained scalable web applications using React, Node.js and MongoDB.</li>
                    <li>Implemented RESTful APIs and integrated third-party services.</li>
                    <li>Collaborated with cross-functional teams to deliver high quality features.</li>
                  </ul>
                </div>
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel number="4" title="Overall Resume Score">
              <ScoreGauge score={score} />
              <div className="mt-5 space-y-3">
                {scoreBreakdown.map((item) => (
                  <div key={item.label} className="grid grid-cols-[95px_1fr_42px] items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-200">{item.label}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                    </div>
                    <span className="text-right font-bold text-emerald-300">{item.value}%</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel number="5" title="Strengths">
              <div className="space-y-3">
                {strengths.map((strength) => (
                  <div key={strength} className="flex items-center gap-2 text-sm text-slate-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    {strength}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel number="6" title="Areas to Improve">
              <div className="space-y-2">
                {suggestions.slice(0, 4).map((suggestion) => (
                  <div key={suggestion} className="flex items-center justify-between gap-3 rounded-md py-1">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                      <span className="truncate">{suggestion}</span>
                    </div>
                    <Button variant="secondary" size="sm" className="h-8 rounded-md bg-slate-800 px-3 text-xs text-slate-200 hover:bg-slate-700">
                      Improve
                    </Button>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              number="7"
              title="Rejected Applications"
              action={
                <Link to="/jobs" className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              <div className="space-y-3">
                {rejectedApplications.map((application) => (
                  <div key={application.role} className="rounded-lg border border-slate-700/60 bg-slate-800/45 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/25 text-xs font-bold text-rose-200">
                          RS
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{application.role}</p>
                          <p className="text-xs text-slate-400">{application.company}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-400/15 px-2 py-1 text-xs font-bold text-red-300">
                        <XCircle className="h-3.5 w-3.5" />
                        Rejected
                      </span>
                    </div>
                    <p className="mt-4 text-xs text-slate-300">Applied on: {application.date}</p>
                    <p className="mt-2 text-xs text-slate-300">Reason: {application.reason}</p>
                    <Button variant="outline" size="sm" className="mt-4 h-8 rounded-md border-slate-700 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800">
                      View feedback
                    </Button>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <p className="rounded-lg border border-slate-700/70 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
          Tip: Tailor your resume for each job to increase your match score.
        </p>

        <ApplyDialog
          open={applyOpen}
          onOpenChange={setApplyOpen}
          job={
            selectedJob
              ? { _id: selectedJob._id, title: selectedJob.title, companyName: selectedJob.companyName }
              : null
          }
          prefillFile={selectedFile}
          onApplied={() => setApplyOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

const Panel = ({
  number,
  title,
  action,
  children,
}: {
  number: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-lg border border-slate-700/70 bg-slate-950/82 p-4 shadow-xl shadow-black/10">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400/60 text-[11px] font-bold text-blue-300">
          {number}
        </span>
        <h3 className="text-base font-bold text-white">{title}</h3>
      </div>
      {action ? <div className="text-sm">{action}</div> : null}
    </div>
    {children}
  </section>
);

const ScoreGauge = ({ score }: { score: number }) => {
  const radius = 64;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="text-center">
      <div className="relative mx-auto h-36 w-56">
        <svg viewBox="0 0 180 110" className="h-full w-full">
          <path
            d="M 25 90 A 65 65 0 0 1 155 90"
            fill="none"
            stroke="rgb(30 41 59)"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d="M 25 90 A 65 65 0 0 1 155 90"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="55%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-0 bottom-4">
          <p className="text-4xl font-extrabold text-white">{score}</p>
          <p className="mt-1 text-sm font-semibold text-slate-300">{score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs work"}</p>
        </div>
      </div>
      <p className="mx-auto mt-1 max-w-64 text-sm leading-5 text-slate-300">
        Keep improving! Your resume is good but has room for growth.
      </p>
    </div>
  );
};

const JobCard = ({ job, onApply }: { job: RecommendedJob; onApply: () => void }) => {
  const matchTone = job.matchScore >= 80 ? "text-emerald-300" : job.matchScore >= 70 ? "text-yellow-300" : "text-amber-300";
  const initials = (job.companyName || job.employer || "Company")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-800/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-400/10 text-xs font-bold text-yellow-200">
            {initials || "C"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{job.title}</p>
            <p className="mt-1 text-xs text-slate-300">{job.companyName || job.employer || "Employer"}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
              <span>{job.location || "Remote"}</span>
              <span>{job.jobType || "Full-time"}</span>
            </div>
          </div>
        </div>
        <div className={`text-right text-xl font-extrabold ${matchTone}`}>
          {job.matchScore}%
          <p className="text-xs font-bold">Match</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(job.matchedSkills || []).slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-200">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={onApply} className="h-9 rounded-md bg-blue-500 px-4 text-white hover:bg-blue-400">
          Apply
        </Button>
        <Link to="/jobs">
          <Button variant="outline" size="sm" className="h-9 rounded-md border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800">
            <Eye className="h-4 w-4" />
            View details
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
