import "@fontsource/teko/700.css";
import "./styles.css";
import { createApp } from "./app/App.js";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("#app");
  root.replaceChildren(createApp({ pathname: window.location.pathname }));
});
