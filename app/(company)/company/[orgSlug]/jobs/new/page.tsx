"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateJob,
  type JobRequirement,
} from "@/features/jobs/api/use-jobs";

type RequirementDraft = JobRequirement & { key: string };

function emptyRequirement(type: "required" | "preferred"): RequirementDraft {
  return {
    key: crypto.randomUUID(),
    type,
    category: "skill",
    label: "",
  };
}

export default function NewJobPage() {
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const router = useRouter();
  const createJob = useCreateJob(orgSlug);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState<string>("full_time");
  const [workplaceType, setWorkplaceType] = useState<string>("hybrid");
  const [location, setLocation] = useState("");
  const [experienceMin, setExperienceMin] = useState("");
  const [experienceMax, setExperienceMax] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [benefits, setBenefits] = useState("");
  const [requirements, setRequirements] = useState<RequirementDraft[]>([
    emptyRequirement("required"),
  ]);

  async function handleSubmit(publish: boolean) {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      const job = await createJob.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        department: department.trim() || undefined,
        employmentType: employmentType || undefined,
        workplaceType: workplaceType || undefined,
        location: location.trim() || undefined,
        experienceMin: experienceMin ? Number(experienceMin) : null,
        experienceMax: experienceMax ? Number(experienceMax) : null,
        responsibilities: responsibilities.trim() || undefined,
        qualifications: qualifications.trim() || undefined,
        benefits: benefits.trim() || undefined,
        status: publish ? "published" : "draft",
        requirements: requirements
          .filter((r) => r.label.trim())
          .map(({ type, category, label, description: desc }, index) => ({
            type,
            category,
            label: label.trim(),
            description: desc ?? null,
            sortOrder: index,
          })),
      });
      toast.success(publish ? "Job published" : "Draft saved");
      router.push(`/company/${orgSlug}/jobs/${job.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create job",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}/jobs`}>← Back to jobs</Link>
      </Button>
      <header className="space-y-1">
        <p className="eyebrow uppercase">New job</p>
        <h1 className="text-h2 text-text-primary">Create a role</h1>
        <p className="text-body-sm text-text-secondary">
          Candidates will apply with their Livefolio. Keep requirements
          structured so matching can improve later.
        </p>
      </header>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Job title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Senior Marketing Manager"
          />
          <p className="text-xs text-text-muted">
            The public link uses a unique id, so companies can share the same
            role title without conflicts.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            placeholder="Describe the role, team, and impact."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Marketing"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bangalore / Remote"
            />
          </div>
          <div className="space-y-2">
            <Label>Employment type</Label>
            <Select value={employmentType} onValueChange={setEmploymentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full-time</SelectItem>
                <SelectItem value="part_time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Workplace</Label>
            <Select value={workplaceType} onValueChange={setWorkplaceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select workplace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="on_site">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expMin">Min years experience</Label>
            <Input
              id="expMin"
              type="number"
              min={0}
              value={experienceMin}
              onChange={(e) => setExperienceMin(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expMax">Max years experience</Label>
            <Input
              id="expMax"
              type="number"
              min={0}
              value={experienceMax}
              onChange={(e) => setExperienceMax(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsibilities">Responsibilities</Label>
          <Textarea
            id="responsibilities"
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualifications">Qualifications</Label>
          <Textarea
            id="qualifications"
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="benefits">Benefits</Label>
          <Textarea
            id="benefits"
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label>Structured requirements</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setRequirements((prev) => [...prev, emptyRequirement("required")])
              }
            >
              Add requirement
            </Button>
          </div>
          <div className="space-y-3">
            {requirements.map((req, index) => (
              <div
                key={req.key}
                className="grid gap-2 rounded-[var(--radius-md)] border border-border-default p-3 sm:grid-cols-[140px_1fr_auto]"
              >
                <Select
                  value={req.type}
                  onValueChange={(value) =>
                    setRequirements((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              type: value as "required" | "preferred",
                            }
                          : item,
                      ),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="required">Required</SelectItem>
                    <SelectItem value="preferred">Preferred</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={req.label}
                  onChange={(e) =>
                    setRequirements((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, label: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="e.g. B2B Marketing, 5+ years experience"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setRequirements((prev) =>
                      prev.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border-default pt-6">
        <Button
          onClick={() => handleSubmit(false)}
          disabled={createJob.isPending}
          variant="outline"
        >
          Save draft
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={createJob.isPending}
        >
          Publish job
        </Button>
        <Button variant="ghost" asChild>
          <Link href={`/company/${orgSlug}/jobs`}>Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
