import React from "react";
import ReactDOM from "react-dom/client";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import App from "./App";

/* ✅ Ionic core and theme CSS */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import "./theme/variables.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);

/* Needed for camera / file inputs on mobile */
defineCustomElements(window);
