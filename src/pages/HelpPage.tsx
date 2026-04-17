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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { homeOutline } from "ionicons/icons";

const HelpPage: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>About HealthLens</IonTitle>

          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/")}>
              <IonIcon icon={homeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>What is HealthLens?</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>
                <strong>HealthLens</strong> is an AI-supported wellness app that helps
                users understand possible early risk patterns for
                <strong> heart disease and diabetes</strong> using personal health and
                lifestyle information.
              </p>
              <p>
                The app uses machine learning models built from public health datasets
                such as <strong>BRFSS</strong> and <strong>NHANES</strong> to provide
                educational risk estimates, explain important contributing factors, and
                offer personalized lifestyle suggestions.
              </p>
              <p>
                HealthLens is designed to support awareness and prevention. It is not a
                diagnostic tool.
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Key Features</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.6" }}>
                <li>
                  Check possible risk patterns for heart disease and diabetes using
                  lifestyle and health inputs
                </li>
                <li>
                  View personalized explanations of the factors that may be influencing
                  your result
                </li>
                <li>
                  See how risk may change over time if your current health profile stays
                  similar
                </li>
                <li>
                  Receive personalized wellness suggestions and action steps
                </li>
                <li>
                  Chat with an AI-supported Health Coach for general guidance on habits,
                  food, exercise, and prevention
                </li>
              </ul>
            </IonText>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Privacy</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>
                HealthLens is designed with privacy in mind. Your health information is
                stored locally on your device for app functionality.
              </p>
              <p>
                If you choose to use AI-generated features, limited information may be
                sent securely to generate a response. HealthLens does not ask users to
                share more information than needed for the app experience.
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Ethics and Fair Use</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>
                HealthLens was built to encourage prevention and awareness, but all
                health prediction systems have limitations.
              </p>
              <p>
                Results may not be equally accurate for every individual, especially if
                users differ from the populations represented in the public training
                datasets. For that reason, the app uses clear, non-diagnostic language
                and encourages follow-up with a healthcare professional when appropriate.
              </p>
              <p>
                The app is meant to support healthier decision-making, not replace
                medical care.
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Accessibility</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>
                HealthLens aims to make health information easier to understand by using
                simple language, readable layouts, and clear visual summaries.
              </p>
              <p>
                Our goal is to make preventive health insights more approachable for
                users who may not have a medical background.
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>

        <IonCard color="light">
          <IonCardHeader>
            <IonCardTitle>Medical Disclaimer</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>
                HealthLens is for <strong>educational and informational use only</strong>.
                It does not provide medical advice, diagnosis, or treatment.
              </p>
              <p>
                The results shown in this app are screening-style estimates based on
                self-reported information and public datasets. They should not be used
                as a substitute for professional evaluation, lab testing, or emergency
                care.
              </p>
              <p>
                Always consult a qualified healthcare provider if you have symptoms,
                ongoing concerns, or questions about your health.
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default HelpPage;