import { beforeEach, describe, expect, mock, test } from "bun:test";

const ATTACKER_USER_ID = "user-attacker";
const VICTIM_USER_ID = "user-victim";
const VICTIM_RECORD_ID = "victim-record";

type ModelName =
  | "experience"
  | "education"
  | "skill"
  | "project"
  | "certification"
  | "socialProfile"
  | "achievement"
  | "customSection";

type StoredRecord = {
  id: string;
  userId: string;
  title: string;
  [key: string]: unknown;
};

type MutationArgs = {
  where: {
    id?: string;
    portfolio?: { userId?: string };
  };
  data?: Record<string, unknown>;
};

function createDelegate() {
  const records = new Map<string, StoredRecord>();

  return {
    records,
    updateMany: mock(async ({ where, data }: MutationArgs) => {
      const record = where.id ? records.get(where.id) : undefined;
      if (!record || record.userId !== where.portfolio?.userId) {
        return { count: 0 };
      }

      records.set(record.id, { ...record, ...data });
      return { count: 1 };
    }),
    deleteMany: mock(async ({ where }: MutationArgs) => {
      const record = where.id ? records.get(where.id) : undefined;
      if (!record || record.userId !== where.portfolio?.userId) {
        return { count: 0 };
      }

      records.delete(record.id);
      return { count: 1 };
    }),
    findUniqueOrThrow: mock(async ({ where }: MutationArgs) => {
      const record = where.id ? records.get(where.id) : undefined;
      if (!record) throw new Error("Record not found");
      return record;
    }),
  };
}

const delegates: Record<ModelName, ReturnType<typeof createDelegate>> = {
  experience: createDelegate(),
  education: createDelegate(),
  skill: createDelegate(),
  project: createDelegate(),
  certification: createDelegate(),
  socialProfile: createDelegate(),
  achievement: createDelegate(),
  customSection: createDelegate(),
};

mock.module("@/lib/prisma", () => ({
  prisma: delegates,
}));

mock.module("@/lib/session", () => ({
  getSession: async (request: Request) => {
    const userId = request.headers.get("x-test-user-id");
    return userId ? { userId } : null;
  },
}));

const { portfolio } = await import("./route");

type RouteCase = {
  label: string;
  method: "PATCH" | "DELETE";
  path: string;
  model: ModelName;
  operation: "updateMany" | "deleteMany";
  body?: Record<string, unknown>;
  error: string;
};

const cases: RouteCase[] = [
  {
    label: "experience update",
    method: "PATCH",
    path: "/experience",
    model: "experience",
    operation: "updateMany",
    body: { company: "Changed company" },
    error: "Experience not found",
  },
  {
    label: "experience delete",
    method: "DELETE",
    path: "/experience",
    model: "experience",
    operation: "deleteMany",
    error: "Experience not found",
  },
  {
    label: "education update",
    method: "PATCH",
    path: "/education",
    model: "education",
    operation: "updateMany",
    body: { institution: "Changed institution" },
    error: "Education not found",
  },
  {
    label: "education delete",
    method: "DELETE",
    path: "/education",
    model: "education",
    operation: "deleteMany",
    error: "Education not found",
  },
  {
    label: "skill delete",
    method: "DELETE",
    path: "/skill",
    model: "skill",
    operation: "deleteMany",
    error: "Skill not found",
  },
  {
    label: "project update",
    method: "PATCH",
    path: "/project",
    model: "project",
    operation: "updateMany",
    body: { title: "Changed project" },
    error: "Project not found",
  },
  {
    label: "project delete",
    method: "DELETE",
    path: "/project",
    model: "project",
    operation: "deleteMany",
    error: "Project not found",
  },
  {
    label: "certification update",
    method: "PATCH",
    path: "/certification",
    model: "certification",
    operation: "updateMany",
    body: { name: "Changed certification" },
    error: "Certification not found",
  },
  {
    label: "certification delete",
    method: "DELETE",
    path: "/certification",
    model: "certification",
    operation: "deleteMany",
    error: "Certification not found",
  },
  {
    label: "social profile delete",
    method: "DELETE",
    path: "/social",
    model: "socialProfile",
    operation: "deleteMany",
    error: "Social profile not found",
  },
  {
    label: "achievement update",
    method: "PATCH",
    path: "/achievement",
    model: "achievement",
    operation: "updateMany",
    body: { title: "Changed achievement" },
    error: "Achievement not found",
  },
  {
    label: "achievement delete",
    method: "DELETE",
    path: "/achievement",
    model: "achievement",
    operation: "deleteMany",
    error: "Achievement not found",
  },
  {
    label: "custom section update",
    method: "PATCH",
    path: "/custom-section",
    model: "customSection",
    operation: "updateMany",
    body: { label: "Changed section" },
    error: "Custom section not found",
  },
  {
    label: "custom section delete",
    method: "DELETE",
    path: "/custom-section",
    model: "customSection",
    operation: "deleteMany",
    error: "Custom section not found",
  },
];

function requestFor(routeCase: RouteCase, userId: string) {
  return new Request(
    `http://localhost/portfolio${routeCase.path}/${VICTIM_RECORD_ID}`,
    {
      method: routeCase.method,
      headers: {
        "content-type": "application/json",
        "x-test-user-id": userId,
      },
      body: routeCase.body ? JSON.stringify(routeCase.body) : undefined,
    },
  );
}

beforeEach(() => {
  for (const delegate of Object.values(delegates)) {
    delegate.records.clear();
    delegate.records.set(VICTIM_RECORD_ID, {
      id: VICTIM_RECORD_ID,
      userId: VICTIM_USER_ID,
      title: "Victim data",
    });
    delegate.updateMany.mockClear();
    delegate.deleteMany.mockClear();
    delegate.findUniqueOrThrow.mockClear();
  }
});

describe("nested portfolio ownership", () => {
  for (const routeCase of cases) {
    test(`${routeCase.label} rejects a cross-user ID and allows its owner`, async () => {
      const delegate = delegates[routeCase.model];
      const mutation = delegate[routeCase.operation];

      const attackerResponse = await portfolio.handle(
        requestFor(routeCase, ATTACKER_USER_ID),
      );

      expect(attackerResponse.status).toBe(404);
      expect(await attackerResponse.json()).toEqual({ error: routeCase.error });
      expect(mutation).toHaveBeenCalledTimes(1);
      expect(mutation.mock.calls[0]?.[0].where).toEqual({
        id: VICTIM_RECORD_ID,
        portfolio: { userId: ATTACKER_USER_ID },
      });
      expect(delegate.records.has(VICTIM_RECORD_ID)).toBe(true);

      const ownerResponse = await portfolio.handle(
        requestFor(routeCase, VICTIM_USER_ID),
      );

      expect(ownerResponse.status).toBe(200);
      expect(mutation).toHaveBeenCalledTimes(2);
      expect(mutation.mock.calls[1]?.[0].where).toEqual({
        id: VICTIM_RECORD_ID,
        portfolio: { userId: VICTIM_USER_ID },
      });

      if (routeCase.method === "DELETE") {
        expect(delegate.records.has(VICTIM_RECORD_ID)).toBe(false);
      } else {
        expect(delegate.records.get(VICTIM_RECORD_ID)).toMatchObject(
          routeCase.body ?? {},
        );
      }
    });
  }
});
