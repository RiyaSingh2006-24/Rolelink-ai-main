import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Briefcase,
  CheckCircle2,
  Clock3,
  FileSearch,
  Layers3,
  MailCheck,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { apiFetch, getApiBaseUrl, getAuthToken } from "@/lib/api";
import { fetchMyApplications, Application } from "@/services/application";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
import { getNotificationSocket, RoleLinkNotification } from "@/services/notification";

type User = {
  _id: string;
  name: string;
  email: string;
  resumeUrl?: string;
  skills?: string[];
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; className: string; tone: string }> = {
  Shortlisted: {
    icon: CheckCircle2,
    className: "text-success",
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  },
  Applied: {
    icon: Clock3,
    className: "text-warning",
    tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  Rejected: {
    icon: XCircle,
    className: "text-destructive",
    tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
};

const SeekerDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { notifications, unreadCount, markRead } = useNotifications({ showToasts: false });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!getAuthToken()) {
        toast.error("Please sign in to view your dashboard.");
        setLoading(false);
        return;
      }

      try {
        const [me, apps] = await Promise.all([
          apiFetch<{ user: User }>("/api/auth/me"),
          fetchMyApplications(),
        ]);

        if (!mounted) return;
        setUser(me.user);
        setApplications(apps.applications || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load dashboard.";
        if (message.toLowerCase().includes("failed to fetch")) {
          toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
        } else {
          toast.error(message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = getNotificationSocket();
    const handleStatusUpdate = (payload: { application?: Application }) => {
      if (!payload.application?._id) return;
      setApplications((current) =>
        current.map((application) =>
          application._id === payload.application?._id ? { ...application, ...payload.application } : application
        )
      );
    };

    socket?.on("application-status-updated", handleStatusUpdate);
    return () => {
      socket?.off("application-status-updated", handleStatusUpdate);
    };
  }, []);

  const resumeScore = localStorage.getItem("rolelink_resume_score");
  const shortlistedCount = applications.filter((application) => application.status === "Shortlisted").length;
  const activeCount = applications.filter((application) => application.status === "Applied").length;
  const recentApplications = applications.slice(0, 5);
  const applicationUpdates = notifications.filter((notification) =>
    ["Shortlisted", "Rejected"].includes(notification.status || "")
  );

  const stats = useMemo(
    () => [
      {
        label: "Applications sent",
        value: applications.length.toString(),
        helper: applications.length ? "Across active roles" : "Start applying",
        icon: Briefcase,
      },
      {
        label: "Resume score",
        value: resumeScore || "--",
        helper: resumeScore ? "Last analyzer result" : "Analyze to unlock",
        icon: TrendingUp,
      },
      {
        label: "Shortlisted",
        value: shortlistedCount.toString(),
        helper: shortlistedCount ? "Great traction" : "No shortlist yet",
        icon: Target,
      },
      {
        label: "In review",
        value: activeCount.toString(),
        helper: activeCount ? "Waiting on employers" : "Nothing pending",
        icon: Layers3,
      },
    ],
    [activeCount, applications.length, resumeScore, shortlistedCount]
  );

  const quickActions = [
    {
      title: "Analyze your resume",
      description: "See how well your current resume performs against ATS expectations.",
      href: "/resume-analyzer",
      icon: FileSearch,
      cta: "Run analyzer",
    },
    {
      title: "Generate a stronger version",
      description: "Create a cleaner ATS-ready resume from your profile details.",
      href: "/resume-generator",
      icon: Sparkles,
      cta: "Generate resume",
    },
    {
      title: "Browse open roles",
      description: "Search jobs and apply with your saved or generated resume.",
      href: "/jobs",
      icon: Briefcase,
      cta: "Explore jobs",
    },
  ];

  const profileCompleteness = useMemo(() => {
    const checks = [
      Boolean(user?.name),
      Boolean(user?.email),
      Boolean(user?.resumeUrl),
      Boolean(user?.skills?.length),
      Boolean(resumeScore),
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [resumeScore, user?.email, user?.name, user?.resumeUrl, user?.skills]);

  return (
    <DashboardLayout>
      <div className="page-wrap space-y-6">
        <section className="hero-band overflow-hidden p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
            <div>
              <p className="label-caps text-primary">Career cockpit</p>
              <h2 className="mt-3 section-heading">
                {loading ? "Loading your job search command center..." : `Welcome back, ${user?.name || "job seeker"}`}
              </h2>
              <p className="mt-3 max-w-2xl section-copy">
                Keep your resume sharp, focus on high-fit roles, and track where your applications are gaining traction.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/resume-analyzer">
                  <Button className="rounded-2xl px-5">Analyze resume</Button>
                </Link>
                <Link to="/jobs">
                  <Button variant="outline" className="rounded-2xl px-5">
                    Browse roles
                  </Button>
                </Link>
              </div>
            </div>

            <div className="panel-soft p-5">
              <p className="text-sm font-semibold text-foreground">Momentum snapshot</p>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Profile readiness</span>
                    <span className="font-semibold text-foreground">{profileCompleteness}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${profileCompleteness}%` }} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-secondary/70 p-4">
                    <p className="text-xs text-muted-foreground">Resume on file</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{user?.resumeUrl ? "Ready to use" : "Upload needed"}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/70 p-4">
                    <p className="text-xs text-muted-foreground">Latest ATS score</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{resumeScore || "Not analyzed yet"}</p>
                  </div>
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

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Recent applications</p>
                <p className="text-xs text-muted-foreground">Keep an eye on the roles already in motion.</p>
              </div>
              <Link to="/jobs">
                <Button variant="ghost" className="rounded-2xl text-sm">
                  Find more roles
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-border/60">
              {loading ? (
                <div className="px-6 py-8 text-sm text-muted-foreground">Loading applications...</div>
              ) : recentApplications.length === 0 ? (
                <div className="px-6 py-10">
                  <p className="text-sm font-semibold text-foreground">No applications yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start with the resume generator, then apply to roles that fit your skill set.
                  </p>
                </div>
              ) : (
                recentApplications.map((application) => {
                  const config = statusConfig[application.status] || statusConfig.Applied;
                  const StatusIcon = config.icon;
                  const title = application.jobId?.title || "Open role";
                  const company =
                    typeof application.jobId?.employerId === "object"
                      ? application.jobId?.employerId?.name || application.jobId?.employerId?.companyName || "Employer"
                      : "Employer";

                  return (
                    <div key={application._id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{company}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${config.tone}`}>
                          <StatusIcon className={`h-3.5 w-3.5 ${config.className}`} />
                          {application.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Application Updates</p>
                  <p className="text-xs text-muted-foreground">Real-time status notifications and email delivery.</p>
                </div>
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-3 p-4">
                {applicationUpdates.length === 0 ? (
                  <div className="rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
                    No application updates yet. Shortlist and rejection updates will appear here instantly.
                  </div>
                ) : (
                  applicationUpdates.slice(0, 4).map((notification) => (
                    <ApplicationUpdateCard key={notification.id} notification={notification} onRead={() => markRead(notification.id)} />
                  ))
                )}
              </div>
            </div>

            {quickActions.map((action) => (
              <Link key={action.href} to={action.href} className="block">
                <div className="panel-soft p-5 transition-transform hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{action.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.description}</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        {action.cta}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

const ApplicationUpdateCard = ({
  notification,
  onRead,
}: {
  notification: RoleLinkNotification;
  onRead: () => Promise<void>;
}) => {
  const shortlisted = notification.status === "Shortlisted";
  const tone = shortlisted
    ? "border-emerald-500/35 bg-emerald-500/10 shadow-[0_0_28px_-18px_rgba(34,197,94,0.9)]"
    : "border-red-500/35 bg-red-500/10 shadow-[0_0_28px_-18px_rgba(239,68,68,0.9)]";
  const Icon = shortlisted ? CheckCircle2 : XCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${tone}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${shortlisted ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{notification.title}</p>
            {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.message}</p>
          {notification.detail && <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.detail}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{notification.jobTitle || "Selected role"}</span>
            {notification.companyName && <span>· {notification.companyName}</span>}
            {notification.createdAt && <span>· {new Date(notification.createdAt).toLocaleString()}</span>}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1 text-xs font-semibold text-foreground">
              <MailCheck className="h-3.5 w-3.5 text-primary" />
              {notification.emailSent ? "Email sent" : "Email pending"}
            </span>
            {!notification.read && (
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline"
                onClick={() => onRead().catch(() => toast.error("Failed to mark notification as read."))}
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SeekerDashboard;
