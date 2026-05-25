import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Mail, Lock, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { getEmailValidationMessage } from "@/lib/emailValidation";
import { setAuthSession } from "@/services/auth";
import ThemeToggle from "@/components/ThemeToggle";

const Register = () => {
  const [role, setRole] = useState<"seeker" | "employer">("seeker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [education, setEducation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!name || !email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const emailValidationMessage = getEmailValidationMessage(email);
    if (emailValidationMessage) {
      toast.error(emailValidationMessage);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        role: role === "seeker" ? "jobseeker" : "employer",
        education: role === "seeker" ? education : "",
        companyName: role === "employer" ? name : ""
      };

      const data = await apiFetch<{ token: string; user: { role: string } }>(
        "/api/auth/register",
        {
          method: "POST",
          body: payload
        }
      );

      setAuthSession(data.token, data.user);
      toast.success("Account created successfully.");

      if (data.user?.role === "employer") {
        navigate("/employer-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed.";
      if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend not reachable at ${getApiBaseUrl()}`);
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-rolelink relative w-full max-w-md p-8"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">RoleLink</span>
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Get started with RoleLink</p>
        </div>

        <div className="mb-6 flex rounded-lg bg-secondary p-1">
          <button
            onClick={() => setRole("seeker")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
              role === "seeker"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" />
            Job Seeker
          </button>
          <button
            onClick={() => setRole("employer")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
              role === "employer"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Employer
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm text-muted-foreground">
              {role === "seeker" ? "Full Name" : "Company Name"}
            </Label>
            <div className="relative mt-1.5">
              {role === "seeker" ? (
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              ) : (
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                id="name"
                placeholder={role === "seeker" ? "John Doe" : "Acme Corp"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          {role === "seeker" && (
            <div>
              <Label htmlFor="education" className="text-sm text-muted-foreground">College Name</Label>
              <div className="relative mt-1.5">
                <Input
                  id="education"
                  placeholder="Your college or university"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
