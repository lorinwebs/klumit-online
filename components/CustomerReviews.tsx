'use client';

import { Star, Quote } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Review {
  id: number;
  name: string;
  years: number;
  text: string;
  rating: number;
  location?: string;
}

const reviews: Review[] = [
  {
    id: 1,
    name: 'נועה מ.',
    years: 0,
    text: 'קניתי את התיק בשביל "שיהיה יפה" וגיליתי שהוא גם הכי פרקטי שהיה לי. הוא יושב בול על הגוף, מרגיש איכותי, והכי חשוב - כל פעם שאני יוצאת איתו אנשים שואלים מאיפה. אני כבר לא עונה, אני שולחת לינק 😅',
    rating: 5,
    location: 'תל אביב',
  },
  {
    id: 2,
    name: 'חני ש.',
    years: 0,
    text: 'יש משהו בתיקים של קלומית שמרגיש לא תעשייתי. כאילו מישהי באמת חשבה עליי כשעיצבה אותם. זה תיק שמרגיע אותי כזה… לא יודעת להסביר.',
    rating: 5,
    location: 'ירושלים',
  },
  {
    id: 3,
    name: 'טליה א.',
    years: 0,
    text: 'החגורה הזו הצילה לי חצי ארון. פתאום כל שמלה נהיית "וואו". היא לא מתעוותת, לא נפתחת, והיא נראית מיליון דולר.',
    rating: 5,
    location: 'גבעתיים',
  },
  {
    id: 4,
    name: 'לירון כ.',
    years: 0,
    text: 'הייתי בחנות בגאולה, התאהבתי במקום. עכשיו כשהזמנתי אונליין - קיבלתי את אותה תחושה. אריזה מושקעת, ריח של עור חדש, והכל מרגיש מדויק.',
    rating: 5,
    location: 'ראשון לציון',
  },
  {
    id: 5,
    name: 'מיכל ר.',
    years: 0,
    text: 'אני טיפוס שמחליף תיקים כל שבוע… וזה התיק הראשון שלא בא לי להחליף. הוא פשוט עובד עם כל לוק.',
    rating: 5,
    location: 'נתניה',
  },
  {
    id: 6,
    name: 'שירה ב.',
    years: 0,
    text: 'הדבר הכי טוב? החלוקה הפנימית. סוף סוף מפתחות לא נעלמים לי לתוך חור שחור. קלאסי, נקי, ומרגיש יקר.',
    rating: 5,
    location: 'ירושלים',
  },
];

export default function CustomerReviews() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nextReview = () => {
    if (isMobile) {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    } else {
      setActiveIndex((prev) => {
        const next = prev + 3;
        return next >= reviews.length ? 0 : next;
      });
    }
  };

  const prevReview = () => {
    if (isMobile) {
      setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    } else {
      setActiveIndex((prev) => {
        const prevIndex = prev - 3;
        return prevIndex < 0 ? Math.max(0, reviews.length - 3) : prevIndex;
      });
    }
  };

  // Get current reviews to display (desktop: 3, mobile: 1)
  const getDisplayReviews = () => {
    if (isMobile) {
      return [reviews[activeIndex]];
    }
    return reviews.slice(activeIndex, activeIndex + 3);
  };

  return (
    <section className="py-12 md:py-16 bg-[#fdfcfb]">
      {/* Divider */}
      <div className="flex items-center justify-center mb-8 md:mb-12 px-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <span className="px-6 text-xs tracking-[0.3em] uppercase text-gray-400">◆</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-light luxury-font text-[#1a1a1a] mb-3">
            מה אומרות הלקוחות שלנו
          </h2>
          <p className="text-gray-500 font-light text-sm md:text-base">
            ביקורות אמיתיות מלקוחותינו
          </p>
        </div>

        {/* Mobile - Carousel */}
        <div className="md:hidden">
          <div className="relative">
            <div className="overflow-hidden rounded-lg">
              {getDisplayReviews().map((review) => (
                <div key={review.id} className="transition-opacity duration-300">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className="fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <Quote size={24} className="text-[#8B6914] mb-3 opacity-50" />
                    <p className="text-gray-700 font-light leading-relaxed mb-4 text-sm">
                      {review.text}
                    </p>
                    <div className="border-t border-gray-100 pt-4">
                      <p className="font-medium text-[#1a1a1a] text-sm">{review.name}</p>
                      {review.location && (
                        <p className="text-xs text-gray-500 font-light">
                          {review.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note - Mobile */}
            <div className="text-center mt-6 mb-4">
              <p className="text-sm md:text-base text-gray-700 font-normal">
                כן, אלו אנשים אמיתיים. כן, גם אנחנו התרגשנו.
              </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevReview}
                className="p-2 text-gray-500 hover:text-[#1a1a1a] transition-colors"
                aria-label="ביקורת קודמת"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 6l8 10-8 10" />
                </svg>
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === activeIndex
                        ? 'w-8 bg-[#8B6914]'
                        : 'w-2 bg-gray-300'
                    }`}
                    aria-label={`ביקורת ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextReview}
                className="p-2 text-gray-500 hover:text-[#1a1a1a] transition-colors"
                aria-label="ביקורת הבאה"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6l-8 10 8 10" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop - Grid with Carousel */}
        <div className="hidden md:block">
          <div className="relative">
            <div className="grid grid-cols-3 gap-6 lg:gap-8">
              {getDisplayReviews().map((review) => (
                <div
                  key={review.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <Quote size={28} className="text-[#8B6914] mb-4 opacity-50" />
                  <p className="text-gray-700 font-light leading-relaxed mb-6 text-base">
                    {review.text}
                  </p>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-medium text-[#1a1a1a]">{review.name}</p>
                    {review.location && (
                      <p className="text-sm text-gray-500 font-light mt-1">
                        {review.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note - Desktop */}
            <div className="text-center mt-8 mb-6">
              <p className="text-base text-gray-700 font-normal">
                כן, אלו אנשים אמיתיים. כן, גם אנחנו התרגשנו.
              </p>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prevReview}
                className="p-2 text-gray-500 hover:text-[#1a1a1a] transition-colors"
                aria-label="ביקורות קודמות"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 6l8 10-8 10" />
                </svg>
              </button>

              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(reviews.length / 3) }).map((_, i) => {
                  const pageIndex = i * 3;
                  const isActive = Math.floor(activeIndex / 3) === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(pageIndex)}
                      className={`h-2 rounded-full transition-all ${
                        isActive
                          ? 'w-8 bg-[#8B6914]'
                          : 'w-2 bg-gray-300'
                      }`}
                      aria-label={`עמוד ${i + 1}`}
                    />
                  );
                })}
              </div>

              <button
                onClick={nextReview}
                className="p-2 text-gray-500 hover:text-[#1a1a1a] transition-colors"
                aria-label="ביקורות הבאות"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6l-8 10 8 10" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
