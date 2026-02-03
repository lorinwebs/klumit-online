'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import LoginModal from '@/components/LoginModal';
import Toast from '@/components/Toast';
import { useChatWidget } from '@/lib/hooks/useChatWidget';
import { useLanguage } from '@/lib/LanguageContext';

export default function ChatWidget() {
  const { language } = useLanguage();
  const {
    isOpen,
    toggleChat,
    messages,
    inputValue,
    setInputValue,
    loading,
    isTyping,
    adminTyping,
    user,
    unreadCount,
    conversationId,
    sessionId,
    sendMessage,
    showLoginModal,
    setShowLoginModal,
  } = useChatWidget();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [errorToast, setErrorToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  // גלילה למטה כשמוסיפים הודעה או כשפותחים את הצ'אט
  useEffect(() => {
    if (isOpen && messages.length > 0 && messagesEndRef.current) {
      // שימוש ב-requestAnimationFrame במקום setTimeout
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages, isOpen]);

  // סגירת צ'אט
  const handleClose = () => {
    toggleChat();
  };

  // שליחת הודעה עם טיפול בשגיאות
  const handleSend = async () => {
    try {
      await sendMessage();
    } catch (error: any) {
      setErrorToast({
        show: true,
        message: `שגיאה בשליחת הודעה: ${error.message || 'שגיאה לא ידועה'}`,
      });
      setTimeout(() => {
        setErrorToast({ show: false, message: '' });
      }, 3000);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'delivered_to_telegram':
        return '✓';
      case 'sent_to_server':
        return '✓';
      case 'failed':
        return '✗';
      default:
        return '✓';
    }
  };

  // טיפול בהתחברות מוצלחת
  const handleLoginSuccess = async () => {
    setShowLoginModal(false);
    
    // ה-auth state change handler ב-hook יטפל בעדכון המשתמש
    // אין צורך לעשות reload או לבדוק את הסשן - supabase.auth.onAuthStateChange יעדכן אוטומטית
  };

  return (
    <>
      {/* כפתור פתיחה */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={toggleChat}
          className="fixed right-6 bottom-6 z-[9999] bg-[#1a1a1a] text-white rounded-full px-3 py-3 md:px-6 md:py-2.5 shadow-lg hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
          aria-label="פתח צ'אט"
        >
          <MessageCircle size={20} />
          <span className="hidden md:inline text-sm font-medium whitespace-nowrap">דברו איתנו!</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* חלון צ'אט */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-6 bottom-6 z-[9999] w-96 max-w-[calc(100vw-3rem)] bg-white rounded-lg shadow-2xl flex flex-col max-h-[600px] h-[600px]"
            dir={language === 'he' ? 'rtl' : 'ltr'}
          >
            {/* כותרת */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">צור קשר</h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
                aria-label="סגור"
              >
                <X size={20} />
              </button>
            </div>

            {/* הודעה להתחברות */}
            {!user && (
              <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <LogIn size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-right">
                      <p className="text-xs text-blue-800 mb-2">
                        כדאי להתחבר על מנת לשמור על היסטוריית השיחה
                      </p>
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline font-medium text-right"
                      >
                        התחבר עכשיו
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* אזור הודעות */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>שלום! איך אפשר לעזור?</p>
                </div>
              ) : null}
              {messages.length > 0 && (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.from_user ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.from_user
                          ? 'bg-[#1a1a1a] text-white'
                          : 'bg-gray-100 text-[#1a1a1a]'
                      }`}
                    >
                      {!msg.from_user && msg.replied_by_name && (
                        <div className="text-xs opacity-75 mb-1">
                          {msg.replied_by_name}
                        </div>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className="text-xs opacity-75">
                          {formatTime(msg.created_at)}
                        </span>
                        {msg.from_user && (
                          <span
                            className={`text-xs ${
                              msg.status === 'failed'
                                ? 'text-red-500'
                                : msg.status === 'delivered_to_telegram'
                                ? 'text-green-500'
                                : 'text-gray-400'
                            }`}
                            title={
                              msg.status === 'delivered_to_telegram'
                                ? 'נמסר לטלגרם'
                                : msg.status === 'sent_to_server'
                                ? 'נשלח לשרת'
                                : msg.status === 'failed'
                                ? 'נכשל'
                                : 'ממתין'
                            }
                          >
                            {getStatusIcon(msg.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {adminTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <p className="text-sm text-gray-500">מקליד...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* שדה קלט */}
            <div className="p-4 border-t border-gray-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="הקלד הודעה..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading}
                  className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="שלח"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* מודל התחברות */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Toast לשגיאות */}
      <Toast 
        show={errorToast.show} 
        message={errorToast.message} 
        showViewCart={false} 
        type="warning" 
      />
    </>
  );
}
