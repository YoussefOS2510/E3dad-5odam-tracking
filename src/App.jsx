import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
import GatekeeperStep from "./components/Wizard/GatekeeperStep";
import EvaluationCard from "./components/Wizard/EvaluationCard";
import SubmitReview from "./components/Wizard/SubmitReview";
import FilterBar from "./components/Dashboard/FilterBar";
import Leaderboard from "./components/Dashboard/Leaderboard";
import ProfileModal from "./components/Dashboard/ProfileModal";
import ManageInterns from "./components/Dashboard/ManageInterns";

import { fetchData, submitEvaluations, saveRotationsApi, saveDepartmentsApi, saveLocalDepartments, saveExamsListApi } from "./api";
import { isFirebaseConfigured } from "./firebase";
import { saveFirestoreEvaluations, DEFAULT_EXAMS_LIST } from "./mockData";
import { translations } from "./translations";

const FALLBACK_MAIN_DEPTS = [
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

const FALLBACK_SEC_DEPTS = [
  "اخوه رب",
  "كانتين",
  "سوبر ماركت",
  "ملاجئ",
  "رحلات",
  "طابيثا",
  "وسائل ايضاح"
];
import { CheckCircle2, RefreshCw, ClipboardList, LayoutDashboard, AlertCircle, FileSpreadsheet } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("wizard");
  
  // Language State
  const [lang, setLang] = useState(() => localStorage.getItem("app_lang") || "ar");
  const t = translations[lang];

  // Data State
  const [rotations, setRotations] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [apiSource, setApiSource] = useState("local"); // "local" | "firestore" | "fallback"
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isReadOnlyAdmin, setIsReadOnlyAdmin] = useState(false);
  const [mainDepartments, setMainDepartments] = useState(FALLBACK_MAIN_DEPTS);
  const [secondaryDepartments, setSecondaryDepartments] = useState(FALLBACK_SEC_DEPTS);
  const [examsList, setExamsList] = useState(DEFAULT_EXAMS_LIST);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "", preset: "all" });

  // Wizard States
  const [wizardStep, setWizardStep] = useState("gatekeeper"); // "gatekeeper" | "evaluating" | "review" | "success"
  const [supervisorName, setSupervisorName] = useState("");
  const [wizardDept, setWizardDept] = useState("");
  const [internQueue, setInternQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [evaluationsBatch, setEvaluationsBatch] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  // Restore State Prompt
  const [hasDraftSession, setHasDraftSession] = useState(false);

  // Selected Intern for Profile Deep-Dive Modal
  const [selectedProfileIntern, setSelectedProfileIntern] = useState(null);

  // Toggle App Language
  const toggleLang = () => {
    const newLang = lang === "ar" ? "en" : "ar";
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  // Load Data on Mount
  const loadDatabase = async () => {
    setLoading(true);
    setSyncStatus(t.loadingData);
    const res = await fetchData();
    
    const fetchedRotations = res.rotations || [];
    
    if (res.departments && res.departments.main && res.departments.secondary) {
      const main = res.departments.main.filter(Boolean);
      const sec = res.departments.secondary.filter(Boolean);
      if (main.length > 0) setMainDepartments(main);
      if (sec.length > 0) setSecondaryDepartments(sec);
    } else {
      setMainDepartments(FALLBACK_MAIN_DEPTS);
      setSecondaryDepartments(FALLBACK_SEC_DEPTS);
    }

    if (res.examsList && res.examsList.length > 0) {
      setExamsList(res.examsList);
    }
    
    setRotations(fetchedRotations);
    setEvaluations(res.evaluations || []);
    setApiSource(res.source);
    setLoading(false);
    
    const isAr = lang === "ar";
    if (res.source === "firestore") {
      setSyncStatus(isAr ? "✓ متصل بقاعدة البيانات السحابية" : "✓ Connected to Cloud Database");
    } else if (res.source === "fallback") {
      setSyncStatus(isAr ? "تحذير: فشل الاتصال، وضع محلي" : "Warning: Connection failed, offline mode");
    } else {
      setSyncStatus(isAr ? "وضع محلي — أضف Firebase للمزامنة السحابية" : "Local mode — add Firebase for cloud sync");
    }
  };

  useEffect(() => {
    // Detect app mode based on query param
    const params = new URLSearchParams(window.location.search);
    
    // Parse Google Sheets URL from sharing link if present, and save it
    const syncUrl = params.get("syncUrl");
    if (syncUrl) {
      localStorage.setItem("google_sheets_api_url", syncUrl);
      // Clean up the URL parameter from the browser address bar for aesthetics and control
      params.delete("syncUrl");
      const newSearch = params.toString();
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, document.title, newPath);
    }

    const mode = params.get("mode");
    if (mode === "admin" || mode === "dashboard") {
      setIsAdminMode(true);
      setIsReadOnlyAdmin(false);
      setActiveTab("dashboard");
    } else if (mode === "viewer" || mode === "readonly") {
      setIsAdminMode(true);
      setIsReadOnlyAdmin(true);
      setActiveTab("dashboard");
    } else {
      setIsAdminMode(false);
      setIsReadOnlyAdmin(false);
      setActiveTab("wizard");
    }

    loadDatabase();
    
    // Check if there is an active saved session
    const savedSession = localStorage.getItem("active_eval_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.queue && parsed.queue.length > 0) {
          setHasDraftSession(true);
        }
      } catch (e) {
        console.error("Failed to parse active evaluation draft:", e);
      }
    }
  }, [lang]);

  // Save Wizard Session Draft to localStorage
  const saveSessionDraft = (index, batch) => {
    const session = {
      supervisorName,
      department: wizardDept,
      queue: internQueue,
      currentIndex: index,
      evaluationsBatch: batch,
      step: "evaluating"
    };
    localStorage.setItem("active_eval_session", JSON.stringify(session));
    setHasDraftSession(true);
  };

  // Restore Wizard Session
  const restoreSession = () => {
    const savedSession = localStorage.getItem("active_eval_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSupervisorName(parsed.supervisorName || "");
        setWizardDept(parsed.department || "");
        setInternQueue(parsed.queue || []);
        setCurrentIndex(parsed.currentIndex || 0);
        setEvaluationsBatch(parsed.evaluationsBatch || []);
        setWizardStep("evaluating");
        setHasDraftSession(false);
      } catch (e) {
        console.error("Failed to restore session:", e);
      }
    }
  };

  // Clear Wizard Session
  const clearSessionDraft = () => {
    localStorage.removeItem("active_eval_session");
    setHasDraftSession(false);
  };

  // Start Session (From Gatekeeper)
  const handleStartSession = ({ supervisorName, department, queue }) => {
    setSupervisorName(supervisorName);
    setWizardDept(department);
    setInternQueue(queue);
    setCurrentIndex(0);
    setEvaluationsBatch([]);
    setWizardStep("evaluating");
    setSubmitError("");

    // Initialize draft session
    const session = {
      supervisorName,
      department,
      queue,
      currentIndex: 0,
      evaluationsBatch: [],
      step: "evaluating"
    };
    localStorage.setItem("active_eval_session", JSON.stringify(session));
  };

  // Handle evaluation card next/save
  const handleCardNext = (evaluationData) => {
    const updatedBatch = [...evaluationsBatch];
    updatedBatch[currentIndex] = {
      ...evaluationData,
      timestamp: new Date().toISOString(),
      evaluator_name: supervisorName,
      department: wizardDept,
    };
    
    setEvaluationsBatch(updatedBatch);

    if (currentIndex < internQueue.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      saveSessionDraft(nextIdx, updatedBatch);
    } else {
      // End of queue -> Go to Review Step
      setWizardStep("review");
      const session = {
        supervisorName,
        department: wizardDept,
        queue: internQueue,
        currentIndex: currentIndex,
        evaluationsBatch: updatedBatch,
        step: "review"
      };
      localStorage.setItem("active_eval_session", JSON.stringify(session));
    }
  };

  // Handle evaluation card back
  const handleCardBack = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      saveSessionDraft(prevIdx, evaluationsBatch);
    }
  };

  // Cancel evaluation session entirely
  const handleCancelSession = () => {
    clearSessionDraft();
    setWizardStep("gatekeeper");
    setSupervisorName("");
    setWizardDept("");
    setInternQueue([]);
    setCurrentIndex(0);
    setEvaluationsBatch([]);
  };

  // Submit Batch Evaluations
  const handleBatchSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    const res = await submitEvaluations(evaluationsBatch);
    setIsSubmitting(false);

    if (res.success) {
      clearSessionDraft();
      setWizardStep("success");
      loadDatabase(); // Refresh charts and leaderboard
    } else {
      setSubmitError(res.error || (lang === "ar" ? "فشل إرسال البيانات." : "Failed to submit data."));
    }
  };

  // Compiles and downloads the current session's evaluations as a CSV file compatible with Excel
  const downloadEvaluationsCsv = () => {
    if (!evaluationsBatch || evaluationsBatch.length === 0) return;

    // Define bilingual headers
    const headers = [
      "Timestamp / التاريخ",
      "Evaluator Name / اسم المقيّم",
      "Department / الخدمة",
      "Intern Name / اسم الطالب",
      "Attendance Days / الحضور",
      "Punctuality (1-5) / الالتزام بالوقت",
      "Appearance (1-5) / المظهر الكنسي",
      "Lesson Prep (1-5) / تحضير الدرس",
      "Audience Handling (1-5) / التعامل مع المخدومين",
      "Strengths / نقاط القوة",
      "Areas of Improvement / نقاط للتحسين",
      "Notes / ملاحظات"
    ];

    // Safe escaping helper for CSV syntax
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    // Compile rows
    const rows = evaluationsBatch.map((ev) => [
      ev.timestamp || new Date().toISOString(),
      ev.evaluator_name || "",
      ev.department || "",
      ev.intern_name || "",
      ev.attendance || 0,
      ev.commitment_time || 0,
      ev.church_spirit_appearance || 0,
      ev.lesson_preparation || 0,
      ev.target_audience_handling || 0,
      ev.strengths || "",
      ev.areas_of_improvement || "",
      ev.notes || ""
    ]);

    // Build raw CSV string
    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(","))
    ].join("\n");

    // Add Byte Order Mark (BOM) for correct Arabic rendering in MS Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

    // Download trigger
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    const dateStr = new Date().toISOString().split("T")[0];
    const deptNameClean = wizardDept.replace(/[\s\/\\]+/g, "_");
    link.setAttribute("download", `evaluations_${deptNameClean}_${dateStr}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered Evaluations calculation for Dashboard
  const filteredEvaluations = evaluations.filter((ev) => {
    if (searchQuery && !ev.intern_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedDept && ev.department !== selectedDept) {
      return false;
    }
    if (dateRange.start && new Date(ev.timestamp) < new Date(dateRange.start)) {
      return false;
    }
    if (dateRange.end) {
      const endLimit = new Date(dateRange.end);
      endLimit.setHours(23, 59, 59, 999);
      if (new Date(ev.timestamp) > endLimit) {
        return false;
      }
    }
    return true;
  });

  // Build a unified departments list: Firestore master list + any extra found in rotations
  const allDepartments = Array.from(
    new Set([
      ...mainDepartments,
      ...secondaryDepartments,
      ...rotations.flatMap((r) => [r.main_department, r.secondary_department].filter(Boolean))
    ])
  ).sort((a, b) => a.localeCompare(b, lang));

  // For the filter bar, also include only departments that appear in evaluations
  const uniqueDepartments = allDepartments;

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDept("");
    setDateRange({ start: "", end: "", preset: "all" });
  };

  const handleAddIntern = async (intern) => {
    if (rotations.some((r) => r.intern_name === intern.intern_name)) {
      alert(lang === "ar" ? "هذا الاسم موجود بالفعل!" : "This name already exists!");
      return false;
    }
    const updated = [...rotations, intern];
    setRotations(updated);
    localStorage.setItem("rotations", JSON.stringify(updated));
    await saveRotationsApi(updated);
    return true;
  };

  const handleUpdateIntern = async (oldName, updatedIntern) => {
    const updated = rotations.map((r) => {
      if (r.intern_name === oldName) {
        return updatedIntern;
      }
      return r;
    });
    setRotations(updated);
    localStorage.setItem("rotations", JSON.stringify(updated));
    await saveRotationsApi(updated);
    return true;
  };

  const handleDeleteIntern = async (name) => {
    const updated = rotations.filter((r) => r.intern_name !== name);
    setRotations(updated);
    localStorage.setItem("rotations", JSON.stringify(updated));
    await saveRotationsApi(updated);
    return true;
  };

  const handleDeleteEvaluation = async (timestamp, name) => {
    const isAr = lang === "ar";
    if (!window.confirm(isAr ? "هل أنت متأكد من حذف هذا التقييم نهائياً؟" : "Are you sure you want to delete this evaluation permanently?")) {
      return false;
    }
    const updated = evaluations.filter(
      (ev) => !(ev.timestamp === timestamp && ev.intern_name === name)
    );
    // Save to localStorage cache
    localStorage.setItem("evaluations", JSON.stringify(updated));
    // Save to Firestore (cloud)
    if (isFirebaseConfigured) {
      await saveFirestoreEvaluations(updated);
    }
    setEvaluations(updated);
    return true;
  };

  const handleBulkUpdateInterns = async (names, mainDept, secondaryDept) => {
    const updated = rotations.map((r) => {
      if (names.includes(r.intern_name)) {
        return {
          ...r,
          main_department: mainDept !== undefined ? mainDept : r.main_department,
          secondary_department: secondaryDept !== undefined ? secondaryDept : r.secondary_department
        };
      }
      return r;
    });
    setRotations(updated);
    localStorage.setItem("rotations", JSON.stringify(updated));
    await saveRotationsApi(updated);
    return true;
  };

  const handleUpdateDepartments = async (newMainDepts, newSecDepts) => {
    setMainDepartments(newMainDepts);
    setSecondaryDepartments(newSecDepts);
    saveLocalDepartments(newMainDepts, newSecDepts);
    await saveDepartmentsApi(newMainDepts, newSecDepts);
    return true;
  };

  const handleUpdateExamsList = async (newExamsList) => {
    setExamsList(newExamsList);
    await saveExamsListApi(newExamsList);
    return true;
  };

  const isRtl = lang === "ar";

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={(tab) => {
        setActiveTab(tab);
        if (tab === "dashboard") {
          loadDatabase();
        }
      }}
      apiSource={apiSource}
      syncStatus={syncStatus}
      lang={lang}
      toggleLang={toggleLang}
      isAdminMode={isAdminMode}
      isReadOnlyAdmin={isReadOnlyAdmin}
    >
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-600 font-arabic">
          <RefreshCw className="w-10 h-10 animate-spin mb-4" />
          <p className="font-bold">{t.loadingData}</p>
        </div>
      )}

      {!loading && activeTab === "wizard" && (
        <div className="space-y-6">
          
          {/* Restore Draft Toast/Panel */}
          {wizardStep === "gatekeeper" && hasDraftSession && (
            <div className={`w-full max-w-md mx-auto bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 ${
              isRtl ? "text-right" : "text-left"
            }`} dir={isRtl ? "rtl" : "ltr"}>
              <AlertCircle className="w-5.5 h-5.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2 font-arabic">
                <span className="text-xs font-bold text-amber-800 block">{t.restoreDraftTitle}</span>
                <p className="text-[11px] text-amber-700 leading-tight">
                  {t.restoreDraftSub}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={restoreSession}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {t.restoreBtn}
                  </button>
                  <button
                    onClick={clearSessionDraft}
                    className="border border-amber-300 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {t.discardBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wizard step routing */}
          {wizardStep === "gatekeeper" && (
            <GatekeeperStep
              rotations={rotations}
              allDepartments={allDepartments}
              onStartSession={handleStartSession}
              lang={lang}
            />
          )}

          {wizardStep === "evaluating" && (
            <EvaluationCard
              intern={internQueue[currentIndex]}
              index={currentIndex}
              total={internQueue.length}
              onNext={handleCardNext}
              onBack={handleCardBack}
              onCancel={handleCancelSession}
              savedDraft={evaluationsBatch[currentIndex]}
              lang={lang}
            />
          )}

          {wizardStep === "review" && (
            <SubmitReview
              evaluations={evaluationsBatch}
              evaluatorName={supervisorName}
              department={wizardDept}
              onSubmit={handleBatchSubmit}
              onCancel={handleCancelSession}
              isSubmitting={isSubmitting}
              submitError={submitError}
              lang={lang}
            />
          )}

          {wizardStep === "success" && (
            <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-8 glass-panel animate-fade-in text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold font-arabic text-slate-800">{t.successTitle}</h2>
              <p className="text-slate-400 text-xs mt-1 font-light">{t.successSub}</p>
              
              <div className="bg-slate-50 rounded-2xl p-4 my-6 font-arabic text-sm text-slate-600 space-y-1" dir={isRtl ? "rtl" : "ltr"}>
                <p className={isRtl ? "text-right" : "text-left"}>
                  {t.successCount}: <span className="font-bold text-indigo-600 font-mono">{evaluationsBatch.length}</span>
                </p>
                <p className={isRtl ? "text-right" : "text-left"}>
                  {t.successDept}: <span className="font-bold">{wizardDept}</span>
                </p>
                <p className={isRtl ? "text-right" : "text-left"}>
                  {t.successEvaluator}: <span className="font-bold">{supervisorName}</span>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {/* Download Excel CSV Button */}
                <button
                  onClick={downloadEvaluationsCsv}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-arabic font-semibold shadow-lg shadow-emerald-600/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>{lang === "ar" ? "تحميل ملف التقييمات (Excel)" : "Download Evaluations (Excel/CSV)"}</span>
                </button>

                <button
                  onClick={() => {
                    setWizardStep("gatekeeper");
                    setSupervisorName("");
                    setWizardDept("");
                    setInternQueue([]);
                    setEvaluationsBatch([]);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-arabic font-semibold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ClipboardList className="w-5 h-5" />
                  <span>{t.evaluateAnotherBtn}</span>
                </button>
                
                {isAdminMode && (
                  <button
                    onClick={() => {
                      setActiveTab("dashboard");
                      loadDatabase();
                    }}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-arabic font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>{t.goToDashboardBtn}</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {!loading && activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className={isRtl ? "text-right" : "text-left"} dir={isRtl ? "rtl" : "ltr"}>
            <h2 className="text-2xl font-bold font-arabic text-slate-800">{t.dashboardTitle}</h2>
            <p className="text-slate-400 text-xs mt-0.5 font-light">{t.dashboardSub}</p>
          </div>

          {/* Filter Bar */}
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            dateRange={dateRange}
            setDateRange={setDateRange}
            departments={uniqueDepartments}
            onReset={handleResetFilters}
            lang={lang}
          />


          {/* Interns Leaderboard List */}
          <Leaderboard
            evaluations={filteredEvaluations}
            allRotations={rotations}
            onSelectIntern={setSelectedProfileIntern}
            searchQuery={searchQuery}
            selectedDept={selectedDept}
            examsList={examsList}
            lang={lang}
          />

          {/* Individual Intern Detail Profile Modal */}
          {selectedProfileIntern && (
            <ProfileModal
              internName={selectedProfileIntern}
              evaluations={evaluations}
              allRotations={rotations}
              onClose={() => setSelectedProfileIntern(null)}
              onDeleteEvaluation={isReadOnlyAdmin ? null : handleDeleteEvaluation}
              onUpdateIntern={isReadOnlyAdmin ? null : handleUpdateIntern}
              examsList={examsList}
              lang={lang}
            />
          )}

        </div>
      )}

      {!loading && activeTab === "interns" && !isReadOnlyAdmin && (
        <ManageInterns
          rotations={rotations}
          onAddIntern={handleAddIntern}
          onUpdateIntern={handleUpdateIntern}
          onDeleteIntern={handleDeleteIntern}
          onBulkUpdateInterns={handleBulkUpdateInterns}
          onUpdateDepartments={handleUpdateDepartments}
          onUpdateExamsList={handleUpdateExamsList}
          lang={lang}
          mainDepartments={mainDepartments}
          secondaryDepartments={secondaryDepartments}
          examsList={examsList}
        />
      )}

    </Layout>
  );
}
