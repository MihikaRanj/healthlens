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
  IonButton,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonRadioGroup,
  IonRadio,
  IonList,
  IonButtons,
  IonIcon,
  IonAlert,
  IonFooter,
  IonText,

} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { runGlucoseModel } from "../onnxPredictor";
import { homeOutline, refreshOutline } from "ionicons/icons";

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

const GlucosePredictor: React.FC = () => {
  const history = useHistory();

  const savedData = JSON.parse(localStorage.getItem("glucoFormData") || "{}");

  const [age, setAge] = useState<number>(savedData.AGE || 0);
  const [heightFt, setHeightFt] = useState<number>(savedData.heightFt || 0);
  const [heightIn, setHeightIn] = useState<number>(savedData.heightIn || 0);
  const [weight, setWeight] = useState<number>(savedData.weight || 0);
  const [unit, setUnit] = useState<"kg" | "lb">(savedData.unit || "kg");
  const [bmi, setBmi] = useState<number>(savedData.BMI || 0);
  const [gender, setGender] = useState<string>(savedData.gender || "male");
  const [htn, setHtn] = useState<boolean>(savedData.HTN_FLAG === 1);
  const [smoking, setSmoking] = useState<number>(
    [0, 1, 2, 3].includes(savedData.SMOKING_IDX) ? savedData.SMOKING_IDX : 0
  );
  const [glucose, setGlucose] = useState<string>(
    savedData.GLU ? String(savedData.GLU) : ""
  );
  const [active, setActive] = useState<boolean>(savedData.PA_ANY === 1);

  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const hMeters = ((heightFt * 12 + heightIn) * 2.54) / 100;
    const wKg = unit === "lb" ? weight * 0.453592 : weight;
    if (hMeters > 0) {
      setBmi(parseFloat((wKg / (hMeters * hMeters)).toFixed(1)));
    } else {
      setBmi(0);
    }
  }, [heightFt, heightIn, weight, unit]);

  useEffect(() => {
    const data = {
      AGE: age,
      heightFt,
      heightIn,
      weight,
      unit,
      BMI: bmi,
      gender,
      HTN_FLAG: htn ? 1 : 0,
      SMOKING_IDX: smoking,
      GLU: glucose === "" ? "" : Number(glucose),
      PA_ANY: active ? 1 : 0,
    };

    localStorage.setItem("glucoFormData", JSON.stringify(data));
  }, [
    age,
    heightFt,
    heightIn,
    weight,
    unit,
    bmi,
    gender,
    htn,
    smoking,
    glucose,
    active,
  ]);

  const handleClear = () => {
    if (!window.confirm("Clear all entered information?")) return;

    localStorage.removeItem("glucoFormData");
    localStorage.removeItem("glucoRiskData");

    const summary = JSON.parse(localStorage.getItem("healthSummary") || "{}");
    if (summary.glucose) {
      delete summary.glucose;
      localStorage.setItem("healthSummary", JSON.stringify(summary));
    }

    setAge(0);
    setHeightFt(0);
    setHeightIn(0);
    setWeight(0);
    setUnit("kg");
    setBmi(0);
    setGender("male");
    setHtn(false);
    setSmoking(0);
    setGlucose("");
    setActive(false);
  };

  const handlePredict = async () => {
    const safe = (v: number | undefined) =>
      isNaN(Number(v)) ? 0 : Number(v);

    if (
      !age ||
      !heightFt ||
      !weight ||
      bmi <= 0 ||
      gender === "" ||
      smoking === undefined
    ) {
      alert("Please fill all required fields before continuing.");
      return;
    }

    let glucoseVal = Number(glucose);
    if (!glucose || isNaN(glucoseVal) || glucoseVal <= 0) {
      glucoseVal = 95;
      setShowAlert(true);
    }

    const SEX_MALE = gender === "male" ? 1 : 0;
    const HTN_FLAG = htn ? 1 : 0;
    const PA_ANY = active ? 1 : 0;

    const inputMap: Record<string, number> = {
      AGE: safe(age),
      BMI: safe(bmi),
      SEX_MALE,
      HTN_FLAG,
      SMOKING_IDX: safe(smoking),
      GLU: glucoseVal,
      PA_ANY,
    };

    //console.log("Glucose model input:", inputMap);

    try {
      const result = await runGlucoseModel(Object.values(inputMap));

      const riskData = {
        inputs: inputMap,
        result: { ...result, type: "glucose" },
      };
      localStorage.setItem("glucoRiskData", JSON.stringify(riskData));

      const summary = JSON.parse(localStorage.getItem("healthSummary") || "{}");
      summary.glucose = riskData;
      localStorage.setItem("healthSummary", JSON.stringify(summary));

      history.push("/result", {
        result: { ...result, type: "glucose" },
        inputs: inputMap,
      });
    } catch (err) {
      console.error("Model Error:", err);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={handleClear}>
              <IonIcon icon={refreshOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>

          <IonTitle slot="primary">Glucose Check</IonTitle>

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
            Answer a few questions about your health and habits to explore your
            glucose health risk pattern.
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

        <div style={sectionTitleStyle}>Health History and Habits</div>

        <IonList>
          <IonItem>
            <IonLabel position="stacked">Do you have high blood pressure? *</IonLabel>
            <IonSelect
              value={htn ? "yes" : "no"}
              onIonChange={(e) => setHtn(e.detail.value === "yes")}
            >
              <IonSelectOption value="yes">Yes</IonSelectOption>
              <IonSelectOption value="no">No</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem lines="none">
            <IonLabel>
              <h3 style={{ marginBottom: "6px" }}>Smoking Status *</h3>
            </IonLabel>
          </IonItem>

          <IonRadioGroup
            value={smoking}
            onIonChange={(e) => setSmoking(Number(e.detail.value))}
          >
            <IonItem>
              <IonLabel>I do not smoke</IonLabel>
              <IonRadio slot="start" value={0} />
            </IonItem>
            <IonItem>
              <IonLabel>I smoke occasionally</IonLabel>
              <IonRadio slot="start" value={1} />
            </IonItem>
            <IonItem>
              <IonLabel>I smoke regularly</IonLabel>
              <IonRadio slot="start" value={2} />
            </IonItem>
            <IonItem>
              <IonLabel>I smoke heavily</IonLabel>
              <IonRadio slot="start" value={3} />
            </IonItem>
          </IonRadioGroup>

          <IonItem>
            <IonLabel position="stacked">
              Fasting blood sugar (mg/dL) — optional
            </IonLabel>
            <IonInput
              type="number"
              value={glucose}
              placeholder="Optional"
              onIonChange={(e) => setGlucose(e.detail.value ?? "")}
            />
          </IonItem>

          <IonText color="medium">
            <p style={helperTextStyle}>
              Leave this blank if you do not know your fasting blood sugar value.
            </p>
          </IonText>

          <IonItem>
            <IonLabel>Are you physically active? *</IonLabel>
            <IonToggle
              checked={active}
              onIonChange={(e) => setActive(e.detail.checked)}
            />
          </IonItem>
        </IonList>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Default Blood Sugar Used"
          message="You did not enter a fasting blood sugar value. A typical value of 95 mg/dL was used for estimation, so actual results may vary."
          buttons={["OK"]}
        />
      </IonContent>

      <IonFooter translucent>
        <IonToolbar>
          <IonButton expand="block" color="primary" onClick={handlePredict}>
            Check My Glucose Health
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default GlucosePredictor;