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
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { runGlucoseModel } from "../onnxPredictor";
import { homeOutline, refreshOutline } from "ionicons/icons";

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
  const [smoking, setSmoking] = useState<number>(savedData.SMOKING_IDX || 0);
  const [glucose, setGlucose] = useState<number>(savedData.GLU || 0);
  const [active, setActive] = useState<boolean>(savedData.PA_ANY === 1);

  const [showAlert, setShowAlert] = useState(false);

  //Auto BMI
  useEffect(() => {
    const hMeters = ((heightFt * 12 + heightIn) * 2.54) / 100;
    const wKg = unit === "lb" ? weight * 0.453592 : weight;
    if (hMeters > 0)
      setBmi(parseFloat((wKg / (hMeters * hMeters)).toFixed(1)));
  }, [heightFt, heightIn, weight, unit]);

  //Save to localStorage
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

  //Predict
  const handlePredict = async () => {
    const safe = (v: number | undefined) =>
      isNaN(Number(v)) ? 0 : Number(v);

    //Mandatory field validation
    if (
      !age ||
      !heightFt ||
      !weight ||
      bmi <= 0 ||
      gender === "" ||
      smoking === undefined
    ) {
      alert("Please fill all required fields before predicting.");
      return;
    }

    //Default fasting glucose to 95 mg/dL if blank, with disclaimer
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

    console.log("Model Input:", inputMap);

    try {
      const result = await runGlucoseModel(Object.values(inputMap));
      console.log("Model Output:", result);

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

          <IonTitle slot="primary">GlucoPredict</IonTitle>

          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/")}>
              <IonIcon icon={homeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h2 className="ion-text-center">Enter Your Information</h2>

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
          <IonLabel>BMI (auto-calculated)</IonLabel>
          <IonLabel>{bmi || "--"}</IonLabel>
        </IonItem>

        <IonSegment
          value={gender}
          onIonChange={(e) => setGender(String(e.detail.value))}
        >
          <IonSegmentButton value="male">Male</IonSegmentButton>
          <IonSegmentButton value="female">Female</IonSegmentButton>
        </IonSegment>

        <IonItem>
          <IonLabel>Hypertension *</IonLabel>
          <IonSelect
            value={htn ? "yes" : "no"}
            onIonChange={(e) => setHtn(e.detail.value === "yes")}
          >
            <IonSelectOption value="yes">Yes</IonSelectOption>
            <IonSelectOption value="no">No</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonList>
          <IonItem lines="full">
            <IonLabel>
              <h3>Smoking Level *</h3>
            </IonLabel>
          </IonItem>

          <IonRadioGroup
            value={smoking}
            onIonChange={(e) => setSmoking(Number(e.detail.value))}
          >
            <IonItem>
              <IonLabel>0 - Non-Smoker 🚭</IonLabel>
              <IonRadio slot="start" value={0} />
            </IonItem>
            <IonItem>
              <IonLabel>1 - Occasional Smoker ✍️</IonLabel>
              <IonRadio slot="start" value={1} />
            </IonItem>
            <IonItem>
              <IonLabel>2 - Regular Smoker 💨</IonLabel>
              <IonRadio slot="start" value={2} />
            </IonItem>
            <IonItem>
              <IonLabel>3 - Heavy Smoker 🔥</IonLabel>
              <IonRadio slot="start" value={3} />
            </IonItem>
          </IonRadioGroup>
        </IonList>

        <IonItem>
          <IonLabel position="stacked">
            Fasting Glucose (mg/dL) — optional
          </IonLabel>
          <IonInput
            type="number"
            value={glucose}
            onIonChange={(e) => setGlucose(Number(e.detail.value))}
          />
        </IonItem>

        <IonItem>
          <IonLabel>Physically Active *</IonLabel>
          <IonToggle
            checked={active}
            onIonChange={(e) => setActive(e.detail.checked)}
          />
        </IonItem>

        <div className="ion-text-center ion-padding-top">

        </div>

        {/* Disclaimer alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Default Glucose Used"
          message="You did not enter a fasting glucose value. A typical average of 95 mg/dL was used for estimation. Actual results may vary."
          buttons={["OK"]}
        />
      </IonContent>

      <IonFooter translucent={true}>
        <IonToolbar>
          <IonButton expand="block" onClick={handlePredict}>
            Predict
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default GlucosePredictor;
