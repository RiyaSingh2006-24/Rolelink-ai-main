import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import JobForm from "@/components/JobForm";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { deleteJob, fetchEmployerJobs, Job } from "@/services/job";
import { fetchEmployerApplications, Application } from "@/services/application";
import { toast } from "sonner";

type User = {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  companyLogoUrl?: string;
  location?: string;
  phone?: string;
};

const EmployerDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationsMap, setApplicationsMap] = useState<Record<string, Application[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [me, jobsResponse, applicationsResponse] = await Promise.all([
        apiFetch<{ user: User }>("/api/auth/me"),
        fetchEmployerJobs(),
        fetchEmployerApplications(),
      ]);

      const groupedApplications = (applicationsResponse.applications || []).reduce(
        (accumulator, application) => {
          const jobId = typeof application.jobId === "object" ? application.jobId?._id : application.jobId;
          if (!jobId) return accumulator;
          accumulator[jobId] = accumulator[jobId] ? [...accumulator[jobId], application] : [application];
          return accumulator;
        },
        {} as Record<string, Application[]>
      );

      setUser(me.user);
      setJobs(jobsResponse.jobs || []);
      setApplicationsMap(groupedApplications);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load dashboard.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allApplications = useMemo(() => Object.values(applicationsMap).flat(), [applicationsMap]);
  const shortlistedCount = allApplications.filter((application) => application.status === "Shortlisted").length;

  const stats = useMemo(
    () => [
      {
        label: "Open roles",
        value: jobs.length.toString(),
        helper: jobs.length ? "Roles currently published" : "Post your first job",
        icon: Briefcase,
      },
      {
        label: "Applicants",
        value: allApplications.length.toString(),
        helper: allApplications.length ? "Across all openings" : "No inbound pipeline yet",
        icon: Users,
      },
      {
        label: "Shortlisted",
        value: shortlistedCount.toString(),
        helper: shortlistedCount ? "Candidates to move forward" : "No shortlist yet",
        icon: CheckCircle2,
      },
      {
        label: "Views",
        value: "-",
        helper: "Tracking can be added next",
        icon: Eye,
      },
    ],
    [allApplications.length, jobs.length, shortlistedCount]
  );

  const recentJobs = useMemo(
    () =>
      jobs.map((job) => ({
        id: job._id,
        title: job.title,
        applicants: applicationsMap[job._id]?.length || 0,
        location: job.location || "Location not specified",
        posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "",
      })),
    [applicationsMap, jobs]
  );

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (jobId: string) => {
    const confirmed = window.confirm("Delete this job posting?");
    if (!confirmed) return;

    try {
      await deleteJob(jobId);
      toast.success("Job deleted.");
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete job.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    }
  };

  const jobFormSeed = useMemo(() => {
    if (editingJob) return editingJob;
    if (user?.companyName || user?.name) {
      return { companyName: user?.companyName || user?.name || "" };
    }
    return undefined;
  }, [editingJob, user?.companyName, user?.name]);

  return (
    <DashboardLayout>
      <div className="page-wrap space-y-6">
        <section className="hero-band overflow-hidden p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
            <div>
              <p className="label-caps text-primary">Hiring workspace</p>
              <h2 className="mt-3 section-heading">
                {loading ? "Loading your hiring pipeline..." : `Build momentum for ${user?.companyName || user?.name || "your company"}`}
              </h2>
              <p className="mt-3 section-copy">
                Post clearer roles, review candidates faster, and keep your hiring pipeline visible from one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/employer/jobs">
                  <Button className="rounded-2xl px-5">
                    <Plus className="h-4 w-4" />
                    Manage jobs
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="rounded-2xl px-5"
                  onClick={() => {
                    setEditingJob(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Post new role
                </Button>
              </div>
            </div>

            <div className="panel-soft p-5">
              <p className="text-sm font-semibold text-foreground">Company snapshot</p>
              <div className="mt-5 flex items-center gap-4">
                {user?.companyLogoUrl ? (
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border/70 bg-secondary">
                    <img src={user.companyLogoUrl} alt={user.companyName || "Company logo"} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
                    {(user?.companyName || user?.name || "C").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-base font-semibold text-foreground">{user?.companyName || user?.name || "Employer"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
                  {user?.location && <p className="text-sm text-muted-foreground">{user.location}</p>}
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs text-muted-foreground">Live openings</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{jobs.length}</p>
                </div>
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs text-muted-foreground">Pipeline strength</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{allApplications.length} applicants</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="metric-tile"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Live</span>
              </div>
              <div className="mt-5">
                <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{stat.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.helper}</p>
              </div>
            </motion.div>
          ))}
        </section>

        <section className="panel p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{editingJob ? "Edit job posting" : "Post a new job"}</p>
              <p className="text-sm text-muted-foreground">
                Create a clearer listing with better candidate expectations and faster pipeline quality.
              </p>
            </div>
          </div>
          <JobForm
            title=""
            initialData={jobFormSeed}
            jobId={editingJob?._id}
            onSuccess={async () => {
              setEditingJob(null);
              await loadData();
            }}
            onCancel={() => setEditingJob(null)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Job postings</p>
                <p className="text-xs text-muted-foreground">Edit live roles and keep demand visible.</p>
              </div>
              <Link to="/employer/jobs">
                <Button variant="ghost" className="rounded-2xl text-sm">
                  Full manager
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-border/60">
              {loading ? (
                <div className="px-6 py-8 text-sm text-muted-foreground">Loading jobs...</div>
              ) : recentJobs.length === 0 ? (
                <div className="px-6 py-10">
                  <p className="text-sm font-semibold text-foreground">No roles posted yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Publish your first role above to start building pipeline.</p>
                </div>
              ) : (
                recentJobs.map((job) => (
                  <div key={job.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{job.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {job.location} · {job.applicants} applicants · {job.posted}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => {
                          const selected = jobs.find((item) => item._id === job.id);
                          if (selected) handleEdit(selected);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="rounded-2xl" onClick={() => handleDelete(job.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-border/70 px-6 py-5">
              <p className="text-sm font-semibold text-foreground">Recent applicants</p>
              <p className="text-xs text-muted-foreground">A quick view of the candidates currently entering your funnel.</p>
            </div>

            <div className="divide-y divide-border/60">
              {loading ? (
                <div className="px-6 py-8 text-sm text-muted-foreground">Loading applicants...</div>
              ) : allApplications.length === 0 ? (
                <div className="px-6 py-10">
                  <p className="text-sm font-semibold text-foreground">No applicants yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Sharper job posts and clearer expectations will help pipeline quality.</p>
                </div>
              ) : (
                allApplications.slice(0, 4).map((application) => {
                  const applicantName =
                    typeof application.applicantId === "object" ? application.applicantId?.name || "Applicant" : "Applicant";
                  const applicantEmail =
                    typeof application.applicantId === "object" ? application.applicantId?.email || "" : "";
                  const jobTitle = typeof application.jobId === "object" ? application.jobId?.title || "Role" : "Role";
                  const statusTone =
                    application.status === "Shortlisted"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                      : application.status === "Rejected"
                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300";

                  return (
                    <div key={application._id} className="px-6 py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{applicantName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{jobTitle}</p>
                          {applicantEmail && <p className="mt-2 text-xs text-muted-foreground">{applicantEmail}</p>}
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
                          {application.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default EmployerDashboard;
