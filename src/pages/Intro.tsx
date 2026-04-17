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
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { helpCircleOutline } from "ionicons/icons";

const Intro: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>HealthLens</IonTitle>

          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/help")}>
              <IonIcon icon={helpCircleOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding ion-text-center">
        <h1 style={{ fontWeight: "bold", marginBottom: "10px" }}>
          Understand Your Health Risk Early
        </h1>

        <IonText>
          <p
            style={{
              maxWidth: "500px",
              margin: "0 auto 14px auto",
              lineHeight: "1.5",
            }}
          >
            HealthLens helps you explore possible early risk patterns for
            <strong> heart disease and diabetes</strong> based on your health
            habits, and gives personalized insights to support healthier choices.
          </p>
        </IonText>

        <IonCard>
          <IonCardContent style={{ textAlign: "left", paddingTop: "10px", paddingBottom: "10px" }}>
            <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.55", margin: 0 }}>
              <li>Personalized risk insights based on your habits</li>
              <li>Clear explanation of key contributing factors</li>
              <li>Projected risk trends over time</li>
              <li>Simple, actionable health recommendations</li>
            </ul>
          </IonCardContent>
        </IonCard>

        <IonText color="medium">
          <p style={{ marginTop: "6px", marginBottom: "12px", fontSize: "0.92rem" }}>
            Choose a health check to get started.
          </p>
        </IonText>

        <IonButton
          expand="block"
          color="primary"
          onClick={() => history.push("/gluco")}
        >
          Start Glucose Check
        </IonButton>

        <IonButton
          expand="block"
          color="danger"
          onClick={() => history.push("/heart")}
        >
          Start Heart Check
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
          💬 Ask Health Coach
        </IonButton>

        <IonText color="medium">
          <p
            style={{
              marginTop: "16px",
              textAlign: "center",
              fontSize: "0.75rem",
              opacity: 0.75,
              padding: "0 10px",
              lineHeight: "1.3",
            }}
          >
            ⚠️ HealthLens provides educational insights only and does not replace medical advice.
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Intro;