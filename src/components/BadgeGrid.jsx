import React from 'react';
import { 
  Award, 
  PenTool, 
  HelpCircle, 
  BookCheck, 
  Lock, 
  Sparkles, 
  CheckCircle2,
  Flame,
  ShieldCheck,
  Star,
  Trophy
} from 'lucide-react';

const iconMap = {
  Award: Award,
  award: Award,
  PenTool: PenTool,
  pentool: PenTool,
  'pen-tool': PenTool,
  HelpCircle: HelpCircle,
  helpcircle: HelpCircle,
  'help-circle': HelpCircle,
  BookCheck: BookCheck,
  bookcheck: BookCheck,
  'book-check': BookCheck,
  Flame: Flame,
  flame: Flame,
  ShieldCheck: ShieldCheck,
  'shield-check': ShieldCheck,
  Star: Star,
  star: Star,
  Trophy: Trophy,
  trophy: Trophy,
};

export default function BadgeGrid({ badges }) {
  const badgeList = Array.isArray(badges) ? badges : [];

  if (badgeList.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-serif font-bold text-lg text-brand-dark flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-secondary" />
            <span>Gamification Badges &amp; Milestone Trophies</span>
          </h4>
          <span className="text-xs font-bold text-brand-primary bg-brand-cream/50 px-2.5 py-0.5 rounded-full">
            SRS Section 4.6
          </span>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-brand-cream/80 text-center space-y-2.5 shadow-warm-xs">
          <div className="w-12 h-12 rounded-2xl bg-brand-accent/20 flex items-center justify-center text-brand-primary mx-auto">
            <Award className="w-6 h-6 text-brand-secondary" />
          </div>
          <h5 className="font-serif font-bold text-base text-brand-dark">No badges unlocked yet</h5>
          <p className="text-xs text-brand-dark/70 max-w-md mx-auto leading-relaxed">
            Attend Tuesday meetups, complete reading milestones, score on Thursday quizzes, and write Saturday stories to unlock milestone trophies!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-serif font-bold text-lg text-brand-dark flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-secondary" />
          <span>Gamification Badges &amp; Milestone Trophies</span>
        </h4>
        <span className="text-xs font-bold text-brand-primary bg-brand-cream/50 px-2.5 py-0.5 rounded-full">
          {badgeList.filter(b => b.isUnlocked || b.is_unlocked).length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {badgeList.map((badge) => {
          const iconKey = badge.iconName || badge.icon_slug || badge.iconSlug || 'Award';
          const IconComponent = iconMap[iconKey] || Award;
          const isUnlocked = badge.isUnlocked ?? badge.is_unlocked ?? true;
          const tierText = badge.tier || badge.tier_display || 'Silver Tier';
          const tierColorClass = badge.tierColor || badge.tier_color || 'bg-slate-100 text-slate-900 border-slate-300';
          const criteriaText = badge.criteria || badge.description || 'Awarded for active club participation';
          const unlockedTime = badge.unlockedAt || (badge.earned_at ? new Date(badge.earned_at).toLocaleDateString() : 'Active Member');

          return (
            <div
              key={badge.id || badge.name}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative overflow-hidden ${
                isUnlocked
                  ? 'bg-white border-brand-accent/50 shadow-warm-sm hover:shadow-warm-md'
                  : 'bg-brand-surface/70 border-brand-cream/60 opacity-60'
              }`}
            >
              {/* Badge Icon Emblem */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                isUnlocked
                  ? 'bg-brand-accent text-brand-dark border-brand-cream'
                  : 'bg-brand-cream/40 text-brand-dark/50 border-brand-cream'
              }`}>
                {isUnlocked ? (
                  <IconComponent className="w-6 h-6 text-brand-dark" />
                ) : (
                  <Lock className="w-5 h-5 text-brand-dark/50" />
                )}
              </div>

              {/* Badge Details */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="font-serif font-bold text-sm text-brand-dark leading-tight">
                    {badge.name}
                  </h5>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${tierColorClass}`}>
                    {tierText}
                  </span>
                </div>
                <p className="text-xs text-brand-dark/75 leading-relaxed">
                  {criteriaText}
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-semibold text-brand-dark/60">
                  {isUnlocked ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Unlocked: {unlockedTime}
                    </span>
                  ) : (
                    <span className="text-brand-dark/50">
                      🔒 Locked (In Progress)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

