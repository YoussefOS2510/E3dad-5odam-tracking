import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { AreaChart } from "lucide-react";
import { translations } from "../../translations";

export default function ChartsSection({ evaluations, selectedDept, lang }) {
  const t = translations[lang];
  const isRtl = lang === "ar";

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="w-full bg-white rounded-3xl border border-slate-200/60 p-12 text-center text-slate-400 font-arabic mb-6">
        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
          <AreaChart className="w-8 h-8" />
        </div>
        <p className="text-lg font-bold text-slate-600">{t.chartNoDataTitle}</p>
        <p className="text-xs text-slate-400 mt-1 font-light">{t.chartNoDataSub}</p>
      </div>
    );
  }

  // ==================== LINE CHART DATA PROCESSING ====================
  const dateMap = {};
  evaluations.forEach((ev) => {
    if (!ev.timestamp) return;
    const dateStr = ev.timestamp.split("T")[0];
    if (!dateMap[dateStr]) {
      dateMap[dateStr] = { sum: 0, count: 0 };
    }
    dateMap[dateStr].sum += ev.attendance || 0;
    dateMap[dateStr].count += 1;
  });

  const lineChartData = Object.keys(dateMap)
    .sort((a, b) => new Date(a) - new Date(b))
    .map((date) => {
      const d = new Date(date);
      const formattedDate = d.toLocaleDateString(isRtl ? "ar-EG" : "en-US", { day: "numeric", month: "short" });
      return {
        date: formattedDate,
        [t.chartAttendanceLegend]: parseFloat((dateMap[date].sum / dateMap[date].count).toFixed(2)),
      };
    });

  // ==================== RADAR CHART DATA PROCESSING ====================
  const metrics = [
    { key: "commitment_time", label: t.radarCommitment },
    { key: "church_spirit_appearance", label: t.radarAppearance },
    { key: "lesson_preparation", label: t.radarLesson },
    { key: "target_audience_handling", label: t.radarAudience },
  ];

  const globalAverages = { count: 0 };
  metrics.forEach((m) => (globalAverages[m.key] = 0));

  evaluations.forEach((ev) => {
    globalAverages.count++;
    metrics.forEach((m) => {
      globalAverages[m.key] += ev[m.key] || 0;
    });
  });

  metrics.forEach((m) => {
    globalAverages[m.key] = globalAverages.count ? globalAverages[m.key] / globalAverages.count : 0;
  });

  let targetDeptName = selectedDept;
  if (!targetDeptName) {
    const depts = {};
    evaluations.forEach((ev) => {
      if (ev.department) depts[ev.department] = (depts[ev.department] || 0) + 1;
    });
    const sortedDepts = Object.keys(depts).sort((a, b) => depts[b] - depts[a]);
    targetDeptName = sortedDepts[0] || "";
  }

  const deptAverages = { count: 0 };
  metrics.forEach((m) => (deptAverages[m.key] = 0));

  if (targetDeptName) {
    evaluations.forEach((ev) => {
      if (ev.department === targetDeptName) {
        deptAverages.count++;
        metrics.forEach((m) => {
          deptAverages[m.key] += ev[m.key] || 0;
        });
      }
    });

    metrics.forEach((m) => {
      deptAverages[m.key] = deptAverages.count ? deptAverages[m.key] / deptAverages.count : 0;
    });
  }

  const radarChartData = metrics.map((m) => ({
    subject: m.label,
    [t.chartOverallAvg]: parseFloat(globalAverages[m.key].toFixed(2)),
    [targetDeptName ? `${targetDeptName}` : (isRtl ? "الخدمة المحدد" : "Selected Dept")]: parseFloat(deptAverages[m.key].toFixed(2)),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1 font-arabic" dir={isRtl ? "rtl" : "ltr"}>
          <p className="font-bold border-b border-slate-800 pb-1 text-slate-200">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }} className={isRtl ? "text-right" : "text-left"}>
              {p.name}: <span className="font-mono font-semibold">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      
      {/* Attendance Line Chart */}
      <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/60 p-6 flex flex-col shadow-sm">
        <div className={`flex flex-col mb-6 ${isRtl ? "text-right" : "text-left"}`}>
          <h3 className="text-sm font-bold font-arabic text-slate-800">{t.chartAttendanceTitle}</h3>
          <span className="text-[10px] text-slate-400 font-light block">{t.chartAttendanceSub}</span>
        </div>

        <div className="h-72 w-full text-xs font-semibold">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: isRtl ? -20 : -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 5]} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Line
                name={t.chartAttendanceLegend}
                type="monotone"
                dataKey={t.chartAttendanceLegend}
                stroke="#4f46e5"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                dot={{ stroke: "#4f46e5", strokeWidth: 2, r: 4, fill: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Radar Chart */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 p-6 flex flex-col shadow-sm">
        <div className={`flex flex-col mb-6 ${isRtl ? "text-right" : "text-left"}`}>
          <h3 className="text-sm font-bold font-arabic text-slate-800">{t.chartRadarTitle}</h3>
          <span className="text-[10px] text-slate-400 font-light block">{t.chartRadarSub}</span>
        </div>

        <div className="h-72 w-full text-xs font-semibold flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" radius="70%" data={radarChartData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#94a3b8" tick={{ fontSize: 8 }} />
              <Radar
                name={t.chartOverallAvg}
                dataKey={t.chartOverallAvg}
                stroke="#94a3b8"
                fill="#94a3b8"
                fillOpacity={0.2}
              />
              {targetDeptName && (
                <Radar
                  name={targetDeptName}
                  dataKey={targetDeptName}
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.4}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
