import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createJob, updateJob } from '@/services/job';

export type JobFormData = {
  title: string;
  description: string;
  qualifications?: string;
  responsibilities?: string;
  location?: string;
  salaryRange?: string;
  jobType?: string;
  companyName?: string;
};

export type JobFormProps = {
  initialData?: Partial<JobFormData> & { _id?: string };
  jobId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  loading?: boolean;
  title?: string;
};

const JobForm = ({
  initialData,
  jobId,
  onSuccess,
  onCancel,
  loading = false,
  title = 'Post a New Job'
}: JobFormProps) => {
  const [formData, setFormData] = useState<JobFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    qualifications: initialData?.qualifications || '',
    responsibilities: initialData?.responsibilities || '',
    location: initialData?.location || '',
    salaryRange: initialData?.salaryRange || '',
    jobType: initialData?.jobType || '',
    companyName: initialData?.companyName || ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      title: initialData?.title || '',
      description: initialData?.description || '',
      qualifications: initialData?.qualifications || '',
      responsibilities: initialData?.responsibilities || '',
      location: initialData?.location || '',
      salaryRange: initialData?.salaryRange || '',
      jobType: initialData?.jobType || '',
      companyName: initialData?.companyName || ''
    });
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };

      const targetJobId = jobId || initialData?._id;
      if (targetJobId) {
        await updateJob(targetJobId, payload);
        toast.success('Job updated successfully!');
      } else {
        await createJob(payload);
        toast.success('Job posted successfully!');
        setFormData({
          title: '',
          description: '',
          qualifications: '',
          responsibilities: '',
          location: '',
          salaryRange: '',
          jobType: '',
          companyName: initialData?.companyName || ''
        });
      }

      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save job';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="space-y-4">
      {title ? <h2 className="text-lg font-semibold text-foreground">{title}</h2> : null}
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Company Name</Label>
          <Input
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            placeholder="Your Company"
            className="mt-2 rounded-2xl border-border/70 bg-secondary/55"
          />
        </div>
        <div className="md:col-span-2">
          <Label>Job Title *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Senior Frontend Engineer"
            className="mt-2 rounded-2xl border-border/70 bg-secondary/55"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label>Description *</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Role overview, responsibilities..."
            rows={4}
            className="mt-2 rounded-2xl border-border/70 bg-secondary/55"
            required
          />
        </div>
        <div>
          <Label>Qualifications</Label>
          <Input
            value={formData.qualifications}
            onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
            placeholder="React, TypeScript, 3+ years"
            className="mt-2 rounded-2xl border-border/70 bg-secondary/55"
          />
        </div>
        <div>
          <Label>Responsibilities</Label>
          <Input
            value={formData.responsibilities}
            onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
            placeholder="Build UI components"
            className="mt-2 rounded-2xl border-border/70 bg-secondary/55"
          />
        </div>
        <div>
          <Label>Location</Label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder="Remote / NYC"
            className="mt-2 rounded-2xl border-border/70 bg-secondary/55"
          />
        </div>
        <div>
          <Label>Salary Range</Label>
          <Input
            value={formData.salaryRange}
            onChange={(e) => setFormData({...formData, salaryRange: e.target.value})}
            placeholder="$120K-$160K"
            className="mt-2 rounded-2xl border-border/70 bg-secondary/55"
          />
        </div>
        <div>
          <Label>Job Type</Label>
          <Input
            value={formData.jobType}
            onChange={(e) => setFormData({...formData, jobType: e.target.value})}
            placeholder="Full-time"
            className="mt-2 rounded-2xl border-border/70 bg-secondary/55"
          />
        </div>
        <div className="md:col-span-2 flex gap-3">
          <Button type="submit" disabled={submitting || loading} className="flex-1 rounded-2xl">
            {submitting ? 'Saving...' : jobId || initialData?._id ? 'Update Job' : 'Post Job'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting} className="rounded-2xl">
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default JobForm;

