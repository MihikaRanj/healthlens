import React, { useState, useEffect } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonToggle, IonButton, IonSegment, IonSegmentButton,
  IonList, IonIcon, IonButtons,
  IonFooter
} from "@ionic/react";
import { homeOutline, refreshOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { runHeartModel } from "../onnxPredictor";

const HeartPredictor: React.FC = () => {
  const history = useHistory();

  //Load saved form data
  const savedData = JSON.parse(localStorage.getItem("heartFormData") || "{}");

  //Demographics
  const [age, setAge] = useState<number>(savedData.AGE || 0);
  const [heightFt, setHeightFt] = useState<number>(savedData.heightFt || 0);
  const [heightIn, setHeightIn] = useState<number>(savedData.heightIn || 0);
  const [weight, setWeight] = useState<number>(savedData.weight || 0);
  const [unit, setUnit] = useState<"kg" | "lb">(savedData.unit || "kg");
  const [bmi, setBmi] = useState<number>(savedData.BMI || 0);
  const [gender, setGender] = useState<string>(savedData.gender || "male");

  //Clinical & lifestyle factors
  const [paAny, setPaAny] = useState<number>(savedData.PA_ANY || 0);
  const [paIndex, setPaIndex] = useState<number>(savedData.PA_INDEX || 0);
  const [activityType, setActivityType] = useState<number>(savedData.ACTIVITY_TYPE_CODE || 0);
  const [exerFreq, setExerFreq] = useState<number>(savedData.EXER_FREQ_WK || 0);
  const [strengthFreq, setStrengthFreq] = useState<number>(savedData.STRENGTH_FREQ || 0);
  const [insured, setInsured] = useState<boolean>(savedData.INSURED_FLAG === 1);
  const [smoking, setSmoking] = useState<boolean>(savedData.SMOKING_IDX === 1);
  const [htn, setHtn] = useState<boolean>(savedData.HTN_FLAG === 1);
  const [chol, setChol] = useState<boolean>(savedData.CHOL_FLAG === 1);
  const [cholScreen, setCholScreen] = useState<boolean>(savedData.CHOL_SCREEN === 0);
  const [alc, setAlc] = useState<boolean>(savedData.ALC_FLAG === 1);
  const [stress, setStress] = useState<number>(savedData.STRESS_SCORE || 0);

  //BMI calculation
  useEffect(() => {
    if (heightFt && weight) {
      const hMeters = ((heightFt * 12 + (heightIn || 0)) * 2.54) / 100;
      const wKg = unit === "lb" ? weight * 0.453592 : weight;
      if (hMeters > 0) setBmi(parseFloat((wKg / (hMeters * hMeters)).toFixed(1)));
    }
  }, [heightFt, heightIn, weight, unit]);

  //save to localStorage
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
  }, [age, heightFt, heightIn, weight, unit, bmi, gender, paAny, paIndex, activityType,
      exerFreq, strengthFreq, insured, smoking, htn, chol, cholScreen, alc, stress]);

  //Clear button
  const handleClear = () => {
    localStorage.removeItem("heartFormData");
    localStorage.removeItem("heartRiskData");

    const summary = JSON.parse(localStorage.getItem("healthSummary") || "{}");
    if (summary.heart) {
      delete summary.heart;
      localStorage.setItem("healthSummary", JSON.stringify(summary));
    }

    //Reset states
    setAge(0); setHeightFt(0); setHeightIn(0); setWeight(0);
    setUnit("kg"); setBmi(0); setGender("male");
    setPaAny(0); setPaIndex(0); setActivityType(0);
    setExerFreq(0); setStrengthFreq(0);
    setInsured(true); setSmoking(false); setHtn(false);
    setChol(false); setCholScreen(true); setAlc(false);
    setStress(0);
  };

  //Predict
  const handlePredict = async () => {
    const safe = (v: number | undefined, fallback = 0) =>
      isNaN(Number(v)) ? fallback : Number(v);

    //Validate mandatory fields
    if (
      !age ||
      !heightFt ||
      !weight ||
      bmi <= 0 ||
      gender === "" ||
      paAny === undefined ||
      paIndex === undefined
    ) {
      alert("Please fill all required fields before predicting.");
      return;
    }

    //defaults for fields
    const STRESS_SCORE = safe(stress, 0);
    const ALC_FLAG = alc ? 1 : 0;
    const CHOL_FLAG = chol ? 1 : 0;
    const CHOL_SCREEN = cholScreen ? 0 : 1;
    const EXER_FREQ_WK = safe(exerFreq, 2);
    const STRENGTH_FREQ = safe(strengthFreq, 1);
    const INSURED_FLAG = insured ? 1 : 0;
    const ACTIVITY_TYPE_CODE = safe(activityType, 1);

    //Derived + mapped felds
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

    console.log("🧩 Model Input:", inputMap);

    try {
      const result = await runHeartModel(inputMap);
      console.log("✅ Model Output:", result);

      //Save result
      const riskData = { inputs: inputMap, result: { ...result, type: "heart" } };
      localStorage.setItem("heartRiskData", JSON.stringify(riskData));

      //Update healthSummary
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
          {/* Clear Button */}
          <IonButtons slot="start">
            <IonButton onClick={handleClear}>
              <IonIcon icon={refreshOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>

          <IonTitle slot="primary">Heart Disease Risk</IonTitle>


          {/*Home Button */}
          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/")}>
              <IonIcon icon={homeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h2 className="ion-text-center">Enter Your Health Information</h2>

        {/*Demographics*/}
        <IonList>
          <IonItem>
            <IonLabel position="stacked">Age (years) *</IonLabel>
            <IonInput type="number" value={age} onIonChange={(e) => setAge(Number(e.detail.value))} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Height (ft) *</IonLabel>
            <IonInput type="number" value={heightFt} onIonChange={(e) => setHeightFt(Number(e.detail.value))} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Height (in)</IonLabel>
            <IonInput type="number" value={heightIn} onIonChange={(e) => setHeightIn(Number(e.detail.value))} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Weight ({unit}) *</IonLabel>
            <IonInput type="number" value={weight} onIonChange={(e) => setWeight(Number(e.detail.value))} />
          </IonItem>

          <IonSegment value={unit} onIonChange={(e) => setUnit(String(e.detail.value) as "kg" | "lb")}>
            <IonSegmentButton value="kg">kg</IonSegmentButton>
            <IonSegmentButton value="lb">lb</IonSegmentButton>
          </IonSegment>

          <IonItem>
            <IonLabel>BMI (auto-calculated)</IonLabel>
            <IonLabel>{bmi || "--"}</IonLabel>
          </IonItem>

          <IonSegment value={gender} onIonChange={(e) => setGender(String(e.detail.value))}>
            <IonSegmentButton value="male">Male</IonSegmentButton>
            <IonSegmentButton value="female">Female</IonSegmentButton>
          </IonSegment>
        </IonList>

        {/*Activity Section*/}
        <IonList>
          <IonItem>
            <IonLabel>Any physical exercise in last 30 days? *</IonLabel>
            <IonSelect value={paAny} onIonChange={(e) => setPaAny(Number(e.detail.value))}>
              <IonSelectOption value={1}>Yes</IonSelectOption>
              <IonSelectOption value={2}>No</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel>Met 150 min/week activity guideline? *</IonLabel>
            <IonSelect value={paIndex} onIonChange={(e) => setPaIndex(Number(e.detail.value))}>
              <IonSelectOption value={1}>Yes</IonSelectOption>
              <IonSelectOption value={2}>No</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Primary Exercise Type</IonLabel>
            <IonSelect value={activityType} onIonChange={(e) => setActivityType(Number(e.detail.value))}>
              <IonSelectOption value={1}>Walking</IonSelectOption>
              <IonSelectOption value={2}>Running</IonSelectOption>
              <IonSelectOption value={3}>Cycling</IonSelectOption>
              <IonSelectOption value={4}>Strength Training</IonSelectOption>
              <IonSelectOption value={10}>Yoga</IonSelectOption>
              <IonSelectOption value={11}>Other</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Aerobic Exercise Sessions / Week (0–14)</IonLabel>
            <IonInput type="number" min="0" max="14" value={exerFreq} onIonChange={(e) => setExerFreq(Number(e.detail.value))} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Strength Sessions / Week (0–14)</IonLabel>
            <IonInput type="number" min="0" max="14" value={strengthFreq} onIonChange={(e) => setStrengthFreq(Number(e.detail.value))} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">
              Days mental health “not good” due to stress/emotions (0–30)
            </IonLabel>
            <IonInput type="number" min="0" max="30" value={stress} onIonChange={(e) => setStress(Number(e.detail.value))} />
          </IonItem>
        </IonList>

        {/*Clinical Risk Factors*/}
        <IonList>
          <IonItem><IonLabel>High Blood Pressure? *</IonLabel><IonToggle checked={htn} onIonChange={(e) => setHtn(e.detail.checked)} /></IonItem>
          <IonItem><IonLabel>Current Smoker? *</IonLabel><IonToggle checked={smoking} onIonChange={(e) => setSmoking(e.detail.checked)} /></IonItem>
          <IonItem><IonLabel>Heavy Drinker?</IonLabel><IonToggle checked={alc} onIonChange={(e) => setAlc(e.detail.checked)} /></IonItem>
          <IonItem><IonLabel>Had Cholesterol Screening (5 yrs)?</IonLabel><IonToggle checked={cholScreen} onIonChange={(e) => setCholScreen(e.detail.checked)} /></IonItem>
          <IonItem><IonLabel>High Cholesterol?</IonLabel><IonToggle checked={chol} onIonChange={(e) => setChol(e.detail.checked)} /></IonItem>
          <IonItem><IonLabel>Have Health Insurance?</IonLabel><IonToggle checked={insured} onIonChange={(e) => setInsured(e.detail.checked)} /></IonItem>
        </IonList>


        
      </IonContent>
      <IonFooter translucent={true}>
              <IonToolbar>
                <IonButton expand="block" color="danger" onClick={handlePredict}>
            Predict Heart Risk
          </IonButton>
              </IonToolbar>
            </IonFooter>
    </IonPage>
  );
};

export default HeartPredictor;
