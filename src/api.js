import {
  getLocalRotations,
  getLocalEvaluations,
  saveLocalEvaluationBatch,
  getGoogleSheetsUrl,
  setGoogleSheetsUrl,
  getLocalDepartments,
  saveLocalDepartments
} from "./mockData";

export { getGoogleSheetsUrl, setGoogleSheetsUrl, saveLocalDepartments };

/**
 * Normalizes rotation data from different possible sheet header representations.
 */
const normalizeRotation = (r) => {
  if (!r) return null;
  const normalized = {};

  // Normalize intern_name
  const nameKey = Object.keys(r).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, "") === "internname"
  );
  normalized.intern_name = nameKey ? r[nameKey] : (r.intern_name || r.name || "");

  // Normalize main_department
  const mainKey = Object.keys(r).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, "") === "maindepartment"
  );
  normalized.main_department = mainKey ? r[mainKey] : (r.main_department || r.department || "");

  // Normalize secondary_department
  const secKey = Object.keys(r).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, "") === "secondarydepartment"
  );
  normalized.secondary_department = secKey ? r[secKey] : (r.secondary_department || "");

  // Normalize drive_photo_id
  const photoKey = Object.keys(r).find(
    (k) =>
      k.toLowerCase().replace(/[\s_-]/g, "") === "internphotoid" ||
      k.toLowerCase().replace(/[\s_-]/g, "") === "drivephotoid"
  );
  normalized.drive_photo_id = photoKey ? r[photoKey] : (r.drive_photo_id || "");

  // Normalize exams
  if (r.exams) {
    if (typeof r.exams === "string") {
      try {
        normalized.exams = JSON.parse(r.exams);
      } catch (e) {
        normalized.exams = {};
      }
    } else {
      normalized.exams = r.exams;
    }
  } else {
    normalized.exams = {};
  }

  // Trim string values
  if (typeof normalized.intern_name === "string") normalized.intern_name = normalized.intern_name.trim();
  if (typeof normalized.main_department === "string") normalized.main_department = normalized.main_department.trim();
  if (typeof normalized.secondary_department === "string") normalized.secondary_department = normalized.secondary_department.trim();
  if (typeof normalized.drive_photo_id === "string") normalized.drive_photo_id = normalized.drive_photo_id.trim();

  return normalized;
};

/**
 * Fetch rotations and evaluation logs.
 * Falls back to local storage if API is not set or fails.
 */
export const fetchData = async () => {
  const url = getGoogleSheetsUrl();
  if (!url) {
    return {
      rotations: getLocalRotations().map(normalizeRotation).filter(Boolean),
      evaluations: getLocalEvaluations(),
      departments: getLocalDepartments(),
      source: "mock"
    };
  }

  try {
    const res = await fetch(`${url}?action=getData`);
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const json = await res.json();
    if (json.error) {
      throw new Error(json.error);
    }
    return {
      rotations: (json.rotations || []).map(normalizeRotation).filter(Boolean),
      evaluations: json.evaluations || [],
      departments: json.departments || getLocalDepartments(),
      source: "sheets"
    };
  } catch (err) {
    console.error("API error, falling back to local data:", err);
    return {
      rotations: getLocalRotations().map(normalizeRotation).filter(Boolean),
      evaluations: getLocalEvaluations(),
      departments: getLocalDepartments(),
      source: "fallback",
      error: err.message
    };
  }
};

/**
 * Submit batch evaluations.
 * Appends data locally and posts to Google Sheets if configured.
 */
export const submitEvaluations = async (evaluations) => {
  const url = getGoogleSheetsUrl();
  
  // We ALWAYS save locally first to ensure immediate responsiveness and offline resilience.
  saveLocalEvaluationBatch(evaluations);

  if (!url) {
    return {
      success: true,
      count: evaluations.length,
      source: "mock"
    };
  }

  try {
    // Send as text/plain to avoid preflight OPTIONS requests,
    // which Google Apps Script web apps do not handle well.
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        action: "submitEvaluations",
        data: evaluations
      })
    });
    
    // Since Google Apps Script Web App redirects are sometimes blocked by CORS depending on browser,
    // if we don't get an error, we treat it as success. If it fails, we fall back.
    if (!res.ok && res.status !== 0) {
      throw new Error(`HTTP error ${res.status}`);
    }

    return {
      success: true,
      count: evaluations.length,
      source: "sheets"
    };
  } catch (err) {
    console.error("API POST error, saved locally as fallback:", err);
    return {
      success: true,
      count: evaluations.length,
      source: "fallback",
      error: err.message
    };
  }
};

/**
 * Push rotation updates to Google Sheets.
 */
export const updateRotations = async (updates) => {
  const url = getGoogleSheetsUrl();
  if (!url) {
    return {
      success: true,
      source: "mock"
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        action: "updateRotations",
        data: updates
      })
    });

    if (!res.ok && res.status !== 0) {
      throw new Error(`HTTP error ${res.status}`);
    }

    return {
      success: true,
      source: "sheets"
    };
  } catch (err) {
    console.error("API POST error updating rotations:", err);
    return {
      success: false,
      source: "fallback",
      error: err.message
    };
  }
};

/**
 * Save the entire rotations list to Google Sheets.
 */
export const saveRotationsApi = async (rotationsList) => {
  const url = getGoogleSheetsUrl();
  if (!url) {
    return {
      success: true,
      source: "mock"
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        action: "saveRotations",
        data: rotationsList
      })
    });

    if (!res.ok && res.status !== 0) {
      throw new Error(`HTTP error ${res.status}`);
    }

    return {
      success: true,
      source: "sheets"
    };
  } catch (err) {
    console.error("API POST error saving rotations:", err);
    return {
      success: false,
      source: "fallback",
      error: err.message
    };
  }
};

/**
 * Save the departments list to Google Sheets.
 */
export const saveDepartmentsApi = async (main, secondary) => {
  const url = getGoogleSheetsUrl();
  if (!url) {
    return {
      success: true,
      source: "mock"
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        action: "saveDepartments",
        main: main,
        secondary: secondary
      })
    });

    if (!res.ok && res.status !== 0) {
      throw new Error(`HTTP error ${res.status}`);
    }

    return {
      success: true,
      source: "sheets"
    };
  } catch (err) {
    console.error("API POST error saving departments:", err);
    return {
      success: false,
      source: "fallback",
      error: err.message
    };
  }
};

/**
 * Validate a connection to the Google Sheets API.
 */
export const testApiConnection = async (testUrl) => {
  if (!testUrl) return { success: false, error: "URL is empty" };
  
  try {
    const res = await fetch(`${testUrl}?action=getData`);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const json = await res.json();
    if (json.rotations && json.evaluations) {
      return { success: true, data: json };
    }
    throw new Error("Invalid response format. Expected 'rotations' and 'evaluations' arrays.");
  } catch (err) {
    return { success: false, error: err.message };
  }
};
