// Mock Database for local preview and offline storage fallback
import rosterData from "./data.json";

const DEFAULT_ROTATIONS = rosterData;
const DEFAULT_EVALUATIONS = [];

const DEFAULT_MAIN_DEPTS = [
  "مدارس احد KG",
  "مدارس احد اولي وتانية",
  "مدارس احد تالتة ورابعة بنين",
  "مدارس احد تالتة ورابعة بنات",
  "مدارس احد خامسة وسادسة بنين",
  "مدارس احد خامسة وسادسة بنات",
  "مدارس احد اعدادي بنين",
  "درس كتاب",
  "كشافة"
];

const DEFAULT_SEC_DEPTS = [
  "اخوه رب",
  "كانتين",
  "سوبر ماركت",
  "ملاجئ",
  "رحلات",
  "طابيثا",
  "وسائل ايضاح"
];

export const initMockStorage = () => {
  const storedRotations = localStorage.getItem("rotations");
  const storedEvaluations = localStorage.getItem("evaluations");
  const storedDepartments = localStorage.getItem("departments");

  let isMock = false;
  if (storedRotations) {
    try {
      const parsed = JSON.parse(storedRotations);
      isMock = parsed.some(
        (r) =>
          r.intern_name === "مينا نيروز" ||
          r.intern_name === "فادي أمجد"
      );
    } catch (e) {
      isMock = true;
    }
  }

  if (!storedRotations || isMock) {
    localStorage.setItem("rotations", JSON.stringify(DEFAULT_ROTATIONS));
    localStorage.removeItem("active_eval_session");
  }

  let isMockEvals = false;
  if (storedEvaluations) {
    try {
      const parsed = JSON.parse(storedEvaluations);
      isMockEvals = parsed.some(
        (e) =>
          e.evaluator_name === "أ. شنودة رفيق" ||
          e.intern_name === "مينا أمير عبد القدوس"
      );
    } catch (e) {
      isMockEvals = true;
    }
  }

  if (!storedEvaluations || isMockEvals) {
    localStorage.setItem("evaluations", JSON.stringify(DEFAULT_EVALUATIONS));
    localStorage.removeItem("active_eval_session");
  }

  if (!storedDepartments) {
    localStorage.setItem(
      "departments",
      JSON.stringify({ main: DEFAULT_MAIN_DEPTS, secondary: DEFAULT_SEC_DEPTS })
    );
  }
};

export const getLocalRotations = () => {
  initMockStorage();
  return JSON.parse(localStorage.getItem("rotations"));
};

export const getLocalEvaluations = () => {
  initMockStorage();
  return JSON.parse(localStorage.getItem("evaluations"));
};

export const getLocalDepartments = () => {
  initMockStorage();
  return JSON.parse(localStorage.getItem("departments"));
};

export const saveLocalDepartments = (main, secondary) => {
  initMockStorage();
  const updated = { main, secondary };
  localStorage.setItem("departments", JSON.stringify(updated));
  return updated;
};

export const saveLocalEvaluationBatch = (newEvaluations) => {
  initMockStorage();
  const current = JSON.parse(localStorage.getItem("evaluations")) || [];
  const updated = [...current, ...newEvaluations];
  localStorage.setItem("evaluations", JSON.stringify(updated));
  return updated;
};

export const resetToDefaults = () => {
  localStorage.setItem("rotations", JSON.stringify(DEFAULT_ROTATIONS));
  localStorage.setItem("evaluations", JSON.stringify(DEFAULT_EVALUATIONS));
  localStorage.setItem(
    "departments",
    JSON.stringify({ main: DEFAULT_MAIN_DEPTS, secondary: DEFAULT_SEC_DEPTS })
  );
  return {
    rotations: DEFAULT_ROTATIONS,
    evaluations: DEFAULT_EVALUATIONS,
    departments: { main: DEFAULT_MAIN_DEPTS, secondary: DEFAULT_SEC_DEPTS }
  };
};

export const getGoogleSheetsUrl = () => {
  return localStorage.getItem("google_sheets_api_url") || "";
};

export const setGoogleSheetsUrl = (url) => {
  if (url) {
    localStorage.setItem("google_sheets_api_url", url);
  } else {
    localStorage.removeItem("google_sheets_api_url");
  }
};
