import { callGenerateHealthPlan } from "../firebase/functions";
import { getClientId } from "./clientId";

export async function fetchCustomHealthPlan(
  inputs: Record<string, number>,
  type: "heart" | "glucose",
  category: string,
  modelOutput?: {
    probability?: number;
    probabilities?: number[];
    label?: number | null;
  }
): Promise<string> {
  const plan = await callGenerateHealthPlan({
    clientId: getClientId(),
    inputs,
    type,
    category,
    modelOutput,
  });

  return plan || "Unable to generate plan right now. Please try again later.";
}