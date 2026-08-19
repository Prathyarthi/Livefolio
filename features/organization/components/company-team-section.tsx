"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ASSIGNABLE_ORG_ROLES,
  type AssignableOrgRole,
} from "@/features/organization/lib/permissions";
import {
  useAddOrgMember,
  useOrganization,
  useOrgMembers,
  useRemoveOrgMember,
  useUpdateOrgMemberRole,
  type OrgMember,
} from "@/features/organization/api/use-organization";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  recruiter: "Recruiter",
  hiring_manager: "Hiring manager",
};

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source.slice(0, 2).toUpperCase();
}

export function CompanyTeamSection({
  orgSlug,
  canManage,
  viewerRole,
}: {
  orgSlug: string;
  canManage: boolean;
  viewerRole: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const viewerUserId = session?.user?.id;
  const { data: org } = useOrganization(orgSlug);
  const { data: members, isLoading } = useOrgMembers(orgSlug);
  const addMember = useAddOrgMember(orgSlug);
  const updateRole = useUpdateOrgMemberRole(orgSlug);
  const removeMember = useRemoveOrgMember(orgSlug);
  const workspaces = org?.workspaces ?? [];

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableOrgRole>("recruiter");
  const [workspaceIds, setWorkspaceIds] = useState<string[]>([]);

  async function handleAdd() {
    if (!email.trim()) {
      toast.error("Enter an email address");
      return;
    }
    try {
      await addMember.mutateAsync({
        email: email.trim(),
        role,
        workspaceIds:
          workspaceIds.length > 0
            ? workspaceIds
            : workspaces.map((ws) => ws.id),
      });
      toast.success("Member added");
      setEmail("");
      setRole("recruiter");
      setWorkspaceIds([]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add member",
      );
    }
  }

  async function handleRoleChange(member: OrgMember, nextRole: string) {
    if (nextRole === member.role) return;
    try {
      await updateRole.mutateAsync({ memberId: member.id, role: nextRole });
      toast.success("Role updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role",
      );
    }
  }

  async function handleRemove(member: OrgMember) {
    const isSelf = member.user.id === viewerUserId;
    try {
      await removeMember.mutateAsync(member.id);
      toast.success(isSelf ? "You left the company" : "Member removed");
      if (isSelf) router.push("/company");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member",
      );
    }
  }

  function canEditMember(member: OrgMember) {
    if (!canManage) return false;
    if (member.role === "owner") return false;
    if (member.role === "admin" && viewerRole !== "owner") return false;
    return true;
  }

  function canRemoveMember(member: OrgMember) {
    const isSelf = member.user.id === viewerUserId;
    if (isSelf && member.role !== "owner") return true;
    return canEditMember(member);
  }

  return (
    <section className="space-y-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="space-y-1">
        <h2 className="text-h3 text-text-primary">Team</h2>
        <p className="text-body-sm text-text-secondary">
          People in this organization. Recruiters and hiring managers only
          see the workspaces you assign. New members must already have a
          Livefolio account.
        </p>
      </div>

      {isLoading ? (
        <p className="text-body-sm text-text-muted">Loading team…</p>
      ) : (
        <ul className="divide-y divide-border-default rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
          {(members ?? []).map((member) => {
            const editable = canEditMember(member);
            const removable = canRemoveMember(member);
            const isSelf = member.user.id === viewerUserId;

            return (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={member.user.avatar ?? undefined}
                    alt=""
                  />
                  <AvatarFallback>
                    {initials(member.user.name, member.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">
                    {member.user.name || member.user.email}
                    {isSelf ? (
                      <span className="ml-1 text-body-sm font-normal text-text-muted">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-body-sm text-text-secondary">
                    {member.user.email}
                  </p>
                  {workspaces.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {workspaces.map((ws) => {
                        const assigned = member.workspaceIds.includes(ws.id);
                        const canToggle =
                          canManage && member.role !== "owner";
                        return (
                          <button
                            key={ws.id}
                            type="button"
                            disabled={!canToggle || updateRole.isPending}
                            onClick={() => {
                              if (!canToggle) return;
                              const next = assigned
                                ? member.workspaceIds.filter((id) => id !== ws.id)
                                : [...member.workspaceIds, ws.id];
                              void updateRole.mutateAsync({
                                memberId: member.id,
                                workspaceIds: next,
                              });
                            }}
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              assigned || member.role === "owner" || member.role === "admin"
                                ? "bg-brand-light text-brand-primary"
                                : "bg-surface-base text-text-muted"
                            } ${canToggle ? "cursor-pointer" : "cursor-default"}`}
                          >
                            {ws.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {editable ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      void handleRoleChange(member, value)
                    }
                    disabled={updateRole.isPending}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ORG_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-body-sm text-text-secondary">
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                )}

                {removable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={removeMember.isPending}
                    onClick={() => void handleRemove(member)}
                  >
                    {isSelf ? "Leave" : "Remove"}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {canManage ? (
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4 shadow-[var(--shadow-card)]">
          <p className="text-body-sm font-medium text-text-primary">
            Add teammate
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
            <div className="space-y-2">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setRole(value as AssignableOrgRole)
                }
              >
                <SelectTrigger id="member-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ORG_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full sm:w-auto"
                disabled={addMember.isPending}
                onClick={() => void handleAdd()}
              >
                Add
              </Button>
            </div>
          </div>
          {workspaces.length > 0 ? (
            <div className="space-y-2">
              <Label>Workspaces</Label>
              <div className="flex flex-wrap gap-1.5">
                {workspaces.map((ws) => {
                  const selected =
                    workspaceIds.length === 0 || workspaceIds.includes(ws.id);
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        setWorkspaceIds((current) => {
                          const base =
                            current.length === 0
                              ? workspaces.map((item) => item.id)
                              : current;
                          return base.includes(ws.id)
                            ? base.filter((id) => id !== ws.id)
                            : [...base, ws.id];
                        });
                      }}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        selected
                          ? "bg-brand-light text-brand-primary"
                          : "bg-surface-base text-text-muted"
                      }`}
                    >
                      {ws.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <p className="text-xs text-text-muted">
            That email must already have a Livefolio account.
          </p>
        </div>
      ) : null}
    </section>
  );
}