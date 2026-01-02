'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, city: string, zipCode: string, apartment?: string, floor?: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

declare global {
  interface Window {
    google: typeof google;
    initGooglePlaces: () => void;
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'הזן כתובת',
  className = '',
  required = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current) {
      console.warn('Input ref לא זמין');
      return;
    }

    if (!window.google) {
      console.error('window.google לא זמין');
      return;
    }

    if (!window.google.maps) {
      console.error('window.google.maps לא זמין');
      return;
    }

    if (!window.google.maps.places) {
      console.error('window.google.maps.places לא זמין - ודא ש-libraries=places נכלל ב-URL');
      return;
    }

    // אם כבר יש autocomplete, אל תיצור חדש
    if (autocompleteRef.current) {
      return;
    }

    try {
      // צור Autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'il' }, // רק כתובות מישראל
        fields: ['address_components', 'formatted_address'],
        language: 'he',
      });

      autocompleteRef.current = autocomplete;

      // האזן לבחירת כתובת
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.address_components) {
          return;
        }

        let address = '';
        let city = '';
        let zipCode = '';
        let apartment = '';
        let floor = '';

        // חלץ פרטים מהכתובת
        place.address_components.forEach((component) => {
          const types = component.types;

          // כתובת - רחוב ומספר בית
          if (types.includes('street_number')) {
            address = component.long_name + (address ? ' ' + address : '');
          }
          if (types.includes('route')) {
            address = address ? address + ' ' + component.long_name : component.long_name;
          }

          // עיר - עדיף locality, אם אין אז administrative_area_level_2 או administrative_area_level_1
          if (types.includes('locality')) {
            city = component.long_name;
          } else if (!city && types.includes('administrative_area_level_2')) {
            city = component.long_name;
          } else if (!city && types.includes('administrative_area_level_1')) {
            city = component.long_name;
          }

          // מיקוד
          if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }

          // דירה - subpremise
          if (types.includes('subpremise')) {
            apartment = component.long_name;
          }
        });

        // נסה לחלץ דירה וקומה מה-formatted_address אם לא נמצא ב-address_components
        if (!apartment && place.formatted_address) {
          // חיפוש דפוסים כמו "דירה X", "קומה X", "ד' X" וכו'
          const apartmentMatch = place.formatted_address.match(/(?:דירה|ד'|ד|apartment|apt)\s*[:\-]?\s*(\d+[א-ת]?)/i);
          if (apartmentMatch) {
            apartment = apartmentMatch[1];
          }
          
          const floorMatch = place.formatted_address.match(/(?:קומה|ק'|ק|floor|fl)\s*[:\-]?\s*(\d+[א-ת]?)/i);
          if (floorMatch) {
            floor = floorMatch[1];
          }
        }

        // אם לא מצאנו כתובת, נשתמש ב-formatted_address
        if (!address && place.formatted_address) {
          address = place.formatted_address;
        }

        // עדכן את הערכים
        onChange(address, city, zipCode, apartment, floor);
      });
    } catch (error) {
      console.error('שגיאה ביצירת Autocomplete:', error);
    }
  }, [onChange]);

  useEffect(() => {
    // טען את Google Maps API
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key לא מוגדר - Autocomplete לא יעבוד');
      return;
    }

    // בדוק אם כבר נטען
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      initializeAutocomplete();
      return;
    }

    // בדוק אם יש כבר script בטעינה
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      // אם יש script, נחכה שהוא יסיים לטעון
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkLoaded);
          setIsLoaded(true);
          initializeAutocomplete();
        }
      }, 100);
      
      // timeout אחרי 10 שניות
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.google?.maps?.places) {
          console.error('Google Maps Places API לא נטען אחרי 10 שניות');
        }
      }, 10000);
      
      return;
    }

    // טען את הספרייה
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=he&region=IL`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // המתן קצת כדי לוודא שה-API נטען לגמרי
      setTimeout(() => {
        if (window.google?.maps?.places) {
          setIsLoaded(true);
          initializeAutocomplete();
        } else {
          console.error('Google Maps Places API לא נטען כראוי - ודא ש-Places API מופעל ב-Google Cloud Console');
        }
      }, 100);
    };
    
    script.onerror = (error) => {
      console.error('שגיאה בטעינת Google Maps API:', error);
      console.error('בדוק:');
      console.error('1. שה-API Key תקין:', apiKey ? `${apiKey.substring(0, 10)}...` : 'לא מוגדר');
      console.error('2. ש-Places API מופעל ב-Google Cloud Console');
      console.error('3. שה-API Key לא מוגבל לדומיינים אחרים');
    };
    
    document.head.appendChild(script);

    return () => {
      // אל תמחק את ה-script - זה יכול לגרום לבעיות אם יש כמה קומפוננטות
    };
  }, [initializeAutocomplete]);

  // אתחל את Autocomplete כשהקומפוננטה מוכנה
  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      initializeAutocomplete();
    }
  }, [isLoaded, initializeAutocomplete]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => {
        // עדכן את הערך המקומי (ללא שינוי דירה/קומה)
        onChange(e.target.value, '', '', '', '');
      }}
      placeholder={placeholder}
      className={className}
      required={required}
      dir="rtl"
    />
  );
}

