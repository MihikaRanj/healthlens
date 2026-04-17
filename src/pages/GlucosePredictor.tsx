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
  IonSegment,
  IonSegmentButton,
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
  const [glucose, setGlucose] = useState<number>(savedData.GLU || 0);
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
      GLU: glucose,
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
    setGlucose(0);
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

    let glucoseVal = glucose;
    if (!glucoseVal || glucoseVal <= 0) {
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

          <IonItem>
            <IonLabel position="stacked">Height (ft) *</IonLabel>
            <IonInput
              type="number"
              value={heightFt}
              onIonChange={(e) => setHeightFt(Number(e.detail.value))}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Height (in)</IonLabel>
            <IonInput
              type="number"
              value={heightIn}
              onIonChange={(e) => setHeightIn(Number(e.detail.value))}
            />
          </IonItem>

          <IonText color="medium">
            <p style={helperTextStyle}>Example: 5 ft 8 in</p>
          </IonText>

          <IonItem>
            <IonLabel position="stacked">Weight ({unit}) *</IonLabel>
            <IonInput
              type="number"
              value={weight}
              onIonChange={(e) => setWeight(Number(e.detail.value))}
            />
          </IonItem>
        </IonList>

        <IonSegment
          value={unit}
          onIonChange={(e) => setUnit(String(e.detail.value) as "kg" | "lb")}
        >
          <IonSegmentButton value="kg">kg</IonSegmentButton>
          <IonSegmentButton value="lb">lb</IonSegmentButton>
        </IonSegment>

        <IonItem>
          <IonLabel>Your BMI (calculated automatically)</IonLabel>
          <IonLabel>{bmi || "--"}</IonLabel>
        </IonItem>

        <IonSegment
          value={gender}
          onIonChange={(e) => setGender(String(e.detail.value))}
        >
          <IonSegmentButton value="male">Male</IonSegmentButton>
          <IonSegmentButton value="female">Female</IonSegmentButton>
        </IonSegment>

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
              onIonChange={(e) => setGlucose(Number(e.detail.value))}
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