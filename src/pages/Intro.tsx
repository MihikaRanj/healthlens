import React from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonText,
  IonButtons,
  IonIcon,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { helpCircleOutline } from "ionicons/icons";

const Intro: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle slot="primary">HealthLens</IonTitle>

          {/*Help Icon Button */}
          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/help")}>
              <IonIcon icon={helpCircleOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding ion-text-center">
        <h1 style={{ fontWeight: "bold" }}>Welcome to HealthLens</h1>
        <p>
          A smart tool that predicts your glucose health and heart health based on your lifestyle
          and vitals. Get insights instantly!
        </p>

        <IonButton expand="block" color="primary" onClick={() => history.push("/gluco")}>
          Glucose Predictor
        </IonButton>

        <IonButton expand="block" color="danger" onClick={() => history.push("/heart")}>
          Heart Risk Predictor
        </IonButton>

        <IonButton
          expand="block"
          color="secondary"
          onClick={() => {
            const heartData = localStorage.getItem("heartRiskData");
            const glucoData = localStorage.getItem("glucoRiskData");

            if (heartData || glucoData) {
              history.push("/chat", {
                heartData: heartData ? JSON.parse(heartData) : null,
                glucoData: glucoData ? JSON.parse(glucoData) : null,
              });
            } else {
              history.push("/chat");
            }
          }}
        >
          💬 Chat with Health Coach
        </IonButton>

        {/*Disclaimer Section*/}
        <IonText
          color="medium"
          style={{
            position: "absolute",
            bottom: "12px",
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: "0.75rem",
            opacity: 0.7,
            padding: "0 20px",
            lineHeight: "1.3",
          }}
        >
          ⚠️ This app uses AI to generate insights and should not replace medical consultation.
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Intro;
