import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonText,
  IonIcon,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { homeOutline } from "ionicons/icons";

const HelpPage: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle slot="primary">About HealthLens</IonTitle>

          {/*Home button */}
          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/")}>
              <IonIcon icon={homeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonText>
          <h2>What is HealthLens?</h2>
          <p>
            HealthLens is an AI-powered wellness app designed to help you understand your
            <strong> heart and glucose health</strong> using public health datasets
            (such as BRFSS and NHANES). It uses machine learning models to provide
            personalized risk insights and lifestyle recommendations.
          </p>

          <h3>Key Features</h3>
          <ul>
            <li>Predict risk of diabetes and heart disease, coronary heart disease (CHD) or myocardial infarction (MI), based on your inputs.</li>
            <li>Generate personalized advice for better health outcomes.</li>
            <li>Visualize projected health risk over the span of next 10 years.</li>
            <li>Chat with an AI-powered Health Coach for tailored insights.</li>
          </ul>

          <h3>Disclaimer</h3>
          <p>
            This app is intended for educational and informational use only. It does not
            provide medical advice, diagnosis, or treatment. Always consult a qualified
            healthcare provider for medical guidance.
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default HelpPage;
