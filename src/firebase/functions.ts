import { httpsCallable } from "firebase/functions";
import { functions } from "./config";

type HealthPlanPayload = {
  clientId: string;
  inputs: Record<string, number>;
  type: "heart" | "glucose";
  category: string;
  modelOutput?: {
    probability?: number;
    probabilities?: number[];
    label?: number | null;
  };
};

type HealthPlanResponse = {
  plan: string;
};

type ChatPayload = {
  clientId: string;
  message: string;
  heartData?: {
    inputs: Record<string, number>;
    result: any;
  } | null;
  glucoData?: {
    inputs: Record<string, number>;
    result: any;
  } | null;
};

type ChatResponse = {
  reply: string;
};

export async function callGenerateHealthPlan(
  payload: HealthPlanPayload
): Promise<string> {
  const fn = httpsCallable<HealthPlanPayload, HealthPlanResponse>(
    functions,
    "generateHealthPlan"
  );

  const result = await fn(payload);
  return result.data.plan;
}

export async function callChatHealthCoach(
  payload: ChatPayload
): Promise<string> {
  const fn = httpsCallable<ChatPayload, ChatResponse>(
    functions,
    "chatHealthCoach"
  );

  const result = await fn(payload);
  return result.data.reply;
}