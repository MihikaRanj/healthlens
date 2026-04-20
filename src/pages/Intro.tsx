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
            <strong> heart disease and diabetes</strong> using your health habits,
            and gives simple, personalized insights to support healthier choices
            earlier.
          </p>
        </IonText>

        <IonText color="medium">
          <p style={{ marginTop: "6px", marginBottom: "12px", fontSize: "0.92rem" }}>
            Choose a health check to get started.
          </p>
        </IonText>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            maxWidth: "560px",
            margin: "0 auto",
          }}
        >
          <IonButton
            expand="block"
            color="primary"
            style={{ minHeight: "110px", whiteSpace: "normal" }}
            onClick={() => history.push("/gluco")}
          >
            Start Glucose Check
          </IonButton>

          <IonButton
            expand="block"
            color="danger"
            style={{ minHeight: "110px", whiteSpace: "normal" }}
            onClick={() => history.push("/heart")}
          >
            Start Heart Check
          </IonButton>

          <IonButton
            expand="block"
            color="secondary"
            style={{
              minHeight: "120px",
              gridColumn: "1 / -1",
              whiteSpace: "normal",
              display: "flex",
              flexDirection: "column",
            }}
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
            <div style={{ fontSize: "2rem", marginBottom: "6px" }}>🧑‍⚕️</div>
            <div>Ask Health Coach</div>
          </IonButton>
        </div>

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