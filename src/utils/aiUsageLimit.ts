const AI_USAGE_KEY = "healthlens_ai_usage_v1";

type AIUsageState = {
  date: string;
  usedCredits: number;
};

export const AI_DAILY_CREDIT_LIMIT = 6;
export const AI_CHAT_COST = 1;
export const AI_PLAN_COST = 2;

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readUsage(): AIUsageState {
  const raw = localStorage.getItem(AI_USAGE_KEY);
  const today = getTodayString();

  if (!raw) {
    return { date: today, usedCredits: 0 };
  }

  try {
    const parsed = JSON.parse(raw) as AIUsageState;

    if (parsed.date !== today) {
      return { date: today, usedCredits: 0 };
    }

    return {
      date: parsed.date,
      usedCredits: Number(parsed.usedCredits) || 0,
    };
  } catch {
    return { date: today, usedCredits: 0 };
  }
}

function writeUsage(state: AIUsageState): void {
  localStorage.setItem(AI_USAGE_KEY, JSON.stringify(state));
}


export function consumeAICredits(cost: number): boolean {
  const state = readUsage();

  if (state.usedCredits + cost > AI_DAILY_CREDIT_LIMIT) {
    return false;
  }

  writeUsage({
    date: state.date,
    usedCredits: state.usedCredits + cost,
  });

  return true;
}

export function refundAICredits(cost: number): void {
  const state = readUsage();

  writeUsage({
    date: state.date,
    usedCredits: Math.max(0, state.usedCredits - cost),
  });
}

export function resetAICredits(): void {
  writeUsage({
    date: getTodayString(),
    usedCredits: 0,
  });
}