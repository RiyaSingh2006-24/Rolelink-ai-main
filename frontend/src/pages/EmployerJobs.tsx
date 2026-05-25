import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Search,
  XCircle,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import JobForm from "@/components/JobForm";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { toast } from "sonner";
import { fetchEmployerJobs, deleteJob, Job } from "@/services/job";
import { fetchEmployerApplications, updateApplicationStatus, Application } from "@/services/application";

const jobTypes = ["All", "Full-time", "Part-time", "Internship"];

type User = {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
};

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  Applied: { label: "Applied", className: "text-warning", icon: Clock },
  Shortlisted: { label: "Shortlisted", className: "text-success", icon: CheckCircle2 },
  Rejected: { label: "Rejected", className: "text-destructive", icon: XCircle },
};

const EmployerJobs = () => {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationsByJob, setApplicationsByJob] = useState<Record<string, Application[]>>({});
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const [me, jobsResponse, appsResponse] = await Promise.all([
        apiFetch<{ user: User }>("/api/auth/me"),
        fetchEmployerJobs(),
        fetchEmployerApplications()
      ]);

      const myJobs = jobsResponse.jobs || [];
      setUser(me.user);
      setJobs(myJobs);

      setSelectedJobId((current) => {
        if (current && myJobs.some((job) => job._id === current)) {
          return current;
        }
        return myJobs[0]?._id || null;
      });

      const groupedApplications = (appsResponse.applications || []).reduce(
        (acc, application) => {
          const jobId =
            typeof application.jobId === "object" ? application.jobId?._id : application.jobId;
          if (!jobId) return acc;
          acc[jobId] = acc[jobId] ? [...acc[jobId], application] : [application];
          return acc;
        },
        {} as Record<string, Application[]>
      );

      setApplicationsByJob(groupedApplications);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load jobs.";
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
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.title?.toLowerCase().includes(search.toLowerCase()) ||
        job.location?.toLowerCase().includes(search.toLowerCase());
      const matchesType = selectedType === "All" || job.jobType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [jobs, search, selectedType]);

  const selectedApplications = selectedJobId ? applicationsByJob[selectedJobId] || [] : [];

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setShowJobModal(true);
  };

  const handleDelete = async (jobId: string) => {
    const confirmed = window.confirm("Delete this job posting?");
    if (!confirmed) return;
    setDeletingJobId(jobId);
    try {
      await deleteJob(jobId);
      toast.success("Job deleted.");
      if (selectedJobId === jobId) {
        setSelectedJobId(null);
      }
      await loadJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete job.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    } finally {
      setDeletingJobId(null);
    }
  };

  const jobFormSeed = useMemo(() => {
    if (editingJob) return editingJob;
    if (user?.companyName || user?.name) {
      return { companyName: user?.companyName || user?.name || "" };
    }
    return undefined;
  }, [editingJob, user?.companyName, user?.name]);

  const updateStatus = async (applicationId: string, status: "Applied" | "Shortlisted" | "Rejected") => {
    if (updatingStatusId) return;
    setUpdatingStatusId(applicationId);

    try {
      const response = await updateApplicationStatus(applicationId, status);

      setApplicationsByJob((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((jobId) => {
          updated[jobId] = updated[jobId].map((app) =>
            app._id === applicationId ? { ...app, status: response.application.status } : app
          );
        });
        return updated;
      });

      toast.success(response.emailSent ? "Email notification sent successfully." : `Application marked as ${status}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update status.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Manage Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading jobs..." : `Welcome, ${user?.companyName || user?.name || "Employer"}`}
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search job titles or locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground max-w-md"
              />
            </div>
            <div className="flex gap-2">
              {jobTypes.map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={selectedType === type ? "default" : "outline"}
                  onClick={() => setSelectedType(type)}
                  className={
                    selectedType === type
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }
                >
                  <Filter className="h-3.5 w-3.5" /> {type}
                </Button>
              ))}
            </div>
          </div>
          <Dialog
            open={showJobModal}
            onOpenChange={(open) => {
              setShowJobModal(open);
              if (!open) setEditingJob(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setEditingJob(null)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl p-0">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle>{editingJob ? "Edit Job" : "Create New Job"}</DialogTitle>
              </DialogHeader>
              <JobForm
                initialData={jobFormSeed}
                jobId={editingJob?._id}
                title=""
                onSuccess={async () => {
                  setShowJobModal(false);
                  setEditingJob(null);
                  await loadJobs();
                }}
                onCancel={() => {
                  setShowJobModal(false);
                  setEditingJob(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,1.4fr]">
          <div className="space-y-4">
            {loading ? (
              <div className="card-rolelink p-6 text-sm text-muted-foreground">Loading your jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="card-rolelink p-6 text-sm text-muted-foreground">
                No jobs posted yet. Create a job to start receiving applications.
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="card-rolelink p-6 text-sm text-muted-foreground">No jobs match these filters.</div>
            ) : (
              filteredJobs.map((job) => {
                const isActive = job._id === selectedJobId;
                const tags = job.qualifications
                  ? job.qualifications.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 3)
                  : [];
                const applicantsCount = applicationsByJob[job._id]?.length ?? 0;

                return (
                  <motion.button
                    key={job._id}
                    type="button"
                    onClick={() => setSelectedJobId(job._id)}
                    className={`card-rolelink w-full p-5 text-left transition-colors ${
                      isActive ? "border border-primary/50 bg-primary/5" : "hover:bg-secondary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{job.title}</h3>
                            <p className="text-xs text-muted-foreground">{job.location || "Location"}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="bg-secondary text-muted-foreground text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEdit(job);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(job._id);
                            }}
                            disabled={deletingJobId === job._id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Applicants</p>
                        <p className="text-lg font-semibold text-foreground font-mono">{applicantsCount}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {job.location || "Remote"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> {job.jobType || "Role"}
                      </span>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>

          <div className="card-rolelink p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Applicants</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedJobId ? `${selectedApplications.length} applicants` : "Select a job to view applicants"}
                </p>
              </div>
              <Button size="sm" variant="outline" className="border-border text-muted-foreground" onClick={loadJobs}>
                Refresh
              </Button>
            </div>

            {selectedJobId ? (
              selectedApplications.length === 0 ? (
                <div className="rounded-lg bg-secondary/40 p-6 text-sm text-muted-foreground">
                  No applicants for this job yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedApplications.map((app) => {
                    const applicant = typeof app.applicantId === "object" ? app.applicantId : undefined;
                    const resumePath = app.resumeUrl || applicant?.resumeUrl;
                    const resumeLink = resumePath ? `${getApiBaseUrl()}${resumePath}` : null;
                    const status = statusConfig[app.status] || statusConfig.Applied;
                    const StatusIcon = status.icon;

                    return (
                      <div key={app._id} className="rounded-lg border border-border/50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">
                              {applicant?.name || "Applicant"}
                            </h3>
                            <p className="text-xs text-muted-foreground">{applicant?.email || ""}</p>
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <StatusIcon className={`h-3.5 w-3.5 ${status.className}`} />
                              <span className={`font-medium ${status.className}`}>{status.label}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-muted-foreground">
                                {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ""}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border text-foreground"
                              onClick={() => updateStatus(app._id, "Shortlisted")}
                              disabled={updatingStatusId === app._id}
                            >
                              {updatingStatusId === app._id ? "Sending email..." : "Shortlist"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border text-foreground"
                              onClick={() => updateStatus(app._id, "Rejected")}
                              disabled={updatingStatusId === app._id}
                            >
                              {updatingStatusId === app._id ? "Sending email..." : "Reject"}
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-muted-foreground space-y-2">
                          {applicant?.skills?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {applicant.skills.slice(0, 6).map((skill) => (
                                <span key={skill} className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {applicant?.education && <p><strong>College:</strong> {applicant.education}</p>}
                          {applicant?.experience && <p><strong>Experience:</strong> {applicant.experience}</p>}
                        </div>

                        <div className="mt-3 flex items-center gap-3 text-xs">
                          {resumeLink ? (
                            <a
                              className="text-primary hover:underline"
                              href={resumeLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Resume
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Resume not available</span>
                          )}
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">Application ID: {app._id.slice(0, 6)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="rounded-lg bg-secondary/40 p-6 text-sm text-muted-foreground">
                Select a job to view applicants.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => window.history.back()}>
            Back to dashboard <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployerJobs;
