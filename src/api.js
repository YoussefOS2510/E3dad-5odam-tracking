import { isFirebaseConfigured } from "./firebase";
import {
  getLocalRotations,
  getLocalEvaluations,
  getLocalDepartments,
  saveLocalEvaluationBatch,
  saveLocalRotations,
  saveLocalDepartments,
  getFirestoreRotations,
  getFirestoreEvaluations,
  getFirestoreDepartments,
  saveFirestoreRotations,
  saveFirestoreEvaluations,
  appendFirestoreEvaluations,
  saveFirestoreDepartments,
  migrateLocalToFirestore,
  getGoogleSheetsUrl,
  setGoogleSheetsUrl,
} from "./mockData";

export { getGoogleSheetsUrl, setGoogleSheetsUrl, saveLocalDepartments };

/**
 * Normalizes rotation data from different possible data source formats.
 */
const normalizeRotation = (r) => {
  if (!r) return null;
  const normalized = {};

  const nameKey = Object.keys(r).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, "") === "internname"
  );
  normalized.intern_name = nameKey ? r[nameKey] : (r.intern_name || r.name || "");

  const mainKey = Object.keys(r).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, "") === "maindepartment"
  );
  normalized.main_department = mainKey ? r[mainKey] : (r.main_department || r.department || "");

  const secKey = Object.keys(r).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, "") === "secondarydepartment"
  );
  normalized.secondary_department = secKey ? r[secKey] : (r.secondary_department || "");

  const photoKey = Object.keys(r).find(
    (k) =>
      k.toLowerCase().replace(/[\s_-]/g, "") === "internphotoid" ||
      k.toLowerCase().replace(/[\s_-]/g, "") === "drivephotoid"
  );
  normalized.drive_photo_id = photoKey ? r[photoKey] : (r.drive_photo_id || "");

  const examsKey = Object.keys(r).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, "") === "exams"
  );
  const rawExams = examsKey ? r[examsKey] : (r.exams || null);
  if (rawExams) {
    if (typeof rawExams === "string" && rawExams.trim() !== "") {
      try {
        normalized.exams = JSON.parse(rawExams);
      } catch (e) {
        normalized.exams = {};
      }
    } else {
      normalized.exams = rawExams;
    }
  } else {
    normalized.exams = {};
  }

  if (typeof normalized.intern_name === "string") normalized.intern_name = normalized.intern_name.trim();
  if (typeof normalized.main_department === "string") normalized.main_department = normalized.main_department.trim();
  if (typeof normalized.secondary_department === "string") normalized.secondary_department = normalized.secondary_department.trim();
  if (typeof normalized.drive_photo_id === "string") normalized.drive_photo_id = normalized.drive_photo_id.trim();

  return normalized;
};

/**
 * Wraps a promise with a timeout. If the promise takes longer than ms, resolves with null.
 */
const withTimeout = (promise, ms = 8000) => {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
};

/**
 * Fetch rotations, evaluations, and departments.
 * Priority: Firestore → localStorage (fallback when Firebase not configured or fails)
 */
export const fetchData = async () => {
  if (isFirebaseConfigured) {
    try {
      // Seed Firestore from local data if it's empty (first-time setup)
      await withTimeout(migrateLocalToFirestore(), 10000);

      // Fetch all three collections with a timeout so the app never hangs
      const [firestoreRotations, firestoreEvaluations, firestoreDepartments] =
        await Promise.all([
          withTimeout(getFirestoreRotations()),
          withTimeout(getFirestoreEvaluations()),
          withTimeout(getFirestoreDepartments()),
        ]);

      if (firestoreRotations !== null) {
        // Update local cache
        saveLocalRotations(firestoreRotations);

        return {
          rotations: firestoreRotations.map(normalizeRotation).filter(Boolean),
          evaluations: firestoreEvaluations || [],
          departments: firestoreDepartments || getLocalDepartments(),
          source: "firestore",
        };
      }

      // Firestore returned null — could mean DB doesn't exist yet or timed out
      console.warn("Firestore returned no data, falling back to local storage.");
    } catch (err) {
      console.error("Firestore fetchData error, falling back to local:", err);
    }
  }

  // Fallback: localStorage (offline or unconfigured)
  return {
    rotations: getLocalRotations().map(normalizeRotation).filter(Boolean),
    evaluations: getLocalEvaluations(),
    departments: getLocalDepartments(),
    source: "local",
  };
};

/**
 * Submit a batch of new evaluations.
 * Saves to Firestore (cloud) and localStorage (cache).
 */
export const submitEvaluations = async (evaluations) => {
  // Always save locally first
  saveLocalEvaluationBatch(evaluations);

  if (isFirebaseConfigured) {
    try {
      await appendFirestoreEvaluations(evaluations);
      return { success: true, count: evaluations.length, source: "firestore" };
    } catch (err) {
      console.error("Firestore submitEvaluations error:", err);
      return { success: true, count: evaluations.length, source: "local", error: err.message };
    }
  }

  return { success: true, count: evaluations.length, source: "local" };
};

/**
 * Save the entire rotations list (with exam grades) to Firestore.
 */
export const saveRotationsApi = async (rotationsList) => {
  saveLocalRotations(rotationsList);

  if (isFirebaseConfigured) {
    try {
      await saveFirestoreRotations(rotationsList);
      return { success: true, source: "firestore" };
    } catch (err) {
      console.error("Firestore saveRotations error:", err);
      return { success: false, source: "local", error: err.message };
    }
  }

  return { success: true, source: "local" };
};

/**
 * Push selective rotation updates (partial update by intern name).
 */
export const updateRotations = async (updates) => {
  if (!updates || updates.length === 0) return { success: true, source: "noop" };

  // Get current list, apply updates, save back
  const currentRotations = getLocalRotations();
  const updatedMap = {};
  for (const u of updates) {
    updatedMap[u.intern_name] = u;
  }

  const merged = currentRotations.map((r) =>
    updatedMap[r.intern_name] ? { ...r, ...updatedMap[r.intern_name] } : r
  );

  return saveRotationsApi(merged);
};

/**
 * Save the departments list.
 */
export const saveDepartmentsApi = async (main, secondary) => {
  saveLocalDepartments(main, secondary);

  if (isFirebaseConfigured) {
    try {
      await saveFirestoreDepartments(main, secondary);
      return { success: true, source: "firestore" };
    } catch (err) {
      console.error("Firestore saveDepartments error:", err);
      return { success: false, source: "local", error: err.message };
    }
  }

  return { success: true, source: "local" };
};

/**
 * Validate API connection (Firestore or legacy Google Sheets).
 */
export const testApiConnection = async (testUrl) => {
  if (isFirebaseConfigured) {
    try {
      const rotations = await getFirestoreRotations();
      if (rotations !== null) {
        return { success: true, source: "firestore", count: rotations.length };
      }
      return { success: true, source: "firestore", count: 0, message: "Connected (empty database)" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Legacy Google Sheets test
  if (!testUrl) return { success: false, error: "No URL and Firebase not configured" };
  try {
    const res = await fetch(`${testUrl}?action=getData`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    if (json.rotations && json.evaluations) {
      return { success: true, data: json };
    }
    throw new Error("Invalid response format.");
  } catch (err) {
    return { success: false, error: err.message };
  }
};
