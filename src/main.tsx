import React from "react";
import ReactDOM from "react-dom/client";
import Root from "./Root";
import { FuelUpProvider } from "./state/FuelUpProvider";
import "./styles.css";
import "./features.css";
import "./design-system.css";
import "./welcome.css";
import "./typography.css";
import "./disclosure.css";
import "./nearby.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FuelUpProvider>
      <Root />
    </FuelUpProvider>
  </React.StrictMode>,
);
