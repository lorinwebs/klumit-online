import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// GET - קבלת כל השיחות (למנהלים)
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('klumit_chat_conversations')
      .select('*')
      .is('deleted_at', null) // רק שיחות שלא נמחקו
      .order('last_message_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`user_name.ilike.%${search}%,user_phone.ilike.%${search}%,user_email.ilike.%${search}%`);
    }

    const { data: conversations, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ספירת הודעות שלא נקראו לכל שיחה + טעינת פרטי משתמש + בדיקה שיש הודעות
    const conversationsWithCounts = await Promise.all(
      (conversations || []).map(async (conv) => {
        // בדיקה אם יש הודעות בשיחה - אם אין, נסנן אותה
        const { count: messageCount } = await supabaseAdmin
          .from('klumit_chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);
        
        // אם אין הודעות - נחזיר null כדי לסנן
        if (!messageCount || messageCount === 0) {
          return null;
        }
        
        // מציאת ההודעה האחרונה (מכל השיחות אם יש user_id, או מהשיחה הספציפית אם אורח)
        let lastUserMessageAt: string | null = null;
        let lastMessage: { message: string; from_user: boolean; replied_by_name: string | null; created_at: string } | null = null;
        
        if (conv.user_id) {
          // מציאת כל השיחות של המשתמש
          const { data: allConversations } = await supabaseAdmin
            .from('klumit_chat_conversations')
            .select('id')
            .eq('user_id', conv.user_id)
            .is('deleted_at', null);
          
          const conversationIds = (allConversations || []).map(c => c.id);
          
          // קבלת ההודעה האחרונה מכל השיחות (לא רק מהיוזר)
          const { data: lastMsg } = await supabaseAdmin
            .from('klumit_chat_messages')
            .select('message, from_user, replied_by_name, created_at')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          lastMessage = lastMsg || null;
          
          // קבלת ההודעה האחרונה מהיוזר למיון
          const { data: lastUserMessage } = await supabaseAdmin
            .from('klumit_chat_messages')
            .select('created_at')
            .in('conversation_id', conversationIds)
            .eq('from_user', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          lastUserMessageAt = lastUserMessage?.created_at || null;
        } else {
          // אם אין user_id (אורח) - נבדוק את ההודעה האחרונה מהשיחה הספציפית
          const { data: lastMsg } = await supabaseAdmin
            .from('klumit_chat_messages')
            .select('message, from_user, replied_by_name, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          lastMessage = lastMsg || null;
          
          const { data: lastUserMessage } = await supabaseAdmin
            .from('klumit_chat_messages')
            .select('created_at')
            .eq('conversation_id', conv.id)
            .eq('from_user', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          lastUserMessageAt = lastUserMessage?.created_at || null;
        }
        // חישוב unread_count ו-needs_response - רק אם ההודעה האחרונה היא מהמשתמש
        let unreadCount = 0;
        let needsResponse = false;
        
        if (conv.user_id) {
          // מציאת כל השיחות של המשתמש
          const { data: allConversations } = await supabaseAdmin
            .from('klumit_chat_conversations')
            .select('id')
            .eq('user_id', conv.user_id);
          
          const conversationIds = (allConversations || []).map(c => c.id);
          
          // קבלת ההודעה האחרונה מכל השיחות
          const { data: lastMessages } = await supabaseAdmin
            .from('klumit_chat_messages')
            .select('from_user, created_at')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // אם ההודעה האחרונה היא מהמשתמש - צריך להגיב
          if (lastMessages && lastMessages.from_user) {
            needsResponse = true;
            
            // מציאת ההודעה האחרונה מהאדמין
            const { data: lastAdminMessage } = await supabaseAdmin
              .from('klumit_chat_messages')
              .select('created_at')
              .in('conversation_id', conversationIds)
              .eq('from_user', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            // ספירת הודעות מהמשתמש אחרי ההודעה האחרונה מהאדמין
            if (lastAdminMessage) {
              const { count } = await supabaseAdmin
                .from('klumit_chat_messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', conversationIds)
                .eq('from_user', true)
                .gt('created_at', lastAdminMessage.created_at);
              unreadCount = count || 0;
            } else {
              // אין הודעות מהאדמין - כל ההודעות מהמשתמש הן חדשות
              const { count } = await supabaseAdmin
                .from('klumit_chat_messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', conversationIds)
                .eq('from_user', true);
              unreadCount = count || 0;
            }
          }
          // אם ההודעה האחרונה היא מהאדמין - unreadCount נשאר 0 ו-needsResponse = false
        } else {
          // אם אין user_id (אורח) - נבדוק את ההודעה האחרונה מהשיחה הספציפית
          const { data: lastMsg } = await supabaseAdmin
            .from('klumit_chat_messages')
            .select('from_user')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // רק אם ההודעה האחרונה היא מהמשתמש - צריך להגיב
          if (lastMsg && lastMsg.from_user) {
            needsResponse = true;
            const { count } = await supabaseAdmin
              .from('klumit_chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('from_user', true);
            unreadCount = count || 0;
          }
        }

        // אם יש user_id אבל אין user_name/user_email - נטען מהמשתמש
        let enrichedConv = { 
          ...conv, 
          unread_count: unreadCount, 
          needs_response: needsResponse,
          last_user_message_at: lastUserMessageAt, // שמירה למיון
          last_message: lastMessage?.message || null, // ההודעה האחרונה
          last_message_from_user: lastMessage?.from_user || false, // האם מהמשתמש
          last_message_replied_by: lastMessage?.replied_by_name || null // מי ענה (אם לא מהמשתמש)
        };
        
        if (conv.user_id && (!conv.user_name || !conv.user_email || !conv.user_phone)) {
          try {
            // קבלת פרטי המשתמש מ-auth.users
            const { data: userProfile } = await supabaseAdmin.auth.admin.getUserById(conv.user_id);
            if (userProfile?.user) {
              const userEmail = userProfile.user.email || conv.user_email;
              const userName = userProfile.user.user_metadata?.first_name && userProfile.user.user_metadata?.last_name
                ? `${userProfile.user.user_metadata.first_name} ${userProfile.user.user_metadata.last_name}`
                : userProfile.user.user_metadata?.name || conv.user_name;

              // קבלת טלפון מטבלת user_shopify_sync
              const { data: syncData } = await supabaseAdmin
                .from('user_shopify_sync')
                .select('phone')
                .eq('user_id', conv.user_id)
                .maybeSingle();
              
              const userPhone = syncData?.phone || userProfile.user.user_metadata?.phone || conv.user_phone;

              enrichedConv = {
                ...enrichedConv,
                user_name: userName || enrichedConv.user_name,
                user_email: userEmail || enrichedConv.user_email,
                user_phone: userPhone || enrichedConv.user_phone,
              };
            }
          } catch (error) {
            // Error loading user profile - ignore
          }
        }

        return enrichedConv;
      })
    );
    
    // סינון שיחות בלי הודעות (null values)
    const conversationsWithMessages = conversationsWithCounts.filter(conv => conv !== null) as typeof conversationsWithCounts;

    // קיבוץ שיחות לפי user_id - רק השיחה האחרונה לכל משתמש
    // אבל נשמור את כל ה-conversation_ids של המשתמש
    const conversationsByUserId = new Map<string, typeof conversationsWithMessages[0] & { all_conversation_ids?: string[] }>();
    
    for (const conv of conversationsWithMessages) {
      // אם יש user_id - נקבץ לפי user_id
      // אם אין user_id - נשתמש ב-session_id (אורחים)
      const key = conv.user_id || conv.session_id;
      
      if (!conversationsByUserId.has(key)) {
        // שיחה ראשונה למשתמש זה - נוסיף את כל ה-conversation_ids
        conversationsByUserId.set(key, { ...conv, all_conversation_ids: [conv.id] });
      } else {
        // יש כבר שיחה למשתמש זה - נבדוק איזו יותר חדשה
        const existing = conversationsByUserId.get(key)!;
        const existingDate = new Date(existing.last_message_at || existing.created_at);
        const currentDate = new Date(conv.last_message_at || conv.created_at);
        
        // נוסיף את ה-conversation_id לרשימה
        if (!existing.all_conversation_ids) {
          existing.all_conversation_ids = [existing.id];
        }
        if (!existing.all_conversation_ids.includes(conv.id)) {
          existing.all_conversation_ids.push(conv.id);
        }
        
        // אם השיחה הנוכחית יותר חדשה - נחליף את הפרטים אבל נשמור את כל ה-IDs
        if (currentDate > existingDate) {
          conversationsByUserId.set(key, { 
            ...conv, 
            all_conversation_ids: existing.all_conversation_ids,
            unread_count: (existing.unread_count || 0) + (conv.unread_count || 0)
          });
        } else {
          // אם השיחה הקיימת יותר חדשה - נסכם את ה-unread_count
          existing.unread_count = (existing.unread_count || 0) + (conv.unread_count || 0);
        }
      }
    }

    // המרה חזרה למערך ומיון - שיחות שצריך להגיב להן קודם, אחר כך לפי ההודעה האחרונה מהיוזר
    const uniqueConversations = Array.from(conversationsByUserId.values())
      .sort((a, b) => {
        // קודם כל - שיחות שצריך להגיב להן
        const needsResponseA = (a as any).needs_response ? 1 : 0;
        const needsResponseB = (b as any).needs_response ? 1 : 0;
        
        if (needsResponseA !== needsResponseB) {
          return needsResponseB - needsResponseA; // needs_response=true קודם
        }
        
        // אם שתיהן באותו סטטוס - מיון לפי ההודעה האחרונה מהיוזר
        const dateA = new Date((a as any).last_user_message_at || a.last_message_at || a.created_at).getTime();
        const dateB = new Date((b as any).last_user_message_at || b.last_message_at || b.created_at).getTime();
        return dateB - dateA;
      });

    return NextResponse.json({ conversations: uniqueConversations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - עדכון סטטוס שיחה
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, status } = body;

    if (!conversation_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('klumit_chat_conversations')
      .update({ status })
      .eq('id', conversation_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversation: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
