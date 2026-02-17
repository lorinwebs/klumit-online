'use client';

import { useEffect, useState } from 'react';
import { Users, MapPin, Sparkles, TrendingUp, Award, UserPlus, Calendar, DollarSign, CreditCard, Crown } from 'lucide-react';

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
  paid?: boolean;
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

const CLASS_NAMES: Record<string, string> = {
  'יב1': 'מדעית',
  'יב2': 'מחר ספורט',
  'יב3': 'מחר',
  'יב4': 'אתגר',
  'יב5': 'טכ"מ',
  'יב6': 'מב"ר',
  'יב7': 'חינוך מיוחד',
  'יב8': 'תעשייה וניהול',
  'יב9': 'מחר',
  'יב10': 'משאבי אנוש',
};

export default function ReunionPage() {
  const [data, setData] = useState<ReunionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update page title for Google Analytics
    document.title = 'מקיף ח\' 2007 מפגש איחוד!';
    
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
  
  // חישוב כמה שילמו
  const paidCount = Object.values(allClassesData)
    .flat()
    .filter(p => p.paid).length;
  const paidPercentage = total > 0 ? Math.round((paidCount / total) * 100) : 0;
  
  // חישוב סכומים
  const PRICE_PER_PERSON = 400;
  const TARGET_PARTICIPANTS = 24;
  const totalTargetAmount = TARGET_PARTICIPANTS * PRICE_PER_PERSON; // 9,600
  const collectedAmount = paidCount * PRICE_PER_PERSON;
  const remainingAmount = totalTargetAmount - collectedAmount;
  
  // מציאת הכיתה המובילה (עם הכי הרבה משתתפים ששילמו)
  let leadingClass = '';
  let maxPaidCount = 0;
  Object.entries(allClassesData).forEach(([className, participants]) => {
    const classPaidCount = participants.filter(p => p.paid).length;
    if (classPaidCount > maxPaidCount && classPaidCount > 0) {
      maxPaidCount = classPaidCount;
      leadingClass = className;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-8 md:py-12 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          {/* School Logo */}
          <div className="mb-6 flex justify-center">
            <img 
              src="https://mekifh.mashov.info/wp-content/uploads/sites/82/2021/06/Semel-MekifH-%D7%A9%D7%9C%D7%95%D7%9D-%D7%95%D7%90%D7%A0%D7%95%D7%A0%D7%95.png"
              alt="לוגו מקיף ח'"
              className="h-24 md:h-32 w-auto object-contain"
            />
          </div>
          <div className="inline-block mb-6">
            <h1 className="text-4xl md:text-6xl font-light text-slate-900 mb-3 tracking-tight">
              מקיף ח' 2007 מפגש איחוד!
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto"></div>
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
              <div className="inline-flex items-center gap-3 bg-white px-6 py-3 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300">
                <Users className="text-indigo-600" size={28} />
                <span className="text-2xl md:text-3xl font-light text-slate-800">
                  <span className="font-semibold text-indigo-600">{total}</span> נרשמו
                </span>
              </div>
              <a
                href="https://forms.monday.com/forms/f2abc9fccb939b062aeb659cc4454b24?r=euc1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium text-lg"
              >
                <UserPlus size={22} />
                הרשמה למפגש
              </a>
              <a
                href="/mekif-chet-availability-check"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 shadow-md hover:shadow-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-medium text-lg"
              >
                <Calendar size={22} />
                בדיקת זמינות לתאריך
              </a>
            </div>
            
            {/* Telegram Payment Link */}
            <a
              href="https://links.payboxapp.com/ROF2GSCOP0b"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg rounded-lg"
              style={{ 
                backgroundColor: '#0088cc',
                color: 'white'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#006ba3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0088cc'}
            >
              <CreditCard size={24} />
              תשלום ₪400
            </a>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-10 md:mb-16 max-w-3xl mx-auto">
          <div className="bg-white shadow-md border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <p className="text-lg md:text-xl text-slate-700 leading-relaxed text-center font-light">
                היי לכולם, החלטנו שהגיע הזמן ליצור מפגש, רק לנו (בלי בני זוג וילדים!!) לא להאמין כמה אנחנו זקנים וכמה זמן לא נפגשנו, יאללה תמלאו את הטופס ובקרוב נעדכן מתי זה קורה!
              </p>
            </div>
            
            {/* Payment Stats */}
            <div className="border-t border-slate-200 bg-gradient-to-br from-green-50 to-emerald-50 px-6 md:px-8 py-5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">סטטוס תשלומים</p>
                    <p className="text-2xl font-semibold text-green-700">
                      {paidCount} מתוך {total} שילמו
                    </p>
                    {leadingClass && maxPaidCount > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Crown className="text-yellow-600" size={14} fill="currentColor" />
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-yellow-700">{leadingClass}</span> מובילה עם{' '}
                          <span className="font-bold text-green-600">{maxPaidCount}</span> תשלומים
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Total Amount */}
                  <div className="bg-white/70 backdrop-blur-sm border border-green-200 rounded-lg px-5 py-3">
                    <p className="text-xs text-slate-600 mb-0.5">סה״כ נאסף</p>
                    <p className="text-xl font-bold text-green-600">
                      ₪{collectedAmount.toLocaleString('he-IL')}
                    </p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full md:w-64">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600">התקדמות</span>
                      <span className="text-sm font-bold text-green-600">{paidPercentage}%</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-out rounded-full"
                        style={{ width: `${paidPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-12">
          {Object.entries(allClassesData).map(([className, participants], idx) => {
            const gradient = CLASS_GRADIENTS[className] || CLASS_GRADIENTS['לא צוין'];
            const isLeading = className === leadingClass;
            const classPaidCount = participants.filter(p => p.paid).length;
            
            return (
              <div
                key={className}
                className={`group bg-white shadow-md overflow-hidden border transition-all duration-300 ${
                  isLeading 
                    ? 'border-yellow-400 ring-4 ring-yellow-200 shadow-xl scale-105' 
                    : 'border-slate-200 hover:shadow-lg'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Crown for Leading Class */}
                {isLeading && (
                  <div className="absolute -top-3 right-1/2 translate-x-1/2 z-10">
                    <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-2 rounded-full shadow-lg border-4 border-white">
                      <Crown className="text-yellow-900" size={24} fill="currentColor" />
                    </div>
                  </div>
                )}
                
                {/* Class Header */}
                <div className={`bg-gradient-to-br ${gradient.from} ${gradient.to} ${gradient.text} px-5 py-4 relative overflow-hidden ${isLeading ? 'pt-6' : ''}`}>
                  {isLeading && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 animate-pulse"></div>
                  )}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl md:text-2xl font-semibold">{className}</h2>
                        {isLeading && (
                          <span className="text-xs bg-yellow-300/30 text-yellow-100 px-2 py-0.5 rounded-full font-bold border border-yellow-400/40">
                            מובילים! 🔥
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="bg-white/30 px-3 py-1.5 text-sm font-semibold border border-white/40">
                          {participants.length}
                        </span>
                        {classPaidCount > 0 && (
                          <span className="bg-green-500/30 px-2 py-0.5 text-xs font-semibold border border-green-400/40 flex items-center gap-1">
                            <DollarSign size={12} />
                            {classPaidCount}
                          </span>
                        )}
                      </div>
                    </div>
                    {CLASS_NAMES[className] && (
                      <p className="text-sm opacity-90">{CLASS_NAMES[className]}</p>
                    )}
                  </div>
                </div>

                {/* Participants List */}
                <div className="p-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar min-h-[100px]">
                  {participants.length > 0 ? (
                    participants.map((participant, index) => (
                      <div
                        key={index}
                        className={`p-3 border transition-all duration-200 group/item ${
                          participant.paid 
                            ? 'bg-green-50 border-green-300 hover:border-green-400 hover:shadow-sm' 
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {participant.paid && (
                            <DollarSign className="text-green-600 shrink-0" size={18} />
                          )}
                          <div className={`font-medium mb-1.5 transition-colors flex-1 ${
                            participant.paid 
                              ? 'text-green-900 group-hover/item:text-green-700' 
                              : 'text-slate-900 group-hover/item:text-indigo-700'
                          }`}>
                            {index + 1}. {participant.name}
                          </div>
                        </div>
                        {participant.otherClass && (
                          <div className="text-xs text-slate-400 mt-1.5 italic bg-slate-50 px-2 py-1 inline-block">
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
          <div className="bg-white shadow-md p-6 md:p-8 border border-slate-200 max-w-2xl mx-auto">
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
