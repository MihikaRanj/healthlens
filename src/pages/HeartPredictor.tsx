import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonButton,
  IonList,
  IonIcon,
  IonButtons,
  IonFooter,
  IonText,
  IonRadioGroup,
  IonRadio,
} from "@ionic/react";
import { homeOutline, refreshOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { runHeartModel } from "../onnxPredictor";

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1.05rem",
  fontWeight: 700,
  marginTop: "18px",
  marginBottom: "8px",
};

const helperTextStyle: React.CSSProperties = {
  fontSize: "0.84rem",
  marginTop: "4px",
  marginBottom: "10px",
  lineHeight: 1.35,
};

const HeartPredictor: React.FC = () => {
  const history = useHistory();

  const savedData = JSON.parse(localStorage.getItem("heartFormData") || "{}");

  const [age, setAge] = useState<number>(savedData.AGE || 0);
  const [heightFt, setHeightFt] = useState<number>(savedData.heightFt || 0);
  const [heightIn, setHeightIn] = useState<number>(savedData.heightIn || 0);
  const [weight, setWeight] = useState<number>(savedData.weight || 0);
  const [unit, setUnit] = useState<"kg" | "lb">(savedData.unit || "kg");
  const [bmi, setBmi] = useState<number>(savedData.BMI || 0);
  const [gender, setGender] = useState<string>(savedData.gender || "male");


  const [paAny, setPaAny] = useState<number>(
    savedData.PA_ANY === 1 || savedData.PA_ANY === 2 ? savedData.PA_ANY : 1
  );

  const [paIndex, setPaIndex] = useState<number>(
    savedData.PA_INDEX === 1 || savedData.PA_INDEX === 2 ? savedData.PA_INDEX : 1
  );

  const [activityType, setActivityType] = useState<number>(
    [1, 2, 3, 4, 10, 11].includes(savedData.ACTIVITY_TYPE_CODE)
      ? savedData.ACTIVITY_TYPE_CODE
      : 1
  );
  const [exerFreq, setExerFreq] = useState<number>(savedData.EXER_FREQ_WK || 0);
  const [strengthFreq, setStrengthFreq] = useState<number>(
    savedData.STRENGTH_FREQ || 0
  );
  const [insured, setInsured] = useState<boolean>(savedData.INSURED_FLAG === 1);
  const [smoking, setSmoking] = useState<boolean>(savedData.SMOKING_IDX === 1);
  const [htn, setHtn] = useState<boolean>(savedData.HTN_FLAG === 1);
  const [chol, setChol] = useState<boolean>(savedData.CHOL_FLAG === 1);
  const [cholScreen, setCholScreen] = useState<boolean>(
    savedData.CHOL_SCREEN === 0
  );
  const [alc, setAlc] = useState<boolean>(savedData.ALC_FLAG === 1);
  const [stress, setStress] = useState<number>(savedData.STRESS_SCORE || 0);

  useEffect(() => {
    if (heightFt && weight) {
      const hMeters = ((heightFt * 12 + (heightIn || 0)) * 2.54) / 100;
      const wKg = unit === "lb" ? weight * 0.453592 : weight;
      if (hMeters > 0) {
        setBmi(parseFloat((wKg / (hMeters * hMeters)).toFixed(1)));
      }
    } else {
      setBmi(0);
    }
  }, [heightFt, heightIn, weight, unit]);

  useEffect(() => {
    const formData = {
      AGE: age,
      heightFt,
      heightIn,
      weight,
      unit,
      BMI: bmi,
      gender,
      PA_ANY: paAny,
      PA_INDEX: paIndex,
      ACTIVITY_TYPE_CODE: activityType,
      EXER_FREQ_WK: exerFreq,
      STRENGTH_FREQ: strengthFreq,
      INSURED_FLAG: insured ? 1 : 0,
      SMOKING_IDX: smoking ? 1 : 0,
      HTN_FLAG: htn ? 1 : 0,
      CHOL_FLAG: chol ? 1 : 0,
      CHOL_SCREEN: cholScreen ? 0 : 1,
      ALC_FLAG: alc ? 1 : 0,
      STRESS_SCORE: stress || 0,
    };

    localStorage.setItem("heartFormData", JSON.stringify(formData));
  }, [
    age,
    heightFt,
    heightIn,
    weight,
    unit,
    bmi,
    gender,
    paAny,
    paIndex,
    activityType,
    exerFreq,
    strengthFreq,
    insured,
    smoking,
    htn,
    chol,
    cholScreen,
    alc,
    stress,
  ]);

  const handleClear = () => {
    if (!window.confirm("Clear all entered information?")) return;
    localStorage.removeItem("heartFormData");
    localStorage.removeItem("heartRiskData");

    const summary = JSON.parse(localStorage.getItem("healthSummary") || "{}");
    if (summary.heart) {
      delete summary.heart;
      localStorage.setItem("healthSummary", JSON.stringify(summary));
    }

    setAge(0);
    setHeightFt(0);
    setHeightIn(0);
    setWeight(0);
    setUnit("kg");
    setBmi(0);
    setGender("male");
    setPaAny(1);
    setPaIndex(1);
    setActivityType(1);
    setExerFreq(0);
    setStrengthFreq(0);
    setInsured(true);
    setSmoking(false);
    setHtn(false);
    setChol(false);
    setCholScreen(true);
    setAlc(false);
    setStress(0);
  };

  const handlePredict = async () => {
    const safe = (v: number | undefined, fallback = 0) =>
      isNaN(Number(v)) ? fallback : Number(v);

    if (
      !age ||
      !heightFt ||
      !weight ||
      bmi <= 0 ||
      gender === "" ||
      paAny === undefined ||
      paIndex === undefined
    ) {
      alert("Please fill all required fields before continuing.");
      return;
    }

    const STRESS_SCORE = safe(stress, 0);
    const ALC_FLAG = alc ? 1 : 0;
    const CHOL_FLAG = chol ? 1 : 0;
    const CHOL_SCREEN = cholScreen ? 0 : 1;
    const EXER_FREQ_WK = safe(exerFreq, 2);
    const STRENGTH_FREQ = safe(strengthFreq, 1);
    const INSURED_FLAG = insured ? 1 : 0;
    const ACTIVITY_TYPE_CODE = safe(activityType, 1);

    const SEX_MALE = gender === "male" ? 1 : 0;
    const HTN_FLAG = htn ? 1 : 0;
    const SMOKING_IDX = smoking ? 1 : 0;
    const PA_ANY = paAny === 1 ? 1 : 0;
    const PA_INDEX = paIndex === 1 ? 1 : 0;
    const STRESSxPA = STRESS_SCORE * (1 - PA_ANY);

    const inputMap: Record<string, number> = {
      AGE: safe(age),
      BMI: safe(bmi),
      PA_ANY,
      SMOKING_IDX,
      HTN_FLAG,
      STRESS_SCORE,
      PA_INDEX,
      STRESSxPA,
      ALC_FLAG,
      CHOL_FLAG,
      CHOL_SCREEN,
      EXER_FREQ_WK,
      STRENGTH_FREQ,
      INSURED_FLAG,
      ACTIVITY_TYPE_CODE,
      SEX_MALE,
    };

    //console.log("Heart model input:", inputMap);

    try {
      const result = await runHeartModel(inputMap);

      const riskData = { inputs: inputMap, result: { ...result, type: "heart" } };
      localStorage.setItem("heartRiskData", JSON.stringify(riskData));

      const summary = JSON.parse(localStorage.getItem("healthSummary") || "{}");
      summary.heart = riskData;
      localStorage.setItem("healthSummary", JSON.stringify(summary));

      history.push("/result", {
        result: { ...result, type: "heart" },
        inputs: inputMap,
      });
    } catch (err) {
      console.error("Heart Model Error:", err);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonButtons slot="start">
            <IonButton onClick={handleClear}>
              <IonIcon icon={refreshOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>

          <IonTitle slot="primary">Heart Check</IonTitle>

          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/")}>
              <IonIcon icon={homeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h2 className="ion-text-center" style={{ marginBottom: "8px" }}>
          Tell us about your health and habits
        </h2>


        <IonText color="medium">
          <p
            style={{
              textAlign: "center",
              marginBottom: "18px",
              lineHeight: 1.45,
              fontSize: "0.95rem",
            }}
          >
            Answer a few questions about your activity, health, and habits to
            explore your heart health risk pattern.
          </p>
        </IonText>

        <IonText color="medium">
          <p
            style={{
              fontSize: "0.82rem",
              marginTop: "0",
              marginBottom: "8px",
              lineHeight: 1.2,
            }}
          >
            * Required fields
          </p>
        </IonText>

        <div style={sectionTitleStyle}>Basic Information</div>

        <IonList>
          <IonItem>
            <IonLabel position="stacked">Age (years) *</IonLabel>
            <IonInput
              type="number"
              value={age}
              onIonChange={(e) => setAge(Number(e.detail.value))}
            />
          </IonItem>
          <div style={{ display: "flex", gap: "10px" }}>
            <IonItem lines="none" style={{ flex: 1 }}>
              <IonLabel position="stacked">Height (ft) *</IonLabel>
              <IonInput
                type="number"
                value={heightFt}
                onIonChange={(e) => setHeightFt(Number(e.detail.value))}
                style={{ borderBottom: "1px solid #d9d9d9" }}
              />
            </IonItem>

            <IonItem lines="none" style={{ flex: 1 }}>
              <IonLabel position="stacked">Height (in)</IonLabel>
              <IonInput
                type="number"
                value={heightIn}
                onIonChange={(e) => setHeightIn(Number(e.detail.value))}
                style={{ borderBottom: "1px solid #d9d9d9" }}
              />
            </IonItem>
          </div>

          <div
            style={{
              padding: "0 16px 8px 16px",

              borderBottom: "1px solid #d9d9d9",
              marginTop: "2px",
            }}
          >
            <IonText color="medium">
              <p
                style={{
                  fontSize: "0.82rem",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                Example: 5 ft 8 in
              </p>
            </IonText>
          </div>

          <IonItem>
            <IonLabel position="stacked" style={{ whiteSpace: "nowrap" }}>
              Weight *
            </IonLabel>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                width: "100%",
                marginTop: "6px",
              }}
            >
              <IonInput
                type="number"
                value={weight}
                placeholder="Enter weight"
                onIonChange={(e) => setWeight(Number(e.detail.value))}
                style={{
                  width: "90px",
                  minWidth: "90px",
                  flex: "0 0 90px",
                }}
              />

              <IonRadioGroup
                value={unit}
                onIonChange={(e) => setUnit(String(e.detail.value) as "kg" | "lb")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  flexShrink: 0,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "1rem",
                    color: "var(--ion-color-dark)",
                  }}
                >
                  <IonRadio value="kg" mode="md" />
                  <span>kg</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "1rem",
                    color: "var(--ion-color-dark)",
                  }}
                >
                  <IonRadio value="lb" mode="md" />
                  <span>lb</span>
                </label>
              </IonRadioGroup>
            </div>
          </IonItem>

          <IonItem>
            <IonLabel>
              <div style={{ fontSize: "1rem", lineHeight: 1.3 }}>
                Your BMI
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "var(--ion-color-medium)",
                  marginTop: "2px",
                }}
              >
                Calculated automatically
              </div>
            </IonLabel>

            <IonLabel
              slot="end"
              style={{
                fontSize: "1.05rem",
                fontWeight: 500,
                textAlign: "right",
              }}
            >
              {bmi || "--"}
            </IonLabel>
          </IonItem>

          <IonItem lines="none">
            <IonLabel position="stacked">Gender *</IonLabel>

            <IonRadioGroup
              value={gender}
              onIonChange={(e) => setGender(String(e.detail.value))}
              style={{
                display: "flex",
                gap: "20px",
                marginTop: "8px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "1rem",
                  color: "var(--ion-color-dark)",
                }}
              >
                <IonRadio value="male" mode="md" />
                <span>Male</span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "1rem",
                  color: "var(--ion-color-dark)",
                }}
              >
                <IonRadio value="female" mode="md" />
                <span>Female</span>
              </label>
            </IonRadioGroup>
          </IonItem>

        </IonList>

        <div style={sectionTitleStyle}>Activity and Exercise</div>

        <IonList>

          <IonItem>
            <IonLabel position="stacked">
              Have you done any physical activity in the last 30 days? *
            </IonLabel>
            <IonSelect
              value={paAny}
              onIonChange={(e) => setPaAny(Number(e.detail.value))}
            >
              <IonSelectOption value={1}>Yes</IonSelectOption>
              <IonSelectOption value={2}>No</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">
              Do you usually get at least 150 minutes of exercise per week? *
            </IonLabel>
            <IonSelect
              value={paIndex}
              onIonChange={(e) => setPaIndex(Number(e.detail.value))}
            >
              <IonSelectOption value={1}>Yes</IonSelectOption>
              <IonSelectOption value={2}>No</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonText color="medium">
            <p style={helperTextStyle}>
              This refers to the recommended weekly physical activity guideline for adults.
            </p>
          </IonText>

          <IonItem>
            <IonLabel position="stacked">
              Main type of exercise you do most often
            </IonLabel>
            <IonSelect
              value={activityType}
              onIonChange={(e) => setActivityType(Number(e.detail.value))}
            >
              <IonSelectOption value={1}>Walking</IonSelectOption>
              <IonSelectOption value={2}>Running</IonSelectOption>
              <IonSelectOption value={3}>Cycling</IonSelectOption>
              <IonSelectOption value={4}>Strength Training</IonSelectOption>
              <IonSelectOption value={10}>Yoga</IonSelectOption>
              <IonSelectOption value={11}>Other</IonSelectOption>
            </IonSelect>
          </IonItem>


          <IonItem>
            <IonLabel position="stacked">
              How many aerobic exercise sessions do you usually do each week?
            </IonLabel>
            <IonInput
              type="number"
              min="0"
              max="14"
              value={exerFreq}
              onIonChange={(e) => setExerFreq(Number(e.detail.value))}
            />
          </IonItem>

          <IonText color="medium">
            <p style={helperTextStyle}>
              Examples include brisk walking, running, cycling, swimming, or similar activities.
            </p>
          </IonText>

          <IonItem>
            <IonLabel position="stacked">
              How many strength workouts do you usually do each week?
            </IonLabel>
            <IonInput
              type="number"
              min="0"
              max="14"
              value={strengthFreq}
              onIonChange={(e) => setStrengthFreq(Number(e.detail.value))}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">
              In the last 30 days, how many days did stress or emotions affect you?
            </IonLabel>
            <IonInput
              type="number"
              min="0"
              max="30"
              value={stress}
              onIonChange={(e) => setStress(Number(e.detail.value))}
            />
          </IonItem>
        </IonList>

        <div style={sectionTitleStyle}>Health History</div>

        <IonList>
          <IonItem>
            <IonLabel>Do you have high blood pressure? *</IonLabel>
            <IonToggle
              checked={htn}
              onIonChange={(e) => setHtn(e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonLabel>Do you currently smoke? *</IonLabel>
            <IonToggle
              checked={smoking}
              onIonChange={(e) => setSmoking(e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonLabel>Do you drink heavily?</IonLabel>
            <IonToggle
              checked={alc}
              onIonChange={(e) => setAlc(e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonLabel>Have you had your cholesterol checked in the last 5 years?</IonLabel>
            <IonToggle
              checked={cholScreen}
              onIonChange={(e) => setCholScreen(e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonLabel>Do you have high cholesterol?</IonLabel>
            <IonToggle
              checked={chol}
              onIonChange={(e) => setChol(e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonLabel>Do you have health insurance?</IonLabel>
            <IonToggle
              checked={insured}
              onIonChange={(e) => setInsured(e.detail.checked)}
            />
          </IonItem>
        </IonList>
      </IonContent>

      <IonFooter translucent>
        <IonToolbar>
          <IonButton expand="block" color="danger" onClick={handlePredict}>
            Check My Heart Health
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default HeartPredictor;