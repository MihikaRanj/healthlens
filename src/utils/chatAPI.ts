import { callChatHealthCoach } from "../firebase/functions";
import { getClientId } from "./clientId";

export async function fetchChatReply(
  message: string,
  heartData?: {
    inputs: Record<string, number>;
    result: any;
  } | null,
  glucoData?: {
    inputs: Record<string, number>;
    result: any;
  } | null
): Promise<string> {
  const reply = await callChatHealthCoach({
    clientId: getClientId(),
    message,
    heartData: heartData || null,
    glucoData: glucoData || null,
  });

  return reply || "I’m sorry, I couldn’t generate a response right now.";
}

export function clearChatHistory(): void {
  
}