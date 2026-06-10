import React from "react";
import { LineChart } from "lucide-react";
import InternImage from "../InternImage";

export default function Leaderboard({ evaluations, allRotations, onSelectIntern, lang }) {
  const isRtl = lang === "ar";

  // 1. Initialize intern data structure
  const internStats = {};

  // Initialize all interns from rotations
  allRotations.forEach((r) => {
    internStats[r.intern_name] = {
      name: r.intern_name,
      mainDept: r.main_department,
      secDept: r.secondary_department,
      photoId: r.drive_photo_id
    };
  });

  // Ensure any interns in evaluations but not in rotations are added
  evaluations.forEach((ev) => {
    const name = ev.intern_name;
    if (!internStats[name]) {
      internStats[name] = {
        name,
        mainDept: ev.department || (isRtl ? "غير محدد" : "Unspecified"),
        secDept: "",
        photoId: ""
      };
    }
  });

  // Sort interns alphabetically by name
  const sortedData = Object.values(internStats).sort((a, b) =>
    a.name.localeCompare(b.name, lang)
  );

  return (
    <div className={`space-y-6 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Title block */}
      <div>
        <h3 className="text-lg font-bold font-arabic text-slate-800">
          {isRtl ? "دليل إحصائيات الطلاب" : "Student Performance Directory"}
        </h3>
        <span className="text-xs text-slate-400 font-light block mt-0.5">
          {isRtl
            ? "اختر طالباً لعرض بطاقة التقييمات الفردية المفصلة والتحليلات الخاصة بكل قسم"
            : "Select an intern to view their individual scorecard and department performance"}
        </span>
      </div>

      {/* Grid of Intern Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedData.map((intern) => {
          return (
            <div
              key={intern.name}
              onClick={() => onSelectIntern(intern.name)}
              className="bg-white border border-slate-200/80 hover:border-indigo-500/50 hover:shadow-lg rounded-3xl p-5 transition-all duration-300 flex flex-col items-center text-center cursor-pointer group"
            >
              {/* Photo / Avatar */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-slate-100 group-hover:border-indigo-500 shadow-md transition-all duration-300 mb-3 bg-slate-50 flex items-center justify-center flex-shrink-0">
                <InternImage
                  internName={intern.name}
                  drivePhotoId={intern.photoId}
                  className="w-full h-full"
                  initialsClassName="text-2xl"
                />
              </div>

              {/* Name */}
              <h4 className="font-arabic font-bold text-sm md:text-base text-slate-800 group-hover:text-indigo-600 transition-colors mb-2 truncate max-w-full">
                {intern.name}
              </h4>

              {/* Department Badges */}
              <div className="flex flex-col gap-1 w-full mt-1">
                {intern.mainDept && (
                  <span className="inline-flex justify-center items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/40 truncate">
                    {intern.mainDept}
                  </span>
                )}
                {intern.secDept && (
                  <span className="inline-flex justify-center items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200/40 truncate">
                    {intern.secDept}
                  </span>
                )}
              </div>

              {/* Action Button */}
              <div className="w-full mt-auto pt-4">
                <button
                  className="w-full py-2 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-slate-500 rounded-xl text-[10px] md:text-xs font-semibold font-arabic shadow-sm transition-all duration-300 flex items-center justify-center gap-1 border border-slate-200/60 group-hover:border-indigo-600 cursor-pointer"
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>{isRtl ? "عرض الإحصائيات" : "View Performance"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
