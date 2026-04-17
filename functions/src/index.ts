import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import OpenAI from "openai";

initializeApp();
const db = getFirestore();

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

const PLAN_DAILY_LIMIT = 2;
const CHAT_DAILY_LIMIT = 8;

type HealthPlanRequest = {
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

type ChatRequest = {
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

function getTodayKey(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sanitizeClientId(clientId: string): string {
  return clientId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
}

async function checkAndIncrementUsage(
  clientId: string,
  type: "plan" | "chat"
): Promise<void> {
  const today = getTodayKey();
  const safeClientId = sanitizeClientId(clientId);
  if (!safeClientId) {
    throw new HttpsError("invalid-argument", "Missing valid client ID.");
  }

  const docId = `${today}_${safeClientId}`;
  const ref = db.collection("aiUsage").doc(docId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};

    const planCount = Number(data.planCount || 0);
    const chatCount = Number(data.chatCount || 0);

    if (type === "plan" && planCount >= PLAN_DAILY_LIMIT) {
      throw new HttpsError(
        "resource-exhausted",
        "Daily AI plan limit reached. Please try again tomorrow."
      );
    }

    if (type === "chat" && chatCount >= CHAT_DAILY_LIMIT) {
      throw new HttpsError(
        "resource-exhausted",
        "Daily AI chat limit reached. Please try again tomorrow."
      );
    }

    tx.set(
      ref,
      {
        date: today,
        clientId: safeClientId,
        updatedAt: FieldValue.serverTimestamp(),
        planCount: type === "plan" ? planCount + 1 : planCount,
        chatCount: type === "chat" ? chatCount + 1 : chatCount,
      },
      { merge: true }
    );
  });
}

function validateHealthPlanRequest(data: unknown): asserts data is HealthPlanRequest {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Missing request body.");
  }

  const body = data as Partial<HealthPlanRequest>;

  if (!body.clientId || typeof body.clientId !== "string") {
    throw new HttpsError("invalid-argument", "Missing clientId.");
  }

  if (!body.inputs || typeof body.inputs !== "object") {
    throw new HttpsError("invalid-argument", "Missing inputs.");
  }

  if (body.type !== "heart" && body.type !== "glucose") {
    throw new HttpsError("invalid-argument", "Invalid health plan type.");
  }

  if (!body.category || typeof body.category !== "string") {
    throw new HttpsError("invalid-argument", "Missing category.");
  }
}

function validateChatRequest(data: unknown): asserts data is ChatRequest {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Missing request body.");
  }

  const body = data as Partial<ChatRequest>;

  if (!body.clientId || typeof body.clientId !== "string") {
    throw new HttpsError("invalid-argument", "Missing clientId.");
  }

  if (!body.message || typeof body.message !== "string") {
    throw new HttpsError("invalid-argument", "Missing chat message.");
  }
}

function describeInputs(
  inputs: Record<string, number>,
  type: "heart" | "glucose"
): string {
  if (type === "heart") {
    const activityMap: Record<number, string> = {
      1: "Walking",
      2: "Running",
      3: "Cycling",
      4: "Strength Training",
      10: "Yoga",
      11: "Other",
    };

    return `
User Profile:
- Age: ${inputs.AGE ?? "Unknown"}
- BMI: ${inputs.BMI ?? "Unknown"}
- Sex: ${inputs.SEX_MALE === 1 ? "Male" : "Female"}
- Physical activity in last 30 days: ${inputs.PA_ANY === 1 ? "Yes" : "No"}
- Meets 150 min/week guideline: ${inputs.PA_INDEX === 1 ? "Yes" : "No"}
- Smoking: ${inputs.SMOKING_IDX === 1 ? "Yes" : "No"}
- High blood pressure: ${inputs.HTN_FLAG === 1 ? "Yes" : "No"}
- Stress score: ${inputs.STRESS_SCORE ?? 0}
- Heavy drinking: ${inputs.ALC_FLAG === 1 ? "Yes" : "No"}
- High cholesterol: ${inputs.CHOL_FLAG === 1 ? "Yes" : "No"}
- Cholesterol checked recently: ${inputs.CHOL_SCREEN === 0 ? "Yes" : "No"}
- Aerobic exercise sessions/week: ${inputs.EXER_FREQ_WK ?? 0}
- Strength workouts/week: ${inputs.STRENGTH_FREQ ?? 0}
- Primary exercise type: ${activityMap[inputs.ACTIVITY_TYPE_CODE] || "Unknown"}
`;
  }

  const smokingText =
    inputs.SMOKING_IDX === 0
      ? "Does not smoke"
      : inputs.SMOKING_IDX === 1
        ? "Smokes occasionally"
        : inputs.SMOKING_IDX === 2
          ? "Smokes regularly"
          : "Smokes heavily";

  return `
User Profile:
- Age: ${inputs.AGE ?? "Unknown"}
- BMI: ${inputs.BMI ?? "Unknown"}
- Sex: ${inputs.SEX_MALE === 1 ? "Male" : "Female"}
- High blood pressure: ${inputs.HTN_FLAG === 1 ? "Yes" : "No"}
- Fasting blood sugar: ${inputs.GLU ?? "Unknown"} mg/dL
- Smoking: ${smokingText}
- Physically active: ${inputs.PA_ANY === 1 ? "Yes" : "No"}
`;
}

function buildModelSummary(
  type: "heart" | "glucose",
  category: string,
  modelOutput?: {
    probability?: number;
    probabilities?: number[];
    label?: number | null;
  }
): string {
  if (type === "heart") {
    const probability = modelOutput?.probability ?? 0;
    return `
Model Output Summary:
- Category: ${category}
- Estimated probability: ${(probability * 100).toFixed(1)}%
`;
  }

  const probs = modelOutput?.probabilities ?? [];
  if (probs.length === 3) {
    return `
Model Output Summary:
- Normal: ${(probs[0] * 100).toFixed(1)}%
- Prediabetic: ${(probs[1] * 100).toFixed(1)}%
- Diabetic: ${(probs[2] * 100).toFixed(1)}%
- Category: ${category}
`;
  }

  return `
Model Output Summary:
- Category: ${category}
`;
}

function summarizeStoredHealthData(
  heartData?: { inputs: Record<string, number>; result: any } | null,
  glucoData?: { inputs: Record<string, number>; result: any } | null
): string {
  let summary = "";

  if (heartData) {
    const heartInputs = heartData.inputs || {};
    const heartCategory =
      heartData.result?.category ||
      (typeof heartData.result?.probability === "number"
        ? heartData.result.probability < 0.33
          ? "Low"
          : heartData.result.probability < 0.66
            ? "Moderate"
            : "High"
        : "Unknown");

    summary += `
Heart Health Context:
- Category: ${heartCategory}
- Age: ${heartInputs.AGE ?? "Unknown"}
- BMI: ${heartInputs.BMI ?? "Unknown"}
- High blood pressure: ${heartInputs.HTN_FLAG === 1 ? "Yes" : "No"}
- Smoking: ${heartInputs.SMOKING_IDX === 1 ? "Yes" : "No"}
- Physical activity: ${heartInputs.PA_ANY === 1 ? "Yes" : "No"}
`;
  }

  if (glucoData) {
    const glucoInputs = glucoData.inputs || {};
    let glucoCategory = glucoData.result?.category || "Unknown";

    if (
      !glucoData.result?.category &&
      Array.isArray(glucoData.result?.probabilities) &&
      glucoData.result.probabilities.length === 3
    ) {
      const probs = glucoData.result.probabilities;
      const idx = probs.indexOf(Math.max(...probs));
      glucoCategory = ["Normal", "Prediabetic", "Diabetic"][idx];
    }

    summary += `
Glucose Health Context:
- Category: ${glucoCategory}
- Age: ${glucoInputs.AGE ?? "Unknown"}
- BMI: ${glucoInputs.BMI ?? "Unknown"}
- Blood sugar: ${glucoInputs.GLU ?? "Unknown"} mg/dL
- High blood pressure: ${glucoInputs.HTN_FLAG === 1 ? "Yes" : "No"}
- Smoking level: ${glucoInputs.SMOKING_IDX ?? 0}
- Physical activity: ${glucoInputs.PA_ANY === 1 ? "Yes" : "No"}
`;
  }

  return summary.trim();
}

export const generateHealthPlan = onCall(
  {
    secrets: [OPENAI_API_KEY],
  },
  async (request) => {
    validateHealthPlanRequest(request.data);

    const { clientId, inputs, type, category, modelOutput } = request.data;

    await checkAndIncrementUsage(clientId, "plan");

    const apiKey = OPENAI_API_KEY.value();
    if (!apiKey) {
      throw new HttpsError("internal", "Missing OpenAI API key.");
    }

    const client = new OpenAI({ apiKey });

    const userDescription = describeInputs(inputs, type);
    const modelSummary = buildModelSummary(type, category, modelOutput);

    const systemPrompt = `
You are a supportive wellness coach inside the HealthLens app.

Your job is to create a short, practical, personalized wellness plan based on the user's health inputs and model result.

Rules:
- Give educational wellness guidance only.
- Do not diagnose, predict certainty, or prescribe medication.
- Do not say the user has a disease.
- Keep the tone calm, encouraging, and clear.
- Focus on the 1 to 3 most relevant lifestyle areas based on the user's profile.
- Avoid generic advice that could apply to anyone.
- Prefer specific actions the user could start this week.
- Use simple language suitable for a general audience.
- Keep the response concise.
- Begin with one short personalized summary sentence before the numbered steps.
- The summary should reflect whether the user should maintain current habits or improve specific areas.
- The numbered steps should focus on the 1 to 2 most relevant themes, not too many unrelated topics.
- Avoid making every plan mostly about exercise unless exercise is clearly the main issue.
- If the result suggests elevated risk, add one short, calm sentence encouraging follow-up with a healthcare professional.
- Do not sound alarming unless dangerous symptoms are explicitly mentioned.

Output format:
- First, 1 short personalized summary sentence.
- Then 3 to 5 numbered action steps.
- Each step should be concrete and specific.
- End with one short follow-up sentence only if appropriate.
- Do not include headings like "Disclaimer" or "Diagnosis".
`;
    const userPrompt = `
Use the information below to write a personalized wellness plan.

${userDescription}
${modelSummary}

Instructions:
- Identify the most important lifestyle patterns that stand out.
- Use the model result category to decide whether the plan should focus on maintaining good habits or making improvements.
- Reference at least one specific feature from the user profile in the summary or steps.
- Prioritize advice that matches this user's actual profile.
- If physical activity is low, include a realistic movement goal.
- If BMI is elevated, focus on sustainable food/activity habits, not weight-shaming.
- If smoking, blood pressure, cholesterol, stress, or high glucose are relevant, address them briefly and practically.
- Avoid repeating the same kind of plan for every user.
- Make the plan feel personalized, not generic.
- Keep the full response brief and useful.
`;

    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt.trim() },
          { role: "user", content: userPrompt.trim() },
        ],
      });

      const text = completion.choices?.[0]?.message?.content?.trim() || "";
      return { plan: text };
    } catch (err) {
      console.error("Health plan error:", err);
      throw new HttpsError("internal", "We couldn’t generate your plan right now. Please try again in a moment.");
    }
  }
);

export const chatHealthCoach = onCall(
  {
    secrets: [OPENAI_API_KEY],
  },
  async (request) => {
    validateChatRequest(request.data);

    const { clientId, message, heartData, glucoData } = request.data;

    await checkAndIncrementUsage(clientId, "chat");

    const apiKey = OPENAI_API_KEY.value();
    if (!apiKey) {
      throw new HttpsError("internal", "Missing OpenAI API key.");
    }

    const client = new OpenAI({ apiKey });
    const healthContext = summarizeStoredHealthData(heartData, glucoData);

    const systemPrompt = `
You are a supportive wellness coach inside the HealthLens app.

Your role is to answer the user's wellness question clearly, briefly, and helpfully.

Rules:
- Give educational wellness guidance only.
- Do not diagnose conditions or prescribe medication.
- Do not overstate risk or sound alarmist.
- Use the user's saved heart or glucose context only when it is relevant to the question.
- If no saved context is relevant, answer the question normally.
- Answer the user's actual question first, without a long introduction.
- Prefer 2 to 4 sentences or a short bullet list.
- Use simple, practical, everyday language.
- Avoid generic filler.
- Avoid repeating the same disclaimer in every reply.
- When the user asks for ideas, examples, meals, foods, or routines, prefer a short bullet list.
- For chat, prefer answers that fit comfortably on a phone screen.
- When giving examples, keep the list short and avoid extra explanation unless needed.
- After giving the direct answer, add at most one short sentence connecting it to the user's saved context when relevant.
- If the user mentions dangerous symptoms or urgent concerns, encourage prompt professional care in a calm way.
`;

    const userPrompt = `
Available Health Context:
${healthContext || "No prior health check data available."}

User Message:
${message}

Instructions:
- Answer the user's question directly.
- If relevant, briefly connect the answer to the available health context.
- Keep the reply compact.
- Keep the reply practical and specific.
- Do not add extra background explanation unless it helps answer the question.
- Avoid generic filler.
`;
    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt.trim() },
          { role: "user", content: userPrompt.trim() },
        ],
      });

      const reply = completion.choices?.[0]?.message?.content?.trim() || "";
      return { reply };
    } catch (err) {
      console.error("Chat coach error:", err);
      throw new HttpsError("internal", "Unable to generate chat response.");
    }
  }
);