import {
  plainTextFromHtml,
  type ImportedArticle,
} from "@/lib/imported-article";

export interface StackOverflowProfile {
  userId: number;
  username: string;
  url: string;
  reputation: number;
  goldBadges: number;
  silverBadges: number;
  bronzeBadges: number;
  answerCount: number;
  questionCount: number;
  answers: ImportedArticle[];
}

const STACK_TIMEOUT_MS = 20_000;

type StackUser = {
  user_id: number;
  display_name: string;
  link: string;
  reputation: number;
  answer_count?: number;
  question_count?: number;
  badge_counts?: { gold?: number; silver?: number; bronze?: number };
};

type StackAnswer = {
  answer_id: number;
  question_id: number;
  score: number;
  is_accepted?: boolean;
  creation_date?: number;
  body?: string;
};

type StackQuestion = {
  question_id: number;
  title?: string;
  tags?: string[];
};

async function stackExchange<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.stackexchange.com/2.3${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Livefolio",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(STACK_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Stack Overflow API error: ${res.status}`);
  }

  const data = (await res.json()) as T & {
    error_id?: number;
    error_message?: string;
  };
  if (data.error_id) {
    throw new Error(data.error_message || "Stack Overflow API error");
  }
  return data;
}

function userIdFromInput(input: string): number | null {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(/stackoverflow\.com\/users\/(\d+)/i);
  if (fromUrl?.[1]) return Number(fromUrl[1]);
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return null;
}

async function resolveUser(input: string): Promise<StackUser> {
  const userId = userIdFromInput(input);
  if (userId != null) {
    const data = await stackExchange<{ items: StackUser[] }>(
      `/users/${userId}?site=stackoverflow`
    );
    const user = data.items[0];
    if (!user) throw new Error(`Stack Overflow user ${userId} not found`);
    return user;
  }

  const name = input.trim().replace(/^@/, "");
  if (!name) throw new Error("Stack Overflow username or profile URL is required");

  const data = await stackExchange<{ items: StackUser[] }>(
    `/users?site=stackoverflow&pagesize=20&order=desc&sort=reputation&inname=${encodeURIComponent(name)}`
  );
  const exact = data.items.filter(
    (user) => user.display_name.toLowerCase() === name.toLowerCase()
  );
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) {
    throw new Error(
      "Several Stack Overflow users share that name. Paste your profile URL instead."
    );
  }
  throw new Error(
    `Stack Overflow user "${name}" not found. Paste your profile URL if the display name does not match exactly.`
  );
}

export async function fetchStackOverflowProfile(
  input: string
): Promise<StackOverflowProfile> {
  const user = await resolveUser(input);
  const answersData = await stackExchange<{ items: StackAnswer[] }>(
    `/users/${user.user_id}/answers?site=stackoverflow&pagesize=20&order=desc&sort=votes&filter=withbody`
  );
  const answers = answersData.items ?? [];
  const questionIds = [...new Set(answers.map((answer) => answer.question_id))];
  const questions =
    questionIds.length === 0
      ? []
      : (
          await stackExchange<{ items: StackQuestion[] }>(
            `/questions/${questionIds.join(";")}?site=stackoverflow&pagesize=${questionIds.length}`
          )
        ).items ?? [];
  const questionsById = new Map(questions.map((question) => [question.question_id, question]));

  return {
    userId: user.user_id,
    username: user.display_name,
    url: user.link,
    reputation: user.reputation ?? 0,
    goldBadges: user.badge_counts?.gold ?? 0,
    silverBadges: user.badge_counts?.silver ?? 0,
    bronzeBadges: user.badge_counts?.bronze ?? 0,
    answerCount: user.answer_count ?? 0,
    questionCount: user.question_count ?? 0,
    answers: answers.flatMap((answer) => {
      const question = questionsById.get(answer.question_id);
      const title = question?.title?.trim();
      if (!title) return [];
      const accepted = answer.is_accepted ? "Accepted answer. " : "";
      const excerpt = plainTextFromHtml(answer.body ?? "");
      return [
        {
          title,
          description: excerpt || `${accepted}Score ${answer.score}`,
          url: `https://stackoverflow.com/a/${answer.answer_id}`,
          publishedAt: answer.creation_date
            ? new Date(answer.creation_date * 1000).toISOString()
            : "",
          tags: question?.tags ?? [],
        },
      ];
    }),
  };
}