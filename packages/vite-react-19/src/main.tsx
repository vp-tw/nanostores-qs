import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { Theme } from "./theme";

import "@fontsource/inter/index.css";
import "@repo/css-reset/main.css";

const container = document.createElement("div");
container.setAttribute("class", "my-app");
document.body.appendChild(container);

createRoot(container).render(
  <StrictMode>
    <Theme>
      <App />
    </Theme>
  </StrictMode>,
);
