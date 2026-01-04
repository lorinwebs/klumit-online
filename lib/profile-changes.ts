import { supabase } from './supabase';

/**
 * שמירת שינוי בפרופיל
 */
export interface ProfileChange {
  user_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  ip_address?: string;
  user_agent?: string;
}

/**
 * שמירת שינוי בפרופיל
 */
export async function logProfileChange(change: ProfileChange): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_profile_changes')
      .insert({
        user_id: change.user_id,
        field_name: change.field_name,
        old_value: change.old_value,
        new_value: change.new_value,
        ip_address: change.ip_address,
        user_agent: change.user_agent,
      });

    if (error) {
      // אם הטבלה לא קיימת, זה בסדר - נמשיך בלי לשמור
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {

        return;
      }

    }
  } catch (error: any) {
    // אם הטבלה לא קיימת, זה בסדר - נמשיך בלי לשמור
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {

      return;
    }

  }
}

/**
 * שמירת מספר שינויים בבת אחת
 */
export async function logProfileChanges(changes: ProfileChange[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_profile_changes')
      .insert(changes);

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {

        return;
      }

    }
  } catch (error: any) {
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {

      return;
    }

  }
}

/**
 * טעינת היסטוריית שינויים של משתמש
 */
export interface ProfileChangeHistory {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

export async function getUserProfileChanges(
  userId: string,
  fieldName?: string
): Promise<ProfileChangeHistory[]> {
  try {
    let query = supabase
      .from('user_profile_changes')
      .select('id, field_name, old_value, new_value, changed_at')
      .eq('user_id', userId)
      .order('changed_at', { ascending: false });

    if (fieldName) {
      query = query.eq('field_name', fieldName);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return [];
      }
      return [];
    }

    return (data || []) as ProfileChangeHistory[];
  } catch (error) {

    return [];
  }
}

/**
 * קבלת IP address ו-user agent מהדפדפן
 */
export function getClientInfo(): { ip_address?: string; user_agent?: string } {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    user_agent: window.navigator.userAgent,
    // IP address לא ניתן לקבל מהדפדפן ישירות - צריך לקבל מהשרת
  };
}





