function describeInputs(inputs: Record<string, number>, type: "heart" | "glucose"): string {
  const activityMap: Record<number, string> = {
    1: "Walking",
    2: "Running",
    3: "Cycling",
    4: "Strength Training",
    5: "Yoga",
    6: "Other Activity",
  };

  if (type === "heart") {
    return `
User Profile:
- Age: ${inputs.AGE ?? "Unknown"} years old
- BMI: ${inputs.BMI ?? "Unknown"} kg/m²
- Sex: ${inputs.SEX_MALE === 1 ? "Male" : "Female"}
- Physical Activity (any in last 30 days): ${inputs.PA_ANY === 1 ? "Yes" : "No"}
- Meets 150-min/week Activity Guideline: ${inputs.PA_INDEX === 1 ? "Yes" : "No"}
- Smoking: ${inputs.SMOKING_IDX === 1 ? "Smoker" : "Non-smoker"}
- Hypertension (high blood pressure): ${inputs.HTN_FLAG === 1 ? "Yes" : "No"}
- Stress: ${inputs.STRESS_SCORE ?? 0} days of poor mental health in past 30 days
- Alcohol Use: ${inputs.ALC_FLAG === 1 ? "Heavy drinker" : "No heavy drinking"}
- Cholesterol: ${inputs.CHOL_FLAG === 1 ? "High cholesterol" : "Normal"}
- Cholesterol Screening: ${inputs.CHOL_SCREEN === 1 ? "Not checked recently" : "Checked recently"}
- Aerobic Exercise Sessions per Week: ${inputs.EXER_FREQ_WK ?? 0}
- Strength Training Sessions per Week: ${inputs.STRENGTH_FREQ ?? 0}
- Health Insurance Coverage: ${inputs.INSURED_FLAG === 1 ? "Yes" : "No"}
- Primary Activity Type: ${activityMap[inputs.ACTIVITY_TYPE_CODE] || "None / Unknown"}
`;
  } else {
    return `
User Profile:
- Age: ${inputs.AGE ?? "Unknown"} years old
- BMI: ${inputs.BMI ?? "Unknown"} kg/m²
- Sex: ${inputs.SEX_MALE === 1 ? "Male" : "Female"}
- Hypertension (high blood pressure): ${inputs.HTN_FLAG === 1 ? "Yes" : "No"}
- Fasting Glucose Level: ${inputs.GLU ?? "Unknown"} mg/dL
- Smoking level: ${
      inputs.SMOKING_IDX === 0
        ? "Non-smoker"
        : inputs.SMOKING_IDX === 1
        ? "Occasional smoker"
        : inputs.SMOKING_IDX === 2
        ? "Regular smoker"
        : "Heavy smoker"
    }
- Physically Active: ${inputs.PA_ANY === 1 ? "Yes" : "No"}
`;
  }
}

//Make call to OpenAI API
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
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY as string;

  if (!apiKey) {
    console.error("Missing API key! Add REACT_APP_OPENAI_API_KEY to your .env file.");
    return "Unable to connect to AI service. Please check configuration.";
  }

  const userDescription = describeInputs(inputs, type);

  let modelSummary = "";

  if (type === "heart") {
    const probPercent = (modelOutput?.probability ?? 0) * 100;
    modelSummary = `\nModel Output Summary:
- Predicted Heart Risk Category: ${category}
- Predicted Probability: ${probPercent.toFixed(1)}%
- The probability represents the likelihood of having heart disease based on the input health data.`;
  } else if (type === "glucose") {
    const probs = modelOutput?.probabilities ?? [];
    if (probs.length === 3) {
      modelSummary = `\nModel Output Summary:
- Diabetes Probability Breakdown:
  • Normal: ${(probs[0] * 100).toFixed(1)}%
  • Prediabetic: ${(probs[1] * 100).toFixed(1)}%
  • Diabetic: ${(probs[2] * 100).toFixed(1)}%
- Predicted Risk Category: ${category}
- The model predicts your current glucose-related condition using age, BMI, glucose, hypertension, smoking, and activity level.`;
    }
  }

  const systemPrompt = `You are a certified health coach providing safe, non-diagnostic lifestyle advice.
Return a short, numbered action plan (3–6 points) tailored to the user’s health profile and predicted risk category. 
Be specific and actionable (diet, exercise, habits, etc.) but avoid medical prescriptions.`;

  const userPrompt = `
${userDescription}
${modelSummary}

Health Model Type: ${type === "heart" ? "Heart Disease Risk" : "Diabetes Risk"}
Predicted Category: ${category}

Create a personalized plan to help improve their health profile, 
reduce future risk, and explain briefly how their current metrics influence your recommendations.`;

  console.log("Sending to OpenAI with prompt:\n", userPrompt);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("API Error:", data);
    return "AI service error. Please try again later.";
  }

  const plan = data?.choices?.[0]?.message?.content?.trim();
  console.log("AI plan:", plan);

  return plan || "Unable to generate plan. Please try again.";
}
