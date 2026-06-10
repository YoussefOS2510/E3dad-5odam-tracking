import React from "react";
import { Search, Filter, Calendar, RotateCcw } from "lucide-react";
import { translations } from "../../translations";

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedDept,
  setSelectedDept,
  dateRange,
  setDateRange,
  departments,
  onReset,
  lang
}) {
  const t = translations[lang];
  const isRtl = lang === "ar";

  const presets = [
    { id: "all", name: t.allTime },
    { id: "30days", name: t.last30Days },
    { id: "7days", name: t.last7Days },
  ];

  const handlePresetClick = (presetId) => {
    const today = new Date();
    let start = "";
    let end = today.toISOString().split("T")[0];

    if (presetId === "30days") {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      start = past30.toISOString().split("T")[0];
    } else if (presetId === "7days") {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 7);
      start = past7.toISOString().split("T")[0];
    }

    setDateRange({ start, end, preset: presetId });
  };

  const handleCustomDateChange = (field, val) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: val,
      preset: "custom",
    }));
  };

  return (
    <div className={`w-full bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 space-y-4 mb-6 animate-fade-in ${
      isRtl ? "text-right" : "text-left"
    }`}>
      
      {/* Search & Dept Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" dir={isRtl ? "rtl" : "ltr"}>
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-arabic transition-all ${
              isRtl ? "pr-11 pl-4" : "pl-11 pr-4"
            }`}
          />
          <div className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
            isRtl ? "right-0 pr-4" : "left-0 pl-4"
          }`}>
            <Search className="w-5 h-5" />
          </div>
        </div>

        {/* Department Select */}
        <div className="relative">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-arabic appearance-none transition-all cursor-pointer ${
              isRtl ? "pr-11 pl-10" : "pl-11 pr-10"
            }`}
          >
            <option value="">{t.allDeptsOption}</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <div className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
            isRtl ? "right-0 pr-4" : "left-0 pl-4"
          }`}>
            <Filter className="w-5 h-5" />
          </div>
          {/* Dropdown arrow */}
          <div className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
            isRtl ? "left-0 pl-4" : "right-0 pr-4"
          }`}>
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        {/* Reset Buttons */}
        <div className={`flex items-center ${isRtl ? "justify-start md:justify-end" : "justify-end md:justify-start"}`}>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-3 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-2xl transition-all cursor-pointer text-sm font-arabic font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.resetFiltersBtn}</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-4 border-t border-slate-100 ${
        isRtl ? "flex-row-reverse" : ""
      }`} dir={isRtl ? "rtl" : "ltr"}>
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 self-center ml-2 font-arabic font-medium">{t.timePeriod}:</span>
          {presets.map((p) => {
            const isSelected = dateRange.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePresetClick(p.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-arabic font-medium transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Custom Calendar Inputs */}
        <div className="flex flex-wrap items-center gap-2 text-xs" dir={isRtl ? "rtl" : "ltr"}>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-arabic font-medium">{t.fromLabel}:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleCustomDateChange("start", e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-semibold"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-arabic font-medium">{t.toLabel}:</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleCustomDateChange("end", e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-semibold"
            />
          </div>
          <Calendar className="w-4 h-4 text-slate-400" />
        </div>
      </div>

    </div>
  );
}
