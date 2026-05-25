import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Clock,
  DollarSign,
  MapPin,
  Search,
  ServerOff,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ApplyDialog from "@/components/ApplyDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJobs, Job } from "@/services/job";
import { getApiBaseUrl, getAuthToken } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const jobTypes = ["All", "Full-time", "Part-time", "Internship"];
const PAGE_SIZE = 6;

const demoJobs: Job[] = [
  {
    _id: "demo-frontend-engineer",
    companyName: "NovaStack",
    companyLogoUrl: "/logos/novastack.svg",
    title: "Frontend Engineer",
    description: "Build responsive dashboards and candidate-facing hiring workflows.",
    qualifications: "React, TypeScript, Tailwind CSS, API integration",
    responsibilities: "Own interface quality, collaborate with product, ship accessible flows",
    location: "Bengaluru, Hybrid",
    salaryRange: "8-12 LPA",
    jobType: "Full-time",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "demo-data-analyst",
    companyName: "InsightLoop",
    companyLogoUrl: "/logos/insightloop.svg",
    title: "Data Analyst Intern",
    description: "Turn hiring and resume signals into decision-ready insights.",
    qualifications: "SQL, Excel, Python, dashboards",
    responsibilities: "Clean datasets, build reports, present trends",
    location: "Remote",
    salaryRange: "25k/month",
    jobType: "Internship",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: "demo-product-designer",
    companyName: "CraftHire",
    companyLogoUrl: "/logos/crafthire.svg",
    title: "Product Designer",
    description: "Design calm, efficient tools for recruiters and job seekers.",
    qualifications: "Figma, UX research, Design systems, Prototyping",
    responsibilities: "Improve flows, test with users, maintain UI consistency",
    location: "Mumbai, On-site",
    salaryRange: "7-10 LPA",
    jobType: "Full-time",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    _id: "demo-support-associate",
    companyName: "TalentBridge",
    companyLogoUrl: "/logos/talentbridge.svg",
    title: "Career Support Associate",
    description: "Help candidates improve profiles, resumes, and application readiness.",
    qualifications: "Communication, Resume review, Customer support",
    responsibilities: "Guide users, review applications, coordinate feedback",
    location: "Delhi NCR",
    salaryRange: "3-5 LPA",
    jobType: "Part-time",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

const JobListings = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);

  const getLogoFallback = (name?: string) => {
    const initials =
      (name || "Company")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "C";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#1e293b"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#e2e8f0" font-family="Arial" font-size="28" font-weight="700">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJobs();
      if (isMountedRef.current) {
        setJobs(data.jobs || []);
        setUsingDemoData(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load jobs.";
      if (isMountedRef.current) {
        setJobs(demoJobs);
        setUsingDemoData(true);
        setError(message);
      }
      toast.warning("Live jobs are temporarily unavailable. Showing demo roles for your presentation.");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadJobs]);

  const filtered = useMemo(
    () =>
      jobs.filter((job) => {
        const companyName =
          job.companyName || (typeof job.employerId === "object" ? job.employerId?.companyName || job.employerId?.name || "" : "");
        const matchesSearch =
          job.title.toLowerCase().includes(search.toLowerCase()) || companyName.toLowerCase().includes(search.toLowerCase());
        const matchesType = selectedType === "All" || job.jobType === selectedType;
        return matchesSearch && matchesType;
      }),
    [jobs, search, selectedType]
  );

  const displayedJobs = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = displayedJobs.length < filtered.length;
  const fullTimeCount = useMemo(() => jobs.filter((job) => job.jobType === "Full-time").length, [jobs]);
  const internshipCount = useMemo(() => jobs.filter((job) => job.jobType === "Internship").length, [jobs]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, selectedType]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((previous) => Math.min(previous + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "160px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length, hasMore, loading]);

  const handleApplyClick = (jobId: string) => {
    if (!getAuthToken()) {
      toast.error("Please sign in to apply.");
      return;
    }

    const job = jobs.find((item) => item._id === jobId) || null;
    if (job?._id.startsWith("demo-")) {
      toast.info("Demo role selected. Connect MongoDB to submit a real application.");
      return;
    }
    setSelectedJob(job);
    setApplyOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="page-wrap space-y-6">
        <section className="hero-band overflow-hidden p-5 sm:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Job discovery
              </div>
              <h2 className="mt-4 max-w-3xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Browse strong-fit roles with faster, clearer apply decisions
              </h2>
              <p className="mt-3 max-w-2xl section-copy">
                Search by role or company, scan the essentials quickly, and apply with your uploaded or generated resume.
              </p>
            </div>
            <div className="panel-soft p-4 sm:p-5">
              <p className="text-sm font-semibold text-foreground">Market snapshot</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-2">
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs text-muted-foreground">Visible roles</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{loading ? "..." : filtered.length}</p>
                </div>
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs text-muted-foreground">Full-time</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{loading ? "..." : fullTimeCount}</p>
                </div>
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs text-muted-foreground">Internships</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{loading ? "..." : internshipCount}</p>
                </div>
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs text-muted-foreground">Current filter</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{selectedType}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs or companies..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 rounded-2xl border-border/70 bg-secondary/55 pl-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {jobTypes.map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={selectedType === type ? "default" : "outline"}
                  onClick={() => setSelectedType(type)}
                  className="rounded-2xl"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <ApplyDialog open={applyOpen} onOpenChange={setApplyOpen} job={selectedJob} onApplied={() => setApplyOpen(false)} />

        {!loading && usingDemoData && (
          <section className="panel flex flex-col gap-4 border-warning/35 bg-warning/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                <ServerOff className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Live backend is not connected</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing polished demo roles while MongoDB Atlas is unavailable. API target: {getApiBaseUrl()}.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="rounded-2xl" onClick={loadJobs}>
              Retry live data
            </Button>
          </section>
        )}

        <section className="grid gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="panel p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-16 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>
            ))
          ) : error && !usingDemoData ? (
            <div className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <ServerOff className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Unable to load jobs</p>
                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-2xl" onClick={loadJobs}>
                Retry
              </Button>
            </div>
          ) : displayedJobs.length === 0 ? (
            <div className="panel p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>
              <p className="mt-4 text-base font-semibold text-foreground">No matching roles yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Try a broader keyword or switch the job type filter to see more opportunities.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-5 rounded-2xl"
                onClick={() => {
                  setSearch("");
                  setSelectedType("All");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            displayedJobs.map((job, index) => {
              const companyName =
                job.companyName || (typeof job.employerId === "object" ? job.employerId?.companyName || job.employerId?.name : "Employer");
              const tags = job.qualifications ? job.qualifications.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 4) : [];

              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="panel p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-4">
                        {job.companyLogoUrl ? (
                          <div className="h-12 w-12 overflow-hidden rounded-2xl bg-secondary">
                            <img
                              src={job.companyLogoUrl}
                              alt={companyName || "Company"}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.src = getLogoFallback(companyName);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-foreground">{job.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{companyName || "Employer"}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {job.location || "Location not specified"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4" />
                          {job.salaryRange || "Salary not specified"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {job.jobType || "Role"}
                        </span>
                      </div>

                      {tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" className="rounded-2xl">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        <Button className="rounded-2xl px-4" onClick={() => handleApplyClick(job._id)} disabled={role !== "jobseeker"}>
                          Apply now
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "recently"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </section>

        {!loading && hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-4 text-sm text-muted-foreground">
            Loading more roles...
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobListings;
