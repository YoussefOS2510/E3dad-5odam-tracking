import React, { useState, useEffect } from "react";
import { User, Layers, ArrowRight, ArrowLeft } from "lucide-react";
import { translations } from "../../translations";

export default function GatekeeperStep({ rotations, onStartSession, initialSupervisorName = "", initialDepartment = "", lang }) {
  const t = translations[lang];
  const isRtl = lang === "ar";

  const [supervisorName, setSupervisorName] = useState(initialSupervisorName);
  const [selectedDept, setSelectedDept] = useState(initialDepartment);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");

  // Aggregate unique departments from rotations
  useEffect(() => {
    if (!rotations || rotations.length === 0) return;

    const deptSet = new Set();
    rotations.forEach((row) => {
      if (row.main_department) deptSet.add(row.main_department.trim());
      if (row.secondary_department) deptSet.add(row.secondary_department.trim());
    });

    // Sort alphabetically
    const sortedDepts = Array.from(deptSet).sort((a, b) =>
      a.localeCompare(b, lang)
    );
    setDepartments(sortedDepts);
  }, [rotations, lang]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!supervisorName.trim()) {
      setError(t.errNameRequired);
      return;
    }
    if (!selectedDept) {
      setError(t.errDeptRequired);
      return;
    }

    // Filter interns assigned to this department (either as main or secondary rotation)
    const assignedInterns = rotations.filter(
      (intern) =>
        (intern.main_department &&
          intern.main_department.trim() === selectedDept) ||
        (intern.secondary_department &&
          intern.secondary_department.trim() === selectedDept)
    );

    if (assignedInterns.length === 0) {
      setError(t.errNoInterns);
      return;
    }

    onStartSession({
      supervisorName: supervisorName.trim(),
      department: selectedDept,
      queue: assignedInterns,
    });
  };

  return (
    <div className={`w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-8 glass-panel animate-fade-in ${
      isRtl ? "text-right" : "text-left"
    }`}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-inner">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-arabic text-slate-800">{t.startNewSession}</h2>
        <p className="text-slate-400 text-xs mt-1 font-light">{t.newSessionSub}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Evaluator Name */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold font-arabic text-slate-700">
            {t.evaluatorNameLabel} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={t.evaluatorNamePlaceholder}
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              dir={isRtl ? "rtl" : "ltr"}
              className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-arabic transition-all ${
                isRtl ? "pr-11 pl-4" : "pl-11 pr-4"
              }`}
            />
            <div className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
              isRtl ? "right-0 pr-4" : "left-0 pl-4"
            }`}>
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Department Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold font-arabic text-slate-700">
            {t.selectDeptLabel} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              dir={isRtl ? "rtl" : "ltr"}
              className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-arabic appearance-none transition-all cursor-pointer ${
                isRtl ? "pr-11 pl-10" : "pl-11 pr-10"
              }`}
            >
              <option value="">{t.selectDeptPlaceholder}</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <div className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
              isRtl ? "right-0 pr-4" : "left-0 pl-4"
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            {/* Custom dropdown arrow */}
            <div className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
              isRtl ? "left-0 pl-4" : "right-0 pr-4"
            }`}>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-arabic border border-rose-100 text-center animate-shake">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-arabic font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer group"
        >
          <span>{t.startSessionBtn}</span>
          {isRtl ? (
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          ) : (
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </form>
    </div>
  );
}
