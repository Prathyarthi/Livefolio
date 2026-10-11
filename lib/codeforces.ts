export interface CodeforcesStats {
  handle: string;
  name: string;
  rating: number | null;
  maxRating: number | null;
  rank: string | null;
  maxRank: string | null;
  solvedCount: number;
  solvedCountPartial: boolean;
}

const CODEFORCES_TIMEOUT_MS = 20_000;
const STATUS_PAGE_SIZE = 1000;
const STATUS_PAGE_LIMIT = 4;

type CodeforcesUser = {
  handle: string;
  firstName?: string;
  lastName?: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
};

type CodeforcesSubmission = {
  verdict?: string;
  problem?: { contestId?: number; index?: string };
};

async function codeforces<T>(path: string): Promise<T> {
  const res = await fetch(`https://codeforces.com/api/${path}`, {
    headers: { Accept: "application/json", "User-Agent": "Livefolio" },
    cache: "no-store",
    signal: AbortSignal.timeout(CODEFORCES_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Codeforces API error: ${res.status}`);
  const data = (await res.json()) as {
    status: string;
    comment?: string;
    result: T;
  };
  if (data.status !== "OK") {
    const comment = data.comment ?? "";
    if (/not found/i.test(comment)) {
      throw new Error("Codeforces handle not found");
    }
    throw new Error(comment || "Codeforces API error");
  }
  return data.result;
}

async function countSolved(handle: string): Promise<{
  solvedCount: number;
  solvedCountPartial: boolean;
}> {
  const solved = new Set<string>();
  let from = 1;

  for (let page = 0; page < STATUS_PAGE_LIMIT; page += 1) {
    const submissions = await codeforces<CodeforcesSubmission[]>(
      `user.status?handle=${encodeURIComponent(handle)}&from=${from}&count=${STATUS_PAGE_SIZE}`
    );
    for (const submission of submissions) {
      const problem = submission.problem;
      if (submission.verdict !== "OK" || problem?.contestId == null || !problem.index) {
        continue;
      }
      solved.add(`${problem.contestId}${problem.index}`);
    }
    if (submissions.length < STATUS_PAGE_SIZE) {
      return { solvedCount: solved.size, solvedCountPartial: false };
    }
    from += STATUS_PAGE_SIZE;
  }

  return { solvedCount: solved.size, solvedCountPartial: true };
}

export async function fetchCodeforcesStats(handleInput: string): Promise<CodeforcesStats> {
  const handle = handleInput.trim();
  if (!/^[A-Za-z0-9_.-]{1,24}$/.test(handle)) {
    throw new Error("Enter a Codeforces handle");
  }

  const users = await codeforces<CodeforcesUser[]>(
    `user.info?handles=${encodeURIComponent(handle)}`
  );
  const user = users[0];
  if (!user) throw new Error(`Codeforces handle "${handle}" not found`);

  const solved = await countSolved(user.handle);
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return {
    handle: user.handle,
    name: name || user.handle,
    rating: user.rating ?? null,
    maxRating: user.maxRating ?? null,
    rank: user.rank ?? null,
    maxRank: user.maxRank ?? null,
    solvedCount: solved.solvedCount,
    solvedCountPartial: solved.solvedCountPartial,
  };
}