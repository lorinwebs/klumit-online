/**
 * פונקציית עזר לעיצוב טלפון בפורמט Shopify (E.164)
 * מטפלת בפורמטים שונים של מספרי טלפון ישראלים וממירה אותם לפורמט E.164
 * 
 * @param phone - מספר טלפון בפורמט כלשהו (עם או בלי קידומת, עם או בלי +)
 * @returns מספר טלפון בפורמט E.164 (למשל +972501234567) או undefined אם לא תקין
 * 
 * @example
 * formatPhoneForShopify("050-123-4567") => "+972501234567"
 * formatPhoneForShopify("972501234567") => "+972501234567"
 * formatPhoneForShopify("+972501234567") => "+972501234567"
 */
export function formatPhoneForShopify(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  
  let cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');
  
  // אם כבר יש + בהתחלה, בדוק שהמספר תקין
  if (cleaned.startsWith('+')) {
    const digitsAfterPlus = cleaned.substring(1).replace(/\D/g, '');
    return digitsAfterPlus.length >= 10 ? cleaned : undefined;
  }
  
  // הסר כל תווים שאינם ספרות
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length === 0) return undefined;
  
  // אם מתחיל ב-972, הוסף + בהתחלה
  if (digitsOnly.startsWith('972')) {
    return `+${digitsOnly}`;
  }
  
  // אם מתחיל ב-0 (מספר ישראלי מקומי), החלף ב-+972
  if (digitsOnly.startsWith('0') && digitsOnly.length >= 9 && digitsOnly.length <= 10) {
    return `+972${digitsOnly.substring(1)}`;
  }
  
  // אם זה מספר ישראלי בלי 0 (9-10 ספרות), הוסף +972
  if (digitsOnly.length >= 9 && digitsOnly.length <= 10 && !digitsOnly.startsWith('0')) {
    return `+972${digitsOnly}`;
  }
  
  return undefined;
}
