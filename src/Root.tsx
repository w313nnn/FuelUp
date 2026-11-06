import { useEffect, useState } from "react";
import App from "./App";
import Welcome from "./components/Welcome";
export default function Root() {
  const [inApp, setInApp] = useState(() => window.location.hash === "#app");
  useEffect(() => {
    const sync = () => {
      setInApp(window.location.hash === "#app");
      if (window.location.hash === '#app' || !window.location.hash || window.location.hash === '#') {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return inApp ? <App /> : <Welcome />;
}
