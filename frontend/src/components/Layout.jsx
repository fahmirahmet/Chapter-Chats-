import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CheckInModal from './CheckInModal';

export default function Layout() {
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-brand-surface text-brand-dark antialiased">
      {/* Sticky Glassmorphic Navbar */}
      <Navbar onOpenCheckIn={() => setIsCheckInOpen(true)} />

      {/* Main Dynamic Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet context={{ openCheckInModal: () => setIsCheckInOpen(true) }} />
      </main>

      {/* Interactive Tuesday Passcode Verification Modal */}
      <CheckInModal 
        isOpen={isCheckInOpen} 
        onClose={() => setIsCheckInOpen(false)} 
      />

      {/* Themed Footer */}
      <Footer />
    </div>
  );
}
