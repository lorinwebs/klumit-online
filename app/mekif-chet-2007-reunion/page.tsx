'use client';

import { useEffect, useState } from 'react';
import { Users, MapPin, Sparkles, TrendingUp, Award, UserPlus } from 'lucide-react';

interface Participant {
  name: string;
  className?: string;
  phone?: string;
  email?: string;
  city?: string;
  preferredDate?: string;
  budget?: string;
  meetingStyle?: string;
  notes?: string;
  wantsToHelp?: string;
  otherClass?: string;
}

interface ReunionData {
  total: number;
  byClass: Record<string, Participant[]>;
}

const CLASS_GRADIENTS: Record<string, { from: string; to: string; text: string }> = {
  'יב1': { from: 'from-blue-500', to: 'to-blue-600', text: 'text-blue-50' },
  'יב2': { from: 'from-emerald-500', to: 'to-emerald-600', text: 'text-emerald-50' },
  'יב3': { from: 'from-purple-500', to: 'to-purple-600', text: 'text-purple-50' },
  'יב4': { from: 'from-pink-500', to: 'to-pink-600', text: 'text-pink-50' },
  'יב5': { from: 'from-amber-500', to: 'to-amber-600', text: 'text-amber-50' },
  'יב6': { from: 'from-indigo-500', to: 'to-indigo-600', text: 'text-indigo-50' },
  'יב7': { from: 'from-rose-500', to: 'to-rose-600', text: 'text-rose-50' },
  'יב8': { from: 'from-teal-500', to: 'to-teal-600', text: 'text-teal-50' },
  'יב9': { from: 'from-orange-500', to: 'to-orange-600', text: 'text-orange-50' },
  'יב10': { from: 'from-cyan-500', to: 'to-cyan-600', text: 'text-cyan-50' },
  'אחר': { from: 'from-slate-500', to: 'to-slate-600', text: 'text-slate-50' },
  'לא צוין': { from: 'from-gray-400', to: 'to-gray-500', text: 'text-gray-50' },
};

export default function ReunionPage() {
  const [data, setData] = useState<ReunionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/monday/reunion');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // רענון כל 30 שניות
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-indigo-600 mx-auto mb-6"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={24} />
          </div>
          <p className="text-slate-600 text-lg font-light">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center" dir="rtl">
        <div className="text-center bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <p className="text-red-600 text-lg mb-6 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  // רשימת כל הכיתות
  const allClasses = ['יב1', 'יב2', 'יב3', 'יב4', 'יב5', 'יב6', 'יב7', 'יב8', 'יב9', 'יב10', 'אחר'];
  
  // יצירת אובייקט עם כל הכיתות, גם אם אין נרשמים
  const allClassesData: Record<string, Participant[]> = {};
  allClasses.forEach(className => {
    allClassesData[className] = data?.byClass[className] || [];
  });
  
  // הוספת "לא צוין" אם יש נרשמים כאלה
  if (data?.byClass['לא צוין']) {
    allClassesData['לא צוין'] = data.byClass['לא צוין'];
  }
  
  const total = data?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-8 md:py-12 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <div className="inline-block mb-6">
            <h1 className="text-4xl md:text-6xl font-light text-slate-900 mb-3 tracking-tight">
              מפגש מחזור 2007 מקיף ח' - האיחוד!
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-xl px-6 py-3 rounded-full shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
              <Users className="text-indigo-600" size={28} />
              <span className="text-2xl md:text-3xl font-light text-slate-800">
                <span className="font-semibold text-indigo-600">{total}</span> נרשמו
              </span>
            </div>
            <a
              href="https://forms.monday.com/forms/f2abc9fccb939b062aeb659cc4454b24?r=euc1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-xl hover:shadow-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-0.5 font-medium text-lg"
            >
              <UserPlus size={22} />
              הרשמה למפגש
            </a>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-10 md:mb-16 max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 md:p-8 border border-white/20">
            <p className="text-lg md:text-xl text-slate-700 leading-relaxed text-center font-light">
              היי לכולם, החלטנו שהגיע הזמן ליצור מפגש, רק לנו (בלי בני זוג וילדים!!) לא להאמין כמה אנחנו זקנים וכמה זמן לא נפגשנו, יאללה תמלאו את הטופס ובקרוב נעדכן מתי זה קורה!
            </p>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-12">
          {Object.entries(allClassesData).map(([className, participants], idx) => {
            const gradient = CLASS_GRADIENTS[className] || CLASS_GRADIENTS['לא צוין'];
            
            return (
              <div
                key={className}
                className="group bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border border-white/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Class Header */}
                <div className={`bg-gradient-to-br ${gradient.from} ${gradient.to} ${gradient.text} px-5 py-4 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-semibold">{className}</h2>
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-semibold border border-white/30">
                      {participants.length}
                    </span>
                  </div>
                </div>

                {/* Participants List */}
                <div className="p-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar min-h-[100px]">
                  {participants.length > 0 ? (
                    participants.map((participant, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-3 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200 group/item"
                      >
                        <div className="font-medium text-slate-900 mb-1.5 group-hover/item:text-indigo-700 transition-colors">
                          {index + 1}. {participant.name}
                        </div>
                        {participant.otherClass && (
                          <div className="text-xs text-slate-400 mt-1.5 italic bg-slate-50 px-2 py-1 rounded-md inline-block">
                            {participant.otherClass}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      אין נרשמים עדיין
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Organizers Section */}
        <div className="mt-12 text-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-white/20 max-w-2xl mx-auto">
            <h3 className="text-xl md:text-2xl font-light text-slate-900 mb-6">המארגנות:</h3>
            <div className="space-y-4 text-slate-700">
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                <span className="font-medium">לורין טוטח (חייט)</span>
                <a href="tel:0524893329" className="text-indigo-600 hover:text-indigo-700 transition-colors">
                  0524893329
                </a>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                <span className="font-medium">נטלי נחום (אמיר)</span>
                <a href="tel:0524258068" className="text-indigo-600 hover:text-indigo-700 transition-colors">
                  0524258068
                </a>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                <span className="font-medium">טל נקר (מי-פז)</span>
                <a href="tel:0542553737" className="text-indigo-600 hover:text-indigo-700 transition-colors">
                  0542553737
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
