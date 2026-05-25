import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearAuthSession } from "@/services/auth";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { useNotifications } from "@/hooks/useNotifications";

const seekerLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, hint: "Track momentum" },
  { label: "Jobs", href: "/jobs", icon: Search, hint: "Find strong-fit roles" },
  { label: "Resume Analyzer", href: "/resume-analyzer", icon: FileText, hint: "Score your resume" },
  { label: "Resume Generator", href: "/resume-generator", icon: Sparkles, hint: "Create ATS-ready drafts" },
];

const employerLinks = [
  { label: "Dashboard", href: "/employer-dashboard", icon: LayoutDashboard, hint: "Monitor hiring" },
  { label: "Manage Jobs", href: "/employer/jobs", icon: Building2, hint: "Post and edit roles" },
];

type DashboardLayoutProps = {
  children: ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, user, loading } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const isEmployer = role === "employer";

  const links = useMemo(() => {
    if (loading || !role) return [];
    return isEmployer ? employerLinks : seekerLinks;
  }, [isEmployer, loading, role]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const userInitial = useMemo(() => user?.name?.trim()?.charAt(0)?.toUpperCase() || "U", [user?.name]);

  const activeLinkLabel = useMemo(() => {
    const matched = links.find((link) => location.pathname === link.href);
    return matched?.label || (isEmployer ? "Workspace" : "Career Hub");
  }, [isEmployer, links, location.pathname]);

  const handleSignOut = () => {
    clearAuthSession();
    toast.success("Signed out.");
    navigate("/login");
  };

  const renderLinks = (compact = false) =>
    links.map((link) => {
      const active = location.pathname === link.href;
      return (
        <Link
          key={link.href}
          to={link.href}
          className={`group flex items-center justify-between rounded-2xl border px-3 py-3 transition-all ${
            active
              ? "border-primary/25 bg-primary/10 text-primary shadow-[0_10px_25px_-18px_hsl(var(--primary)/0.8)]"
              : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-card/80 hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:text-foreground"
              }`}
            >
              <link.icon className="h-4.5 w-4.5" />
            </div>
            {!compact && (
              <div>
                <p className="text-sm font-semibold">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.hint}</p>
              </div>
            )}
          </div>
          {!compact && <ChevronRight className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground/60"}`} />}
        </Link>
      );
    });

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-5">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">RoleLink</p>
            <p className="text-xs text-muted-foreground">{isEmployer ? "Hiring workspace" : "Career workspace"}</p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-4 py-5">
        <div className="panel-soft flex items-center gap-3 px-4 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <UserCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{user?.name || "Your account"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || "Signed in"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4">{renderLinks()}</nav>

      <div className="space-y-3 border-t border-border/70 px-4 py-4">
        <Link to="/profile" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground">
          <UserCircle2 className="h-4 w-4" />
          <span>Profile & resume</span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-shell min-h-screen text-foreground">
      <div className="relative min-h-screen lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border/60 bg-sidebar-background/85 backdrop-blur-xl lg:block">
          <div className="sticky top-0 h-screen">{sidebar}</div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
            <aside
              className="h-full w-[88%] max-w-[320px] border-r border-border/70 bg-sidebar-background shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              {sidebar}
            </aside>
          </div>
        )}

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/78 backdrop-blur-xl">
            <div className="page-wrap flex items-center gap-3 py-4">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 rounded-2xl bg-card/70 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </Button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{isEmployer ? "Employer" : "Job seeker"}</span>
                  <span>/</span>
                  <span>{activeLinkLabel}</span>
                </div>
                <h1 className="truncate text-lg font-semibold text-foreground">{activeLinkLabel}</h1>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="relative rounded-2xl bg-card/70">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 rounded-2xl">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary hover:underline"
                          onClick={() => markAllRead().catch(() => toast.error("Failed to mark notifications as read."))}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <div className="px-3 py-5 text-sm text-muted-foreground">No updates yet. We’ll surface activity here.</div>
                    ) : (
                      notifications.slice(0, 8).map((note) => (
                        <DropdownMenuItem
                          key={note.id}
                          className="flex cursor-default flex-col items-start gap-1 py-3"
                          onSelect={(event) => event.preventDefault()}
                        >
                          <div className="flex w-full items-start justify-between gap-3">
                            <span className="text-sm font-semibold leading-5">{note.title || note.message}</span>
                            {!note.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          </div>
                          {note.title && <span className="text-xs leading-5 text-muted-foreground">{note.message}</span>}
                          <span className="text-[11px] text-muted-foreground">
                            {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
                          </span>
                          {!note.read && role === "jobseeker" && (
                            <button
                              type="button"
                              className="mt-1 text-xs font-semibold text-primary hover:underline"
                              onClick={() => markRead(note.id).catch(() => toast.error("Failed to mark notification as read."))}
                            >
                              Mark as read
                            </button>
                          )}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 px-2.5 py-2 text-left transition-colors hover:bg-card"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                        {userInitial}
                      </div>
                      <div className="hidden sm:block">
                        <p className="max-w-[9rem] truncate text-sm font-semibold text-foreground">{user?.name || "Account"}</p>
                        <p className="max-w-[9rem] truncate text-xs text-muted-foreground">{user?.email || ""}</p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Settings coming soon.")}>Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
