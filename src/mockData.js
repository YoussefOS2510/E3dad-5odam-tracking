// Data layer: Firebase Firestore (primary) + localStorage (offline cache/fallback)
import { db, isFirebaseConfigured } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import rosterData from "./data.json";

// ─── Default data ──────────────────────────────────────────────────────────────

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

const DEFAULT_DEPARTMENTS = { main: DEFAULT_MAIN_DEPTS, secondary: DEFAULT_SEC_DEPTS };

// ─── localStorage helpers (offline cache) ─────────────────────────────────────

export const getLocalRotations = () => {
  const stored = localStorage.getItem("rotations");
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fall through */ }
  }
  return DEFAULT_ROTATIONS;
};

export const getLocalEvaluations = () => {
  const stored = localStorage.getItem("evaluations");
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fall through */ }
  }
  return DEFAULT_EVALUATIONS;
};

export const getLocalDepartments = () => {
  const stored = localStorage.getItem("departments");
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fall through */ }
  }
  return DEFAULT_DEPARTMENTS;
};

export const saveLocalRotations = (rotations) => {
  localStorage.setItem("rotations", JSON.stringify(rotations));
};

export const saveLocalEvaluations = (evaluations) => {
  localStorage.setItem("evaluations", JSON.stringify(evaluations));
};

export const saveLocalDepartments = (main, secondary) => {
  const updated = { main, secondary };
  localStorage.setItem("departments", JSON.stringify(updated));
  return updated;
};

export const saveLocalEvaluationBatch = (newEvaluations) => {
  const current = getLocalEvaluations();
  const updated = [...current, ...newEvaluations];
  localStorage.setItem("evaluations", JSON.stringify(updated));
  return updated;
};

// ─── Firestore helpers ─────────────────────────────────────────────────────────

/**
 * Get all rotations (interns) from Firestore.
 * Returns null if Firebase is not configured.
 */
export const getFirestoreRotations = async () => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, "appData", "rotations");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().list || [];
    }
    return null; // Document doesn't exist yet — means first run
  } catch (err) {
    console.error("Firestore read rotations error:", err);
    return null;
  }
};

/**
 * Save all rotations (interns) to Firestore.
 */
export const saveFirestoreRotations = async (rotations) => {
  if (!isFirebaseConfigured || !db) return false;
  try {
    await setDoc(doc(db, "appData", "rotations"), { list: rotations });
    saveLocalRotations(rotations); // keep local cache in sync
    return true;
  } catch (err) {
    console.error("Firestore save rotations error:", err);
    return false;
  }
};

/**
 * Get all evaluations from Firestore.
 * Returns null if Firebase is not configured.
 */
export const getFirestoreEvaluations = async () => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, "appData", "evaluations");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().list || [];
    }
    return null;
  } catch (err) {
    console.error("Firestore read evaluations error:", err);
    return null;
  }
};

/**
 * Save all evaluations to Firestore.
 */
export const saveFirestoreEvaluations = async (evaluations) => {
  if (!isFirebaseConfigured || !db) return false;
  try {
    await setDoc(doc(db, "appData", "evaluations"), { list: evaluations });
    saveLocalEvaluations(evaluations); // keep local cache in sync
    return true;
  } catch (err) {
    console.error("Firestore save evaluations error:", err);
    return false;
  }
};

/**
 * Append a batch of new evaluations to Firestore.
 */
export const appendFirestoreEvaluations = async (newEvaluations) => {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const existing = (await getFirestoreEvaluations()) || [];
    const updated = [...existing, ...newEvaluations];
    await saveFirestoreEvaluations(updated);
    return true;
  } catch (err) {
    console.error("Firestore append evaluations error:", err);
    return false;
  }
};

/**
 * Get departments from Firestore.
 * Returns null if Firebase is not configured.
 */
export const getFirestoreDepartments = async () => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, "appData", "departments");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() || null;
    }
    return null;
  } catch (err) {
    console.error("Firestore read departments error:", err);
    return null;
  }
};

/**
 * Save departments to Firestore.
 */
export const saveFirestoreDepartments = async (main, secondary) => {
  if (!isFirebaseConfigured || !db) return false;
  try {
    await setDoc(doc(db, "appData", "departments"), { main, secondary });
    saveLocalDepartments(main, secondary); // keep local cache in sync
    return true;
  } catch (err) {
    console.error("Firestore save departments error:", err);
    return false;
  }
};

// ─── Migration / seeding ───────────────────────────────────────────────────────

/**
 * If Firestore has no data yet, seed it from localStorage (or defaults).
 * Called once on app startup.
 */
export const migrateLocalToFirestore = async () => {
  if (!isFirebaseConfigured || !db) return;

  try {
    const firestoreRotations = await getFirestoreRotations();

    if (firestoreRotations === null) {
      // Firestore is empty — seed from localStorage if it has real data, otherwise use defaults
      const localRotations = getLocalRotations();
      const localEvaluations = getLocalEvaluations();
      const localDepts = getLocalDepartments();

      console.log("Seeding Firestore from local data...");
      await saveFirestoreRotations(localRotations);
      await saveFirestoreEvaluations(localEvaluations);
      await saveFirestoreDepartments(localDepts.main, localDepts.secondary);
      console.log("Firestore seeded successfully.");
    }
  } catch (err) {
    console.error("Migration to Firestore failed:", err);
  }
};

// ─── Legacy compat (kept for any remaining direct usages) ─────────────────────

export const initMockStorage = () => {
  // No-op: localStorage is now just a cache, not the source of truth
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

export const resetToDefaults = () => {
  localStorage.setItem("rotations", JSON.stringify(DEFAULT_ROTATIONS));
  localStorage.setItem("evaluations", JSON.stringify(DEFAULT_EVALUATIONS));
  localStorage.setItem("departments", JSON.stringify(DEFAULT_DEPARTMENTS));
  return {
    rotations: DEFAULT_ROTATIONS,
    evaluations: DEFAULT_EVALUATIONS,
    departments: DEFAULT_DEPARTMENTS
  };
};
