import { apiFetch, apiFetchForm } from "@/lib/api";

export type ApplicationStatus = "Applied" | "Shortlisted" | "Rejected";

export type Application = {
  _id: string;
  status: ApplicationStatus;
  createdAt?: string;
  resumeUrl?: string;
  applicantId?: {
    name?: string;
    email?: string;
    skills?: string[];
    education?: string;
    experience?: string;
    resumeUrl?: string;
  } | string;
  jobId?: {
    _id?: string;
    title?: string;
    companyName?: string;
    employerId?: { name?: string; companyName?: string } | string;
  } | string;
};

export type ApplicationStatusResponse = {
  application: Application;
  notification?: {
    id: string;
    title?: string;
    message: string;
    detail?: string;
    emailSent?: boolean;
    createdAt?: string;
  } | null;
  emailSent?: boolean;
  message?: string;
};

export const fetchMyApplications = async () =>
  apiFetch<{ applications: Application[] }>("/api/applications/my");

export const fetchEmployerApplications = async () =>
  apiFetch<{ applications: Application[] }>("/api/applications/employer");

export const updateApplicationStatus = async (applicationId: string, status: ApplicationStatus) =>
  apiFetch<ApplicationStatusResponse>(`/api/applications/${applicationId}/status`, {
    method: "PATCH",
    body: { status }
  });

export const applyToJob = async (formData: FormData) =>
  apiFetchForm<{ application: Application }>("/api/applications", formData, { method: "POST" });
