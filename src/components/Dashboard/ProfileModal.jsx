import React, { useState } from "react";
import { X, Calendar, User, TrendingUp, FileText, Trash2 } from "lucide-react";
import { translations } from "../../translations";
import InternImage from "../InternImage";
import { calculateInternOverallScore } from "../../utils/scoreCalculator";

// examsList is now passed as a prop (examsList) from App.jsx — loaded from Firebase

const EXAM_ICONS = {
  "كتاب مقدس": "📖",
  "عقيده": "🛡️",
  "تاريخ كنيسه": "⛪",
  "دفاعيات": "⚔️",
  "لاهوت روحي": "🔥",
  "كورس كيف اخدم": "💼",
  "طقس": "🕯️",
  "ابائيات": "📜",
  "نمو شخصيه": "🌱",
  "لاهوت مقارن": "⚖️",
  "خلوة": "🧘",
  "مؤتمر": "👥",
  "Summer project": "☀️"
};

export default function ProfileModal({ internName, evaluations, allRotations, onClose, onDeleteEvaluation, onUpdateIntern, examsList = [], lang }) {
  const t = translations[lang];
  const isRtl = lang === "ar";

  if (!internName) return null;

  // 1. Find intern details from rotations
  const rotationInfo = allRotations.find((r) => r.intern_name === internName) || {
    intern_name: internName,
    main_department: isRtl ? "غير محدد" : "Unspecified",
    secondary_department: "",
    drive_photo_id: ""
  };

  const scoreResult = calculateInternOverallScore(internName, evaluations);
  const totalEvals = scoreResult.totalEvals;
  const evaluatedDepts = Object.keys(scoreResult.departments);

  // Dynamic active tab switcher (Departments & Exams)
  const allTabs = [...evaluatedDepts, "exams"];
  const [activeTabState, setActiveTabState] = useState(evaluatedDepts[0] || "exams");
  const currentTab = allTabs.includes(activeTabState) ? activeTabState : "exams";

  // Keep activeDeptState references working where needed
  const currentDept = evaluatedDepts.includes(currentTab) ? currentTab : "";

  // Exams editing state
  const [editingExam, setEditingExam] = useState(null);
  const [editGradeVal, setEditGradeVal] = useState("");

  const metrics = [
    { key: "commitment_time", label: t.radarCommitment, color: "bg-rose-500" },
    { key: "church_spirit_appearance", label: t.radarAppearance, color: "bg-amber-500" },
    { key: "lesson_preparation", label: t.radarLesson, color: "bg-teal-500" },
    { key: "target_audience_handling", label: t.radarAudience, color: "bg-indigo-600" },
  ];

  // Calculate overall criteria averages across evaluated departments
  const deptCount = evaluatedDepts.length;
  const overallCriteriaAverages = {
    commitment_time: 0,
    church_spirit_appearance: 0,
    lesson_preparation: 0,
    target_audience_handling: 0
  };

  if (deptCount > 0) {
    let commitmentSum = 0;
    let appearanceSum = 0;
    let lessonSum = 0;
    let audienceSum = 0;

    evaluatedDepts.forEach((key) => {
      const d = scoreResult.departments[key];
      commitmentSum += d.avgCommitment;
      appearanceSum += d.avgAppearance;
      lessonSum += d.avgLesson;
      audienceSum += d.avgAudience;
    });

    overallCriteriaAverages.commitment_time = commitmentSum / deptCount;
    overallCriteriaAverages.church_spirit_appearance = appearanceSum / deptCount;
    overallCriteriaAverages.lesson_preparation = lessonSum / deptCount;
    overallCriteriaAverages.target_audience_handling = audienceSum / deptCount;
  }

  const overallScore = scoreResult.overallScore.toFixed(2);
  const totalAttendance = scoreResult.totalAttendance;
  const avgAttendance = totalEvals ? (totalAttendance / totalEvals).toFixed(1) : "0.0";

  const getInitials = (name) => {
    if (!name) return "ط";
    const parts = name.split(" ");
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return name[0];
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className={`bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col overflow-y-auto md:overflow-hidden max-h-[95vh] md:max-h-[85vh] animate-scale-up ${
        isRtl ? "md:flex-row text-right" : "md:flex-row text-left"
      }`} dir={isRtl ? "rtl" : "ltr"}>
        
        {/* Left/Top Sidebar: Overview & Metrics (1/3 width) */}
        <div className="bg-slate-900 text-slate-100 p-6 md:w-80 border-b md:border-b-0 border-slate-800 flex flex-col items-center flex-shrink-0" dir={isRtl ? "rtl" : "ltr"}>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className={`self-end md:hidden text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer`}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Avatar / Photo */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl mb-4 bg-slate-800 flex items-center justify-center flex-shrink-0">
            <InternImage
              internName={internName}
              drivePhotoId={rotationInfo.drive_photo_id}
              className="w-full h-full"
              initialsClassName="text-3xl"
            />
          </div>

          <h3 className="text-xl font-bold text-white font-arabic text-center mb-1">{internName}</h3>
          <span className="text-[10px] text-slate-400 font-light block mb-4">{t.profileCardSub}</span>
          
          <div className="w-full space-y-2 text-xs text-slate-300 font-arabic border-b border-slate-800 pb-4 mb-4">
            <div className="flex justify-between">
              <span className="text-slate-400">{t.profileMainDept}:</span>
              <span className="font-medium">{rotationInfo.main_department}</span>
            </div>
            {rotationInfo.secondary_department && (
              <div className="flex justify-between">
                <span className="text-slate-400">{t.profileSecDept}:</span>
                <span className="font-medium">{rotationInfo.secondary_department}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">{t.profileTotalAttendance}:</span>
              <span className="font-semibold text-teal-400">
                {totalAttendance} {isRtl ? "أيام" : "days"} ({t.profileAttendanceAverage.replace("{avg}", avgAttendance)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t.profileSessionsCount}:</span>
              <span className="font-semibold text-indigo-400">{totalEvals}</span>
            </div>
          </div>

          {/* Average Scores Indicators */}
          <div className="w-full space-y-4">
            <div className="text-center font-arabic border-b border-slate-800 pb-3">
              <span className="text-[10px] text-slate-400 block font-light">{t.profileCompositeAvg}</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-3xl font-black text-indigo-400 font-mono">{overallScore}</span>
                <span className="text-sm text-slate-500 font-light font-mono">/ 5.0</span>
              </div>
            </div>

            <div className="hidden md:block space-y-3 font-arabic">
              <span className="text-[10px] text-slate-400 font-light block">{t.profileCriteriaTitle}:</span>
              {metrics.map((m) => {
                const score = overallCriteriaAverages[m.key];
                const pct = (score / 5) * 100;
                
                let scoreColorClass = "text-slate-300";
                if (score >= 4.0) scoreColorClass = "text-emerald-400 font-bold";
                else if (score < 3.0 && score > 0) scoreColorClass = "text-rose-400 font-bold";

                return (
                  <div key={m.key} className="space-y-1">
                    <div className={`flex justify-between text-xs leading-none ${isRtl ? "" : "flex-row-reverse"}`}>
                      <span className={`font-mono text-xs ${scoreColorClass}`}>{score ? score.toFixed(1) : "-"}</span>
                      <span className="text-slate-300 font-medium">{m.label}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`${m.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Area: Evaluation History Timeline (2/3 width) */}
        <div className="flex-1 flex flex-col p-6 overflow-visible md:overflow-hidden bg-slate-50">
          
          {/* Header Row */}
          <div className={`flex justify-between items-center mb-5 border-b border-slate-200 pb-3 ${
            isRtl ? "flex-row-reverse" : "flex-row"
          }`}>
            {/* Close button for desktop */}
            <button
              onClick={onClose}
              className="hidden md:block text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className={isRtl ? "text-right" : "text-left"} dir={isRtl ? "rtl" : "ltr"}>
              <h2 className="text-lg font-bold font-arabic text-slate-800">{t.profileTitle}</h2>
              <span className="text-[10px] text-slate-400 font-light">{t.profileSub}</span>
            </div>
          </div>

          {/* Department & Exams Tabs */}
          <div className="flex flex-wrap gap-1.5 mb-5 bg-slate-200/60 p-1 rounded-xl border border-slate-200/40">
            {evaluatedDepts.map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveTabState(dept)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-arabic font-semibold transition-all duration-200 cursor-pointer ${
                  currentTab === dept
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {dept}
              </button>
            ))}
            <button
              onClick={() => setActiveTabState("exams")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-arabic font-semibold transition-all duration-200 cursor-pointer ${
                currentTab === "exams"
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {isRtl ? "📋 درجات الامتحانات" : "📋 Exam Grades"}
            </button>
          </div>

          {/* Timeline & Department Details */}
          <div className="flex-1 overflow-visible md:overflow-y-auto space-y-5 pr-2">
            {currentTab === "exams" ? (
              <div className="space-y-6 animate-fade-in font-arabic">
                {/* Header Info */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
                  <div className={isRtl ? "text-right" : "text-left"} dir={isRtl ? "rtl" : "ltr"}>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {isRtl ? "كشف درجات امتحانات الطلاب" : "Student Exams Transcript"}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-light block">
                      {isRtl 
                        ? "درجة النجاح هي 70% أو أكثر. اضغط على 'رصد الدرجة' لتسجيل الدرجات."
                        : "Passing grade is 70% or more. Click 'Edit Grade' to register grades."}
                    </span>
                  </div>
                </div>

                {/* Overall Exams Progress Overview */}
                {(() => {
                  const grades = rotationInfo.exams || {};
                  const totalExams = examsList.length;
                  const passedCount = Object.keys(grades).filter(k => examsList.includes(k) && grades[k] !== "" && Number(grades[k]) >= 70).length;
                  const percentPassed = totalExams > 0 ? Math.round((passedCount / totalExams) * 100) : 0;
                  
                  return (
                    <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100/60 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4 justify-between" dir={isRtl ? "rtl" : "ltr"}>
                      <div className="space-y-1 text-center sm:text-right flex-1 w-full">
                        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
                          {isRtl ? "معدل إتمام الامتحانات" : "Exams Completion"}
                        </span>
                        <h4 className="text-sm font-black text-slate-800">
                          {isRtl 
                            ? `تم اجتياز ${passedCount} من أصل ${totalExams} امتحانات بنجاح` 
                            : `Passed ${passedCount} of ${totalExams} exams successfully`}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-light">
                          {isRtl ? "درجة النجاح في كل امتحان هي 70% على الأقل" : "Passing grade for each exam is 70% or higher"}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[120px]">
                        <span className="text-xl font-black text-indigo-600 font-mono">{percentPassed}%</span>
                        <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${percentPassed}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Exams Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {examsList.map((exam) => {
                    const grades = rotationInfo.exams || {};
                    const grade = grades[exam];
                    const isExamEditing = editingExam === exam;
                    const hasGrade = grade !== undefined && grade !== null && grade !== "";
                    const isPassed = hasGrade && Number(grade) >= 70;
                    const icon = EXAM_ICONS[exam] || "📋";

                    return (
                      <div
                        key={exam}
                        className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between ${
                          hasGrade
                            ? isPassed
                              ? "border-emerald-200 bg-emerald-50/5"
                              : "border-rose-200 bg-rose-50/5"
                            : "border-slate-200 hover:border-indigo-100"
                        }`}
                      >
                        {/* Card Top: Title & Status Badge */}
                        <div className="flex items-center justify-between gap-2" dir={isRtl ? "rtl" : "ltr"}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-base flex-shrink-0 select-none">{icon}</span>
                            <span className="font-bold text-slate-800 text-xs truncate text-right w-full">{exam}</span>
                          </div>
                          {hasGrade ? (
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                isPassed
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {isPassed ? (isRtl ? "ناجح" : "Passed") : (isRtl ? "يحتاج تحسين" : "Action Needed")}
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-500">
                              {isRtl ? "غير مرصود" : "Not Set"}
                            </span>
                          )}
                        </div>

                        {/* Card Middle: Score & Input Field */}
                        <div className="my-3 flex items-center justify-between" dir={isRtl ? "rtl" : "ltr"}>
                          {isExamEditing ? (
                            <div className="flex items-center gap-1 w-full justify-start">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editGradeVal}
                                onChange={(e) => setEditGradeVal(e.target.value)}
                                className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold font-mono"
                                placeholder="0-100"
                                autoFocus
                              />
                              <span className="text-xs text-slate-400 font-mono">%</span>
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-0.5">
                              {hasGrade ? (
                                <>
                                  <span className={`text-2xl font-black font-mono ${isPassed ? "text-emerald-600" : "text-rose-600"}`}>
                                    {grade}
                                  </span>
                                  <span className="text-xs text-slate-400 font-mono">%</span>
                                </>
                              ) : (
                                <span className="text-xl font-bold text-slate-300 font-mono">-</span>
                              )}
                            </div>
                          )}

                          {/* Edit Actions */}
                          <div>
                            {isExamEditing ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const val = Number(editGradeVal);
                                    if (editGradeVal !== "" && (isNaN(val) || val < 0 || val > 100)) {
                                      alert(isRtl ? "الرجاء إدخال درجة صحيحة بين 0 و 100!" : "Please enter a valid grade between 0 and 100!");
                                      return;
                                    }
                                    const updatedGrades = {
                                      ...(rotationInfo.exams || {}),
                                      [exam]: editGradeVal === "" ? "" : val
                                    };
                                    onUpdateIntern(internName, {
                                      ...rotationInfo,
                                      exams: updatedGrades
                                    });
                                    setEditingExam(null);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  {isRtl ? "حفظ" : "Save"}
                                </button>
                                <button
                                  onClick={() => setEditingExam(null)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors"
                                >
                                  {isRtl ? "إلغاء" : "Cancel"}
                                </button>
                              </div>
                            ) : (
                              onUpdateIntern && (
                                <button
                                  onClick={() => {
                                    setEditingExam(exam);
                                    setEditGradeVal(hasGrade ? String(grade) : "");
                                  }}
                                  className="px-2.5 py-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer text-[10px] font-bold"
                                >
                                  {isRtl ? "رصد الدرجة" : "Edit Grade"}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Card Bottom: Progress Bar */}
                        {hasGrade && !isExamEditing && (
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isPassed ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${grade}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : totalEvals === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 font-arabic text-center">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-bold text-slate-500">{t.profileNoHistory}</p>
              </div>
            ) : (
              <>
                {currentDept && scoreResult.departments[currentDept] && (() => {
                  const deptInfo = scoreResult.departments[currentDept];
                  return (
                    <div className="space-y-5">
                      {/* Department Stats Scorecard */}
                      <div className="grid grid-cols-3 gap-3 font-arabic text-slate-800">
                        <div className="bg-indigo-50/50 border border-indigo-100/60 rounded-2xl p-3 text-center">
                          <span className="text-[9px] text-slate-400 block font-light">{lang === "ar" ? "معدل القسم" : "Dept Score"}</span>
                          <span className="text-lg font-bold text-indigo-600 font-mono">{deptInfo.overallScore.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">/5.0</span>
                        </div>
                        <div className="bg-teal-50/50 border border-teal-100/60 rounded-2xl p-3 text-center">
                          <span className="text-[9px] text-slate-400 block font-light">{lang === "ar" ? "حضور القسم" : "Dept Attendance"}</span>
                          <span className="text-lg font-bold text-teal-600 font-mono">{deptInfo.avgAttendance.toFixed(1)}</span>
                          <span className="text-[9px] text-slate-400 block truncate"> {isRtl ? "يوم/جلسة" : "days/eval"}</span>
                        </div>
                        <div className="bg-amber-50/50 border border-amber-100/60 rounded-2xl p-3 text-center">
                          <span className="text-[9px] text-slate-400 block font-light">{lang === "ar" ? "التقييمات" : "Evals Count"}</span>
                          <span className="text-lg font-bold text-amber-600 font-mono">{deptInfo.evalCount}</span>
                          <span className="text-[9px] text-slate-400 block"> {isRtl ? "تقييمات" : "evals"}</span>
                        </div>
                      </div>

                      {/* Department Criteria Breakdown */}
                      <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm font-arabic">
                        <h4 className="text-xs font-bold text-slate-800 mb-3">{lang === "ar" ? "معايير تقييم القسم" : "Department Criteria Scores"}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {metrics.map((m) => {
                            let score = 0;
                            if (m.key === "commitment_time") score = deptInfo.avgCommitment;
                            else if (m.key === "church_spirit_appearance") score = deptInfo.avgAppearance;
                            else if (m.key === "lesson_preparation") score = deptInfo.avgLesson;
                            else if (m.key === "target_audience_handling") score = deptInfo.avgAudience;

                            const pct = (score / 5) * 100;
                            let scoreColorClass = "text-slate-700";
                            if (score >= 4.0) scoreColorClass = "text-emerald-600 font-bold";
                            else if (score < 3.0 && score > 0) scoreColorClass = "text-rose-600 font-bold";

                            return (
                              <div key={m.key} className="space-y-1">
                                <div className={`flex justify-between text-[11px] leading-none ${isRtl ? "" : "flex-row-reverse"}`}>
                                  <span className={`font-mono text-[11px] ${scoreColorClass}`}>{score ? score.toFixed(1) : "-"} / 5</span>
                                  <span className="text-slate-600 font-medium">{m.label}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`${m.color} h-full rounded-full transition-all duration-300`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Department specific timeline */}
                      <div className={`relative pr-4 space-y-5 ${
                        isRtl ? "border-r-2 border-indigo-100 mr-4 pl-4" : "border-l-2 border-indigo-100 ml-4 pr-4"
                      }`} dir={isRtl ? "rtl" : "ltr"}>
                        {deptInfo.evaluations.map((ev, index) => {
                          const evDate = new Date(ev.timestamp);
                          const formattedDate = evDate.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          });

                          const compositeScore = (
                            ((ev.commitment_time || 0) +
                              (ev.church_spirit_appearance || 0) +
                              (ev.lesson_preparation || 0) +
                              (ev.target_audience_handling || 0)) /
                            4
                          ).toFixed(1);

                          return (
                            <div key={index} className="relative pr-6">
                              {/* Timeline dot */}
                              <span className={`absolute top-1.5 transform w-4 h-4 rounded-full bg-white border-4 border-indigo-500 z-10 flex items-center justify-center shadow-sm ${
                                isRtl ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2"
                              }`}></span>

                              {/* Card Content */}
                              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                {/* Session Metadata Header */}
                                <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 border-b border-slate-100 pb-3 mb-3 text-xs font-arabic ${
                                  isRtl ? "" : "flex-row-reverse"
                                }`}>
                                  <div className={`space-y-1 ${isRtl ? "text-right" : "text-left"}`}>
                                    <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                      {formattedDate}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-slate-400 font-light">
                                      <User className="w-3.5 h-3.5 text-slate-300" />
                                      {t.profileEvalBy}: {ev.evaluator_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {onDeleteEvaluation && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteEvaluation(ev.timestamp, ev.intern_name);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer mr-1"
                                        title={isRtl ? "حذف هذا التقييم" : "Delete this evaluation"}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono text-[11px] font-bold flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      {compositeScore} / 5
                                    </span>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                      {t.profileAttendanceDays.replace("{count}", ev.attendance)}
                                    </span>
                                  </div>
                                </div>

                                {/* Core Averages inside this session */}
                                <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs font-arabic border-b border-slate-100 pb-3 ${
                                  isRtl ? "text-right" : "text-left"
                                }`}>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{t.radarCommitment}:</span>
                                    <span className="font-mono font-bold text-slate-700">{ev.commitment_time} / 5</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{t.radarAppearance}:</span>
                                    <span className="font-mono font-bold text-slate-700">{ev.church_spirit_appearance} / 5</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{t.radarLesson}:</span>
                                    <span className="font-mono font-bold text-slate-700">{ev.lesson_preparation} / 5</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{t.radarAudience}:</span>
                                    <span className="font-mono font-bold text-slate-700">{ev.target_audience_handling} / 5</span>
                                  </div>
                                </div>

                                {/* Qualitative Comments */}
                                <div className="space-y-2.5 text-xs font-arabic">
                                  {ev.strengths && (
                                    <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                      <span className="text-emerald-700 font-bold block mb-1 text-[10px]">💪 {t.profileStrengths}:</span>
                                      <p className="text-slate-600 font-light leading-relaxed">{ev.strengths}</p>
                                    </div>
                                  )}

                                  {ev.areas_of_improvement && (
                                    <div className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100/50">
                                      <span className="text-rose-700 font-bold block mb-1 text-[10px]">⚠️ {t.profileImprovements}:</span>
                                      <p className="text-slate-600 font-light leading-relaxed">{ev.areas_of_improvement}</p>
                                    </div>
                                  )}

                                  {ev.notes && (
                                    <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/40">
                                      <span className="text-slate-600 font-bold block mb-1 text-[10px]">📝 {t.profileNotes}:</span>
                                      <p className="text-slate-500 font-light leading-relaxed">{ev.notes}</p>
                                    </div>
                                  )}
                                </div>

                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Modal Footer Close Button */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs md:text-sm font-arabic font-semibold shadow-md hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {lang === "ar" ? "إغلاق نافذة التفاصيل" : "Close Details"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

