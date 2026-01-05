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

  const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult) => {
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

      // עיר
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

      // דירה
      if (types.includes('subpremise')) {
        apartment = component.long_name;
      }
    });

    // נסה לחלץ דירה וקומה מה-formatted_address
    if (!apartment && place.formatted_address) {
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

    onChange(address, city, zipCode, apartment, floor);
  }, [onChange]);

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || autocompleteRef.current) {
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
      return;
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'il' },
        fields: ['address_components', 'formatted_address'],
        types: ['address'],
      });

      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place) {
          handlePlaceSelect(place);
        }
      });

      setIsLoaded(true);
    } catch (error) {
      console.error('שגיאה ביצירת Autocomplete:', error);
    }
  }, [handlePlaceSelect]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key לא מוגדר');
      return;
    }

    // אם כבר נטען
    if (window.google?.maps?.places) {
      initializeAutocomplete();
      return;
    }

    // בדוק אם יש כבר script בטעינה
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkLoaded);
          initializeAutocomplete();
        }
      }, 100);
      
      setTimeout(() => clearInterval(checkLoaded), 10000);
      return;
    }

    // טען את הספרייה (ללא callback)
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=he&region=IL`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // המתן שה-API יהיה מוכן
      const checkReady = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete) {
          clearInterval(checkReady);
          initializeAutocomplete();
        }
      }, 50);
      
      setTimeout(() => clearInterval(checkReady), 5000);
    };
    
    script.onerror = () => {
      console.error('שגיאה בטעינת Google Maps API');
    };
    
    document.head.appendChild(script);
  }, [initializeAutocomplete]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => {
        onChange(e.target.value, '', '', '', '');
      }}
      placeholder={placeholder}
      className={className}
      required={required}
      dir="rtl"
      autoComplete="off"
    />
  );
}
