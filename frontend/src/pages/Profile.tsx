import { useEffect, useMemo, useState } from "react";
import { FileUp, Save, ShieldCheck, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, apiFetchForm, getApiBaseUrl } from "@/lib/api";
import { getEmailValidationMessage } from "@/lib/emailValidation";
import { updateStoredUser } from "@/services/auth";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

type ProfileData = {
  name: string;
  email: string;
  companyName?: string;
  companyLogoUrl?: string;
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

const Profile = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [skillsText, setSkillsText] = useState("");
  const [programmingLanguages, setProgrammingLanguages] = useState("");
  const [webTechnologies, setWebTechnologies] = useState("");
  const [databases, setDatabases] = useState("");
  const [tools, setTools] = useState("");
  const [interests, setInterests] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const data = await apiFetch<{ user: ProfileData }>("/api/auth/me");
        if (!mounted) return;
        setProfile(data.user);
        setSkillsText((data.user.skills || []).join(", "));
        setProgrammingLanguages(data.user.skillsCategories?.programmingLanguages || "");
        setWebTechnologies(data.user.skillsCategories?.webTechnologies || "");
        setDatabases(data.user.skillsCategories?.databases || "");
        setTools(data.user.skillsCategories?.tools || "");
        setInterests(data.user.skillsCategories?.interests || "");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load profile.";
        if (message.toLowerCase().includes("failed to fetch")) {
          toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
        } else {
          toast.error(message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((previous) => (previous ? { ...previous, [field]: value } : previous));
  };

  const completion = useMemo(() => {
    const checks = [
      Boolean(profile?.name),
      Boolean(profile?.email),
      Boolean(profile?.location),
      Boolean(skillsText.trim()),
      Boolean(profile?.education),
      Boolean(profile?.experience),
      Boolean(profile?.resumeUrl),
      role === "employer" ? Boolean(profile?.companyName) : true,
    ];
    const complete = checks.filter(Boolean).length;
    return Math.round((complete / checks.length) * 100);
  }, [profile?.education, profile?.email, profile?.experience, profile?.location, profile?.name, profile?.resumeUrl, profile?.companyName, role, skillsText]);

  const handleSave = async () => {
    if (!profile) return;

    const emailValidationMessage = getEmailValidationMessage(profile.email);
    if (emailValidationMessage) {
      toast.error(emailValidationMessage);
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone || "",
        location: profile.location || "",
        skills: skillsText.split(",").map((item) => item.trim()).filter(Boolean),
        education: profile.education || "",
        experience: profile.experience || "",
        github: profile.github || "",
        linkedin: profile.linkedin || "",
        portfolio: profile.portfolio || "",
        certifications: profile.certifications || "",
        achievements: profile.achievements || "",
        competitions: profile.competitions || "",
        skillsCategories: {
          programmingLanguages,
          webTechnologies,
          databases,
          tools,
          interests,
        },
      };

      if (role === "employer") {
        payload.companyName = profile.companyName || "";
        payload.companyLogoUrl = profile.companyLogoUrl || "";
      }

      const data = await apiFetch<{ user: ProfileData }>("/api/auth/me", {
        method: "PUT",
        body: payload,
      });

      setProfile(data.user);
      updateStoredUser(data.user);
      toast.success("Profile updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const data = await apiFetchForm<{ user: ProfileData; resumeUrl: string }>("/api/auth/resume", formData, {
        method: "POST",
      });
      setProfile(data.user);
      updateStoredUser(data.user);
      toast.success("Resume uploaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resume upload failed.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const fieldClass = "mt-2 rounded-2xl border-border/70 bg-secondary/55 text-foreground";

  return (
    <DashboardLayout>
      <div className="page-wrap space-y-6">
        <section className="hero-band overflow-hidden p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="label-caps text-primary">Profile workspace</p>
              <h2 className="mt-3 section-heading">
                {role === "employer" ? "Shape the company profile candidates see" : "Build the profile your resume and applications depend on"}
              </h2>
              <p className="mt-3 section-copy">
                Strong profile data makes resume generation better, improves application quality, and gives the product more to work with.
              </p>
            </div>

            <div className="panel-soft p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Profile readiness</p>
                  <p className="text-xs text-muted-foreground">A more complete profile unlocks better resume output.</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-semibold text-foreground">{completion}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${completion}%` }} />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs text-muted-foreground">Resume status</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{profile?.resumeUrl ? "Resume uploaded" : "Resume missing"}</p>
                </div>
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs text-muted-foreground">Best next step</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {role === "employer" ? "Refine company profile" : profile?.resumeUrl ? "Generate ATS version" : "Upload a base resume"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {loading || !profile ? (
          <div className="panel p-8 text-sm text-muted-foreground">Loading profile...</div>
        ) : (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="panel p-6">
                  <p className="text-sm font-semibold text-foreground">Identity</p>
                  <p className="mt-1 text-sm text-muted-foreground">The essentials that appear across your account and public-facing flows.</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Full Name</Label>
                      <Input className={fieldClass} value={profile.name} onChange={(event) => handleChange("name", event.target.value)} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input className={fieldClass} value={profile.email} onChange={(event) => handleChange("email", event.target.value)} />
                    </div>
                    {role === "employer" && (
                      <>
                        <div className="sm:col-span-2">
                          <Label>Company Name</Label>
                          <Input
                            className={fieldClass}
                            value={profile.companyName || ""}
                            onChange={(event) => handleChange("companyName", event.target.value)}
                            placeholder="Your company name"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Company Logo URL</Label>
                          <Input
                            className={fieldClass}
                            value={profile.companyLogoUrl || ""}
                            onChange={(event) => handleChange("companyLogoUrl", event.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <Label>Phone</Label>
                      <Input className={fieldClass} value={profile.phone || ""} onChange={(event) => handleChange("phone", event.target.value)} />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input className={fieldClass} value={profile.location || ""} onChange={(event) => handleChange("location", event.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="panel p-6">
                  <p className="text-sm font-semibold text-foreground">Links and proof points</p>
                  <p className="mt-1 text-sm text-muted-foreground">Make it easy to verify your work and professional presence.</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>LinkedIn</Label>
                      <Input className={fieldClass} value={profile.linkedin || ""} onChange={(event) => handleChange("linkedin", event.target.value)} />
                    </div>
                    <div>
                      <Label>GitHub</Label>
                      <Input className={fieldClass} value={profile.github || ""} onChange={(event) => handleChange("github", event.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Portfolio</Label>
                      <Input className={fieldClass} value={profile.portfolio || ""} onChange={(event) => handleChange("portfolio", event.target.value)} />
                    </div>
                  </div>
                </div>

                {role !== "employer" && (
                  <div className="panel p-6">
                    <p className="text-sm font-semibold text-foreground">Skills and ATS categories</p>
                    <p className="mt-1 text-sm text-muted-foreground">These inputs directly improve matching, analysis, and generated resumes.</p>
                    <div className="mt-5 space-y-4">
                      <div>
                        <Label>Core Skills</Label>
                        <Textarea
                          className={`${fieldClass} min-h-[110px]`}
                          value={skillsText}
                          onChange={(event) => setSkillsText(event.target.value)}
                          placeholder="React, Node.js, SQL, Docker"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label>Programming Languages</Label>
                          <Input className={fieldClass} value={programmingLanguages} onChange={(event) => setProgrammingLanguages(event.target.value)} />
                        </div>
                        <div>
                          <Label>Web Technologies</Label>
                          <Input className={fieldClass} value={webTechnologies} onChange={(event) => setWebTechnologies(event.target.value)} />
                        </div>
                        <div>
                          <Label>Databases</Label>
                          <Input className={fieldClass} value={databases} onChange={(event) => setDatabases(event.target.value)} />
                        </div>
                        <div>
                          <Label>Tools</Label>
                          <Input className={fieldClass} value={tools} onChange={(event) => setTools(event.target.value)} />
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Interests</Label>
                          <Input className={fieldClass} value={interests} onChange={(event) => setInterests(event.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {role !== "employer" && (
                  <>
                    <div className="panel p-6">
                      <p className="text-sm font-semibold text-foreground">Education and experience</p>
                      <div className="mt-5 space-y-4">
                        <div>
                          <Label>Education</Label>
                          <Textarea className={`${fieldClass} min-h-[120px]`} value={profile.education || ""} onChange={(event) => handleChange("education", event.target.value)} />
                        </div>
                        <div>
                          <Label>Experience</Label>
                          <Textarea className={`${fieldClass} min-h-[140px]`} value={profile.experience || ""} onChange={(event) => handleChange("experience", event.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="panel p-6">
                      <p className="text-sm font-semibold text-foreground">Highlights</p>
                      <div className="mt-5 space-y-4">
                        <div>
                          <Label>Certifications</Label>
                          <Textarea className={`${fieldClass} min-h-[96px]`} value={profile.certifications || ""} onChange={(event) => handleChange("certifications", event.target.value)} />
                        </div>
                        <div>
                          <Label>Achievements</Label>
                          <Textarea className={`${fieldClass} min-h-[96px]`} value={profile.achievements || ""} onChange={(event) => handleChange("achievements", event.target.value)} />
                        </div>
                        <div>
                          <Label>Competition Experience</Label>
                          <Textarea className={`${fieldClass} min-h-[96px]`} value={profile.competitions || ""} onChange={(event) => handleChange("competitions", event.target.value)} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="panel p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Resume vault</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Keep a PDF on file for applications, analysis, and faster resume workflows.
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                      <FileUp className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-secondary/70 p-4">
                    <p className="text-xs text-muted-foreground">Current file</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {profile.resumeUrl ? profile.resumeUrl.split("/").pop() : "No resume uploaded yet"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button variant="outline" className="rounded-2xl" disabled={uploading}>
                      <label className="flex cursor-pointer items-center gap-2">
                        <FileUp className="h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload PDF"}
                        <input type="file" accept="application/pdf" className="hidden" onChange={handleResumeUpload} />
                      </label>
                    </Button>

                    {role !== "employer" && (
                      <Link to="/resume-generator">
                        <Button variant="ghost" className="rounded-2xl">
                          <Sparkles className="h-4 w-4" />
                          Open resume generator
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                <Button className="w-full rounded-2xl py-6 text-sm font-semibold" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving profile..." : "Save profile changes"}
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
