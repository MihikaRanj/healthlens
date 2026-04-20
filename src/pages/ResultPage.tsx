import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { runGlucoseModel, runHeartModel } from "../onnxPredictor";

import { useLocation, useHistory } from "react-router-dom";
import { generateHealthAdvice } from "../utils/healthAdvice";
import { fetchCustomHealthPlan } from "../utils/healthAdviceAPI";
import { homeOutline, closeOutline } from "ionicons/icons";
import heartFeatureImportances from "../data/heart_risk_feature_importance.json";
import glucoFeatureImportances from "../data/gluco_risk_feature_importance.json";

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

  const state = location.state;

  const result = useMemo(() => state?.result, [state?.result]);
  const inputs = useMemo<Record<string, number>>(
    () => state?.inputs ?? {},
    [state?.inputs]
  );

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
  const planRef = useRef<HTMLDivElement | null>(null);

  const FEATURE_NAME_MAP: Record<string, string> = {
    AGE: "Age",
    BMI: "Body Mass Index (BMI)",
    SEX_MALE: "Sex",
    HTN_FLAG: "High Blood Pressure",
    SMOKING_IDX: "Smoking Status",
    GLU: "Fasting Blood Sugar",
    PA_ANY: "Physical Activity",
    STRESS_SCORE: "Stress Level",
    PA_INDEX: "Weekly Activity Guideline",
    STRESSxPA: "Stress and Activity Pattern",
    ALC_FLAG: "Heavy Drinking",
    CHOL_FLAG: "High Cholesterol",
    CHOL_SCREEN: "Recent Cholesterol Check",
    EXER_FREQ_WK: "Aerobic Exercise Frequency",
    STRENGTH_FREQ: "Strength Exercise Frequency",
    INSURED_FLAG: "Health Insurance",
    ACTIVITY_TYPE_CODE: "Primary Exercise Type",

    "High Blood Pressure (1=Yes)": "High Blood Pressure",
    "High Cholesterol (1=Yes)": "High Cholesterol",
    "Body Mass Index (BMI)": "Body Mass Index (BMI)",
    "Exercise Frequency (sessions/week)": "Aerobic Exercise Frequency",
    "Strength Exercise Frequency (sessions/week)": "Strength Exercise Frequency",
    "Stress Level (0–30 days)": "Stress Level",
    "Smoker (1=Yes)": "Smoking Status",
    "Physically Active (1=Yes)": "Physical Activity",
    "No Recent Cholesterol Check (1=Yes)": "Recent Cholesterol Check",
    "Has Health Insurance (1=Yes)": "Health Insurance",
    "Heavy Drinking (1=Yes)": "Heavy Drinking",
    "Activity Type Code (1–Walking, 2–Running, 3–Cycling, etc.)":
      "Primary Exercise Type",
  };

  const handleSharePlan = async () => {
    if (!customPlan) return;

    const shareText = `My HealthLens AI Plan\n\n${customPlan}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "HealthLens AI Plan",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("Plan copied to clipboard.");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  useEffect(() => {
    if (!result || !inputs) return;

    const importances =
      result.type === "heart"
        ? heartFeatureImportances
        : result.type === "glucose"
          ? glucoFeatureImportances
          : [];

    const factors = [...importances]
      .sort((a, b) => b.importance_percent - a.importance_percent)
      .map((factor) => {
        let message = "";

        if (result.type === "heart") {
          switch (factor.feature) {
            case "Age":
              if (inputs.AGE >= 55) {
                message =
                  "Age is one of the background factors considered in your heart health result.";
              } else {
                message =
                  "Age is one of the background factors the model uses along with lifestyle and health history.";
              }
              break;

            case "High Blood Pressure":
              if (inputs.HTN_FLAG === 1) {
                message =
                  "Blood pressure appears to be an important part of your current heart health pattern.";
              } else {
                message =
                  "Blood pressure is one of the health factors considered alongside exercise, cholesterol, and stress patterns.";
              }
              break;

            case "High Cholesterol":
              if (inputs.CHOL_FLAG === 1) {
                message =
                  "Cholesterol may be contributing to your result alongside other lifestyle and health factors.";
              } else {
                message =
                  "Cholesterol is one of the health factors included in this heart health estimate.";
              }
              break;

            case "Body Mass Index (BMI)":
              if (inputs.BMI >= 27) {
                message = `Your BMI of ${inputs.BMI.toFixed(
                  1
                )} may be increasing strain on your heart and influencing this result.`;
              } else if (inputs.BMI >= 25) {
                message = `Your BMI of ${inputs.BMI.toFixed(
                  1
                )} is one of the health factors considered in this heart result.`;
              } else {
                message =
                  "Body composition is one of the factors the model considers when estimating heart health patterns.";
              }
              break;

            case "Exercise Frequency (sessions/week)":
              if (inputs.EXER_FREQ_WK < 3) {
                message =
                  "Your current aerobic exercise frequency is lower than the level often associated with stronger heart protection.";
              } else {
                message =
                  "Aerobic exercise frequency is one of the strongest lifestyle factors linked to heart health.";
              }
              break;

            case "Strength Exercise Frequency (sessions/week)":
              if (inputs.STRENGTH_FREQ < 2) {
                message =
                  "Adding regular strength exercise may improve your overall fitness profile and support heart health.";
              } else {
                message =
                  "Strength exercise is one of the habits the model considers as part of overall heart health.";
              }
              break;

            case "Stress Level (0–30 days)":
              if (inputs.STRESS_SCORE > 10) {
                message =
                  "Stress may be playing a bigger role in your result, especially when paired with lower activity levels.";
              } else {
                message =
                  "Stress is one of the lifestyle factors included in this heart health estimate.";
              }
              break;

            case "Smoker":
              if (inputs.SMOKING_IDX === 1) {
                message =
                  "Smoking appears to be contributing to your current heart health risk pattern.";
              } else {
                message =
                  "Smoking status is one of the lifestyle factors the model considers.";
              }
              break;

            case "Physically Active":
              if (inputs.PA_ANY === 0) {
                message =
                  "Your current activity pattern may not be strong enough yet to offset other heart risk factors.";
              } else {
                message =
                  "Physical activity is one of the strongest protective lifestyle factors included in this result.";
              }
              break;

            default:
              break;
          }
        }

        if (result.type === "glucose") {
          switch (factor.feature) {
            case "AGE":
              if (inputs.AGE >= 50) {
                message =
                  "Age is one of the background factors considered in your glucose health result.";
              } else {
                message =
                  "Age is one of the background factors the model uses along with lifestyle and health inputs.";
              }
              break;

            case "BMI":
              if (inputs.BMI >= 25) {
                message = `Your BMI of ${inputs.BMI.toFixed(
                  1
                )} may be affecting how efficiently your body manages blood sugar.`;
              } else {
                message =
                  "Body composition is one of the factors the model considers when estimating glucose health patterns.";
              }
              break;

            case "GLU":
              if (inputs.GLU && inputs.GLU > 100) {
                message = `Your fasting blood sugar value of ${inputs.GLU} mg/dL may be contributing noticeably to this result.`;
              } else if (inputs.GLU) {
                message = `Your fasting blood sugar value of ${inputs.GLU} mg/dL is one of the strongest inputs used in this glucose health result.`;
              }
              break;

            case "HTN_FLAG":
              if (inputs.HTN_FLAG === 1) {
                message =
                  "Blood pressure and glucose health can be connected, so this may be influencing your result.";
              } else {
                message =
                  "Blood pressure is one of the health factors considered alongside glucose and activity patterns.";
              }
              break;

            case "SMOKING_IDX":
              if (inputs.SMOKING_IDX > 0) {
                message =
                  "Smoking may be adding to your glucose-related risk pattern alongside other factors.";
              } else {
                message =
                  "Smoking status is one of the lifestyle factors included in the model.";
              }
              break;

            case "PA_ANY":
              if (inputs.PA_ANY === 0) {
                message =
                  "Your activity level may be affecting how efficiently your body manages blood sugar.";
              } else {
                message =
                  "Physical activity is one of the strongest lifestyle factors linked to healthy blood sugar regulation.";
              }
              break;

            case "SEX_MALE":
              if (inputs.SEX_MALE === 1) {
                message =
                  "Sex is one of several background factors included in the model, together with lifestyle and health inputs.";
              } else {
                message =
                  "Background demographic factors are considered together with lifestyle and health inputs.";
              }
              break;

            default:
              break;
          }
        }

        if (inputs.AGE >= 85 && message) {
          message +=
            " At more advanced ages, screening estimates like this may be less precise, so interpret this result with additional caution.";
        }

        return {
          feature: factor.feature,
          importance: factor.importance_percent,
          message,
        };
      })
      .filter((f) => f.message)
      .slice(0, 3);

    setUserFactors(factors);
  }, [result, inputs]);

  useEffect(() => {
    setCustomPlan("");
  }, [result, inputs]);

  useEffect(() => {
    if (customPlan) {
      setTimeout(() => {
        planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [customPlan]);

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

  useEffect(() => {
    const computeProjection = async () => {
      if (!result || !inputs || !inputs.AGE) return;
      setLoadingProjection(true);

      try {
        const currentAge = inputs.AGE;
        const ages = [currentAge, Math.min(currentAge + 5, 95), Math.min(currentAge + 10, 95)];
        const dataPoints: { year: string; risk: number }[] = [];

        for (const age of ages) {
          const modifiedInputs = { ...inputs, AGE: age };
          let riskProb = 0;

          if (result.type === "heart") {
            const heartRes = await runHeartModel(modifiedInputs);
            riskProb = heartRes.probability ?? 0;
          } else if (result.type === "glucose") {
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
            <IonTitle>Health Result</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <h2 style={{ lineHeight: 1.4 }}>
            No saved result found yet. Complete a Heart Check or Glucose Check first.
          </h2>
          <IonButton expand="block" color="danger" onClick={() => history.push("/")}>
            Go Back
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  const titles: Record<string, string> = {
    heart: "Heart Health Check",
    glucose: "Glucose Health Check",
  };

  let category = result.category || "";
  let probability = result.probability ?? 0;
  let probs: number[] = [];

  if (
    result.type === "glucose" &&
    result.probabilities &&
    result.probabilities.length === 3
  ) {
    probs = result.probabilities;
    const labels = ["Normal", "Prediabetic", "Diabetic"];
    const maxIdx = probs.indexOf(Math.max(...probs));
    category = labels[maxIdx];
    probability = probs[maxIdx];
  }

  const percent = (probability * 100).toFixed(1);

  let color: "success" | "warning" | "danger" = "success";
  if (category === "Moderate" || category === "Prediabetic") color = "warning";
  if (category === "High" || category === "Diabetic") color = "danger";

  const message =
    result.type === "heart"
      ? category === "Low"
        ? "Your answers suggest a lower heart health risk pattern right now. Keep maintaining the healthy habits that are supporting you."
        : category === "Moderate"
          ? "Your answers suggest some heart health risk factors that may be worth improving through lifestyle changes and regular check-ups."
          : "Your answers suggest elevated heart health risk factors. It may help to follow up with a healthcare professional and focus on the areas highlighted below."
      : category === "Normal"
        ? "Your answers suggest a healthy glucose pattern right now. Continuing your current habits can help maintain it."
        : category === "Prediabetic"
          ? "Your answers suggest possible early glucose-related risk factors. Paying attention to food, activity, and weight management may help."
          : "Your answers suggest elevated glucose-related risk factors. Consider following up with a healthcare professional and reviewing the action steps below.";

  const adviceList = generateHealthAdvice(inputs, result.type, category);

  const handleGeneratePlan = async () => {
    if (loadingPlan) return;

    setLoadingPlan(true);

    try {
      const plan = await fetchCustomHealthPlan(inputs, result.type, category, {
        probability: result.probability,
        probabilities: result.probabilities,
        label: result.label,
      });

      setCustomPlan(plan);
    } catch (err: any) {
      const errorCode = err?.code || "";
      const errorMessage = (err?.message || "").toLowerCase();

      if (
        errorCode === "resource-exhausted" ||
        errorCode === "functions/resource-exhausted" ||
        errorMessage.includes("daily ai plan limit")
      ) {
        setCustomPlan(
          "You’ve reached today’s limit of 2 AI plans. You can still use prediction tools and view your results. AI health plan will be available again tomorrow."
        );
      } else {
        console.error("Unexpected AI Plan Error:", err);
        setCustomPlan(
          "We couldn’t generate your plan right now. Please try again in a moment."
        );
      }
    } finally {
      setLoadingPlan(false);
    }
  };


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color={result.type === "heart" ? "danger" : "primary"}>
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
              {titles[result.type]}
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
                <p style={{ fontSize: "1.1rem", marginBottom: "10px" }}>
                  Estimated pattern strength: {percent}%
                </p>
                <IonProgressBar
                  color={color}
                  value={probability}
                  style={{ height: "20px", borderRadius: "10px" }}
                />
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
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>Normal: {((probs[0] ?? 0) * 100).toFixed(1)}%</span>
                  <span>Prediabetic: {((probs[1] ?? 0) * 100).toFixed(1)}%</span>
                  <span>Diabetic: {((probs[2] ?? 0) * 100).toFixed(1)}%</span>
                </div>
              </>
            )}

            <div style={{ marginTop: "18px" }}>
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.55,
                  margin: "0 0 10px 0",
                }}
              >
                {message}
              </p>

              <p
                style={{
                  fontSize: "0.84rem",
                  color: "var(--ion-color-medium)",
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                For wellness guidance only — not medical advice.
              </p>
            </div>
          </IonCardContent>
        </IonCard>

        {userFactors.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Why your result looks this way</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {userFactors.map((f, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "18px",
                    textAlign: "left",
                    paddingBottom: "4px",
                  }}
                >
                  <strong>{FEATURE_NAME_MAP[f.feature] || f.feature}</strong>{" "}
                  <span style={{ color: "#888" }}>({f.importance.toFixed(1)}%)</span>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      marginTop: "6px",
                      marginBottom: "8px",
                      lineHeight: 1.5,
                      color: "#444",
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
                    />
                  </div>
                </div>
              ))}
            </IonCardContent>
          </IonCard>
        )}

        {riskProjection.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>How your risk may change over time</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {loadingProjection ? (
                <IonText>Computing projection...</IonText>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={riskProjection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis
                        domain={[
                          Math.max(0, Math.min(...riskProjection.map((d) => d.risk)) - 5),
                          Math.min(100, Math.max(...riskProjection.map((d) => d.risk)) + 5),
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

                  <IonText color="medium">
                    <p
                      style={{
                        fontSize: "0.84rem",
                        marginTop: "12px",
                        marginBottom: 0,
                        lineHeight: 1.45,
                        textAlign: "left",
                      }}
                    >
                      This estimate shows how your risk pattern may change over time if your
                      current habits and health profile stay similar. It is a screening estimate,
                      not a diagnosis.
                    </p>
                  </IonText>
                </>
              )}
            </IonCardContent>
          </IonCard>
        )}

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>What you can work on next</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <ul
              style={{
                textAlign: "left",
                paddingLeft: "1.2rem",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {adviceList.slice(0, 3).map((tip, i) => (
                <li
                  key={i}
                  style={{
                    marginBottom: "10px",
                    color: "#333",
                  }}
                >
                  {tip}
                </li>
              ))}
            </ul>
          </IonCardContent>
        </IonCard>

        <div
          style={{
            marginTop: "18px",
            marginBottom: "10px",
            padding: "10px 4px 0 4px",
          }}
        >
          <IonText color="medium">
            <p
              style={{
                fontSize: "0.88rem",
                margin: "0 0 6px 0",
                lineHeight: 1.4,
              }}
            >
              You can generate up to 2 AI health plans each day. If you reach the limit, you can still view your results and try again tomorrow.
            </p>
            <p
              style={{
                fontSize: "0.84rem",
                margin: "0 0 12px 0",
                lineHeight: 1.4,
              }}
            >
              This plan is for wellness guidance only and not medical advice.
            </p>
          </IonText>

          <IonButton
            expand="block"
            color="medium"
            onClick={handleGeneratePlan}
            disabled={loadingPlan}
          >
            {loadingPlan ? "Generating AI Plan..." : "✨ Generate AI Health Plan"}
          </IonButton>
        </div>

        {customPlan && (
          <div ref={planRef}>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>AI-Generated Plan</IonCardTitle>
              </IonCardHeader>
              <IonCardContent
                style={{
                  textAlign: "left",
                  whiteSpace: "pre-line",
                  lineHeight: 1.6,
                  fontSize: "0.98rem",
                  color: "#2f2f2f",
                }}
              >
                {customPlan.slice(0, 600)}
                {customPlan.length > 600 ? "..." : ""}
              </IonCardContent>
            </IonCard>
            <IonButton expand="block" fill="outline" onClick={handleSharePlan}>
              Share or Copy Plan
            </IonButton>

            {customPlan.length > 600 && (
              <IonButton expand="block" color="medium" fill="outline" onClick={() => setShowModal(true)}>
                View Full AI Plan
              </IonButton>
            )}

            <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
              <IonHeader translucent>
                <IonToolbar color="danger">
                  <IonTitle>Full AI Health Plan</IonTitle>
                  <IonButtons slot="end">
                    <IonButton
                      onClick={() => setShowModal(false)}
                      style={{
                        background: "rgba(255, 255, 255, 0.18)",
                        borderRadius: "50%",
                        padding: "4px",
                        minWidth: "36px",
                        minHeight: "36px",
                      }}
                    >
                      <IonIcon icon={closeOutline} color="light" slot="icon-only" />
                    </IonButton>
                  </IonButtons>
                </IonToolbar>
              </IonHeader>

              <IonContent className="ion-padding">
                <div
                  style={{
                    whiteSpace: "pre-line",
                    textAlign: "left",
                    lineHeight: 1.65,
                    fontSize: "1rem",
                    color: "#2f2f2f",
                  }}
                >
                  {customPlan}
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "12px",
                    borderTop: "1px solid #e5e5e5",
                  }}
                >
                  <IonText color="medium">
                    <p
                      style={{
                        fontSize: "0.84rem",
                        lineHeight: 1.45,
                        margin: 0,
                      }}
                    >
                      This plan provides general wellness guidance and is not medical advice.
                      For health concerns, consult a healthcare professional.
                    </p>
                  </IonText>
                </div>
              </IonContent>
            </IonModal>
          </div>
        )}
      </IonContent>

      <IonFooter translucent>
        <IonToolbar>
          <IonButton
            expand="block"
            color={result.type === "heart" ? "danger" : "primary"}
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