import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Intro from "./pages/Intro";
import GlucosePredictor from "./pages/GlucosePredictor";
import ResultPage from "./pages/ResultPage";
import HeartPredictor from "./pages/HeartPredictor";
import ChatPage from "./pages/ChatPage";

import HelpPage from './pages/HelpPage';

setupIonicReact();

const App: React.FC = () => (
 <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/" component={Intro} />
        <Route exact path="/gluco" component={GlucosePredictor} />
        <Route exact path="/result" component={ResultPage} />
        <Route exact path="/heart" component={HeartPredictor} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/help" component={HelpPage} exact />
        <Redirect to="/" />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
