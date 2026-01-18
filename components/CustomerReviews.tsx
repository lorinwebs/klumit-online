'use client';

import { Star, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Review {
  id: number;
  name: string;
  years: number;
  text: string;
  rating: number;
  location?: string;
  productImage?: string;
  productName?: string;
  productHandle?: string;
}

interface ProductInfo {
  handle: string;
  title: string;
  image: string | null;
}

const reviews: Review[] = [
  {
    id: 1,
    name: 'נועה מ.',
    years: 0,
    text: 'קניתי את התיק בשביל "שיהיה יפה" וגיליתי שהוא גם הכי פרקטי שהיה לי. הוא יושב בול על הגוף, מרגיש איכותי, והכי חשוב - כל פעם שאני יוצאת איתו אנשים שואלים מאיפה. אני כבר לא עונה, אני שולחת לינק 😅',
    rating: 5,
    location: 'תל אביב',
    productName: 'תיק גב קלאסי',
    productHandle: 'urban-chic-backpack', // TODO: הוסף handle של מוצר אמיתי
  },
  {
    id: 2,
    name: 'חני ש.',
    years: 0,
    text: 'יש משהו בתיקים של קלומית שמרגיש לא תעשייתי. כאילו מישהי באמת חשבה עליי כשעיצבה אותם. זה תיק שמרגיע אותי כזה… לא יודעת להסביר.',
    rating: 5,
    location: 'ירושלים',
    productName: 'תיק ערב אלגנטי',
    productHandle: 'renato-angi-crocodile-effect-leather-handbag', // ה-handle האמיתי מהמוצר
      },
  {
    id: 3,
    name: 'טליה א.',
    years: 0,
    text: 'החגורה הזו הצילה לי חצי ארון. פתאום כל שמלה נהיית "וואו". היא לא מתעוותת, לא נפתחת, והיא נראית מיליון דולר.',
    rating: 5,
    location: 'גבעתיים',
    productName: 'חגורת עור קלאסית',
    productHandle: 'engraved-round-v-belt', // TODO: הוסף handle של מוצר אמיתי
  },
  {
    id: 4,
    name: 'לירון כ.',
    years: 0,
    text: 'הייתי בחנות בגאולה, התאהבתי במקום. עכשיו כשהזמנתי אונליין - קיבלתי את אותה תחושה. אריזה מושקעת, ריח של עור חדש, והכל מרגיש מדויק.',
    rating: 5,
    location: 'ראשון לציון',
    productName: 'תיק צד יוקרתי',
    productHandle: 'woven-leather-shoulder-bag', // TODO: הוסף handle של מוצר אמיתי
  },
  {
    id: 5,
    name: 'מיכל ר.',
    years: 0,
    text: 'אני טיפוס שמחליף תיקים כל שבוע… וזה התיק הראשון שלא בא לי להחליף. הוא פשוט עובד עם כל לוק.',
    rating: 5,
    location: 'נתניה',
    productName: 'תיק יום יומי',
    productHandle: 'the-triple-compartment', // TODO: הוסף handle של מוצר אמיתי
  },
  {
    id: 6,
    name: 'שירה ב.',
    years: 0,
    text: 'הדבר הכי טוב? החלוקה הפנימית. סוף סוף מפתחות לא נעלמים לי לתוך חור שחור. קלאסי, נקי, ומרגיש יקר.',
    rating: 5,
    location: 'ירושלים',
    productName: 'תיק עבודה פרקטי',
    productHandle: 'elegant-tote', // TODO: הוסף handle של מוצר אמיתי
  },
];

export default function CustomerReviews() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [productsMap, setProductsMap] = useState<Record<string, ProductInfo>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load product data for reviews with handles
  useEffect(() => {
    const loadProducts = async () => {
      const handles = reviews
        .map((r) => r.productHandle)
        .filter((h): h is string => !!h && h.trim() !== '');

      if (handles.length === 0) {
        setLoadingProducts(false);
        return;
      }

      try {
        const response = await fetch('/api/products/by-handles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handles }),
        });

        if (response.ok) {
          const data = await response.json();
          setProductsMap(data.products || {});
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
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

  // Get product info for a review
  const getProductInfo = (review: Review): ProductInfo | null => {
    if (!review.productHandle) return null;
    return productsMap[review.productHandle] || null;
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
          <h2 className="text-2xl md:text-4xl font-light luxury-font text-[#1a1a1a] mb-4">
            מה אומרות הלקוחות שלנו
          </h2>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className="fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <span className="text-lg font-medium text-[#1a1a1a]">4.9</span>
            <span className="text-sm text-gray-500 font-light">(952 המלצות)</span>
          </div>
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
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-gray-700 font-light leading-relaxed mb-4 text-sm">
                      {review.text}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#1a1a1a] text-sm">{review.name}</p>
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                          <CheckCircle2 size={10} className="text-green-600" />
                          מאומת
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className="fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                    </div>
                    
                    {review.location && (
                      <p className="text-xs text-gray-500 font-light mb-3">
                        {review.location}
                      </p>
                    )}
                    
                    {(review.productHandle || review.productName) && (() => {
                      const productInfo = getProductInfo(review);
                      const displayName = productInfo?.title || review.productName;
                      const displayImage = productInfo?.image;
                      const displayHandle = review.productHandle;

                      if (!displayName) return null;

                      return (
                        <div className="border-t border-gray-100 pt-3 mt-3">
                          {displayHandle ? (
                            <Link 
                              href={`/products/${displayHandle}`}
                              className="flex items-center gap-2 hover:opacity-70 transition-opacity group"
                            >
                              {displayImage ? (
                                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                                  <Image
                                    src={displayImage}
                                    alt={displayName}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                  </svg>
                                </div>
                              )}
                              <p className="text-xs text-gray-600 font-light truncate group-hover:text-[#1a1a1a] transition-colors">{displayName}</p>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2">
                              {displayImage ? (
                                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                                  <Image
                                    src={displayImage}
                                    alt={displayName}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                  </svg>
                                </div>
                              )}
                              <p className="text-xs text-gray-600 font-light truncate">{displayName}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
                  className="bg-white border border-gray-200 rounded-lg p-6 lg:p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  <p className="text-gray-700 font-light leading-relaxed mb-5 text-base flex-grow">
                    {review.text}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#1a1a1a] text-sm">{review.name}</p>
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        <CheckCircle2 size={10} className="text-green-600" />
                        מאומת
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className="fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                  
                  {review.location && (
                    <p className="text-xs text-gray-500 font-light mb-3">
                      {review.location}
                    </p>
                  )}
                  
                  {(review.productHandle || review.productName) && (() => {
                    const productInfo = getProductInfo(review);
                    const displayName = productInfo?.title || review.productName;
                    const displayImage = productInfo?.image;
                    const displayHandle = review.productHandle;

                    if (!displayName) return null;

                    return (
                      <div className="border-t border-gray-100 pt-3 mt-auto">
                        {displayHandle ? (
                          <Link 
                            href={`/products/${displayHandle}`}
                            className="flex items-center gap-2 hover:opacity-70 transition-opacity group"
                          >
                            {displayImage ? (
                              <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                                <Image
                                  src={displayImage}
                                  alt={displayName}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                              </div>
                            )}
                            <p className="text-xs text-gray-600 font-light truncate group-hover:text-[#1a1a1a] transition-colors">{displayName}</p>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            {displayImage ? (
                              <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                                <Image
                                  src={displayImage}
                                  alt={displayName}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                              </div>
                            )}
                            <p className="text-xs text-gray-600 font-light truncate">{displayName}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
