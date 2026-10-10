import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle2, Flame, Flag } from 'lucide-react';
import { getNextUpcomingTuesday } from '../utils/cycleUtils';

export default function CycleCountdown({ 
  targetDate, 
  activeWeek = 1,
  cycle,
  meetingTitle,
  milestones, 
  currentPages = 0, 
  totalPages = 300 
}) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMeetingActive, setIsMeetingActive] = useState(false);

  // Compute dynamic weekday and review heading
  const meetingDateObj = targetDate ? new Date(typeof targetDate === 'string' && !targetDate.includes('T') ? `${targetDate}T12:30:00+03:00` : targetDate) : null;
  const isValidDate = meetingDateObj && !isNaN(meetingDateObj.getTime());
  const weekdayName = isValidDate ? meetingDateObj.toLocaleDateString(undefined, { weekday: 'long' }) : 'Tuesday';
  const displayCountdownHeading = meetingTitle || `${weekdayName} Review (12:30 PM)`;

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      let targetMs = 0;

      if (targetDate) {
        if (typeof targetDate === 'string') {
          const trimmed = targetDate.trim();
          if (trimmed) {
            if (!trimmed.includes('T')) {
              targetMs = new Date(`${trimmed}T12:30:00+03:00`).getTime();
            } else {
              targetMs = new Date(trimmed).getTime();
            }
          }
        } else if (targetDate instanceof Date) {
          targetMs = targetDate.getTime();
        }
      }

      // If target is missing, invalid, or far in the future (> 7.5 days from now), target the next upcoming Tuesday review
      const maxMs = 7.5 * 24 * 60 * 60 * 1000;
      if (!targetMs || isNaN(targetMs) || (targetMs - now > maxMs)) {
        const nextTue = getNextUpcomingTuesday();
        targetMs = nextTue.getTime();
      }

      const difference = targetMs - now;

      // 4-Hour Meeting Window check from meeting start time
      const meetingEndTime = targetMs + (4 * 60 * 60 * 1000);
      if (now >= targetMs && now <= meetingEndTime) {
        setIsMeetingActive(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setIsMeetingActive(false);

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const safeCurrent = Number(currentPages) || 0;
  const safeTotal = Number(totalPages) || 300;
  const progressPercent = safeTotal > 0 ? Math.min(Math.max(0, Math.round((safeCurrent / safeTotal) * 100)), 100) : 0;

  const week1Label = milestones?.week1?.label || 'Week 1 Milestone';
  const week1Pages = milestones?.week1?.pages || `Pages 1–${Math.round(safeTotal * 0.33)} (33%)`;
  const week2Label = milestones?.week2?.label || 'Week 2 Target';
  const week2Pages = milestones?.week2?.pages || `Pages ${Math.round(safeTotal * 0.33) + 1}–${Math.round(safeTotal * 0.66)} (66%)`;
  const week3Label = milestones?.week3?.label || 'Week 3 Final Sprint';
  const week3Pages = milestones?.week3?.pages || `Pages ${Math.round(safeTotal * 0.66) + 1}–${safeTotal} (100%)`;

  return (
    <div className="space-y-6">
      {/* Real-time Countdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C48B47]">
            <Clock className="w-4 h-4 text-[#C48B47] animate-pulse" />
            <span>Countdown to {displayCountdownHeading}</span>
          </div>
          {isMeetingActive && (
            <span className="bg-[#C48B47] text-[#24150C] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase animate-bounce shadow-sm">
              ⚡ Passcode Window Active Now!
            </span>
          )}
        </div>

        {/* Countdown Digits Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Mins', value: timeLeft.minutes },
            { label: 'Secs', value: timeLeft.seconds },
          ].map((unit, idx) => (
            <div
              key={idx}
              className="bg-[#24150C] border border-[#4A2F1B] p-2.5 sm:p-3.5 rounded-xl shadow-inner flex flex-col justify-center items-center group hover:border-[#C48B47]/50 transition-colors"
            >
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#C48B47] leading-none">
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-[#D8C8B0]/80 uppercase tracking-wide mt-1.5">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Milestone Reading Progress Bar */}
      <div className="space-y-3 pt-3 border-t border-[#4A2F1B]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#F8F4EC]/90 font-bold">
            <Flame className="w-4 h-4 text-[#C48B47]" />
            <span>Cycle Milestone Target</span>
          </div>
          <span className="text-[#C48B47] font-bold">
            {safeCurrent} of {safeTotal} Pages ({progressPercent}%)
          </span>
        </div>

        {/* Carved Groove Track Milestone Progress Bar */}
        <div className="relative w-full bg-[#24150C] rounded-full h-3 p-0.5 border border-[#4A2F1B] overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#A35C33] to-[#C48B47] h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 3-Week Target Markers */}
        <div className="grid grid-cols-3 gap-2 text-[10px] text-[#F8F4EC]/80 pt-1">
          <div className={`text-left space-y-0.5 border-l-2 pl-2 transition-colors ${
            activeWeek === 1
              ? 'border-[#C48B47] text-[#C48B47]'
              : 'border-[#4A2F1B] text-[#F8F4EC]/80'
          }`}>
            <span className={`block font-bold ${activeWeek === 1 ? 'text-[#C48B47]' : 'text-[#F8F4EC]/90'}`}>
              {week1Label}
            </span>
            <span className={activeWeek === 1 ? 'text-[#F8F4EC] font-semibold' : 'text-[#F8F4EC]/60'}>
              {week1Pages}
            </span>
          </div>

          <div className={`text-center space-y-0.5 border-l-2 pl-2 transition-colors ${
            activeWeek === 2
              ? 'border-[#C48B47] text-[#C48B47]'
              : 'border-[#4A2F1B] text-[#F8F4EC]/80'
          }`}>
            <span className={`block font-bold ${activeWeek === 2 ? 'text-[#C48B47]' : 'text-[#F8F4EC]/90'}`}>
              {week2Label}
            </span>
            <span className={activeWeek === 2 ? 'text-[#F8F4EC] font-semibold' : 'text-[#F8F4EC]/60'}>
              {week2Pages}
            </span>
          </div>

          <div className={`text-right space-y-0.5 border-l-2 pl-2 transition-colors ${
            activeWeek === 3
              ? 'border-[#C48B47] text-[#C48B47]'
              : 'border-[#4A2F1B] text-[#F8F4EC]/80'
          }`}>
            <span className={`block font-bold ${activeWeek === 3 ? 'text-[#C48B47]' : 'text-[#F8F4EC]/90'}`}>
              {week3Label}
            </span>
            <span className={activeWeek === 3 ? 'text-[#F8F4EC] font-semibold' : 'text-[#F8F4EC]/60'}>
              {week3Pages}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
