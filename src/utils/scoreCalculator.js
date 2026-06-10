/**
 * Calculates department-divided scores and overall scores for a given intern.
 * An intern's overall score is the average of their department-specific scores.
 */
export const calculateInternOverallScore = (internName, evaluations) => {
  const internEvals = evaluations.filter((ev) => ev.intern_name === internName);
  if (internEvals.length === 0) {
    return {
      overallScore: 0,
      totalAttendance: 0,
      totalEvals: 0,
      departments: {}
    };
  }

  // 1. Group evaluations by department
  const deptsMap = {};
  let totalAttendance = 0;

  internEvals.forEach((ev) => {
    const dept = ev.department || "Unspecified";
    const compositeScore =
      ((ev.commitment_time || 0) +
        (ev.church_spirit_appearance || 0) +
        (ev.lesson_preparation || 0) +
        (ev.target_audience_handling || 0)) /
      4;

    totalAttendance += ev.attendance || 0;

    if (!deptsMap[dept]) {
      deptsMap[dept] = {
        name: dept,
        commitmentSum: 0,
        appearanceSum: 0,
        lessonSum: 0,
        audienceSum: 0,
        attendanceSum: 0,
        compositeSum: 0,
        count: 0,
        evaluations: []
      };
    }

    const d = deptsMap[dept];
    d.commitmentSum += ev.commitment_time || 0;
    d.appearanceSum += ev.church_spirit_appearance || 0;
    d.lessonSum += ev.lesson_preparation || 0;
    d.audienceSum += ev.target_audience_handling || 0;
    d.attendanceSum += ev.attendance || 0;
    d.compositeSum += compositeScore;
    d.count += 1;
    d.evaluations.push(ev);
  });

  // 2. Calculate department averages
  const departments = {};
  let overallScoreSum = 0;
  const deptKeys = Object.keys(deptsMap);

  deptKeys.forEach((key) => {
    const d = deptsMap[key];
    const deptAvg = d.compositeSum / d.count;
    overallScoreSum += deptAvg;

    departments[key] = {
      name: d.name,
      overallScore: deptAvg,
      avgCommitment: d.commitmentSum / d.count,
      avgAppearance: d.appearanceSum / d.count,
      avgLesson: d.lessonSum / d.count,
      avgAudience: d.audienceSum / d.count,
      avgAttendance: d.attendanceSum / d.count,
      evalCount: d.count,
      evaluations: d.evaluations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    };
  });

  // 3. Overall score = average of the department-specific averages
  const overallScore = deptKeys.length ? overallScoreSum / deptKeys.length : 0;

  return {
    overallScore,
    totalAttendance,
    totalEvals: internEvals.length,
    departments
  };
};
