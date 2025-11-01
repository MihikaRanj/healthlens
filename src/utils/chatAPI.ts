
let chatHistory: { role: "user" | "assistant"; content: string }[] = [];

/*Reset chat history when needed*/
export function clearChatHistory() {
  chatHistory = [];
}

/* Chatbot API call with session memory*/
export async function fetchChatReply(
  userMessage: string,
  heartData?: any,
  glucoData?: any
): Promise<string> {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY as string;

  if (!apiKey) {
    console.error("Missing API key!");
    return "Unable to connect to AI service. Please check configuration.";
  }

  const fmt = (v: any) => (typeof v === "number" && !isNaN(v) ? v : "Unknown");

  let contextSummary = "";

  if (heartData?.result || glucoData?.result) contextSummary += "### User Health Summary\n";

  if (heartData?.result) {
    const h = heartData.inputs || {};
    const hr = heartData.result;
    const heartCategory =
      hr.category ||
      (typeof hr.probability === "number"
        ? hr.probability < 0.33
          ? "Low"
          : hr.probability < 0.66
          ? "Moderate"
          : "High"
        : "Unknown");

    contextSummary += `
❤️ **Heart Risk**
- Category: ${heartCategory}
- Probability: ${(hr.probability * 100 || 0).toFixed(1)}%
- Age: ${fmt(h.AGE)}, BMI: ${fmt(h.BMI)}, Hypertension: ${h.HTN_FLAG === 1 ? "Yes" : "No"}, Active: ${h.PA_ANY === 1 ? "Yes" : "No"}
`;
  }

  if (glucoData?.result) {
    const g = glucoData.inputs || {};
    const gr = glucoData.result;
    const probs = gr.probabilities || [];
    const glucoCategory =
      gr.category ||
      (Array.isArray(probs) && probs.length === 3
        ? ["Normal", "Prediabetic", "Diabetic"][probs.indexOf(Math.max(...probs))]
        : "Unknown");

    contextSummary += `
🩸 **Glucose Risk**
- Category: ${glucoCategory}
- Glucose: ${fmt(g.GLU)} mg/dL, BMI: ${fmt(g.BMI)}, Age: ${fmt(g.AGE)}, Active: ${
      g.PA_ANY === 1 ? "Yes" : "No"
    }
`;
  }

  const systemPrompt = `
You are a friendly, empathetic health coach.
You give concise, evidence-based lifestyle advice for diet, exercise, sleep, and stress.
You NEVER diagnose or give medical treatment plans.
You remember the current conversation and reference earlier topics when relevant (e.g. "As I mentioned earlier").
Keep replies under 5 sentences unless user asks for detailed lists.
`;

  chatHistory.push({ role: "user", content: userMessage });

  if (chatHistory.length > 8) chatHistory = chatHistory.slice(-8);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: contextSummary || "No recent health data found." },
    ...chatHistory,
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API error:", data);
      return "Sorry, I'm having trouble right now. Please try again.";
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || "Hmm, could you repeat that?";
    console.log("Chat reply:", reply);

    chatHistory.push({ role: "assistant", content: reply });

    return reply;
  } catch (err) {
    console.error("Chat error:", err);
    return "There was an issue connecting to the AI service.";
  }
}
