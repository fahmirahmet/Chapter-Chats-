import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Trophy, ThumbsUp, ArrowRight, PenTool } from 'lucide-react';

export default function SaturdayStoryBanner({ storyData }) {
  if (!storyData) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-cream/30 via-brand-surface to-brand-cream/20 border-2 border-brand-accent/50 p-6 sm:p-7 shadow-warm-md">
      {/* Subtle background icon emblem */}
      <div className="absolute right-4 bottom-1/2 translate-y-1/2 text-brand-accent/15 pointer-events-none">
        <Trophy className="w-36 h-36" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-accent text-brand-dark text-xs font-bold uppercase tracking-wider shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-brand-dark" />
              Story of the Week (Pinned)
            </span>
            <span className="text-xs font-bold text-brand-primary bg-white px-3 py-1 rounded-full border border-brand-cream shadow-warm-sm">
              {storyData.publishedDate}
            </span>
          </div>

          <div className="space-y-1">
            <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark leading-snug">
              "{storyData.text}"
            </p>
            <p className="text-xs font-semibold text-brand-dark/70">
              Prompt: <span className="italic">"{storyData.prompt}"</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-brand-dark/80 pt-1">
            <span className="font-bold text-brand-primary">by {storyData.author}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-bold text-brand-secondary">
              <ThumbsUp className="w-3.5 h-3.5 text-brand-secondary" />
              {storyData.upvotes} Community Votes
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="shrink-0">
          <NavLink
            to="/six-word-story"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-dark text-brand-cream font-bold text-xs hover:bg-brand-primary hover:text-white transition-all duration-200 shadow-warm-md group"
          >
            <PenTool className="w-4 h-4 text-brand-accent group-hover:scale-110 transition-transform" />
            <span>Submit This Saturday's Entry</span>
            <ArrowRight className="w-4 h-4 text-brand-accent" />
          </NavLink>
        </div>
      </div>
    </div>
  );
}
