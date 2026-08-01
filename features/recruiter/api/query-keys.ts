export const recruiterKeys = {
  all: ["recruiter"] as const,
  org: () => [...recruiterKeys.all, "org"] as const,
  candidates: (status = "active") =>
    [...recruiterKeys.all, "candidates", status] as const,
  candidate: (id: string) => [...recruiterKeys.all, "candidate", id] as const,
};
