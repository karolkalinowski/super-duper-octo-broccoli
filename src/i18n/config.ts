import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "./en/common.json";
import enProjects from "./en/projects.json";
import enNodeForm from "./en/nodeForm.json";
import enValidation from "./en/validation.json";
import plCommon from "./pl/common.json";
import plProjects from "./pl/projects.json";
import plNodeForm from "./pl/nodeForm.json";
import plValidation from "./pl/validation.json";

const resources = {
  en: {
    common: enCommon,
    projects: enProjects,
    nodeForm: enNodeForm,
    validation: enValidation,
  },
  pl: {
    common: plCommon,
    projects: plProjects,
    nodeForm: plNodeForm,
    validation: plValidation,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("lang") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
