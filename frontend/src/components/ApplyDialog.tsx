import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Sparkles, Upload } from "lucide-react";
import { apiFetch, apiFetchBlob, getApiBaseUrl } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { applyToJob } from "@/services/application";

type JobSummary = {
  _id: string;
  title: string;
  companyName?: string;
};

type UserProfile = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  education?: string;
  experience?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  certifications?: string;
  achievements?: string;
  competitions?: string;
  resumeUrl?: string;
  skillsCategories?: {
    programmingLanguages?: string;
    webTechnologies?: string;
    databases?: string;
    tools?: string;
    interests?: string;
  };
};

type ApplyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobSummary | null;
  prefillFile?: File | null;
  onApplied?: () => void;
};

const ApplyDialog = ({ open, onOpenChange, job, prefillFile, onApplied }: ApplyDialogProps) => {
  const { role } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [method, setMethod] = useState<"upload" | "saved" | "generate">("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [generatedFile, setGeneratedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const canUseSaved = Boolean(profile?.resumeUrl);

  useEffect(() => {
    if (!open) return;
    setResumeFile(prefillFile || null);
    setGeneratedFile(null);
    setMethod(prefillFile ? "upload" : "upload");

    const loadProfile = async () => {
      try {
        const data = await apiFetch<{ user: UserProfile }>("/api/auth/me");
        setProfile(data.user);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load profile.";
        if (message.toLowerCase().includes("failed to fetch")) {
          toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
        } else {
          toast.error(message);
        }
      }
    };

    loadProfile();
  }, [open, prefillFile]);

  const safeFileName = useMemo(() => {
    const base = profile?.name || "resume";
    return base.replace(/[^a-zA-Z0-9-_]/g, "_");
  }, [profile?.name]);

  const handleGenerateResume = async () => {
    if (!profile?.name) {
      toast.error("Please complete your profile details first.");
      return;
    }

    setGenerating(true);
    try {
      const resumeData = await apiFetch<{ resumeText: string }>("/api/resume/generate", {
        method: "POST",
        body: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          skills: profile.skills || [],
          education: profile.education,
          experience: profile.experience,
          certifications: profile.certifications,
          achievements: profile.achievements,
          competitions: profile.competitions,
          github: profile.github,
          linkedin: profile.linkedin,
          portfolio: profile.portfolio,
          skillsCategories: profile.skillsCategories,
        },
      });

      if (!resumeData.resumeText) {
        toast.error("Resume generation failed. Please try again.");
        return;
      }

      const blob = await apiFetchBlob("/api/resume/generate-pdf", {
        method: "POST",
        body: {
          name: profile.name,
          resumeText: resumeData.resumeText,
        },
      });

      const file = new File([blob], `${safeFileName}_ATS.pdf`, { type: "application/pdf" });
      setGeneratedFile(file);
      setMethod("generate");
      toast.success("Professional resume generated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate resume.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;
    if (loading) return;
    if (role !== "jobseeker") {
      toast.error("Only job seekers can apply for jobs.");
      return;
    }

    const formData = new FormData();
    formData.append("jobId", job._id);

    if (method === "upload") {
      if (!resumeFile) {
        toast.error("Please upload a resume.");
        return;
      }
      formData.append("resume", resumeFile);
    } else if (method === "generate") {
      if (!generatedFile) {
        toast.error("Generate your professional resume first.");
        return;
      }
      formData.append("resume", generatedFile);
    } else if (method === "saved") {
      if (!profile?.resumeUrl) {
        toast.error("No saved resume found.");
        return;
      }
      formData.append("resumeUrl", profile.resumeUrl);
    }

    setLoading(true);
    try {
      await applyToJob(formData);
      toast.success("Application submitted successfully.");
      onOpenChange(false);
      onApplied?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to apply.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const options = [
    {
      id: "upload" as const,
      title: "Upload a fresh PDF",
      description: "Best when you already have a polished custom resume for this role.",
      action: (
        <>
          <Input type="file" accept="application/pdf" onChange={(event) => setResumeFile(event.target.files?.[0] || null)} />
          {resumeFile && <p className="text-xs text-muted-foreground">Selected: {resumeFile.name}</p>}
        </>
      ),
      icon: Upload,
      disabled: false,
    },
    {
      id: "saved" as const,
      title: "Use saved profile resume",
      description: canUseSaved ? "Quickest option when your profile resume is already current." : "No saved resume found yet.",
      action: canUseSaved ? <p className="text-xs text-muted-foreground">Current file: {profile?.resumeUrl?.split("/").pop()}</p> : null,
      icon: FileText,
      disabled: !canUseSaved,
    },
    {
      id: "generate" as const,
      title: "Generate ATS version",
      description: "Create a polished PDF from your profile details right now.",
      action: generatedFile ? (
        <p className="text-xs text-muted-foreground">Ready: {generatedFile.name}</p>
      ) : (
        <Button size="sm" variant="outline" className="rounded-2xl" onClick={handleGenerateResume} disabled={generating}>
          <Sparkles className="mr-1 h-4 w-4" />
          {generating ? "Generating..." : "Generate now"}
        </Button>
      ),
      icon: Sparkles,
      disabled: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[2rem] border-border/70 bg-background/95 p-0 backdrop-blur-xl">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle className="text-left text-xl font-semibold">Apply to {job?.title || "this role"}</DialogTitle>
          <p className="text-sm text-muted-foreground">{job?.companyName || "Choose the resume format that gives you the strongest shot."}</p>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          {options.map((option) => {
            const active = method === option.id;
            return (
              <div
                key={option.id}
                className={`rounded-[1.5rem] border p-5 transition-all ${
                  active ? "border-primary/30 bg-primary/5" : "border-border/70 bg-card/65"
                } ${option.disabled ? "opacity-60" : ""}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      <option.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{option.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{option.description}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className="rounded-2xl"
                    disabled={option.disabled}
                    onClick={() => setMethod(option.id)}
                  >
                    {active ? "Selected" : "Use this"}
                  </Button>
                </div>

                <div className="mt-4">{option.action}</div>
              </div>
            );
          })}

          <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-4">
            <div className="text-sm text-muted-foreground">
              {method === "generate"
                ? "Using a generated ATS PDF for this application."
                : method === "saved"
                ? "Using the resume already attached to your profile."
                : "Uploading a new resume for this application."}
            </div>
            <Button className="rounded-2xl px-5" onClick={handleApply} disabled={loading}>
              {loading ? "Submitting..." : "Submit application"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyDialog;
