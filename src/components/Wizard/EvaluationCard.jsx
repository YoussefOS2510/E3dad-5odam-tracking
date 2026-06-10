import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, ArrowLeft, ArrowRight, Award } from "lucide-react";
import { translations } from "../../translations";
import InternImage from "../InternImage";

export default function EvaluationCard({
  intern,
  index,
  total,
  onNext,
  onBack,
  onCancel,
  savedDraft,
  lang
}) {
  const t = translations[lang];
  const isRtl = lang === "ar";

  // Evaluation fields state
  const [attendance, setAttendance] = useState(0);
  const [commitment, setCommitment] = useState(5);
  const [appearance, setAppearance] = useState(5);
  const [lessonPrep, setLessonPrep] = useState(5);
  const [audienceHandling, setAudienceHandling] = useState(5);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [notes, setNotes] = useState("");

  // Restore draft if available for this specific intern
  useEffect(() => {
    if (savedDraft && savedDraft.intern_name === intern.intern_name) {
      setAttendance(savedDraft.attendance || 0);
      setCommitment(savedDraft.commitment_time || 5);
      setAppearance(savedDraft.church_spirit_appearance || 5);
      setLessonPrep(savedDraft.lesson_preparation || 5);
      setAudienceHandling(savedDraft.target_audience_handling || 5);
      setStrengths(savedDraft.strengths || "");
      setImprovements(savedDraft.areas_of_improvement || "");
      setNotes(savedDraft.notes || "");
    } else {
      // Reset for new intern
      setAttendance(0);
      setCommitment(5);
      setAppearance(5);
      setLessonPrep(5);
      setAudienceHandling(5);
      setStrengths("");
      setImprovements("");
      setNotes("");
    }
  }, [intern, savedDraft]);

  // Handle image initials fallback
  const getInitials = (name) => {
    if (!name) return "ط";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name[0];
  };

  const handleNext = () => {
    const data = {
      intern_name: intern.intern_name,
      attendance: Number(attendance),
      commitment_time: Number(commitment),
      church_spirit_appearance: Number(appearance),
      lesson_preparation: Number(lessonPrep),
      target_audience_handling: Number(audienceHandling),
      strengths: strengths.trim(),
      areas_of_improvement: improvements.trim(),
      notes: notes.trim(),
    };
    onNext(data);
  };

  const handleCancelClick = () => {
    if (window.confirm(t.cancelConfirm)) {
      onCancel();
    }
  };

  // Helper component for 1-5 scales
  const RatingScale = ({ value, onChange, label, subLabel }) => {
    return (
      <div className="space-y-2">
        <div className={`flex justify-between items-center ${isRtl ? "text-right" : "text-left"}`}>
          {!isRtl && (
            <div className="text-left">
              <span className="text-sm font-semibold font-arabic text-slate-700 block">{label}</span>
              {subLabel && <span className="text-[10px] text-slate-400 font-light">{subLabel}</span>}
            </div>
          )}
          <span className="text-[10px] text-slate-400 font-light">Scale 1-5</span>
          {isRtl && (
            <div className="text-right">
              <span className="text-sm font-semibold font-arabic text-slate-700 block">{label}</span>
              {subLabel && <span className="text-[10px] text-slate-400 font-light">{subLabel}</span>}
            </div>
          )}
        </div>
        <div className="flex justify-between gap-1.5" dir={isRtl ? "rtl" : "ltr"}>
          {[1, 2, 3, 4, 5].map((score) => {
            const isSelected = value === score;
            const bgClasses = [
              "",
              "bg-rose-500 text-white shadow-md shadow-rose-500/20 ring-2 ring-rose-300",
              "bg-orange-500 text-white shadow-md shadow-orange-500/20 ring-2 ring-orange-300",
              "bg-amber-500 text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-300",
              "bg-teal-500 text-white shadow-md shadow-teal-500/20 ring-2 ring-teal-300",
              "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-300"
            ];
            
            return (
              <button
                type="button"
                key={score}
                onClick={() => onChange(score)}
                className={`flex-1 py-3 rounded-xl text-center text-sm font-semibold font-arabic transition-all border cursor-pointer ${
                  isSelected
                    ? bgClasses[score]
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                {score}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 px-1" dir={isRtl ? "rtl" : "ltr"}>
          <span>{t.excellent} (5)</span>
          <span>{t.average} (3)</span>
          <span>{t.weak} (1)</span>
        </div>
      </div>
    );
  };

  const progressPercent = Math.round((index / total) * 100);
  const progressText = t.internProgress
    .replace("{current}", index + 1)
    .replace("{total}", total);

  return (
    <div className={`w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 animate-fade-in flex flex-col gap-6 ${
      isRtl ? "text-right" : "text-left"
    }`}>
      
      {/* Top Session Progress Bar */}
      <div className="space-y-2">
        <div className={`flex justify-between items-center text-xs text-slate-500 font-semibold ${
          isRtl ? "flex-row" : "flex-row-reverse"
        }`}>
          <span className="font-arabic font-medium">{progressText}</span>
          <button
            onClick={handleCancelClick}
            className="text-rose-500 hover:text-rose-600 font-arabic font-semibold transition-colors cursor-pointer"
          >
            {t.cancelSessionBtn}
          </button>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Intern Info Card Header */}
      <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-200/60 text-center">
        {/* Photo Container */}
        <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden shadow-md flex-shrink-0 bg-indigo-50 border-2 border-indigo-500/20 flex items-center justify-center">
          <InternImage
            internName={intern.intern_name}
            drivePhotoId={intern.drive_photo_id}
            className="w-full h-full object-cover"
            initialsClassName="text-4xl"
          />
        </div>
        {/* Text Container */}
        <div className="mt-4 space-y-1">
          <h3 className="text-xl font-bold font-arabic text-slate-800">{intern.intern_name}</h3>
          <p className="text-xs text-slate-400 font-light font-arabic">
            {t.primaryDept}: <span className="font-semibold text-slate-600">{intern.main_department}</span>
            {intern.secondary_department && (
              <>
                <span className="mx-2 text-slate-300">|</span>
                {t.secondaryDept}: <span className="font-semibold text-slate-600">{intern.secondary_department}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Evaluation Form Sections */}
      <div className="space-y-6">
        
        {/* Attendance Counter */}
        <div className="bg-slate-50/50 border border-slate-200/40 p-4 rounded-2xl space-y-3">
          <div className={`flex justify-between items-center ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-[10px] text-slate-400 font-light">Input Number</span>
            <span className="text-sm font-semibold font-arabic text-slate-700">{t.attendanceLabel}</span>
          </div>
          <div className="flex items-center justify-center gap-6" dir="ltr">
            <button
              type="button"
              onClick={() => setAttendance(Math.max(0, attendance - 1))}
              className="w-12 h-12 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center font-bold text-xl transition-all cursor-pointer shadow-sm select-none"
            >
              -
            </button>
            <span className="text-3xl font-bold text-indigo-600 w-16 text-center select-none font-mono">
              {attendance}
            </span>
            <button
              type="button"
              onClick={() => setAttendance(attendance + 1)}
              className="w-12 h-12 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center font-bold text-xl transition-all cursor-pointer shadow-sm select-none"
            >
              +
            </button>
          </div>
        </div>

        {/* 4 Core 1-5 Scale Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RatingScale
            value={commitment}
            onChange={setCommitment}
            label={t.commitmentLabel}
          />
          <RatingScale
            value={appearance}
            onChange={setAppearance}
            label={t.appearanceLabel}
          />
          <RatingScale
            value={lessonPrep}
            onChange={setLessonPrep}
            label={t.lessonPrepLabel}
          />
          <RatingScale
            value={audienceHandling}
            onChange={setAudienceHandling}
            label={t.audienceLabel}
          />
        </div>

        {/* Qualitative Text Areas */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {/* Strengths */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold font-arabic text-slate-700">
              {t.strengthsLabel}
            </label>
            <textarea
              rows={2}
              placeholder={t.strengthsPlaceholder}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              dir={isRtl ? "rtl" : "ltr"}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-arabic text-sm transition-all resize-none"
            />
          </div>

          {/* Improvements */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold font-arabic text-slate-700">
              {t.improvementsLabel}
            </label>
            <textarea
              rows={2}
              placeholder={t.improvementsPlaceholder}
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              dir={isRtl ? "rtl" : "ltr"}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-arabic text-sm transition-all resize-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold font-arabic text-slate-700">
              {t.notesLabel}
            </label>
            <textarea
              rows={2}
              placeholder={t.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              dir={isRtl ? "rtl" : "ltr"}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-arabic text-sm transition-all resize-none"
            />
          </div>
        </div>

      </div>

      {/* Card Action Buttons */}
      <div className={`flex items-center justify-between gap-4 pt-4 border-t border-slate-100 ${
        isRtl ? "flex-row-reverse" : "flex-row"
      }`}>
        <div>
          {index > 0 && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-600 rounded-xl font-arabic font-semibold hover:bg-slate-50 transition-all cursor-pointer"
            >
              {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              <span>{t.backBtn}</span>
            </button>
          )}
        </div>
        
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-arabic font-semibold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <span>{index === total - 1 ? t.reviewBtn : t.nextBtn}</span>
          {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

    </div>
  );
}
