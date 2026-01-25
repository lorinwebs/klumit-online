'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import LoginModal from './LoginModal';

export default function MembershipPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // בדוק אם המשתמש כבר ראה את הפופ-אפ
    const hasSeenPopup = localStorage.getItem('hasSeenMembershipPopup');
    if (!hasSeenPopup) {
      // הצג את הפופ-אפ אחרי עיכוב קצר
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenMembershipPopup', 'true');
  };

  const handleJoin = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenMembershipPopup', 'true');
    // פתח את מודל ההתחברות
    setTimeout(() => {
      setShowLoginModal(true);
    }, 100);
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" 
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="membership-popup-title"
        >
          <div 
            className="bg-white w-full max-w-md mx-4 p-8 relative shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
            role="document"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="סגור חלון"
            >
              <X size={24} aria-hidden="true" />
            </button>

            <div className="text-center space-y-6">
              <h2 
                id="membership-popup-title" 
                className="text-3xl md:text-4xl font-light luxury-font text-[#1a1a1a]"
              >
                הצטרף למועדון החברים שלנו
              </h2>
              
              <p className="text-lg md:text-xl font-light text-gray-700 leading-relaxed">
                וקבל <span className="font-bold text-[#8B6914]">20% הנחה</span> על קניה ראשונה!
              </p>

              <div className="pt-4 space-y-3">
                <button
                  onClick={handleJoin}
                  className="w-full bg-[#1a1a1a] text-white py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury"
                >
                  הצטרף עכשיו
                </button>
                <button
                  onClick={handleClose}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-6 text-sm tracking-luxury uppercase font-light hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-luxury"
                >
                  אולי אחר כך
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          router.push('/');
        }}
      />
    </>
  );
}
