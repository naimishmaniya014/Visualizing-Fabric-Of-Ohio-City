import React from "react";
import ReactDOM from "react-dom/client";
import "./css/index.css";
import Home from "./Components/Home";
import * as d3 from "d3";
import * as d3Lasso from "d3-lasso-v9";
import { createTheme } from "@mui/material/styles";
import ThemeProvider from "@mui/material/styles/ThemeProvider";

const theme = createTheme({
  typography: {
    fontFamily: ["Domine", "Times New Roman", "Roboto", "sans-serif"].join(","),
  },
});

const d3Custom = Object.assign(d3, { lasso: d3Lasso.lasso });
window.d3 = d3Custom;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <ThemeProvider theme={theme}>
    <Home />
  </ThemeProvider>
  // </React.StrictMode>
);
