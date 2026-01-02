import { supabase } from './supabase';

/**
 * שמירת כתובת משלוח לקנייה ספציפית
 */
export interface OrderAddress {
  user_id: string;
  order_reference: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  zip_code: string;
  apartment?: string;
  floor?: string;
  notes?: string;
}

export async function saveOrderAddress(address: OrderAddress): Promise<void> {
  try {
    // בדוק אם יש כבר רשומה עם order_reference הזה
    const { data: existing, error: selectError } = await supabase
      .from('order_addresses')
      .select('id')
      .eq('order_reference', address.order_reference)
      .eq('user_id', address.user_id)
      .maybeSingle();

    if (selectError) {
      // אם זו שגיאת 400, יכול להיות שהטבלה לא קיימת או שיש בעיית הרשאות
      if (selectError.code === 'PGRST116' || selectError.message?.includes('does not exist')) {

        return;
      }
      // אם זו שגיאת הרשאות, נדפיס פרטים נוספים
      if (selectError.code === '42501' || selectError.message?.includes('permission') || selectError.message?.includes('policy')) {

        // נמשיך לנסות לשמור - אולי זו רק בעיה ב-SELECT
      } else {

        // נמשיך לנסות לשמור
      }
    }

    if (existing) {
      // עדכן רשומה קיימת
      const { error } = await supabase
        .from('order_addresses')
        .update({
          first_name: address.first_name,
          last_name: address.last_name,
          email: address.email,
          phone: address.phone,
          address: address.address,
          city: address.city,
          zip_code: address.zip_code,
          apartment: address.apartment,
          floor: address.floor,
          notes: address.notes,
        })
        .eq('id', existing.id)
        .eq('user_id', address.user_id);

      if (error) {

        throw error;
      }
    } else {
      // צור רשומה חדשה
      const { error } = await supabase
        .from('order_addresses')
        .insert(address);

      if (error) {
        // אם הטבלה לא קיימת, זה בסדר - נמשיך בלי לשמור
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {

          return;
        }
        // אם זו שגיאת הרשאות, נדפיס פרטים נוספים
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {

        }
        throw error;
      }
    }
  } catch (error: any) {
    // אם הטבלה לא קיימת, זה בסדר - נמשיך בלי לשמור
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {

      return;
    }
    // אם זו שגיאת הרשאות, נדפיס פרטים נוספים
    if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {

    }

    throw error;
  }
}

/**
 * טעינת כתובת משלוח לקנייה ספציפית
 */
export async function getOrderAddress(orderReference: string): Promise<OrderAddress | null> {
  try {
    const { data, error } = await supabase
      .from('order_addresses')
      .select('*')
      .eq('order_reference', orderReference)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return null;
      }
      return null;
    }

    return data as OrderAddress | null;
  } catch (error) {

    return null;
  }
}

/**
 * טעינת כל כתובות המשלוח של משתמש
 */
export async function getUserOrderAddresses(userId: string): Promise<OrderAddress[]> {
  try {
    const { data, error } = await supabase
      .from('order_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return [];
      }
      return [];
    }

    return (data || []) as OrderAddress[];
  } catch (error) {

    return [];
  }
}

