'use client';

import { useEffect, useState } from 'react';
import { Users, Calendar, TrendingUp, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface Person {
  name: string;
  unavailableDates: string[];
  canDoAll: boolean;
  hasResponded: boolean;
}

interface AvailabilityData {
  total: number;
  people: Person[];
  availableDates: string[];
}

export default function AvailabilityCheckPage() {
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [bestDate, setBestDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isPeopleExpanded, setIsPeopleExpanded] = useState(false);

  useEffect(() => {
    document.title = 'בדיקת זמינות לאירוע - פגישת מקיף ח\'';
    
    const fetchData = async () => {
      try {
        const response = await fetch('/api/availability');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
        
        // מציאת התאריך שהכי הרבה אנשים יכולים (רק אנשים שענו)
        if (result.availableDates.length > 0) {
          let maxAvailable = 0;
          let best = result.availableDates[0];
          
          result.availableDates.forEach((date: string) => {
            const available = result.people.filter((p: Person) => 
              p.hasResponded && !p.unavailableDates.includes(date)
            ).length;
            
            if (available > maxAvailable) {
              maxAvailable = available;
              best = date;
            }
          });
          
          setBestDate(best);
        }
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
            <div className="animate-spin h-20 w-20 border-4 border-slate-200 border-t-indigo-600 mx-auto mb-6" style={{ borderRadius: '50%' }}></div>
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
        <div className="text-center bg-white p-10 shadow-2xl border border-slate-200 max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <p className="text-red-600 text-lg mb-6 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  // חישוב כמה זמינים בתאריך הטוב ביותר (רק אנשים שענו)
  const availableCount = bestDate && data 
    ? data.people.filter(p => p.hasResponded && !p.unavailableDates.includes(bestDate)).length 
    : 0;
  
  // חישוב כמה אנשים ענו בסך הכל
  const respondedCount = data ? data.people.filter(p => p.hasResponded).length : 0;

  // חישוב סטטיסטיקה לכל תאריך
  const dateStats = data?.availableDates.map(date => {
    const unavailableCount = data.people.filter(p => 
      p.hasResponded && p.unavailableDates.includes(date)
    ).length;
    const availableCount = data.people.filter(p => 
      p.hasResponded && !p.unavailableDates.includes(date)
    ).length;
    return {
      date,
      unavailableCount,
      availableCount,
    };
  }).sort((a, b) => a.unavailableCount - b.unavailableCount) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-8 md:py-12 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
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
              בדיקת זמינות לאירוע - פגישת מקיף ח'
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto"></div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 shadow-md border border-slate-200">
              <Users className="text-indigo-600" size={28} />
              <span className="text-2xl md:text-3xl font-light text-slate-800">
                <span className="font-semibold text-indigo-600">{data?.total || 0}</span> משתתפים
              </span>
            </div>
            <a
              href="/mekif-chet-2007-reunion"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium text-lg"
            >
              <Users size={22} />
              חזרה לדף האיחוד
            </a>
          </div>
        </div>

        {/* Best Date Card */}
        {bestDate && (
          <div className="mb-10">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg p-8 border border-green-400">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp size={32} />
                    <h2 className="text-2xl font-semibold">התאריך הטוב ביותר</h2>
                  </div>
                  <p className="text-green-100 text-lg">הכי הרבה אנשים יכולים להגיע</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-1">📅 {bestDate}</div>
                  <div className="text-green-100 text-xl">
                    <span className="font-semibold text-white">{availableCount}</span> מתוך {respondedCount} זמינים
                  </div>
                  <div className="text-green-100 text-sm mt-1">
                    ({respondedCount} ענו מתוך {data?.total} משתתפים)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Statistics Dashboard - Collapsible */}
        {dateStats.length > 0 && (
          <div className="mb-10">
            <div className="bg-white shadow-md border border-slate-200">
              <button
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-between"
              >
                <h2 className="text-2xl font-semibold">סטטיסטיקה לפי תאריכים</h2>
                {isStatsExpanded ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
              </button>
              {isStatsExpanded && (
                <div className="p-6">
                  <div className="space-y-3">
                  {dateStats.map((stat, idx) => {
                    const isBestDate = stat.date === bestDate;
                    const percentage = respondedCount > 0 
                      ? Math.round((stat.availableCount / respondedCount) * 100) 
                      : 0;
                    
                    return (
                      <div
                        key={idx}
                        className={`border p-4 transition-all ${
                          isBestDate 
                            ? 'border-green-500 bg-green-50 shadow-md' 
                            : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">
                              {isBestDate ? '🏆' : '📅'}
                            </div>
                            <div>
                              <div className="font-semibold text-xl text-slate-900">
                                {stat.date}
                              </div>
                              {isBestDate && (
                                <div className="text-sm text-green-700 font-medium">
                                  התאריך הטוב ביותר
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-700">
                                {stat.availableCount}
                              </div>
                              <div className="text-xs text-slate-600">זמינים</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-700">
                                {stat.unavailableCount}
                              </div>
                              <div className="text-xs text-slate-600">לא זמינים</div>
                            </div>
                            <div className="text-center min-w-[80px]">
                              <div className="text-2xl font-bold text-indigo-700">
                                {percentage}%
                              </div>
                              <div className="text-xs text-slate-600">זמינות</div>
                            </div>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-3 bg-slate-200 h-2 overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              isBestDate ? 'bg-green-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All People List - Collapsible */}
        <div className="bg-white shadow-md border border-slate-200">
          <button
            onClick={() => setIsPeopleExpanded(!isPeopleExpanded)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-between"
          >
            <h2 className="text-2xl font-semibold">כל המשתתפים - זמינות לפי תאריכים</h2>
            {isPeopleExpanded ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
          </button>
          {isPeopleExpanded && (
            <div className="p-6">
              <div className="space-y-3">
                {data?.people.map((person, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="font-semibold text-lg text-slate-900">
                        {idx + 1}. {person.name}
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        {!person.hasResponded ? (
                          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 border border-slate-300">
                            <span className="text-xl">⚪</span>
                            <span className="font-medium">לא ענה\תה</span>
                          </div>
                        ) : person.canDoAll ? (
                          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 border border-green-300">
                            <span className="text-xl">✅</span>
                            <span className="font-medium">יכול\ה הכל</span>
                          </div>
                        ) : person.unavailableDates.length > 0 ? (
                          <div>
                            <div className="text-sm text-slate-600 mb-2 font-medium">לא יכול\ה:</div>
                            <div className="flex flex-wrap gap-2">
                              {person.unavailableDates.map((date, dateIdx) => (
                                <span
                                  key={dateIdx}
                                  className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 text-sm border border-red-300"
                                >
                                  <span>❌</span>
                                  {date}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 border border-slate-300">
                            <span className="text-xl">⚪</span>
                            <span className="font-medium">לא ענה\תה</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <div className="bg-white shadow-md p-6 md:p-8 border border-slate-200 max-w-2xl mx-auto">
            <h3 className="text-xl md:text-2xl font-light text-slate-900 mb-4">לשינויים או שאלות</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="text-slate-700 text-lg">
                לורין טוטח חייט - <span className="font-medium">0524893329</span>
              </div>
              <a
                href="https://wa.me/972524893329?text=היי%20לורין,%20יש%20לי%20שאלה%20לגבי%20פגישת%20מקיף%20ח'"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                שלח הודעה בוואטסאפ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
