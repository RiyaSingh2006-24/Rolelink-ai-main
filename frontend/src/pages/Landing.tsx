import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, FileSearch, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { clearAuthSession } from "@/services/auth";

const features = [
  {
    icon: Target,
    title: "Smarter job discovery",
    description: "Search roles with cleaner signals around fit, location, and hiring context.",
  },
  {
    icon: FileSearch,
    title: "Resume analysis",
    description: "Score your existing resume and surface missing keywords before you apply.",
  },
  {
    icon: Sparkles,
    title: "ATS-ready generation",
    description: "Turn profile details into a cleaner draft that is easier to tailor and export.",
  },
  {
    icon: Users,
    title: "Hiring workflow",
    description: "Employers can post roles, review applicants, and track shortlists in one workspace.",
  },
];

const stats = [
  { value: "10K+", label: "Roles indexed" },
  { value: "50K+", label: "Job seekers" },
  { value: "2K+", label: "Hiring teams" },
  { value: "95%", label: "Resume match confidence" },
];

const Landing = () => {
  const { isAuthenticated, role } = useAuth();
  const dashboardLink = role === "employer" ? "/employer-dashboard" : "/dashboard";
  const browseLink = role === "employer" ? "/employer/jobs" : "/jobs";

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="page-wrap flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">RoleLink</p>
              <p className="text-xs text-muted-foreground">AI-guided hiring and job search</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Link to={dashboardLink}>
                  <Button variant="ghost" className="rounded-2xl">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" className="rounded-2xl" onClick={() => clearAuthSession()}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="rounded-2xl">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="rounded-2xl px-5">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="page-wrap space-y-10 pt-8 sm:pt-10">
        <section className="hero-band overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                AI-powered job search and resume workflows
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Make job search and hiring feel <span className="text-gradient">clearer, faster, and better prepared</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                RoleLink helps candidates improve resumes before they apply and gives employers a more organized hiring workspace after applications arrive.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={isAuthenticated ? dashboardLink : "/register"}>
                  <Button size="lg" className="rounded-2xl px-6">
                    {isAuthenticated ? "Open dashboard" : "Start for free"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to={browseLink}>
                  <Button size="lg" variant="outline" className="rounded-2xl px-6">
                    Browse roles
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="panel-soft p-6">
              <p className="text-sm font-semibold text-foreground">Why it feels better</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-sm font-semibold text-foreground">Candidates</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Analyze, generate, and export resumes from one connected workspace.</p>
                </div>
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-sm font-semibold text-foreground">Employers</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Manage postings, review applicants, and keep hiring momentum visible.</p>
                </div>
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-sm font-semibold text-foreground">Shared foundation</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Cleaner workflows, clearer states, and a stronger sense of trust across the product.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="metric-tile">
              <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="space-y-5">
          <div className="max-w-2xl">
            <p className="label-caps text-accent">Core product</p>
            <h2 className="mt-3 section-heading">Designed around the moments where people need confidence</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="panel p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-base font-semibold text-foreground">{feature.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="panel px-6 py-10 text-center sm:px-10">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground">Ready to make the workflow smoother?</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Join RoleLink to search smarter, strengthen resumes, and manage hiring without bouncing between disconnected tools.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to={isAuthenticated ? dashboardLink : "/register"}>
                <Button size="lg" className="rounded-2xl px-6">
                  {isAuthenticated ? "Go to dashboard" : "Create account"}
                </Button>
              </Link>
              <Link to={browseLink}>
                <Button size="lg" variant="outline" className="rounded-2xl px-6">
                  Explore roles
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
