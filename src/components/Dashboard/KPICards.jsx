import React from "react";
import { ClipboardCheck, Users, Star, AlertTriangle } from "lucide-react";
import { translations } from "../../translations";
import { calculateInternOverallScore } from "../../utils/scoreCalculator";

export default function KPICards({ evaluations, allRotations, lang }) {
  const t = translations[lang];
  const isRtl = lang === "ar";
  
  // 1. Total Evaluations
  const totalEvals = evaluations.length;

  // 2. Global Attendance Average
  const avgAttendance = totalEvals
    ? (evaluations.reduce((sum, ev) => sum + (ev.attendance || 0), 0) / totalEvals).toFixed(1)
    : "0.0";

  // 3. Top Performing Department
  const deptAverages = {};
  evaluations.forEach((ev) => {
    const dept = ev.department;
    if (!dept) return;
    
    const compositeScore =
      ((ev.commitment_time || 0) +
        (ev.church_spirit_appearance || 0) +
        (ev.lesson_preparation || 0) +
        (ev.target_audience_handling || 0)) /
      4;

    if (!deptAverages[dept]) {
      deptAverages[dept] = { sum: 0, count: 0 };
    }
    deptAverages[dept].sum += compositeScore;
    deptAverages[dept].count += 1;
  });

  let topDept = "";
  let topScore = 0;
  Object.keys(deptAverages).forEach((dept) => {
    const avg = deptAverages[dept].sum / deptAverages[dept].count;
    if (avg > topScore) {
      topScore = avg;
      topDept = dept;
    }
  });

  const formattedTopDept = topScore > 0 ? `${topDept} (${topScore.toFixed(1)}/5)` : t.noData;

  // 4. Students Requiring Attention
  const uniqueInternNames = Array.from(new Set(evaluations.map((ev) => ev.intern_name)));
  let attentionCount = 0;

  uniqueInternNames.forEach((name) => {
    const scoreResult = calculateInternOverallScore(name, evaluations);
    const avg = scoreResult.overallScore;

    const internEvals = evaluations.filter((ev) => ev.intern_name === name);
    const hasFail = internEvals.some(
      (ev) =>
        ev.commitment_time < 3 ||
        ev.church_spirit_appearance < 3 ||
        ev.lesson_preparation < 3 ||
        ev.target_audience_handling < 3
    );

    if (avg < 3.0 || hasFail) {
      attentionCount++;
    }
  });

  const cards = [
    {
      title: t.kpiTotalEvals,
      en: t.kpiTotalEvalsSub,
      value: totalEvals,
      icon: ClipboardCheck,
      color: "bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/50",
    },
    {
      title: t.kpiAvgAttendance,
      en: t.kpiAvgAttendanceSub,
      value: `${avgAttendance} ${isRtl ? "يوم" : "days"}`,
      icon: Users,
      color: "bg-teal-50 border-teal-100 text-teal-600 dark:bg-teal-950/20 dark:border-teal-900/50",
    },
    {
      title: t.kpiTopDept,
      en: t.kpiTopDeptSub,
      value: formattedTopDept,
      icon: Star,
      color: "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/50",
    },
    {
      title: t.kpiAttention,
      en: t.kpiAttentionSub,
      value: t.attentionCount.replace("{count}", attentionCount),
      icon: AlertTriangle,
      color:
        attentionCount > 0
          ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse dark:bg-rose-950/20 dark:border-rose-900/50"
          : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900/40 dark:border-slate-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white border rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 ${
              isRtl ? "text-right" : "text-left"
            }`}
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-light block leading-none">{card.en}</span>
              <h4 className="text-xs text-slate-500 font-semibold font-arabic leading-none">{card.title}</h4>
              <div className="text-xl font-extrabold text-slate-800 font-arabic pt-1 leading-none">
                {card.value}
              </div>
            </div>
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${card.color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
