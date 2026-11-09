/**
 * Fairness & Standardization Calculator for E3dad 5odam Management
 * 
 * Provides:
 * 1. Evaluator / Department bias calibration (Z-Score & Mean Normalization).
 * 2. Academic completion and grade averages.
 * 3. Attendance rate standardization.
 * 4. Composite multi-pillar scoring with customizable weights.
 * 5. Readiness tier classification (Ready to Serve, Incomplete Exams, Needs Follow-up).
 */

export const DEFAULT_WEIGHTS = {
  academic: 0.40,   // 40% Exams & Spiritual Modules
  practical: 0.40,  // 40% Practical Service Evaluations
  attendance: 0.20  // 20% Commitment & Attendance
};

/**
 * Calculates department-level statistics (mean, count, variance) to detect strict or lenient evaluators.
 */
export const calculateDepartmentBenchmarks = (evaluations) => {
  const deptStats = {};
  let totalEvaluations = 0;
  let globalScoreSum = 0;

  evaluations.forEach((ev) => {
    const dept = ev.department || "Unspecified";
    const compositeScore =
      ((ev.commitment_time || 0) +
        (ev.church_spirit_appearance || 0) +
        (ev.lesson_preparation || 0) +
        (ev.target_audience_handling || 0)) / 4;

    if (!deptStats[dept]) {
      deptStats[dept] = {
        name: dept,
        totalScore: 0,
        evalCount: 0,
        scores: [],
        attendanceSum: 0
      };
    }

    deptStats[dept].totalScore += compositeScore;
    deptStats[dept].evalCount += 1;
    deptStats[dept].scores.push(compositeScore);
    deptStats[dept].attendanceSum += (ev.attendance || 0);

    totalEvaluations += 1;
    globalScoreSum += compositeScore;
  });

  const globalMean = totalEvaluations > 0 ? globalScoreSum / totalEvaluations : 3.5;

  // Compute averages and strictness indicators
  const benchmarks = {};
  Object.keys(deptStats).forEach((dept) => {
    const d = deptStats[dept];
    const mean = d.evalCount > 0 ? d.totalScore / d.evalCount : globalMean;
    const avgAttendance = d.evalCount > 0 ? d.attendanceSum / d.evalCount : 1;

    // Strictness categorization relative to cohort mean
    let strictness = "balanced"; // معتدل
    const diff = mean - globalMean;
    if (diff <= -0.35) {
      strictness = "strict"; // متشدد / حاسم
    } else if (diff >= 0.35) {
      strictness = "lenient"; // متساهل / كريم
    }

    benchmarks[dept] = {
      name: dept,
      evalCount: d.evalCount,
      meanScore: Number(mean.toFixed(2)),
      globalMean: Number(globalMean.toFixed(2)),
      deviation: Number(diff.toFixed(2)),
      avgAttendance: Number(avgAttendance.toFixed(1)),
      strictness
    };
  });

  return {
    benchmarks,
    globalMean: Number(globalMean.toFixed(2)),
    totalEvaluations
  };
};

/**
 * Generates the complete, fair, cross-department student report.
 */
export const generateComprehensiveReport = ({
  rotations = [],
  evaluations = [],
  examsList = [],
  weights = DEFAULT_WEIGHTS,
  normalizePractical = true,
  passScore = 70
}) => {
  const { benchmarks, globalMean } = calculateDepartmentBenchmarks(evaluations);

  // Group evaluations by intern name
  const evalsByIntern = {};
  evaluations.forEach((ev) => {
    const name = ev.intern_name;
    if (!evalsByIntern[name]) {
      evalsByIntern[name] = [];
    }
    evalsByIntern[name].push(ev);
  });

  // Calculate stats for each student
  const students = rotations.map((intern) => {
    const name = intern.intern_name;
    const internEvals = evalsByIntern[name] || [];
    const exams = intern.exams || {};

    // ─────────────────────────────────────────────────────────────
    // 1. Academic & Exam Pillar
    // ─────────────────────────────────────────────────────────────
    const totalExamsCount = examsList.length;
    let gradedExamsCount = 0;
    let passedExamsCount = 0;
    let examSum = 0;

    examsList.forEach((examKey) => {
      const val = exams[examKey];
      if (val !== undefined && val !== null && val !== "" && !isNaN(Number(val))) {
        const numVal = Math.min(100, Math.max(0, Number(val)));
        gradedExamsCount += 1;
        examSum += numVal;
        if (numVal >= passScore) {
          passedExamsCount += 1;
        }
      }
    });

    // Academic score: average of all exams in list (ungraded exams counted as 0 for final graduation readiness,
    // but we also track average of taken exams)
    const examAvgOfTaken = gradedExamsCount > 0 ? examSum / gradedExamsCount : 0;
    const academicScorePct = totalExamsCount > 0 ? (examSum / totalExamsCount) : 0;
    const examCompletionRate = totalExamsCount > 0 ? (gradedExamsCount / totalExamsCount) * 100 : 0;

    // ─────────────────────────────────────────────────────────────
    // 2. Practical Service Pillar
    // ─────────────────────────────────────────────────────────────
    // Group evaluations by department for this student
    const internDeptsMap = {};
    let totalStudentAttendance = 0;

    internEvals.forEach((ev) => {
      const dept = ev.department || intern.main_department || "Unspecified";
      const compositeScore =
        ((ev.commitment_time || 0) +
          (ev.church_spirit_appearance || 0) +
          (ev.lesson_preparation || 0) +
          (ev.target_audience_handling || 0)) / 4;

      totalStudentAttendance += (ev.attendance || 0);

      if (!internDeptsMap[dept]) {
        internDeptsMap[dept] = {
          name: dept,
          compositeSum: 0,
          attendanceSum: 0,
          commitmentSum: 0,
          appearanceSum: 0,
          lessonSum: 0,
          audienceSum: 0,
          count: 0,
          evaluators: [],
          strengths: [],
          improvements: [],
          notes: [],
          evaluations: []
        };
      }
      internDeptsMap[dept].compositeSum += compositeScore;
      internDeptsMap[dept].attendanceSum += (ev.attendance || 0);
      internDeptsMap[dept].commitmentSum += (ev.commitment_time || 0);
      internDeptsMap[dept].appearanceSum += (ev.church_spirit_appearance || 0);
      internDeptsMap[dept].lessonSum += (ev.lesson_preparation || 0);
      internDeptsMap[dept].audienceSum += (ev.target_audience_handling || 0);
      internDeptsMap[dept].count += 1;
      if (ev.evaluator_name && !internDeptsMap[dept].evaluators.includes(ev.evaluator_name)) {
        internDeptsMap[dept].evaluators.push(ev.evaluator_name);
      }
      if (ev.strengths) internDeptsMap[dept].strengths.push(ev.strengths);
      if (ev.improvements) internDeptsMap[dept].improvements.push(ev.improvements);
      if (ev.notes) internDeptsMap[dept].notes.push(ev.notes);
      internDeptsMap[dept].evaluations.push(ev);
    });

    const evaluatedDeptKeys = Object.keys(internDeptsMap);
    let rawPracticalAvgSum = 0;
    let normalizedPracticalAvgSum = 0;

    const departmentsHistory = evaluatedDeptKeys.map((dKey) => {
      const deptData = internDeptsMap[dKey];
      const count = deptData.count;
      const deptRawAvg = count > 0 ? deptData.compositeSum / count : 0;
      rawPracticalAvgSum += deptRawAvg;

      // Fairness calibration:
      // Adjusted = Raw + (GlobalCohortMean - DepartmentMean)
      const deptBenchmark = benchmarks[dKey] || { meanScore: globalMean };
      const adjustment = globalMean - deptBenchmark.meanScore;
      const normalizedScore = count > 0 ? Math.max(1, Math.min(5, deptRawAvg + adjustment)) : 0;
      normalizedPracticalAvgSum += normalizedScore;

      return {
        name: dKey,
        evalCount: count,
        rawScore: Number(deptRawAvg.toFixed(2)),
        rawScorePct: Math.round((deptRawAvg / 5) * 100),
        normalizedScore: Number(normalizedScore.toFixed(2)),
        normalizedScorePct: Math.round((normalizedScore / 5) * 100),
        effectiveScore: normalizePractical ? Number(normalizedScore.toFixed(2)) : Number(deptRawAvg.toFixed(2)),
        effectiveScorePct: normalizePractical ? Math.round((normalizedScore / 5) * 100) : Math.round((deptRawAvg / 5) * 100),
        avgCommitment: Number((deptData.commitmentSum / count).toFixed(1)),
        avgAppearance: Number((deptData.appearanceSum / count).toFixed(1)),
        avgLesson: Number((deptData.lessonSum / count).toFixed(1)),
        avgAudience: Number((deptData.audienceSum / count).toFixed(1)),
        totalAttendance: deptData.attendanceSum,
        avgAttendance: Number((deptData.attendanceSum / count).toFixed(1)),
        evaluators: deptData.evaluators,
        strengths: deptData.strengths,
        improvements: deptData.improvements,
        notes: deptData.notes,
        evaluations: deptData.evaluations
      };
    });

    const departmentsMap = {};
    departmentsHistory.forEach((dh) => {
      departmentsMap[dh.name] = dh;
    });

    const hasPracticalData = evaluatedDeptKeys.length > 0;
    const rawPracticalScore = hasPracticalData ? rawPracticalAvgSum / evaluatedDeptKeys.length : 0;
    const normalizedPracticalScore = hasPracticalData ? normalizedPracticalAvgSum / evaluatedDeptKeys.length : 0;

    // Convert practical score (1 to 5) to percentage (0 to 100%)
    const effectivePracticalScore = normalizePractical ? normalizedPracticalScore : rawPracticalScore;
    const practicalScorePct = hasPracticalData ? (effectivePracticalScore / 5) * 100 : 0;
    const rawPracticalScorePct = hasPracticalData ? (rawPracticalScore / 5) * 100 : 0;

    // ─────────────────────────────────────────────────────────────
    // 3. Attendance Pillar
    // ─────────────────────────────────────────────────────────────
    // Standardize attendance based on evaluation sessions or expected target
    const avgAttendancePerSession = internEvals.length > 0
      ? totalStudentAttendance / internEvals.length
      : 0;
    
    // An average attendance of 4+ sessions per evaluation period is considered 100%
    const attendancePct = Math.min(100, Math.round((avgAttendancePerSession / 4) * 100));

    // ─────────────────────────────────────────────────────────────
    // 4. Composite Standardized Total Score
    // ─────────────────────────────────────────────────────────────
    const totalWeights = weights.academic + weights.practical + weights.attendance;
    const normWeights = {
      academic: weights.academic / totalWeights,
      practical: weights.practical / totalWeights,
      attendance: weights.attendance / totalWeights
    };

    let compositeTotalScore = 0;
    if (hasPracticalData && gradedExamsCount > 0) {
      compositeTotalScore =
        (academicScorePct * normWeights.academic) +
        (practicalScorePct * normWeights.practical) +
        (attendancePct * normWeights.attendance);
    } else if (hasPracticalData) {
      // If exams not yet completed, weight practical + attendance proportionally
      const pWeight = normWeights.practical / (normWeights.practical + normWeights.attendance);
      const aWeight = normWeights.attendance / (normWeights.practical + normWeights.attendance);
      compositeTotalScore = (practicalScorePct * pWeight) + (attendancePct * aWeight);
    } else if (gradedExamsCount > 0) {
      compositeTotalScore = academicScorePct;
    }

    // ─────────────────────────────────────────────────────────────
    // 5. Readiness Classification
    // ─────────────────────────────────────────────────────────────
    let readinessTier = "pending"; // في انتظار التقييمات
    let readinessLabel = "غير مكتمل البيانات";
    let readinessColor = "slate";

    const allExamsCompleted = totalExamsCount > 0 && gradedExamsCount === totalExamsCount;
    const practicalPassed = practicalScorePct >= passScore;
    const examsPassed = academicScorePct >= passScore;

    if (hasPracticalData && gradedExamsCount > 0) {
      if (practicalPassed && allExamsCompleted && passedExamsCount === totalExamsCount && compositeTotalScore >= passScore) {
        readinessTier = "ready";
        readinessLabel = "جاهز للخدمة (مستوفٍ)";
        readinessColor = "emerald";
      } else if (practicalPassed && examCompletionRate < 100) {
        readinessTier = "incomplete_exams";
        readinessLabel = "يحتاج استكمال امتحانات";
        readinessColor = "amber";
      } else if (!practicalPassed && compositeTotalScore >= 60) {
        readinessTier = "needs_practical";
        readinessLabel = "يحتاج متابعة عملية";
        readinessColor = "orange";
      } else if (compositeTotalScore < 60) {
        readinessTier = "at_risk";
        readinessLabel = "تحت الملاحظة";
        readinessColor = "rose";
      } else {
        readinessTier = "in_progress";
        readinessLabel = "جاري الاستكمال";
        readinessColor = "indigo";
      }
    } else if (hasPracticalData) {
      readinessTier = "incomplete_exams";
      readinessLabel = "بانتظار رصد الامتحانات";
      readinessColor = "amber";
    } else if (gradedExamsCount > 0) {
      readinessTier = "incomplete_practical";
      readinessLabel = "بانتظار التقييم العملي";
      readinessColor = "blue";
    }

    return {
      name,
      mainDept: intern.main_department || "غير محدد",
      secondaryDept: intern.secondary_department || "",
      photoId: intern.drive_photo_id || "",
      rawExams: exams,
      // Academic
      totalExamsCount,
      gradedExamsCount,
      passedExamsCount,
      examAvgOfTaken: Number(examAvgOfTaken.toFixed(1)),
      academicScorePct: Number(academicScorePct.toFixed(1)),
      examCompletionRate: Math.round(examCompletionRate),
      // Practical
      evalCount: internEvals.length,
      evaluatedDeptsCount: evaluatedDeptKeys.length,
      departmentsList: evaluatedDeptKeys,
      departmentsHistory,
      departmentsMap,
      rawPracticalScore: Number(rawPracticalScore.toFixed(2)),
      rawPracticalScorePct: Number(rawPracticalScorePct.toFixed(1)),
      normalizedPracticalScore: Number(normalizedPracticalScore.toFixed(2)),
      normalizedPracticalScorePct: Number(practicalScorePct.toFixed(1)),
      practicalScorePct: Number(practicalScorePct.toFixed(1)),
      // Attendance
      totalAttendance: totalStudentAttendance,
      avgAttendancePerSession: Number(avgAttendancePerSession.toFixed(1)),
      attendancePct,
      // Final Composite
      compositeTotalScore: Number(compositeTotalScore.toFixed(1)),
      // Classification
      readinessTier,
      readinessLabel,
      readinessColor,
      hasPracticalData,
      isLowSample: internEvals.length === 1
    };
  });

  // Calculate cohort summary
  const totalStudents = students.length;
  const readyCount = students.filter((s) => s.readinessTier === "ready").length;
  const inProgressCount = students.filter((s) => s.readinessTier === "incomplete_exams" || s.readinessTier === "in_progress").length;
  const atRiskCount = students.filter((s) => s.readinessTier === "at_risk" || s.readinessTier === "needs_practical").length;
  
  const evaluatedStudents = students.filter((s) => s.hasPracticalData);
  const cohortAvgScore = evaluatedStudents.length > 0
    ? evaluatedStudents.reduce((acc, s) => acc + s.compositeTotalScore, 0) / evaluatedStudents.length
    : 0;

  const allEvaluatedDepts = Array.from(
    new Set(evaluations.map((ev) => ev.department).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return {
    students,
    benchmarks,
    globalMean,
    allEvaluatedDepts,
    cohortSummary: {
      totalStudents,
      readyCount,
      readyRate: totalStudents > 0 ? Math.round((readyCount / totalStudents) * 100) : 0,
      inProgressCount,
      atRiskCount,
      cohortAvgScore: Number(cohortAvgScore.toFixed(1)),
      totalEvaluations: evaluations.length
    }
  };
};

