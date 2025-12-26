export function generateHealthAdvice(
  inputs: Record<string, number>,
  modelType: "heart" | "glucose",
  category: string
): string[] {
  const advice: string[] = [];

  if (modelType === "heart") {
    if (inputs.BMI > 30)
      advice.push("Work toward lowering your BMI below 25 through balanced diet and regular physical activity.");
    if (inputs.PA_ANY === 0)
      advice.push("Start light physical activity — even 20 minutes of brisk walking per day helps your heart.");
    if (inputs.SMOKING_IDX === 1)
      advice.push("Quitting smoking dramatically lowers your heart-disease risk within a few months.");
    if (inputs.HTN_FLAG === 1)
      advice.push("Monitor blood pressure regularly and limit sodium intake to keep it in check.");
    if (inputs.ALC_FLAG === 1)
      advice.push("Try reducing alcohol consumption to improve blood pressure and triglycerides.");
    if (inputs.CHOLESTEROL_FLAG === 1)
      advice.push("Include more fiber (oats, beans) and cut down on saturated fats to manage cholesterol.");

    //Default message based on category
    if (advice.length === 0) {
      if (category === "Low")
        advice.push("Excellent job — maintain your current heart-healthy lifestyle!");
      else if (category === "Moderate")
        advice.push("Your heart risk is moderate — consider improving diet and exercise consistency.");
      else if (category === "High")
        advice.push("Your heart risk is elevated — regular checkups and lifestyle management are essential.");
    }
  }

  if (modelType === "glucose") {
    if (inputs.BMI > 27)
      advice.push("Aim for gradual weight loss (5–10% of body weight) to improve insulin sensitivity.");
    if (inputs.PA_ANY === 0)
      advice.push("Increase daily activity — even short walks after meals help regulate blood sugar.");
    if (inputs.ALC_FLAG === 1)
      advice.push("Limit alcohol to reduce strain on your liver and glucose control.");
    if (inputs.STRESS_SCORE > 5)
      advice.push("Manage stress through breathing exercises, sleep, or mindfulness.");

    //Refined category based guidance
    if (advice.length === 0) {
      if (category === "Normal") {
        advice.push("Great job — maintain your current healthy habits to keep glucose levels steady!");
      } else if (category === "Prediabetic") {
        advice.push("Your glucose levels suggest prediabetes risk. Focus on diet moderation and regular exercise.");
        advice.push("Avoid sugary drinks and refined carbs — aim for high-fiber foods and lean proteins.");
      } else if (category === "Diabetic") {
        advice.push("High diabetes risk detected — please consult a healthcare provider for testing and management.");
        advice.push("Adopt a low-glycemic diet and ensure consistent physical activity.");
      }
    }
  }

  if (advice.length === 0)
    advice.push("Maintain your current healthy habits and schedule regular checkups.");

  return advice;
}
