import React from "react";
import { CheckCircle2, AlertTriangle, Send, RefreshCw, XCircle } from "lucide-react";
import { translations } from "../../translations";

export default function SubmitReview({
  evaluations,
  evaluatorName,
  department,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
  lang
}) {
  const t = translations[lang];
  const isRtl = lang === "ar";

  const getAverageScore = (ev) => {
    const sum = ev.commitment_time + ev.church_spirit_appearance + ev.lesson_preparation + ev.target_audience_handling;
    return (sum / 4).toFixed(1);
  };

  return (
    <div className={`w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 animate-fade-in ${
      isRtl ? "text-right" : "text-left"
    }`}>
      
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold font-arabic text-slate-800">{t.reviewTitle}</h2>
        <p className="text-slate-400 text-xs mt-1 font-light">{t.reviewSubtitle}</p>
      </div>

      {/* Session Metadata */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 mb-6 font-arabic" dir={isRtl ? "rtl" : "ltr"}>
        <div className={isRtl ? "text-right" : "text-left"}>
          <span className="text-xs text-slate-400 block">{t.evaluatedDeptLabel}</span>
          <span className="text-sm font-semibold text-slate-700">{department}</span>
        </div>
        <div className={isRtl ? "text-right" : "text-left"}>
          <span className="text-xs text-slate-400 block">{t.evaluatorLabel}</span>
          <span className="text-sm font-semibold text-slate-700">{evaluatorName}</span>
        </div>
      </div>

      {/* Summary Table */}
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden mb-6">
        <table className="w-full font-arabic text-xs md:text-sm" dir={isRtl ? "rtl" : "ltr"}>
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className={`px-4 py-3 font-bold ${isRtl ? "text-right" : "text-left"}`}>{t.tableIntern}</th>
              <th className="px-4 py-3 font-bold text-center">{t.tableAttendance}</th>
              <th className="px-4 py-3 font-bold text-center">{t.tableAvg}</th>
              <th className={`px-4 py-3 font-bold hidden md:table-cell ${isRtl ? "text-right" : "text-left"}`}>{t.tableComments}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {evaluations.map((ev, idx) => {
              const hasNotes = ev.strengths || ev.areas_of_improvement || ev.notes;
              const avg = getAverageScore(ev);
              
              let scoreColor = "text-slate-700";
              if (avg >= 4) scoreColor = "text-emerald-600 font-bold";
              else if (avg < 3) scoreColor = "text-rose-600 font-bold";

              return (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5 font-semibold">{ev.intern_name}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600 bg-indigo-50/30">
                    {ev.attendance}
                  </td>
                  <td className={`px-4 py-3 text-center font-mono ${scoreColor}`}>
                    {avg} / 5
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell max-w-xs truncate">
                    {hasNotes ? (
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                        {ev.strengths ? `${t.excellent} ` : ""}{ev.areas_of_improvement ? `${t.average} ` : ""}{ev.notes ? "notes" : ""}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-light">{t.noComments}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs font-arabic border border-rose-100 flex items-start gap-3" dir={isRtl ? "rtl" : "ltr"}>
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <div className={`space-y-1 ${isRtl ? "text-right" : "text-left"}`}>
            <span className="font-bold block">{t.submitErrorTitle}</span>
            <span className="font-light">{submitError}</span>
            <span className="block text-[10px] text-rose-500 font-light mt-1">
              * {t.submitErrorSub}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 ${
        isRtl ? "flex-row-reverse" : "flex-row"
      }`}>
        
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl font-arabic font-semibold transition-all disabled:opacity-50 cursor-pointer"
        >
          <XCircle className="w-5 h-5 text-slate-400" />
          <span>{t.discardSession}</span>
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-2xl font-arabic font-bold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all disabled:shadow-none cursor-pointer group"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{t.submittingBtn}</span>
            </>
          ) : (
            <>
              <Send className={`w-5 h-5 transition-transform ${isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
              <span>{t.submitFinalBtn}</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
