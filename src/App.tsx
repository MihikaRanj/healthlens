import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ellipse, square, triangle } from 'ionicons/icons';
import Intro from "./pages/Intro";
import GlucosePredictor from "./pages/GlucosePredictor";
import ResultPage from "./pages/ResultPage";
import HeartPredictor from "./pages/HeartPredictor";
import ChatPage from "./pages/ChatPage";



import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';


import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
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
