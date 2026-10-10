/**
 * Utility functions for Reading Cycle milestone determination and Tuesday countdown.
 */

/**
 * Returns a Date object for the upcoming Tuesday at 12:30 PM (EAT / +03:00).
 * If today is Tuesday before 16:30 (4:30 PM), targets today at 12:30 PM.
 * If today is Tuesday after 16:30, targets next Tuesday at 12:30 PM.
 */
export function getNextUpcomingTuesday(now = new Date()) {
  const target = new Date(now);
  const day = target.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  const hours = target.getHours();
  const minutes = target.getMinutes();
  const currentTimeMinutes = hours * 60 + minutes;
  const meetingEndMinutes = 16 * 60 + 30; // 4:30 PM (4-hour meeting window from 12:30 PM)

  let daysToAdd = (2 - day + 7) % 7;
  // If today is Tuesday but meeting window has ended (after 16:30), advance to next Tuesday
  if (day === 2 && currentTimeMinutes > meetingEndMinutes) {
    daysToAdd = 7;
  }

  target.setDate(target.getDate() + daysToAdd);
  target.setHours(12, 30, 0, 0);
  return target;
}

/**
 * Parse a date string or Date object safely into a Date object at 12:30 PM.
 */
export function parseDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') {
    const clean = dateInput.trim();
    if (!clean) return null;
    if (clean.includes('T')) {
      const d = new Date(clean);
      return isNaN(d.getTime()) ? null : d;
    }
    // Format YYYY-MM-DD
    const parts = clean.split('-').map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 30, 0, 0);
    }
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Computes milestone review dates and determines the current active week.
 *
 * Rules:
 * Week 1: Day 0 through Day 6 (or until Week 1 Tuesday meetup ends at 16:30).
 * Week 2: Day 7 through Day 13 (or until Week 2 Tuesday meetup ends at 16:30).
 * Week 3: Day 14 through Day 20+ (or until Week 3 Tuesday meetup ends at 16:30).
 */
export function computeCycleMilestoneSchedule(cycle, currentDate = new Date()) {
  const now = currentDate instanceof Date ? currentDate : new Date();
  const nowMs = now.getTime();

  // If backend provided pre-computed active_week and target_tuesday, check if valid
  const backendActiveWeek = Number(cycle?.active_week);
  const backendTargetTuesday = cycle?.target_tuesday;

  const startDateRaw = cycle?.start_date || cycle?.startDate;
  const meetingDateRaw = cycle?.meeting_date || cycle?.meetingDate || cycle?.targetTuesdayMeeting;
  const totalPages = Number(cycle?.book?.total_pages || cycle?.book?.totalPages) || 300;

  // 1. Establish Start Date
  let startDate = parseDate(startDateRaw);
  if (!startDate) {
    const parsedMeeting = parseDate(meetingDateRaw);
    if (parsedMeeting) {
      startDate = new Date(parsedMeeting.getTime() - 21 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 30, 0, 0);
    }
  }

  // 2. Establish 3 Tuesday Milestone Meeting Timestamps (at 12:30 PM)
  const week1Date = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  week1Date.setHours(12, 30, 0, 0);

  const week2Date = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  week2Date.setHours(12, 30, 0, 0);

  let week3Date = parseDate(meetingDateRaw);
  if (!week3Date) {
    week3Date = new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000);
  }
  week3Date.setHours(12, 30, 0, 0);

  // 4-hour meeting duration (12:30 PM - 4:30 PM)
  const meetingWindowMs = 4 * 60 * 60 * 1000;
  const w1EndMs = week1Date.getTime() + meetingWindowMs;
  const w2EndMs = week2Date.getTime() + meetingWindowMs;

  // 3. Determine Active Week
  let activeWeek = 1;
  let nextMeetingDate = week1Date;

  if (nowMs <= w1EndMs) {
    activeWeek = 1;
    nextMeetingDate = week1Date;
  } else if (nowMs <= w2EndMs) {
    activeWeek = 2;
    nextMeetingDate = week2Date;
  } else {
    activeWeek = 3;
    nextMeetingDate = week3Date;
  }

  // If backend provided active_week and matches, respect backend
  if (backendActiveWeek && [1, 2, 3].includes(backendActiveWeek)) {
    activeWeek = backendActiveWeek;
    if (activeWeek === 1) nextMeetingDate = week1Date;
    else if (activeWeek === 2) nextMeetingDate = week2Date;
    else nextMeetingDate = week3Date;
  }

  if (backendTargetTuesday) {
    const parsedBackendTarget = parseDate(backendTargetTuesday);
    if (parsedBackendTarget && !isNaN(parsedBackendTarget.getTime())) {
      nextMeetingDate = parsedBackendTarget;
    }
  }

  // 4. Safe Milestones Data
  const rawMilestones = cycle?.milestones || {};
  const safeMilestones = {
    week1: {
      label: rawMilestones.week1?.label || 'Week 1 Milestone',
      pages: rawMilestones.week1?.pages || `1 to ${Math.round(totalPages * 0.33)} (33%)`,
      percentage: rawMilestones.week1?.percentage || 33,
      date: week1Date.toISOString(),
    },
    week2: {
      label: rawMilestones.week2?.label || 'Week 2 Target',
      pages: rawMilestones.week2?.pages || `${Math.round(totalPages * 0.33) + 1} to ${Math.round(totalPages * 0.66)} (66%)`,
      percentage: rawMilestones.week2?.percentage || 66,
      date: week2Date.toISOString(),
    },
    week3: {
      label: rawMilestones.week3?.label || 'Week 3 Final Sprint',
      pages: rawMilestones.week3?.pages || `${Math.round(totalPages * 0.66) + 1} to ${totalPages} (100%)`,
      percentage: rawMilestones.week3?.percentage || 100,
      date: week3Date.toISOString(),
    },
  };

  const activeMilestone =
    activeWeek === 3
      ? safeMilestones.week3
      : activeWeek === 2
      ? safeMilestones.week2
      : safeMilestones.week1;

  return {
    activeWeek,
    nextMeetingDate: nextMeetingDate.toISOString(),
    nextMeetingDateObj: nextMeetingDate,
    activeMilestone,
    milestones: safeMilestones,
    milestoneDates: {
      week1: week1Date.toISOString(),
      week2: week2Date.toISOString(),
      week3: week3Date.toISOString(),
    },
  };
}
