import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Briefcase,
  Download,
  FileText,
  GraduationCap,
  Link2,
  Plus,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, apiFetchBlob, getApiBaseUrl } from "@/lib/api";
import { toast } from "sonner";

type ProjectInput = {
  name: string;
  link: string;
  description: string;
};

const ResumeGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [certifications, setCertifications] = useState("");
  const [achievements, setAchievements] = useState("");
  const [competitions, setCompetitions] = useState("");
  const [programmingLanguages, setProgrammingLanguages] = useState("");
  const [webTechnologies, setWebTechnologies] = useState("");
  const [databases, setDatabases] = useState("");
  const [tools, setTools] = useState("");
  const [interests, setInterests] = useState("");
  const [projects, setProjects] = useState<ProjectInput[]>([{ name: "", link: "", description: "" }]);
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const fieldClass = "mt-2 rounded-2xl border-border/70 bg-secondary/55 text-foreground";

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (generating) return;

    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setGenerating(true);
    try {
      const sanitizedProjects = projects
        .map((project) => ({
          name: project.name.trim(),
          link: project.link.trim(),
          description: project.description.trim(),
        }))
        .filter((project) => project.name || project.description || project.link);

      const data = await apiFetch<{ resumeText: string }>("/api/resume/generate", {
        method: "POST",
        body: {
          name,
          email,
          phone,
          location,
          github,
          linkedin,
          portfolio,
          skills: skills
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          education,
          experience,
          certifications,
          achievements,
          competitions,
          skillsCategories: {
            programmingLanguages,
            webTechnologies,
            databases,
            tools,
            interests,
          },
          projects: sanitizedProjects,
        },
      });

      setResumeText(data.resumeText || "");
      toast.success("ATS-optimized resume generated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resume generation failed.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!resumeText || !name || downloading) return;

    setDownloading(true);
    try {
      const blob = await apiFetchBlob("/api/resume/generate-pdf", {
        method: "POST",
        body: {
          name,
          resumeText,
          links: { github, linkedin, portfolio },
        },
      });

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${name.replace(/[^a-zA-Z0-9-_]/g, "_") || "resume"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Resume downloaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download resume.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    } finally {
      setDownloading(false);
    }
  };

  const updateProject = (index: number, field: keyof ProjectInput, value: string) => {
    setProjects((previous) => previous.map((project, currentIndex) => (currentIndex === index ? { ...project, [field]: value } : project)));
  };

  const addProject = () => {
    setProjects((previous) => [...previous, { name: "", link: "", description: "" }]);
  };

  const removeProject = (index: number) => {
    setProjects((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const filledSummary = useMemo(() => {
    const sections = [
      name,
      email,
      phone,
      location,
      skills,
      education,
      experience,
      certifications,
      achievements,
      competitions,
      programmingLanguages,
      webTechnologies,
      databases,
      tools,
      interests,
      github,
      linkedin,
      portfolio,
      ...projects.flatMap((project) => [project.name, project.link, project.description]),
    ];
    const completed = sections.filter((value) => value.trim()).length;
    const total = sections.length;
    return Math.round((completed / total) * 100);
  }, [
    achievements,
    certifications,
    competitions,
    databases,
    education,
    email,
    experience,
    github,
    interests,
    linkedin,
    location,
    name,
    phone,
    portfolio,
    programmingLanguages,
    projects,
    skills,
    tools,
    webTechnologies,
  ]);

  const sectionCards = [
    {
      title: "Personal details",
      icon: User,
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Full Name</Label>
            <Input className={fieldClass} placeholder="John Doe" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input className={fieldClass} placeholder="john@email.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input className={fieldClass} placeholder="+91 98765 43210" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <div>
            <Label>Location</Label>
            <Input className={fieldClass} placeholder="Bangalore, India" value={location} onChange={(event) => setLocation(event.target.value)} />
          </div>
        </div>
      ),
    },
    {
      title: "Professional links",
      icon: Link2,
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>LinkedIn</Label>
            <Input className={fieldClass} placeholder="https://linkedin.com/in/username" value={linkedin} onChange={(event) => setLinkedin(event.target.value)} />
          </div>
          <div>
            <Label>GitHub</Label>
            <Input className={fieldClass} placeholder="https://github.com/username" value={github} onChange={(event) => setGithub(event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Portfolio</Label>
            <Input className={fieldClass} placeholder="https://yourportfolio.com" value={portfolio} onChange={(event) => setPortfolio(event.target.value)} />
          </div>
        </div>
      ),
    },
    {
      title: "Core background",
      icon: GraduationCap,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Skills</Label>
            <Textarea className={`${fieldClass} min-h-[90px]`} placeholder="React, TypeScript, Node.js, PostgreSQL..." value={skills} onChange={(event) => setSkills(event.target.value)} />
          </div>
          <div>
            <Label>Education</Label>
            <Textarea className={`${fieldClass} min-h-[110px]`} placeholder="B.S. Computer Science, Stanford University, 2022" value={education} onChange={(event) => setEducation(event.target.value)} />
          </div>
          <div>
            <Label>Experience</Label>
            <Textarea className={`${fieldClass} min-h-[140px]`} placeholder="Software Engineer at Google, 2022-Present..." value={experience} onChange={(event) => setExperience(event.target.value)} />
          </div>
        </div>
      ),
    },
    {
      title: "ATS skills categories",
      icon: Sparkles,
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Programming Languages</Label>
            <Input className={fieldClass} placeholder="Java, Python, JavaScript" value={programmingLanguages} onChange={(event) => setProgrammingLanguages(event.target.value)} />
          </div>
          <div>
            <Label>Web Technologies</Label>
            <Input className={fieldClass} placeholder="HTML, CSS, React, Node.js" value={webTechnologies} onChange={(event) => setWebTechnologies(event.target.value)} />
          </div>
          <div>
            <Label>Databases</Label>
            <Input className={fieldClass} placeholder="MongoDB, MySQL" value={databases} onChange={(event) => setDatabases(event.target.value)} />
          </div>
          <div>
            <Label>Tools</Label>
            <Input className={fieldClass} placeholder="VS Code, GitHub, Postman" value={tools} onChange={(event) => setTools(event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Interests</Label>
            <Input className={fieldClass} placeholder="Web Development, AI, Open Source" value={interests} onChange={(event) => setInterests(event.target.value)} />
          </div>
        </div>
      ),
    },
    {
      title: "Achievements and credentials",
      icon: Award,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Certifications</Label>
            <Textarea className={`${fieldClass} min-h-[96px]`} placeholder="Certificate - Power BI Workshop" value={certifications} onChange={(event) => setCertifications(event.target.value)} />
          </div>
          <div>
            <Label>Achievements</Label>
            <Textarea className={`${fieldClass} min-h-[96px]`} placeholder="Won 1st place in hackathon..." value={achievements} onChange={(event) => setAchievements(event.target.value)} />
          </div>
          <div>
            <Label>Competition Experience</Label>
            <Textarea className={`${fieldClass} min-h-[96px]`} placeholder="Participated in a coding competition..." value={competitions} onChange={(event) => setCompetitions(event.target.value)} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="page-wrap space-y-6">
        <section className="hero-band overflow-hidden p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="label-caps text-primary">Flagship workflow</p>
              <h2 className="mt-3 section-heading">Generate a cleaner, ATS-ready resume from the details you already know</h2>
              <p className="mt-3 section-copy">
                This flow turns your raw profile information into a structured plain-text resume that is easier to edit, analyze, and export as PDF.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="rounded-2xl px-5" onClick={() => document.getElementById("resume-generator-form")?.scrollIntoView({ behavior: "smooth" })}>
                  Start drafting
                </Button>
                {resumeText && (
                  <Button variant="outline" className="rounded-2xl px-5" onClick={handleDownload} disabled={downloading}>
                    <Download className="h-4 w-4" />
                    {downloading ? "Preparing PDF..." : "Download PDF"}
                  </Button>
                )}
              </div>
            </div>

            <div className="panel-soft p-5">
              <p className="text-sm font-semibold text-foreground">Draft readiness</p>
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Form completion</span>
                  <span className="font-semibold text-foreground">{filledSummary}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${filledSummary}%` }} />
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs text-muted-foreground">Projects added</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{projects.filter((project) => project.name || project.description || project.link).length}</p>
                </div>
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs text-muted-foreground">Preview status</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{resumeText ? "Draft ready" : "Waiting to generate"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <form id="resume-generator-form" onSubmit={handleGenerate} className="space-y-6">
            {sectionCards.map((section) => (
              <section key={section.title} className="panel p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{section.title}</p>
                  </div>
                </div>
                {section.content}
              </section>
            ))}

            <section className="panel p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Projects</p>
                    <p className="text-xs text-muted-foreground">Add proof of work with outcomes, links, and tech context.</p>
                  </div>
                </div>
                <Button type="button" variant="outline" className="rounded-2xl" onClick={addProject}>
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </div>

              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index} className="rounded-[1.5rem] border border-border/70 bg-secondary/35 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Project {index + 1}</p>
                      {projects.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" className="rounded-2xl" onClick={() => removeProject(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Project name</Label>
                        <Input className={fieldClass} placeholder="Project name" value={project.name} onChange={(event) => updateProject(index, "name", event.target.value)} />
                      </div>
                      <div>
                        <Label>Project link</Label>
                        <Input className={fieldClass} placeholder="https://project-link.com" value={project.link} onChange={(event) => updateProject(index, "link", event.target.value)} />
                      </div>
                      <div>
                        <Label>Project description</Label>
                        <Textarea className={`${fieldClass} min-h-[96px]`} placeholder="Explain the impact, stack, and results." value={project.description} onChange={(event) => updateProject(index, "description", event.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Button type="submit" disabled={generating} className="w-full rounded-2xl py-6 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              {generating ? "Generating ATS draft..." : "Generate resume draft"}
            </Button>
          </form>

          <section className="space-y-6">
            <div className="panel p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Resume preview</p>
                  <p className="text-sm text-muted-foreground">Edit your inputs, regenerate, then export the best version as PDF.</p>
                </div>
                {resumeText && (
                  <Button variant="outline" className="rounded-2xl" onClick={handleDownload} disabled={downloading}>
                    <Download className="h-4 w-4" />
                    {downloading ? "Preparing..." : "Download"}
                  </Button>
                )}
              </div>

              {!resumeText ? (
                <div className="mt-6 flex min-h-[520px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-border bg-secondary/30 px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-foreground">No draft yet</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    Fill in the form on the left and generate a draft. The preview will appear here with your ATS-focused structure.
                  </p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                  <div className="rounded-[1.75rem] bg-slate-950 p-6 text-slate-50 shadow-2xl">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-7">{resumeText}</pre>
                  </div>
                </motion.div>
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeGenerator;
