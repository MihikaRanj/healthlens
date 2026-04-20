import React, { useEffect } from "react";
import { Redirect, Route, useHistory } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { App as CapacitorApp } from "@capacitor/app";

import Intro from "./pages/Intro";
import GlucosePredictor from "./pages/GlucosePredictor";
import ResultPage from "./pages/ResultPage";
import HeartPredictor from "./pages/HeartPredictor";
import ChatPage from "./pages/ChatPage";
import HelpPage from "./pages/HelpPage";

setupIonicReact();

const AppRoutes: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    let listener: any;

    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      const path = window.location.pathname;

      if (path === "/") {
        return;
      }

      if (canGoBack) {
        history.goBack();
      } else {
        history.replace("/");
      }
    }).then((handle) => {
      listener = handle;
    });

    return () => {
      listener?.remove();
    };
  }, [history]);

  return (
    <IonRouterOutlet>
      <Route exact path="/" component={Intro} />
      <Route exact path="/gluco" component={GlucosePredictor} />
      <Route exact path="/result" component={ResultPage} />
      <Route exact path="/heart" component={HeartPredictor} />
      <Route exact path="/chat" component={ChatPage} />
      <Route exact path="/help" component={HelpPage} />
      <Redirect to="/" />
    </IonRouterOutlet>
  );
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <AppRoutes />
    </IonReactRouter>
  </IonApp>
);

export default App;