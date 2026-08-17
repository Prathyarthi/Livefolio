"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  defaultComposeBodyHtml,
  wrapEmailHtmlIfNeeded,
} from "@/lib/email-templates";

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  updatedAt: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  portfolio: { id: string; isPublished: boolean } | null;
};

type EmailLog = {
  id: string;
  toEmail: string;
  type: string;
  status: string;
  error: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  campaign: { id: string; subject: string } | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmailsFromCsv(text: string): {
  emails: string[];
  invalid: string[];
} {
  const emails = new Set<string>();
  const invalid: string[] = [];

  for (const line of text.split(/\r?\n/)) {
    const cells = line.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    for (const cell of cells) {
      if (!cell || cell.toLowerCase() === "email") continue;
      if (EMAIL_RE.test(cell)) {
        emails.add(cell.toLowerCase());
      } else if (cell.includes("@")) {
        invalid.push(cell);
      }
    }
  }

  return { emails: [...emails], invalid };
}

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }
  return data;
}

export default function AdminEmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [csvEmails, setCsvEmails] = useState<string[]>([]);
  const [csvInvalid, setCsvInvalid] = useState<string[]>([]);

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState(defaultComposeBodyHtml);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    bodyHtml: "",
  });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [showTemplateHtml, setShowTemplateHtml] = useState(false);
  const [showComposeHtml, setShowComposeHtml] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const loadTemplates = useCallback(async () => {
    const data = await readJson<{ templates: EmailTemplate[] }>(
      await fetch("/api/admin/emails/templates", { cache: "no-store" }),
    );
    setTemplates(data.templates);
  }, []);

  const loadLogs = useCallback(async () => {
    const data = await readJson<{ logs: EmailLog[] }>(
      await fetch("/api/admin/emails/logs?limit=50", { cache: "no-store" }),
    );
    setLogs(data.logs);
  }, []);

  const searchUsers = useCallback(async (q: string) => {
    const params = new URLSearchParams({ limit: "30" });
    if (q.trim()) params.set("q", q.trim());
    const data = await readJson<{ users: AdminUser[] }>(
      await fetch(`/api/admin/emails/users?${params}`, { cache: "no-store" }),
    );
    setUsers(data.users);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadTemplates(), loadLogs(), searchUsers("")]);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load admin data",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTemplates, loadLogs, searchUsers]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void searchUsers(userQuery).catch(() => undefined);
    }, 250);
    return () => clearTimeout(handle);
  }, [userQuery, searchUsers]);

  const recipientCount = useMemo(() => {
    const emails = new Set(csvEmails.map((e) => e.toLowerCase()));
    for (const user of users) {
      if (selectedUserIds.has(user.id)) emails.add(user.email.toLowerCase());
    }
    return emails.size;
  }, [csvEmails, selectedUserIds, users]);

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setSubject(template.subject);
    setBodyHtml(template.bodyHtml);
  }

  function onCsvFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { emails, invalid } = parseEmailsFromCsv(text);
      setCsvEmails(emails);
      setCsvInvalid(invalid);
      toast.success(`Loaded ${emails.length} email${emails.length === 1 ? "" : "s"}`);
    };
    reader.readAsText(file);
  }

  async function handleSend() {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    if (recipientCount === 0) {
      toast.error("Add recipients via CSV or user search");
      return;
    }
    if (recipientCount > 200) {
      toast.error("Max 200 recipients per send — split the list");
      return;
    }

    setSending(true);
    try {
      const data = await readJson<{
        sent: number;
        failed: number;
        total: number;
      }>(
        await fetch("/api/admin/emails/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            bodyHtml,
            templateId: selectedTemplateId || null,
            emails: csvEmails,
            userIds: [...selectedUserIds],
          }),
        }),
      );
      toast.success(`Sent ${data.sent}/${data.total} (${data.failed} failed)`);
      await loadLogs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function handleSaveTemplate() {
    if (
      !templateForm.name.trim() ||
      !templateForm.subject.trim() ||
      !templateForm.bodyHtml.trim()
    ) {
      toast.error("Name, subject, and body are required");
      return;
    }
    setSavingTemplate(true);
    try {
      if (editingTemplateId) {
        await readJson(
          await fetch(`/api/admin/emails/templates/${editingTemplateId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(templateForm),
          }),
        );
        toast.success("Template updated");
      } else {
        await readJson(
          await fetch("/api/admin/emails/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(templateForm),
          }),
        );
        toast.success("Template created");
      }
      setTemplateForm({ name: "", subject: "", bodyHtml: "" });
      setEditingTemplateId(null);
      await loadTemplates();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save template",
      );
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    try {
      await readJson(
        await fetch(`/api/admin/emails/templates/${id}`, { method: "DELETE" }),
      );
      toast.success("Template deleted");
      if (editingTemplateId === id) {
        setEditingTemplateId(null);
        setTemplateForm({ name: "", subject: "", bodyHtml: "" });
      }
      await loadTemplates();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete template",
      );
    }
  }

  function toggleUser(id: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 text-text-primary">Email blasts</h1>
        <p className="mt-1 text-body-sm text-text-secondary">
          Upload a recipient list, pick or write a template, and send from{" "}
          <span className="font-medium">team@livefolio.me</span>. Placeholders:{" "}
          <code className="text-xs">{"{{name}}"}</code>,{" "}
          <code className="text-xs">{"{{email}}"}</code>
          {" · "}
          <a
            href="/admin/emails/preview"
            className="font-medium text-brand-primary hover:underline"
          >
            View automated email demos
          </a>
        </p>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recipients</CardTitle>
                <CardDescription>
                  CSV upload and/or search existing users. Max 200 per send.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="csv-upload">Upload CSV</Label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={(e) => onCsvFile(e.target.files?.[0] ?? null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCsvEmails([]);
                        setCsvInvalid([]);
                      }}
                      disabled={csvEmails.length === 0}
                    >
                      Clear CSV
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    <Upload className="mr-1 inline h-3 w-3" />
                    {csvEmails.length} valid
                    {csvInvalid.length > 0
                      ? ` · ${csvInvalid.length} invalid skipped`
                      : ""}
                  </p>
                </div>

                <div>
                  <Label htmlFor="user-search">Search users</Label>
                  <Input
                    id="user-search"
                    className="mt-2"
                    placeholder="Name or email"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                  />
                  <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-md border border-border-default p-2">
                    {users.length === 0 ? (
                      <p className="px-2 py-4 text-sm text-text-muted">
                        No users found
                      </p>
                    ) : (
                      users.map((user) => (
                        <label
                          key={user.id}
                          className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-surface-sunken"
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={selectedUserIds.has(user.id)}
                            onChange={() => toggleUser(user.id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {user.name}
                            </span>
                            <span className="block truncate text-xs text-text-muted">
                              {user.email}
                            </span>
                          </span>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {user.portfolio
                              ? user.portfolio.isPublished
                                ? "Published"
                                : "Draft"
                              : "No portfolio"}
                          </Badge>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    {selectedUserIds.size} selected from search · {recipientCount}{" "}
                    unique recipients total
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Message</CardTitle>
                <CardDescription>
                  Load a saved template or write a message. Preview shows how
                  recipients will see it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-select">Template</Label>
                  <select
                    id="template-select"
                    className="mt-2 flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={selectedTemplateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                  >
                    <option value="">Custom / blank</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    className="mt-2"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject line"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <Label>Preview</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowComposeHtml((v) => !v)}
                    >
                      {showComposeHtml ? "Hide HTML" : "Edit HTML"}
                    </Button>
                  </div>
                  {showComposeHtml ? (
                    <Textarea
                      id="body"
                      className="mt-2 min-h-48 font-mono text-xs"
                      value={bodyHtml}
                      onChange={(e) => setBodyHtml(e.target.value)}
                    />
                  ) : null}
                  <div className="mt-2 overflow-hidden rounded-md border border-border-default bg-surface-sunken">
                    {bodyHtml.trim() ? (
                      <iframe
                        title="Compose preview"
                        srcDoc={wrapEmailHtmlIfNeeded(bodyHtml, {
                          title: subject || "Livefolio",
                        })}
                        className="h-[560px] w-full bg-white"
                      />
                    ) : (
                      <p className="px-4 py-10 text-center text-sm text-text-muted">
                        Choose a template or edit HTML to see a preview
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending}
                >
                  {sending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Send to {recipientCount} recipient
                  {recipientCount === 1 ? "" : "s"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {editingTemplateId ? "Edit template" : "New template"}
              </CardTitle>
              <CardDescription>
                Create or edit blast templates. Preview is shown by default —
                open Edit HTML only when you need to change markup. Automated
                email demos:{" "}
                <a
                  href="/admin/emails/preview"
                  className="font-medium text-brand-primary hover:underline"
                >
                  Previews
                </a>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tpl-name">Name</Label>
                <Input
                  id="tpl-name"
                  className="mt-2"
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="tpl-subject">Subject</Label>
                <Input
                  id="tpl-subject"
                  className="mt-2"
                  value={templateForm.subject}
                  onChange={(e) =>
                    setTemplateForm((f) => ({ ...f, subject: e.target.value }))
                  }
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Label>Preview</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowTemplateHtml((v) => !v)}
                  >
                    {showTemplateHtml ? "Hide HTML" : "Edit HTML"}
                  </Button>
                </div>
                {showTemplateHtml ? (
                  <Textarea
                    id="tpl-body"
                    className="mt-2 min-h-40 font-mono text-xs"
                    value={templateForm.bodyHtml}
                    onChange={(e) =>
                      setTemplateForm((f) => ({
                        ...f,
                        bodyHtml: e.target.value,
                      }))
                    }
                  />
                ) : null}
                <div className="mt-2 overflow-hidden rounded-md border border-border-default bg-surface-sunken">
                  {templateForm.bodyHtml.trim() ? (
                    <iframe
                      title="Template editor preview"
                      srcDoc={wrapEmailHtmlIfNeeded(templateForm.bodyHtml, {
                        title: templateForm.subject || "Livefolio",
                      })}
                      className="h-[560px] w-full bg-white"
                    />
                  ) : (
                    <p className="px-4 py-10 text-center text-sm text-text-muted">
                      Preview appears when the template has HTML content
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => void handleSaveTemplate()}
                  disabled={savingTemplate}
                >
                  {savingTemplate ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {editingTemplateId ? "Update" : "Create"}
                </Button>
                {editingTemplateId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingTemplateId(null);
                      setShowTemplateHtml(false);
                      setTemplateForm({ name: "", subject: "", bodyHtml: "" });
                    }}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {templates.length === 0 ? (
              <p className="text-sm text-text-muted">No templates yet.</p>
            ) : (
              templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="space-y-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-text-secondary">
                          Subject: {template.subject}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTemplateId(template.id);
                            setShowTemplateHtml(false);
                            setTemplateForm({
                              name: template.name,
                              subject: template.subject,
                              bodyHtml: template.bodyHtml,
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => void handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-md border border-border-default bg-surface-sunken">
                      <iframe
                        title={`Preview ${template.name}`}
                        srcDoc={wrapEmailHtmlIfNeeded(template.bodyHtml, {
                          title: template.subject,
                        })}
                        className="h-[560px] w-full bg-white"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent sends</CardTitle>
              <CardDescription>Last 50 email attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-default text-text-muted">
                      <th className="px-2 py-2 font-medium">When</th>
                      <th className="px-2 py-2 font-medium">To</th>
                      <th className="px-2 py-2 font-medium">Type</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-2 py-8 text-center text-text-muted"
                        >
                          No sends yet
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-border-default/60"
                        >
                          <td className="px-2 py-2 whitespace-nowrap text-text-secondary">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-2 py-2">{log.toEmail}</td>
                          <td className="px-2 py-2">
                            <Badge variant="secondary">{log.type}</Badge>
                          </td>
                          <td className="px-2 py-2">
                            <Badge
                              variant={
                                log.status === "sent" ? "default" : "destructive"
                              }
                            >
                              {log.status}
                            </Badge>
                          </td>
                          <td className="max-w-[200px] truncate px-2 py-2 text-xs text-text-muted">
                            {log.error ?? "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => void loadLogs().catch((e) => toast.error(String(e)))}
              >
                Refresh
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
