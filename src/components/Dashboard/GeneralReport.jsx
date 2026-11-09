import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { 
  FileSpreadsheet, 
  Printer, 
  Sliders, 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpDown, 
  ExternalLink, 
  Award, 
  Users, 
  Grid3X3, 
  ListFilter, 
  Maximize2, 
  Minimize2,
  Clock,
  Sparkles,
  BookOpen,
  Calendar
} from "lucide-react";
import InternImage from "../InternImage";
import { generateComprehensiveReport, DEFAULT_WEIGHTS } from "../../utils/fairnessCalculator";

export default function GeneralReport({
  rotations = [],
  evaluations = [],
  examsList = [],
  onSelectIntern,
  lang = "ar"
}) {
  const isRtl = lang === "ar";

  // Controls & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedTier, setSelectedTier] = useState("all");
  const [sortBy, setSortBy] = useState("compositeTotalScore"); // compositeTotalScore | practicalScorePct | academicScorePct | attendancePct | name
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"
  
  // View mode: "detailed" (with expandable drawers) vs "matrix" (all-departments side-by-side grid)
  const [viewMode, setViewMode] = useState("detailed"); 

  // Expandable row state
  const [expandedStudents, setExpandedStudents] = useState(new Set());

  // Fairness configuration
  const [normalizePractical, setNormalizePractical] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  // Calculate comprehensive report with fairness engine
  const reportData = useMemo(() => {
    return generateComprehensiveReport({
      rotations,
      evaluations,
      examsList,
      weights,
      normalizePractical
    });
  }, [rotations, evaluations, examsList, weights, normalizePractical]);

  const { students, benchmarks, globalMean, cohortSummary, allEvaluatedDepts } = reportData;

  // Extract all unique departments across rotations AND evaluations
  const departmentOptions = useMemo(() => {
    const set = new Set();
    rotations.forEach((r) => {
      if (r.main_department) set.add(r.main_department);
      if (r.secondary_department) set.add(r.secondary_department);
    });
    evaluations.forEach((ev) => {
      if (ev.department) set.add(ev.department);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, lang));
  }, [rotations, evaluations, lang]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
        // Match department if student was in it as main, secondary, or EVER served in it
        const matchesDept = !selectedDept || 
          s.mainDept === selectedDept || 
          s.secondaryDept === selectedDept || 
          (s.departmentsList && s.departmentsList.includes(selectedDept));
        const matchesTier = selectedTier === "all" || s.readinessTier === selectedTier;
        return matchesSearch && matchesDept && matchesTier;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (typeof valA === "string") {
          return sortOrder === "asc" ? valA.localeCompare(valB, lang) : valB.localeCompare(valA, lang);
        }
        return sortOrder === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });
  }, [students, searchQuery, selectedDept, selectedTier, sortBy, sortOrder, lang]);

  // Sorting toggle helper
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
  };

  // Toggle single student drawer
  const toggleStudentExpand = (name) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // Expand / collapse all
  const toggleExpandAll = () => {
    if (expandedStudents.size === filteredStudents.length) {
      setExpandedStudents(new Set());
    } else {
      setExpandedStudents(new Set(filteredStudents.map((s) => s.name)));
    }
  };

  // Export to Excel (.xlsx) across all departments and details
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Master Comprehensive Report with Every Department Column
    const rowsMaster = filteredStudents.map((s, idx) => {
      const row = {
        "م": idx + 1,
        "اسم الطالب": s.name,
        "الخدمة الأساسية الحالية": s.mainDept,
        "الخدمة الفرعية الحالية": s.secondaryDept,
        "جميع الخدمات التي خدم بها": (s.departmentsList || []).join(" | "),
        "عدد الخدمات التي خدم بها": (s.departmentsList || []).length,
        "الحالة والجاهزية": s.readinessLabel,
        "المجموع النهائي الموزون (%)": s.compositeTotalScore,
        "المتوسط الأكاديمي (%)": s.academicScorePct,
        "الامتحانات المكتملة": `${s.passedExamsCount} / ${s.totalExamsCount}`,
        "متوسط التقييم العملي المعاير (%)": s.normalizedPracticalScorePct,
        "متوسط التقييم العملي الخام (من 5)": s.rawPracticalScore,
        "إجمالي عدد التقييمات": s.evalCount,
        "نسبة الحضور والالتزام (%)": s.attendancePct,
        "إجمالي أيام الحضور": s.totalAttendance
      };

      // Add a dedicated column for EVERY department in the system!
      (allEvaluatedDepts || []).forEach((dept) => {
        const dData = s.departmentsMap && s.departmentsMap[dept];
        if (dData) {
          row[`خدمة: ${dept} (الدرجة)`] = `${dData.rawScore} / 5 (${dData.effectiveScorePct}%)`;
          row[`خدمة: ${dept} (الحضور)`] = `${dData.totalAttendance} يوم`;
        } else {
          row[`خدمة: ${dept} (الدرجة)`] = "لم يخدم بها";
          row[`خدمة: ${dept} (الحضور)`] = "—";
        }
      });

      // Add individual exams as columns
      examsList.forEach((exam) => {
        row[`امتحان: ${exam}`] = s.rawExams[exam] !== undefined ? s.rawExams[exam] : "لم يُرصد";
      });

      return row;
    });

    const wsMaster = XLSX.utils.json_to_sheet(rowsMaster);
    XLSX.utils.book_append_sheet(wb, wsMaster, isRtl ? "التقرير الشامل العام" : "Master Report");

    // Sheet 2: Detailed Rotations Log (Every department review ever entered)
    const rowsDetailed = [];
    filteredStudents.forEach((s) => {
      (s.departmentsHistory || []).forEach((dh) => {
        dh.evaluations.forEach((ev, evIdx) => {
          rowsDetailed.push({
            "اسم الطالب": s.name,
            "الخدمة": dh.name,
            "رقم التقييم بالخدمة": evIdx + 1,
            "الخادم المقيّم": ev.evaluator_name || "غير محدد",
            "التاريخ": ev.timestamp ? new Date(ev.timestamp).toLocaleDateString("ar-EG") : "—",
            "أيام الحضور": ev.attendance || 0,
            "الالتزام بالوقت (من 5)": ev.commitment_time || 0,
            "المظهر والروح الكنسية (من 5)": ev.church_spirit_appearance || 0,
            "تحضير الدرس / المهام (من 5)": ev.lesson_preparation || 0,
            "التعامل مع المخدومين (من 5)": ev.target_audience_handling || 0,
            "متوسط التقييم (من 5)": (
              ((ev.commitment_time || 0) +
                (ev.church_spirit_appearance || 0) +
                (ev.lesson_preparation || 0) +
                (ev.target_audience_handling || 0)) / 4
            ).toFixed(2),
            "نقاط القوة": ev.strengths || "—",
            "نقاط تحتاج تحسين": ev.improvements || "—",
            "ملاحظات المشرف": ev.notes || "—"
          });
        });
      });
    });

    const wsDetailed = XLSX.utils.json_to_sheet(rowsDetailed);
    XLSX.utils.book_append_sheet(wb, wsDetailed, isRtl ? "سجل الخدمات التفصيلي" : "All Departments Log");

    // Sheet 3: Department Calibration Benchmarks
    const deptRows = Object.values(benchmarks).map((b) => ({
      "الخدمة": b.name,
      "عدد التقييمات": b.evalCount,
      "متوسط تقييم الخدمة (من 5)": b.meanScore,
      "المتوسط العام للدفعة": b.globalMean,
      "فرق المعايرة (انحراف)": b.deviation,
      "تصنيف التقييم": b.strictness === "strict" ? "متشدد في التقييم" : b.strictness === "lenient" ? "متساهل في التقييم" : "معتدل",
      "متوسط الحضور بالخدمة": b.avgAttendance
    }));
    const wsDepts = XLSX.utils.json_to_sheet(deptRows);
    XLSX.utils.book_append_sheet(wb, wsDepts, isRtl ? "معايرة الخدمات" : "Department Benchmarks");

    // Save File
    const fileName = `E3dad_Full_Departments_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Printable Official Header (Only visible when printing) */}
      <div className="hidden print:block text-center font-arabic border-b-2 border-slate-800 pb-4 mb-6" dir="rtl">
        <h1 className="text-xl font-black text-slate-900">نظام تقييم إعداد خدام - التقرير الشامل التراكمي لجميع الخدمات</h1>
        <h2 className="text-sm font-bold text-slate-700 mt-1">
          {selectedDept ? `تقرير تفصيلي لطلاب خدمة: ${selectedDept}` : "كشف تقييم ومعدلات أداء الدفعة عبر كافة الخدمات والامتحانات"}
        </h2>
        <div className="flex justify-between items-center text-xs text-slate-600 mt-3 border-t border-slate-200 pt-2">
          <span>تاريخ التقرير: {new Date().toLocaleDateString("ar-EG")}</span>
          <span>عدد الطلاب المعروضين: {filteredStudents.length}</span>
          <span>نسبة الجاهزية للخدمة: {cohortSummary.readyRate}%</span>
          <span>المتوسط التراكمي العام: {cohortSummary.cohortAvgScore}%</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. Header & Actions
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Scale className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold font-arabic text-slate-800">
                {isRtl ? "التقرير العام التراكمي الشامل لكافة الخدمات" : "Complete Cross-Department Evaluation Report"}
              </h2>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                {isRtl 
                  ? "تقرير تفصيلي موحد يغطي كل خدمة خدم بها كل طالب، مع تحليل الأداء الأكاديمي والعملي والحضور"
                  : "Comprehensive student performance report across every department, exam, and rotation"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 font-arabic text-xs">
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "detailed"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>{isRtl ? "عرض السجل التفصيلي" : "Detailed Log"}</span>
            </button>

            <button
              onClick={() => setViewMode("matrix")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "matrix"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>{isRtl ? "مصفوفة جميع الخدمات" : "All-Depts Matrix"}</span>
            </button>
          </div>

          {/* Fairness calibration toggle */}
          <button
            onClick={() => setNormalizePractical(!normalizePractical)}
            className={`px-3.5 py-2 rounded-xl text-xs font-arabic font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
              normalizePractical
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
            title={isRtl ? "تعديل الدرجات لموازنة المشرفين المتشددين والمتساهلين" : "Adjust scores for evaluator strictness"}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isRtl 
                ? (normalizePractical ? "معايرة العدالة مفعلة ✓" : "الدرجات الخام (بدون معايرة)")
                : (normalizePractical ? "Fair Normalization ON" : "Raw Scores")}
            </span>
          </button>

          {/* Evaluator Audit */}
          <button
            onClick={() => setShowBenchmarks(!showBenchmarks)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-arabic font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Scale className="w-4 h-4 text-indigo-500" />
            <span>{isRtl ? "فحص انحياز الخدمات" : "Audit Evaluators"}</span>
            {showBenchmarks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Weight Settings Trigger */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-arabic font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>{isRtl ? "تخصيص الأوزان" : "Weights"}</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-arabic font-bold transition-all shadow-md shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isRtl ? "تصدير Excel الشامل (.xlsx)" : "Export Full Excel"}</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-arabic font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isRtl ? "طباعة التقرير" : "Print"}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Cohort High-Level KPI Cards
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-arabic">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-light block">{isRtl ? "إجمالي الطلاب" : "Total Students"}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-800 font-mono">{cohortSummary.totalStudents}</span>
              <span className="text-[10px] text-slate-400">طالب</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4 bg-emerald-50/20">
          <div className="w-12 h-12 rounded-xl bg-emerald-100/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-emerald-700 font-bold block">{isRtl ? "جاهز للرسامة / الخدمة" : "Ready to Serve"}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-700 font-mono">{cohortSummary.readyCount}</span>
              <span className="text-xs text-emerald-600 font-bold font-mono">({cohortSummary.readyRate}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 bg-amber-50/20">
          <div className="w-12 h-12 rounded-xl bg-amber-100/60 text-amber-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-amber-800 font-bold block">{isRtl ? "بانتظار استكمال متطلبات" : "In Progress / Pending"}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-800 font-mono">{cohortSummary.inProgressCount}</span>
              <span className="text-[10px] text-amber-700">طالب</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-light block">{isRtl ? "المتوسط التراكمي للدفعة" : "Cohort Average Score"}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-purple-600 font-mono">{cohortSummary.cohortAvgScore}%</span>
              <span className="text-[10px] text-slate-400">من 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. Collapsible: Weights Configuration Panel
         ───────────────────────────────────────────────────────────── */}
      {showConfig && (
        <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-md font-arabic space-y-4 animate-fade-in print:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                {isRtl ? "تخصيص أوزان التقييم الشامل للدفعة" : "Custom Evaluation Weights"}
              </h3>
            </div>
            <span className="text-xs text-indigo-600 font-mono font-bold">
              {Math.round((weights.academic + weights.practical + weights.attendance) * 100)}%
            </span>
          </div>

          <p className="text-xs text-slate-500 font-light leading-relaxed">
            {isRtl
              ? "يمكنك تعديل نسبة كل ركن من أركان التقييم الثلاثة لحساب المجموع التراكمي العادل لجميع الطلاب."
              : "Adjust the relative importance of academic exams, practical evaluations, and attendance."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Academic weight */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>📖 {isRtl ? "الامتحانات والدراسات الروحية" : "Academic Exams"}</span>
                <span className="text-indigo-600 font-mono text-sm">{Math.round(weights.academic * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.7"
                step="0.05"
                value={weights.academic}
                onChange={(e) => setWeights({ ...weights, academic: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Practical weight */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>🤝 {isRtl ? "التقييم العملي في الخدمات" : "Practical Fieldwork"}</span>
                <span className="text-indigo-600 font-mono text-sm">{Math.round(weights.practical * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.7"
                step="0.05"
                value={weights.practical}
                onChange={(e) => setWeights({ ...weights, practical: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Attendance weight */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>⏱️ {isRtl ? "الحضور ونسبة الالتزام" : "Attendance & Commitment"}</span>
                <span className="text-indigo-600 font-mono text-sm">{Math.round(weights.attendance * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={weights.attendance}
                onChange={(e) => setWeights({ ...weights, attendance: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setWeights(DEFAULT_WEIGHTS)}
              className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
            >
              {isRtl ? "استعادة الأوزان الافتراضية (40% - 40% - 20%)" : "Reset to default weights (40-40-20)"}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. Collapsible: Department Evaluators Calibration Audit
         ───────────────────────────────────────────────────────────── */}
      {showBenchmarks && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm font-arabic space-y-4 animate-fade-in print:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {isRtl ? "لوحة معايرة وتقييم انحياز مشرفي الخدمات" : "Department Evaluators Calibration & Bias Audit"}
                </h3>
                <span className="text-[10px] text-slate-400 font-light">
                  {isRtl 
                    ? `المتوسط العام للدفعة ككل هو ${globalMean} من 5. المعايرة تضبط تلقائياً فروق الشدة بين الخدمات.`
                    : `Global cohort average is ${globalMean}/5. Normalization automatically offsets strict/lenient evaluators.`}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {Object.values(benchmarks).map((b) => {
              const isStrict = b.strictness === "strict";
              const isLenient = b.strictness === "lenient";

              return (
                <div 
                  key={b.name}
                  className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between space-y-2 ${
                    isStrict
                      ? "bg-rose-50/40 border-rose-200 text-rose-900"
                      : isLenient
                      ? "bg-emerald-50/40 border-emerald-200 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm truncate max-w-[180px]">{b.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isStrict
                        ? "bg-rose-100 text-rose-700"
                        : isLenient
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {isStrict ? (isRtl ? "مشرف متشدد" : "Strict") : isLenient ? (isRtl ? "مشرف كريم" : "Lenient") : (isRtl ? "معتدل" : "Balanced")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/50">
                    <div>
                      <span className="text-slate-400 block text-[9px]">{isRtl ? "متوسط التقييم" : "Average"}</span>
                      <span className="font-bold font-mono text-sm">{b.meanScore} / 5</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">{isRtl ? "عدد التقييمات" : "Evals Count"}</span>
                      <span className="font-mono">{b.evalCount} تقييم</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{isRtl ? "تأثير المعايرة على طلاب الخدمة:" : "Fairness adjustment:"}</span>
                    <span className={`font-mono font-bold ${b.deviation < 0 ? "text-emerald-600" : "text-amber-600"}`}>
                      {b.deviation <= 0 ? `+${Math.abs(b.deviation)}` : `-${b.deviation}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. Search, Filter & Expand Controls
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 font-arabic print:hidden">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "بحث باسم الطالب..." : "Search by student name..."}
            className={`w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
              isRtl ? "pr-10 pl-3" : "pl-10 pr-3"
            }`}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">{isRtl ? "جميع الخدمات (خدم بها الطالب)" : "All Departments"}</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Readiness Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">{isRtl ? "جميع الحالات" : "All Statuses"}</option>
            <option value="ready">{isRtl ? "🟢 جاهز للخدمة (مستوفٍ)" : "Ready to Serve"}</option>
            <option value="incomplete_exams">{isRtl ? "🟡 يحتاج استكمال امتحانات" : "Incomplete Exams"}</option>
            <option value="needs_practical">{isRtl ? "🟠 يحتاج متابعة عملية" : "Needs Practical"}</option>
            <option value="at_risk">{isRtl ? "🔴 تحت الملاحظة" : "At Risk"}</option>
          </select>

          {/* Expand/Collapse All */}
          {viewMode === "detailed" && (
            <button
              onClick={toggleExpandAll}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {expandedStudents.size === filteredStudents.length ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isRtl ? "طي تفاصيل الخدمات" : "Collapse All"}</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isRtl ? "عرض تفاصيل كل الخدمات للجميع" : "Expand All"}</span>
                </>
              )}
            </button>
          )}

          {/* Reset Filters */}
          {(searchQuery || selectedDept || selectedTier !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDept("");
                setSelectedTier("all");
              }}
              className="py-2 px-3 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              {isRtl ? "إعادة ضبط" : "Reset"}
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6A. VIEW MODE 1: Detailed Table with Expandable Full-Department Drawers
         ───────────────────────────────────────────────────────────── */}
      {viewMode === "detailed" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden font-arabic">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-3 text-center w-10">#</th>
                  <th 
                    onClick={() => handleSort("name")}
                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isRtl ? "الطالب والخدمات التي خدم بها" : "Student & Departments"}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("academicScorePct")}
                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isRtl ? "الامتحانات (40%)" : "Academic (40%)"}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("practicalScorePct")}
                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isRtl ? "متوسط كل الخدمات (40%)" : "All Services Avg (40%)"}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("attendancePct")}
                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isRtl ? "الحضور (20%)" : "Attendance (20%)"}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("compositeTotalScore")}
                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{isRtl ? "المجموع التراكمي الموزون" : "Composite Total"}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center">{isRtl ? "الحالة والجاهزية" : "Readiness Status"}</th>
                  <th className="py-4 px-4 text-center print:hidden">{isRtl ? "التفاصيل" : "Details"}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <span>{isRtl ? "لا توجد نتائج مطابقة لخيارات البحث أو الفلترة" : "No matching student records found."}</span>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => {
                    const isExpanded = expandedStudents.has(s.name);
                    const deptsList = s.departmentsHistory || [];

                    return (
                      <React.Fragment key={s.name}>
                        <tr 
                          className={`hover:bg-indigo-50/20 transition-colors duration-150 group ${
                            isExpanded ? "bg-indigo-50/30" : ""
                          }`}
                        >
                          {/* Rank Index */}
                          <td className="py-4 px-3 text-center font-mono font-bold text-slate-400 text-xs">
                            {idx + 1}
                          </td>

                          {/* Student Info & Departments Badges */}
                          <td className="py-4 px-4">
                            <div className="flex items-start gap-3">
                              <InternImage
                                photoId={s.photoId}
                                name={s.name}
                                className="w-10 h-10 rounded-full border border-slate-200 object-cover flex-shrink-0 mt-0.5"
                              />
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                                    {s.name}
                                  </span>
                                </div>

                                {/* Badges of ALL departments served */}
                                <div className="flex flex-wrap items-center gap-1">
                                  {deptsList.length === 0 ? (
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                      {isRtl ? "لم يُقيّم بعد في أي خدمة" : "No evaluations recorded"}
                                    </span>
                                  ) : (
                                    deptsList.map((dh) => (
                                      <span 
                                        key={dh.name}
                                        className="inline-flex items-center gap-1 text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-medium"
                                        title={`${dh.evalCount} تقييمات | متوسط: ${dh.rawScore} من 5 | حضور: ${dh.totalAttendance} يوم`}
                                      >
                                        <span>{dh.name}</span>
                                        <span className="font-bold text-indigo-600 font-mono">
                                          {dh.rawScore}★
                                        </span>
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Academic / Exams */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-slate-800 text-xs">
                                  {s.academicScorePct}%
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {s.passedExamsCount} / {s.totalExamsCount}
                                </span>
                              </div>
                              <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${s.academicScorePct >= 70 ? "bg-indigo-600" : "bg-amber-500"}`}
                                  style={{ width: `${s.examCompletionRate}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Practical Service (Raw + Normalized) */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-800 text-xs">
                                  {s.practicalScorePct}%
                                </span>
                                {normalizePractical && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono" title="الدرجة بعد معايرة شدة المشرف">
                                    معاير
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span>الخام: {s.rawPracticalScore} / 5</span>
                                <span>({deptsList.length} خدمات)</span>
                                {s.isLowSample && (
                                  <span className="text-amber-500 font-bold" title="تقييم واحد فقط مسجل!">⚠️</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Attendance */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-slate-800 text-xs">
                                {s.attendancePct}%
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {s.totalAttendance} يوم حضور
                              </span>
                            </div>
                          </td>

                          {/* Composite Total */}
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-xl font-mono font-black text-sm border shadow-sm ${
                              s.compositeTotalScore >= 75
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : s.compositeTotalScore >= 60
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {s.compositeTotalScore}%
                            </span>
                          </td>

                          {/* Readiness Classification Badge */}
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              s.readinessTier === "ready"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : s.readinessTier === "incomplete_exams"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : s.readinessTier === "needs_practical"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {s.readinessTier === "ready" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {s.readinessTier === "incomplete_exams" && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                              <span>{s.readinessLabel}</span>
                            </span>
                          </td>

                          {/* Action: Expand & Open Profile */}
                          <td className="py-4 px-4 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => toggleStudentExpand(s.name)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border ${
                                  isExpanded
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                                }`}
                                title={isRtl ? "عرض تفاصيل كل خدمة خدم بها الطالب" : "Toggle all department details"}
                              >
                                <span>{deptsList.length} خدمات</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={() => onSelectIntern && onSelectIntern(s.name)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                                title={isRtl ? "عرض بطاقة الطالب الفردية وتعديل الامتحانات" : "View Dossier"}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ─────────────────────────────────────────────────────────────
                            Expanded Full-Department Breakdown Drawer
                           ───────────────────────────────────────────────────────────── */}
                        {(isExpanded || window.matchMedia?.("print")?.matches) && (
                          <tr className="bg-slate-50/80 border-b-2 border-indigo-100">
                            <td colSpan="8" className="p-4 md:p-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-indigo-600" />
                                    <h4 className="font-bold text-slate-800 text-xs">
                                      {isRtl 
                                        ? `سجل تقييمات الطالب في جميع الخدمات التي شارك بها (${deptsList.length} خدمات مسجلة)`
                                        : `Evaluations across all participating departments (${deptsList.length} recorded)`}
                                    </h4>
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {isRtl ? "درجات الخدمات الأربعة (الوقت، المظهر، الدرس، المخدومين)" : "4 Core criteria scores"}
                                  </span>
                                </div>

                                {deptsList.length === 0 ? (
                                  <div className="text-center py-4 text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                                    {isRtl ? "لا توجد تقييمات عملية مسجلة لهذا الطالب حتى الآن." : "No practical service evaluations recorded yet."}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {deptsList.map((dh) => (
                                      <div 
                                        key={dh.name}
                                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
                                      >
                                        {/* Dept Header */}
                                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                                          <div>
                                            <span className="font-bold text-slate-800 text-xs block">
                                              {dh.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                              <span>{dh.evalCount} تقييمات</span>
                                              {dh.evaluators.length > 0 && (
                                                <span>• بواسطة: {dh.evaluators.join(", ")}</span>
                                              )}
                                            </span>
                                          </div>

                                          <div className="text-left flex-shrink-0">
                                            <span className="text-xs font-black font-mono text-indigo-600 block">
                                              {dh.rawScore} / 5
                                            </span>
                                            <span className="text-[9px] text-emerald-600 font-bold font-mono">
                                              {dh.effectiveScorePct}%
                                            </span>
                                          </div>
                                        </div>

                                        {/* 4 Core Criteria Breakdown */}
                                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                          <div className="space-y-0.5">
                                            <span className="text-slate-400 block text-[9px]">⏱️ الالتزام بالوقت</span>
                                            <span className="font-bold font-mono text-slate-700">{dh.avgCommitment} / 5</span>
                                          </div>
                                          <div className="space-y-0.5">
                                            <span className="text-slate-400 block text-[9px]">⛪ المظهر الكنسي</span>
                                            <span className="font-bold font-mono text-slate-700">{dh.avgAppearance} / 5</span>
                                          </div>
                                          <div className="space-y-0.5">
                                            <span className="text-slate-400 block text-[9px]">📖 تحضير الدرس</span>
                                            <span className="font-bold font-mono text-slate-700">{dh.avgLesson} / 5</span>
                                          </div>
                                          <div className="space-y-0.5">
                                            <span className="text-slate-400 block text-[9px]">👥 مع المخدومين</span>
                                            <span className="font-bold font-mono text-slate-700">{dh.avgAudience} / 5</span>
                                          </div>
                                        </div>

                                        {/* Attendance in this department */}
                                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            <span>حضور هذه الخدمة:</span>
                                          </span>
                                          <span className="font-bold font-mono text-slate-700">
                                            {dh.totalAttendance} يوم ({dh.avgAttendance} يوم/جلسة)
                                          </span>
                                        </div>

                                        {/* Feedback & Supervisor Notes */}
                                        {(dh.strengths.length > 0 || dh.improvements.length > 0 || dh.notes.length > 0) && (
                                          <div className="text-[10px] space-y-1 pt-2 border-t border-slate-100 bg-amber-50/20 -mx-1 p-2 rounded-xl">
                                            {dh.strengths.length > 0 && (
                                              <div className="text-emerald-800">
                                                <span className="font-bold">🌟 نقاط القوة: </span>
                                                <span>{dh.strengths.join(" — ")}</span>
                                              </div>
                                            )}
                                            {dh.improvements.length > 0 && (
                                              <div className="text-amber-800">
                                                <span className="font-bold">💡 للتحسين: </span>
                                                <span>{dh.improvements.join(" — ")}</span>
                                              </div>
                                            )}
                                            {dh.notes.length > 0 && (
                                              <div className="text-slate-600">
                                                <span className="font-bold">📝 ملاحظات: </span>
                                                <span>{dh.notes.join(" — ")}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Exams mini-summary */}
                                <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2 text-[10px]">
                                  <span className="font-bold text-slate-700">📋 الامتحانات المكتملة ({s.passedExamsCount} / {s.totalExamsCount}):</span>
                                  {examsList.map((exam) => {
                                    const val = s.rawExams[exam];
                                    const hasVal = val !== undefined && val !== null && val !== "";
                                    const isPassed = hasVal && Number(val) >= 70;
                                    return (
                                      <span
                                        key={exam}
                                        className={`px-2 py-0.5 rounded-md font-mono border ${
                                          hasVal
                                            ? isPassed
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                                              : "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                                            : "bg-slate-50 text-slate-400 border-slate-200"
                                        }`}
                                      >
                                        {exam}: {hasVal ? val : "—"}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6B. VIEW MODE 2: All-Departments Full Comparison Matrix
         ───────────────────────────────────────────────────────────── */}
      {viewMode === "matrix" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden font-arabic">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              {isRtl 
                ? "مصفوفة مقارنة أداء الطلاب عبر جميع الخدمات المسجلة في النظام" 
                : "Cross-Department Comparison Matrix"}
            </span>
            <span className="text-[10px] text-slate-400">
              {isRtl ? "توضح درجات الطالب في كل خدمة خدم بها جنباً إلى جنب" : "Side-by-side grades for every service rotated"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600">
                  <th className="py-3 px-3 text-center w-8">#</th>
                  <th className="py-3 px-4 min-w-[180px] sticky right-0 bg-slate-50 shadow-sm z-10">
                    {isRtl ? "اسم الطالب" : "Student Name"}
                  </th>
                  
                  {/* Dynamic Columns for EVERY department in the system */}
                  {(allEvaluatedDepts || []).map((dept) => (
                    <th key={dept} className="py-3 px-3 min-w-[120px] text-center border-r border-slate-200/50">
                      <span className="block truncate max-w-[120px]" title={dept}>{dept}</span>
                    </th>
                  ))}

                  <th className="py-3 px-3 text-center min-w-[80px] bg-indigo-50/50">
                    {isRtl ? "الامتحانات" : "Exams"}
                  </th>
                  <th className="py-3 px-3 text-center min-w-[80px] bg-slate-100/50">
                    {isRtl ? "الحضور" : "Att."}
                  </th>
                  <th className="py-3 px-3 text-center min-w-[90px] bg-purple-50/50">
                    {isRtl ? "المجموع الموزون" : "Total"}
                  </th>
                  <th className="py-3 px-3 text-center min-w-[110px]">
                    {isRtl ? "الحالة" : "Status"}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6 + (allEvaluatedDepts || []).length} className="py-12 text-center text-slate-400">
                      {isRtl ? "لا توجد بيانات مطابقة للفلترة." : "No matching records."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <tr key={s.name} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                      
                      {/* Name sticky */}
                      <td className="py-3 px-4 font-bold text-slate-800 sticky right-0 bg-white shadow-sm z-10">
                        <div className="flex items-center gap-2">
                          <InternImage
                            photoId={s.photoId}
                            name={s.name}
                            className="w-7 h-7 rounded-full border border-slate-200 object-cover flex-shrink-0"
                          />
                          <span className="truncate max-w-[140px]">{s.name}</span>
                        </div>
                      </td>

                      {/* Score in EVERY evaluated department */}
                      {(allEvaluatedDepts || []).map((dept) => {
                        const dData = s.departmentsMap && s.departmentsMap[dept];
                        if (!dData) {
                          return (
                            <td key={dept} className="py-3 px-3 text-center text-slate-300 border-r border-slate-100 font-mono">
                              —
                            </td>
                          );
                        }

                        return (
                          <td key={dept} className="py-3 px-3 text-center border-r border-slate-100 bg-indigo-50/5">
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-indigo-700 block">
                                {dData.rawScore}★
                              </span>
                              <span className="text-[9px] text-slate-400 block font-mono">
                                ({dData.totalAttendance} يوم)
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      {/* Exams */}
                      <td className="py-3 px-3 text-center bg-indigo-50/30 font-mono font-bold text-indigo-900">
                        {s.academicScorePct}%
                      </td>

                      {/* Attendance */}
                      <td className="py-3 px-3 text-center bg-slate-50 font-mono text-slate-700">
                        {s.attendancePct}%
                      </td>

                      {/* Composite Total */}
                      <td className="py-3 px-3 text-center bg-purple-50/30 font-mono font-black text-purple-700">
                        {s.compositeTotalScore}%
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          s.readinessTier === "ready"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : s.readinessTier === "incomplete_exams"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {s.readinessLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
