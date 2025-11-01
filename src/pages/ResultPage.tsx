import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonProgressBar,
  IonButtons,
  IonIcon,
  IonModal,
  IonText,
  IonFooter,
} from "@ionic/react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { runGlucoseModel } from "../onnxPredictor";
import { runHeartModel } from "../onnxPredictor";


import { useLocation, useHistory } from "react-router-dom";
import { generateHealthAdvice } from "../utils/healthAdvice";
import { fetchCustomHealthPlan } from "../utils/healthAdviceAPI";
import { homeOutline } from "ionicons/icons";
import heartFeatureImportances from "../data/heart_risk_feature_importance.json";
import glucoFeatureImportances from "../data/gluco_risk_feature_importance.json";


import { closeOutline } from "ionicons/icons";

interface ModelResult {
  type: "heart" | "glucose";
  probability?: number;
  label?: number | null;
  probs?: number[];
  probabilities?: number[];
  category?: string;
}

const ResultPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ result: ModelResult; inputs: Record<string, number> }>();
  const result = location.state?.result;
  const inputs = location.state?.inputs || {};

  const [customPlan, setCustomPlan] = useState<string>("");
  const [loadingPlan, setLoadingPlan] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);

  const [userFactors, setUserFactors] = useState<
    { feature: string; importance: number; message: string }[]
  >([]);

  const [riskProjection, setRiskProjection] = useState<
    { year: string; risk: number }[]
  >([]);
  const [loadingProjection, setLoadingProjection] = useState(false);

  // Adding yser friendly display names for model features
  const FEATURE_NAME_MAP: Record<string, string> = {
    AGE: "Age",
    BMI: "Body Mass Index (BMI)",
    SEX_MALE: "Sex (Male)",
    HTN_FLAG: "High Blood Pressure",
    SMOKING_IDX: "Smoking Status",
    GLU: "Fasting Glucose (mg/dL)",
    PA_ANY: "Physically Active",
    STRESS_SCORE: "Stress Level",
    PA_INDEX: "Physical Activity Index",
    STRESSxPA: "Stress × Activity Interaction",
    ALC_FLAG: "Heavy Drinking",
    CHOL_FLAG: "High Cholesterol",
    CHOL_SCREEN: "No Recent Cholesterol Check",
    EXER_FREQ_WK: "Exercise Frequency",
    STRENGTH_FREQ: "Strength Exercise Frequency",
    INSURED_FLAG: "Health Insurance",
    ACTIVITY_TYPE_CODE: "Activity Type Code",

    "High Blood Pressure (1=Yes)": "High Blood Pressure",
    "High Cholesterol (1=Yes)": "High Cholesterol",
    "Body Mass Index (BMI)": "Body Mass Index (BMI)",
    "Exercise Frequency (sessions/week)": "Exercise Frequency",
    "Strength Exercise Frequency (sessions/week)": "Strength Exercise Frequency",
    "Stress Level (0–30 days)": "Stress Level",
    "Smoker (1=Yes)": "Smoker",
    "Physically Active (1=Yes)": "Physically Active",
    "No Recent Cholesterol Check (1=Yes)": "No Recent Cholesterol Check",
    "Has Health Insurance (1=Yes)": "Has Health Insurance",
    "Heavy Drinking (1=Yes)": "Heavy Drinking",
    "Activity Type Code (1–Walking, 2–Running, 3–Cycling, etc.)":
      "Primary Activity Type",
  };




  // Generate personalized feature insights for both Heart and Glucose Models
  useEffect(() => {
    if (!result || !inputs) return;

    const importances =
      result.type === "heart"
        ? heartFeatureImportances
        : result.type === "glucose"
          ? glucoFeatureImportances
          : [];

    const factors = importances
      .sort((a, b) => b.importance_percent - a.importance_percent)
      .slice(0, 6)
      .map((factor) => {
        let message = "";

        if (result.type === "heart") {
          switch (factor.feature) {
            case "Age":
              if (inputs.AGE > 50)
                message = "Older age increases cardiovascular risk.";
              break;
            case "High Blood Pressure":
              if (inputs.HTN_FLAG === 1)
                message = "Managing blood pressure can reduce heart strain.";
              break;
            case "High Cholesterol":
              if (inputs.CHOL_FLAG === 1)
                message = "High cholesterol may cause plaque buildup in arteries.";
              break;
            case "Body Mass Index (BMI)":
              if (inputs.BMI > 25)
                message = `Your BMI of ${inputs.BMI.toFixed(
                  1
                )} suggests weight management could improve heart health.`;
              break;
            case "Exercise Frequency (sessions/week)":
              if (inputs.EXER_FREQ_WK < 3)
                message =
                  "Aim for at least 3 sessions of aerobic activity per week.";
              break;
            case "Strength Exercise Frequency (sessions/week)":
              if (inputs.STRENGTH_FREQ < 2)
                message =
                  "Add strength training twice weekly to support cardiovascular fitness.";
              break;
            case "Stress Level (0–30 days)":
              if (inputs.STRESS_SCORE > 10)
                message =
                  "High stress can affect heart rhythm; consider mindfulness or relaxation exercises.";
              break;
            case "Smoker":
              if (inputs.SMOKING_IDX === 1)
                message =
                  "Smoking greatly increases cardiovascular risk — quitting helps within weeks.";
              break;
            case "Physically Active":
              if (inputs.PA_ANY === 0)
                message = "Being more active significantly improves heart health.";
              break;
            default:
              break;
          }
        }

        if (result.type === "glucose") {
          switch (factor.feature) {
            case "AGE":
              if (inputs.AGE > 50)
                message =
                  "Risk of insulin resistance tends to rise with age. Maintain active lifestyle.";
              break;
            case "BMI":
              if (inputs.BMI > 25)
                message = `Your BMI of ${inputs.BMI.toFixed(
                  1
                )} suggests that even small weight loss can improve glucose control.`;
              break;
            case "GLU":
              if (inputs.GLU && inputs.GLU > 100)
                message = `Fasting glucose ${inputs.GLU} mg/dL is slightly elevated — consider monitoring diet and sugar intake.`;
              break;
            case "HTN_FLAG":
              if (inputs.HTN_FLAG === 1)
                message =
                  "High blood pressure can worsen insulin resistance and diabetes risk.";
              break;
            case "SMOKING_IDX":
              if (inputs.SMOKING_IDX > 0)
                message =
                  "Smoking increases inflammation and risk of developing diabetes.";
              break;
            case "PA_ANY":
              if (inputs.PA_ANY === 0)
                message =
                  "Regular activity improves insulin sensitivity and helps manage glucose.";
              break;
            case "SEX_MALE":
              if (inputs.SEX_MALE === 1)
                message =
                  "Men have slightly higher diabetes risk; regular screening is advised.";
              break;
            default:
              break;
          }
        }

        return {
          feature: factor.feature,
          importance: factor.importance_percent,
          message,
        };
      })
      .filter((f) => f.message);

    setUserFactors(factors);
  }, [result, inputs]);


  useEffect(() => {
    setCustomPlan("");
  }, [result, inputs]);

  useEffect(() => {
    if (result && inputs && Object.keys(inputs).length > 0) {
      const dataToSave = { inputs, result };

      if (result.type === "heart") {
        localStorage.setItem("heartRiskData", JSON.stringify(dataToSave));
      } else if (result.type === "glucose") {
        localStorage.setItem("glucoRiskData", JSON.stringify(dataToSave));
      }

      const summary = {
        heart: JSON.parse(localStorage.getItem("heartRiskData") || "null"),
        glucose: JSON.parse(localStorage.getItem("glucoRiskData") || "null"),
      };
      localStorage.setItem("healthSummary", JSON.stringify(summary));
    }
  }, [result, inputs]);

  // Calculate 5-year and 10-year risk projections using ONNX models
  useEffect(() => {
    const computeProjection = async () => {
      if (!result || !inputs || !inputs.AGE) return;
      setLoadingProjection(true);

      try {
        const currentAge = inputs.AGE;
        const ages = [currentAge, currentAge + 5, currentAge + 10];
        const dataPoints: { year: string; risk: number }[] = [];

        for (const age of ages) {
          const modifiedInputs = { ...inputs, AGE: age };
          let riskProb = 0;

          if (result.type === "heart") {
            // Heart model expects a Record<string, number>
            const heartRes = await runHeartModel(modifiedInputs);
            riskProb = heartRes.probability ?? 0;
          } else if (result.type === "glucose") {
            // Glucose model expects a numeric array in specific order
            const featureOrder = [
              "AGE",
              "BMI",
              "SEX_MALE",
              "HTN_FLAG",
              "SMOKING_IDX",
              "GLU",
              "PA_ANY",
            ];

            const modInputs = modifiedInputs as Record<string, number>;
            const inputArray = featureOrder.map((f) =>
              isNaN(Number(modInputs[f])) ? 0 : Number(modInputs[f])
            );

            const gluRes = await runGlucoseModel(inputArray);
            if (gluRes.probabilities && gluRes.probabilities.length >= 3) {
              riskProb = gluRes.probabilities[2];
            }

          }

          dataPoints.push({
            year: age === currentAge ? "Current" : `Age ${age}`,
            risk: +(riskProb * 100).toFixed(1),
          });
        }

        setRiskProjection(dataPoints);
        console.log("Projection data:", dataPoints);
      } catch (err) {
        console.error("Projection Error:", err);
      } finally {
        setLoadingProjection(false);
      }
    };

    computeProjection();
  }, [result, inputs]);


  if (!result) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="danger">
            <IonTitle>Prediction Result</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <h2>No result found. Please run the prediction again.</h2>
          <IonButton expand="block" color="danger" onClick={() => history.push("/")}>
            Go Back
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  const titles: Record<string, string> = {
    heart: "Heart Disease Risk",
    glucose: "Diabetes Risk",
  };

  let category = result.category || "";
  let probability = result.probability ?? 0;
  let probs: number[] = [];

  if (result.type === "glucose" && result.probabilities && result.probabilities.length === 3) {
    probs = result.probabilities;
    const labels = ["Normal", "Prediabetic", "Diabetic"];
    const maxIdx = probs.indexOf(Math.max(...probs));
    category = labels[maxIdx];
    probability = probs[maxIdx]; // show highest probability as summary value
  }

  const percent = (probability * 100).toFixed(1);

  let color: "success" | "warning" | "danger" = "success";
  if (category === "Moderate" || category === "Prediabetic") color = "warning";
  if (category === "High" || category === "Diabetic") color = "danger";

  const message =
    result.type === "heart"
      ? category === "Low"
        ? "Great job! Your predicted heart disease risk is low. Keep maintaining a healthy lifestyle!"
        : category === "Moderate"
          ? "Your predicted heart risk is moderate. Consider regular check-ups and staying active."
          : "Your predicted heart disease risk is high. Please consult a healthcare provider for further evaluation."
      : category === "Normal"
        ? "Your predicted glucose level is within a healthy range!"
        : category === "Prediabetic"
          ? "You may be at risk for prediabetes. Watch your diet and activity level closely."
          : "High diabetes risk detected. Consider consulting your doctor for tests and lifestyle adjustments.";

  const adviceList = generateHealthAdvice(inputs, result.type, category);

  const handleGeneratePlan = async () => {
    setLoadingPlan(true);
    try {
      const plan = await fetchCustomHealthPlan(inputs, result.type, category, {
        probability: result.probability,
        probabilities: result.probabilities,
        label: result.label,
      });

      setCustomPlan(plan);
    } catch (err) {
      console.error("AI Plan Error:", err);
      setCustomPlan("There was an issue generating your AI plan. Please try again.");
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle slot="primary">{titles[result.type]}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/")}>
              <IonIcon icon={homeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding ion-text-center">
        <IonCard className="ion-padding">
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
              Predicted {titles[result.type]}
            </IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            <h1
              style={{
                fontSize: "2.5rem",
                margin: "10px 0",
                color: `var(--ion-color-${color})`,
              }}
            >
              {category}
            </h1>

            {result.type === "heart" && (
              <>
                <p style={{ fontSize: "1.2rem", marginBottom: "10px" }}>
                  {percent}% probability
                </p>
                <IonProgressBar
                  color={color}
                  value={probability}
                  style={{ height: "20px", borderRadius: "10px" }}
                ></IonProgressBar>
              </>
            )}

            {result.type === "glucose" && probs.length === 3 && (
              <>
                <h3
                  style={{
                    marginTop: "10px",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  Probability Breakdown
                </h3>

                {/* Stacked bar */}
                <div
                  style={{
                    display: "flex",
                    height: "24px",
                    width: "100%",
                    borderRadius: "10px",
                    overflow: "hidden",
                    marginTop: "6px",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      flex: probs[0],
                      backgroundColor: "var(--ion-color-success)",
                      transition: "flex 0.6s ease-in-out",
                    }}
                    title={`Normal: ${(probs[0] * 100).toFixed(1)}%`}
                  />
                  <div
                    style={{
                      flex: probs[1],
                      backgroundColor: "var(--ion-color-warning)",
                      transition: "flex 0.6s ease-in-out",
                    }}
                    title={`Prediabetic: ${(probs[1] * 100).toFixed(1)}%`}
                  />
                  <div
                    style={{
                      flex: probs[2],
                      backgroundColor: "var(--ion-color-danger)",
                      transition: "flex 0.6s ease-in-out",
                    }}
                    title={`Diabetic: ${(probs[2] * 100).toFixed(1)}%`}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.9rem",
                    color: "gray",
                    marginTop: "4px",
                  }}
                >
                  <span>Normal: {((probs?.[0] ?? 0) * 100).toFixed(1)}%</span>
                  <span>Prediabetic: {((probs?.[1] ?? 0) * 100).toFixed(1)}%</span>
                  <span>Diabetic: {((probs?.[2] ?? 0) * 100).toFixed(1)}%</span>
                </div>
              </>
            )}

            <p style={{ marginTop: "20px", fontSize: "1rem", lineHeight: 1.4 }}>
              {message}
            </p>
          </IonCardContent>
        </IonCard>

        {/*Personalized Factor Insights */}
        {userFactors.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Key Factors Affecting Your Risk</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {userFactors.map((f, i) => (
                <div key={i} style={{ marginBottom: "14px" }}>
                  <strong>{FEATURE_NAME_MAP[f.feature] || f.feature}</strong>{" "}
                  <span style={{ color: "#888" }}>
                    ({f.importance.toFixed(1)}%)
                  </span>
                  <p
                    style={{
                      fontSize: "0.9em",
                      marginTop: "4px",
                      marginBottom: "4px",
                    }}
                  >
                    {f.message}
                  </p>
                  <div
                    style={{
                      background: "#eee",
                      height: "6px",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${f.importance}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #ff9d00, #ff3c00)",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </IonCardContent>
          </IonCard>
        )}

        {riskProjection.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                Projected {result.type === "heart" ? "Heart" : "Diabetes"} Risk Over Time
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {loadingProjection ? (
                <IonText>Computing projection...</IonText>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={riskProjection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis
                      domain={[
                        Math.max(
                          0,
                          Math.min(...riskProjection.map((d) => d.risk)) - 5
                        ),
                        Math.min(
                          100,
                          Math.max(...riskProjection.map((d) => d.risk)) + 5
                        ),
                      ]}
                      label={{
                        value: "Risk (%)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                      tickFormatter={(v) => v.toFixed(1)}
                    />

                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="risk"
                      stroke={
                        result.type === "heart"
                          ? "var(--ion-color-danger)"
                          : "var(--ion-color-warning)"
                      }
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </IonCardContent>
          </IonCard>
        )}


        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Your Personalized Plan</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <ul style={{ textAlign: "left", marginLeft: "10px" }}>
              {adviceList.map((tip, i) => (
                <li key={i} style={{ marginBottom: "8px" }}>
                  {tip}
                </li>
              ))}
            </ul>
          </IonCardContent>
        </IonCard>

        <IonButton
          expand="block"
          color="medium"
          onClick={handleGeneratePlan}
          disabled={loadingPlan}
        >
          {loadingPlan ? "Generating AI Plan..." : "✨ Generate AI Health Plan"}
        </IonButton>

        {customPlan && (
          <>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>AI-Generated Plan</IonCardTitle>
              </IonCardHeader>
              <IonCardContent style={{ textAlign: "left", whiteSpace: "pre-line" }}>
                {customPlan.slice(0, 600)}{customPlan.length > 600 ? "..." : ""}
              </IonCardContent>
            </IonCard>

            {customPlan.length > 600 && (
              <IonButton expand="block" color="medium" onClick={() => setShowModal(true)}>
                📜 View Full AI Plan
              </IonButton>
            )}

            {/* Modal for Full Plan */}
            <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
              <IonHeader translucent>
                <IonToolbar color="danger">
                  <IonTitle slot="primary">Full AI Health Plan</IonTitle>
                  <IonButtons slot="end">
                    <IonButton
                      onClick={() => setShowModal(false)}
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        borderRadius: "50%",
                        padding: "4px",
                      }}
                    >
                      <IonIcon icon={closeOutline} color="light" slot="icon-only" />
                    </IonButton>
                  </IonButtons>



                </IonToolbar>
              </IonHeader>


              <IonContent className="ion-padding">
                <IonText style={{ whiteSpace: "pre-line", textAlign: "left" }}>
                  {customPlan}
                </IonText>
                <IonText color="medium" style={{ display: "block", marginTop: "1.5rem", fontSize: "0.85rem" }}>
                  This app uses AI models trained on public health datasets (e.g., NHANES, BRFSS)
                  to estimate potential health risks and provide lifestyle suggestions.
                  It is <strong>not a substitute for professional medical advice,
                    diagnosis, or treatment.</strong> Always consult your doctor or a qualified
                  healthcare provider with any questions you may have regarding a medical condition.
                </IonText>
              </IonContent>
            </IonModal>
          </>
        )}

      </IonContent>
      <IonFooter translucent={true}>
        <IonToolbar>
          <IonButton
            expand="block"
            color="danger"
            onClick={() => {
              setCustomPlan("");
              history.push(result.type === "heart" ? "/heart" : "/gluco");
            }}
          >
            Try Again
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default ResultPage;
