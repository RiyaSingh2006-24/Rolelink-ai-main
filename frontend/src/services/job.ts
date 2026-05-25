import { apiFetch } from "@/lib/api";

export type Job = {
  _id: string;
  companyName?: string;
  companyLogoUrl?: string;
  title: string;
  description?: string;
  qualifications?: string;
  responsibilities?: string;
  location?: string;
  salaryRange?: string;
  jobType?: string;
  employerId?: { _id?: string; name?: string; companyName?: string; companyLogoUrl?: string } | string;
  createdAt?: string;
};

export type JobPayload = {
  title: string;
  description: string;
  qualifications?: string;
  responsibilities?: string;
  location?: string;
  salaryRange?: string;
  jobType?: string;
  companyName?: string;
  companyLogoUrl?: string;
};

export const fetchJobs = async () => apiFetch<{ jobs: Job[] }>("/api/jobs");

export const fetchEmployerJobs = async () => apiFetch<{ jobs: Job[] }>("/api/jobs/mine");

export const createJob = async (payload: JobPayload) =>
  apiFetch<{ job: Job }>("/api/jobs", { method: "POST", body: payload });

export const updateJob = async (jobId: string, payload: JobPayload) =>
  apiFetch<{ job: Job }>(`/api/jobs/${jobId}`, { method: "PUT", body: payload });

export const deleteJob = async (jobId: string) =>
  apiFetch<{ message: string }>(`/api/jobs/${jobId}`, { method: "DELETE" });
