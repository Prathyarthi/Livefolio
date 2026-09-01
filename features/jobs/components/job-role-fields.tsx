"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRENCY_OPTIONS,
  EDUCATION_OPTIONS,
  SENIORITY_OPTIONS,
  SALARY_PERIOD_OPTIONS,
  emptyRequirement,
  type JobRoleFormState,
} from "@/features/jobs/lib/role-fields";
import {
  EDUCATION_LABELS,
  SENIORITY_LABELS,
  SALARY_PERIOD_LABELS,
} from "@/features/jobs/constants/labels";

function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border-default pt-6 first:border-t-0 first:pt-0">
      <div className="space-y-1">
        <h2 className="text-h3 text-text-primary">{title}</h2>
        {description ? (
          <p className="text-body-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function JobRoleFields({
  values,
  onChange,
  descriptionExtra,
}: {
  values: JobRoleFormState;
  onChange: (patch: Partial<JobRoleFormState>) => void;
  descriptionExtra?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <FieldGroup
        title="The role"
        description="What candidates see first on the public job page."
      >
        <div className="space-y-2">
          <Label htmlFor="title">Job title</Label>
          <Input
            id="title"
            value={values.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Senior Marketing Manager"
          />
          <p className="text-xs text-text-muted">
            The public link uses a unique id, so companies can share the same
            role title without conflicts.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          {descriptionExtra}
          <Textarea
            id="description"
            value={values.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={8}
            placeholder="Describe the role, team, and impact."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={values.department}
              onChange={(e) => onChange({ department: e.target.value })}
              placeholder="Marketing"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup
        title="Location & type"
        description="Where the work happens and how the role is structured."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={values.location}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="Bangalore / Remote"
            />
          </div>
          <div className="space-y-2">
            <Label>Workplace</Label>
            <Select
              value={values.workplaceType}
              onValueChange={(workplaceType) => onChange({ workplaceType })}
            >
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
            <Label>Employment type</Label>
            <Select
              value={values.employmentType}
              onValueChange={(employmentType) => onChange({ employmentType })}
            >
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
            <Label htmlFor="deadline">Application deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={values.applicationDeadline}
              onChange={(e) =>
                onChange({ applicationDeadline: e.target.value })
              }
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup
        title="Compensation"
        description="Optional, but candidates notice when this is filled in."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="salaryMin">Salary min</Label>
            <Input
              id="salaryMin"
              type="number"
              min={0}
              value={values.salaryMin}
              onChange={(e) => onChange({ salaryMin: e.target.value })}
              placeholder="120000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryMax">Salary max</Label>
            <Input
              id="salaryMax"
              type="number"
              min={0}
              value={values.salaryMax}
              onChange={(e) => onChange({ salaryMax: e.target.value })}
              placeholder="160000"
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={values.salaryCurrency}
              onValueChange={(salaryCurrency) => onChange({ salaryCurrency })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Requirements">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="expMin">Min years experience</Label>
            <Input
              id="expMin"
              type="number"
              min={0}
              value={values.experienceMin}
              onChange={(e) => onChange({ experienceMin: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expMax">Max years experience</Label>
            <Input
              id="expMax"
              type="number"
              min={0}
              value={values.experienceMax}
              onChange={(e) => onChange({ experienceMax: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibilities">Responsibilities</Label>
          <Textarea
            id="responsibilities"
            value={values.responsibilities}
            onChange={(e) => onChange({ responsibilities: e.target.value })}
            rows={5}
            placeholder="One responsibility per line."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qualifications">Qualifications</Label>
          <Textarea
            id="qualifications"
            value={values.qualifications}
            onChange={(e) => onChange({ qualifications: e.target.value })}
            rows={5}
            placeholder="One qualification per line."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="benefits">Benefits</Label>
          <Textarea
            id="benefits"
            value={values.benefits}
            onChange={(e) => onChange({ benefits: e.target.value })}
            rows={4}
            placeholder="Health insurance, flexible hours, learning stipend…"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label>Custom fields</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  customFields: [
                    ...values.customFields,
                    { id: crypto.randomUUID(), label: "", value: "" },
                  ],
                })
              }
            >
              Add custom field
            </Button>
          </div>
          <div className="space-y-3">
            {values.customFields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-2 rounded-[var(--radius-md)] border border-border-default p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Field label</Label>
                  <Input
                    value={field.label}
                    onChange={(e) =>
                      onChange({
                        customFields: values.customFields.map((item, i) =>
                          i === index ? { ...item, label: e.target.value } : item,
                        ),
                      })
                    }
                    placeholder="e.g. Travel requirement"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={field.value}
                    onChange={(e) =>
                      onChange({
                        customFields: values.customFields.map((item, i) =>
                          i === index ? { ...item, value: e.target.value } : item,
                        ),
                      })
                    }
                    placeholder="e.g. 20% travel"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onChange({
                        customFields: values.customFields.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label>Structured requirements</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  requirements: [
                    ...values.requirements,
                    emptyRequirement("required"),
                  ],
                })
              }
            >
              Add requirement
            </Button>
          </div>
          <div className="space-y-3">
            {values.requirements.map((req, index) => (
              <div
                key={req.key}
                className="grid gap-2 rounded-[var(--radius-md)] border border-border-default p-3 sm:grid-cols-[140px_1fr_auto]"
              >
                <Select
                  value={req.type}
                  onValueChange={(value) =>
                    onChange({
                      requirements: values.requirements.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              type: value as "required" | "preferred",
                            }
                          : item,
                      ),
                    })
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
                    onChange({
                      requirements: values.requirements.map((item, i) =>
                        i === index ? { ...item, label: e.target.value } : item,
                      ),
                    })
                  }
                  placeholder="e.g. B2B Marketing, 5+ years experience"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onChange({
                      requirements: values.requirements.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </FieldGroup>
    </div>
  );
}
