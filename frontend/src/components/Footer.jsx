import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  Shield, 
  Sparkles, 
  Heart, 
  Mail, 
  ExternalLink,
  BookMarked
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-brand-surface pt-12 pb-8 border-t-4 border-brand-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-brand-cream/15">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 px-3 py-1.5 rounded-2xl bg-[#EFE7DA] border-2 border-brand-accent/40 shadow-md flex items-center justify-center">
                <img src="/logo.png" alt="Chapters & Chats Logo" className="h-10 w-auto object-contain" />
              </div>
            </div>
            <p className="text-xs text-brand-cream/80 leading-relaxed">
              Digitizing our university reading community through structured 3-week reading sprints, downloadable study guides, and in-person Tuesday reviews.
            </p>
          </div>

          {/* Col 2: In-Person Meeting Schedule Banner */}
          <div className="md:col-span-1 space-y-3 bg-brand-dark-light/60 p-4 rounded-2xl border border-brand-cream/20 shadow-inner">
            <div className="flex items-center gap-2 text-brand-accent font-semibold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-brand-accent" />
              <span>Physical Meetup Schedule</span>
            </div>
            <div className="space-y-1.5">
              <p className="font-serif text-lg font-bold text-brand-cream">
                Every 3rd Tuesday
              </p>
              <div className="flex items-center gap-2 text-xs text-brand-surface/90 font-medium">
                <Clock className="w-3.5 h-3.5 text-brand-accent" />
                <span>12:30 PM – 3:30 PM (EAT)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-brand-cream/70">
                <MapPin className="w-3.5 h-3.5 text-brand-secondary" />
                <span>University Student Center • Library Hall B</span>
              </div>
            </div>
            <div className="pt-2 border-t border-brand-cream/10 flex items-center justify-between text-[11px] text-brand-cream">
              <span>Passcode Check-in Window:</span>
              <span className="font-bold text-brand-accent bg-brand-primary px-2 py-0.5 rounded">12:30 – 15:30</span>
            </div>
          </div>

          {/* Col 3: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm uppercase text-brand-accent tracking-wider">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-xs text-brand-cream/80">
              <li>
                <NavLink to="/book-house" className="hover:text-brand-accent transition-colors flex items-center gap-1.5">
                  <BookMarked className="w-3.5 h-3.5 text-brand-secondary" />
                  <span>Book House Repository (PDFs)</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/six-word-story" className="hover:text-brand-accent transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Saturday Six-Word Story</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/discussions" className="hover:text-brand-accent transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-brand-secondary" />
                  <span>Chapter Discussions &amp; Polls</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/about" className="hover:text-brand-accent transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-brand-cream" />
                  <span>About &amp; Member Guidelines</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Col 4: Community & Contact */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm uppercase text-brand-accent tracking-wider">
              Community Engagement
            </h4>
            <p className="text-xs text-brand-cream/80 leading-relaxed">
              Earn XP badges, maintain your Tuesday check-in streak, and submit book recommendations for upcoming cycle votes.
            </p>
            <div className="pt-2">
              <a
                href="mailto:contact@chaptersandchats.edu"
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-brand-primary text-brand-cream hover:bg-brand-accent hover:text-brand-dark transition-all duration-200"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Club Executives</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom copyright & info */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-cream/60">
          <p>© {new Date().getFullYear()} Chapters &amp; Chats Book Club.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-brand-cream">
              Made with <Heart className="w-3.5 h-3.5 text-brand-primary fill-brand-primary inline" /> for book lovers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
