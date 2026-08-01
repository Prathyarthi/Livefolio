"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateOrg } from "@/features/recruiter/api/use-org";

export function CreateOrgGate() {
  const createOrg = useCreateOrg();
  const [name, setName] = useState("");

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Create your hiring workspace</CardTitle>
        <CardDescription>
          Upload resumes, search your talent pool, and evaluate living proof —
          without becoming another ATS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Hiring"
          />
        </div>
        <Button
          disabled={name.trim().length < 2 || createOrg.isPending}
          onClick={() => {
            createOrg.mutate(name.trim(), {
              onSuccess: () => toast.success("Workspace created"),
              onError: (e) => toast.error(e.message),
            });
          }}
        >
          {createOrg.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Create workspace"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
