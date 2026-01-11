'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const SESSION_ID_KEY = 'klumit_chat_session_id';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  message: string;
  from_user: boolean;
  replied_by_name?: string;
  status?: 'sent_to_server' | 'delivered_to_telegram' | 'failed';
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id?: string;
  session_id: string;
  user_name?: string;
  status: string;
  created_at: string;
}

interface UseChatWidgetReturn {
  isOpen: boolean;
  toggleChat: () => void;
  messages: ChatMessage[];
  inputValue: string;
  setInputValue: (value: string) => void;
  loading: boolean;
  isTyping: boolean;
  adminTyping: boolean;
  user: any;
  unreadCount: number;
  conversationId: string | null;
  sessionId: string | null;
  sendMessage: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

export function useChatWidget(): UseChatWidgetReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationChannelRef = useRef<RealtimeChannel | null>(null);
  const hasMergedRef = useRef<boolean>(false);
  const isPageVisibleRef = useRef<boolean>(true);

  // טעינת session_id מ-localStorage
  useEffect(() => {
    let storedSessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!storedSessionId) {
      storedSessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  // בדיקת משתמש עם event listeners במקום polling
  useEffect(() => {
    let isMounted = true;
    
    const checkUser = async () => {
      if (!isPageVisibleRef.current) return; // רק אם הדף גלוי
      
      try {
        // שימוש ישיר ב-supabase.auth.getUser() במקום דרך API
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        
        if (error || !user) {
          setUser(null);
          hasMergedRef.current = false;
          return;
        }
        
        setUser(user);
        
        // מיזוג שיחות אם צריך
        if (user && !hasMergedRef.current && sessionId) {
          await mergeGuestToUser(sessionId);
        }
      } catch (error) {
        if (!isMounted) return;
        setUser(null);
        hasMergedRef.current = false;
      }
    };
    
    // בדיקה ראשונית
    checkUser();
    
    // האזנה לשינויים ב-auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' && session?.user && sessionId && !hasMergedRef.current) {
        setUser(session.user);
        await mergeGuestToUser(sessionId);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        hasMergedRef.current = false;
      }
    });

    // בדיקה כשהדף חוזר להיות גלוי (במקום polling)
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        checkUser();
      }
    };

    // בדיקה כשהחלון מקבל focus
    const handleFocus = () => {
      isPageVisibleRef.current = true;
      checkUser();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [sessionId]);

  // Realtime subscription עם תמיכה ב-broadcast events עבור typing
  const setupRealtime = useCallback(async (convId: string) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // אם המשתמש מחובר - נטען את כל השיחות שלו
    if (user) {
      try {
        const { data: allConversations } = await supabase
          .from('klumit_chat_conversations')
          .select('id')
          .eq('user_id', user.id);

        const conversationIds = allConversations?.map(c => c.id) || [convId];
        
        const channel = supabase.channel(`chat-user:${user.id}`);
        
        conversationIds.forEach((id) => {
          channel.on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'klumit_chat_messages',
              filter: `conversation_id=eq.${id}`,
            },
            (payload) => {
              const newMessage = payload.new as ChatMessage;
              setMessages((prev) => {
                if (prev.some((msg) => msg.id === newMessage.id) || 
                    prev.some((msg) => msg.id.startsWith('temp-') && msg.message === newMessage.message)) {
                  return prev;
                }
                return [...prev, newMessage];
              });
              
              if (!newMessage.from_user && !isOpen) {
                setUnreadCount((prev) => prev + 1);
              }
              
              if (isOpen) {
                setLastReadMessageId(newMessage.id);
              }
            }
          );
        });
        
        // הוספת broadcast event עבור typing indicator
        channel.on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload?.isTyping) {
            setAdminTyping(true);
            // Debounce להסרת החיווי אחרי 3 שניות
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setAdminTyping(false);
            }, 3000);
          } else {
            setAdminTyping(false);
          }
        });
        
        channel.subscribe();
        channelRef.current = channel;
        return;
      } catch (error) {
        console.error('Error setting up realtime for all conversations:', error);
      }
    }

    // Fallback: subscription רגיל
    const channel = supabase
      .channel(`chat:${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'klumit_chat_messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id) || 
                prev.some((msg) => msg.id.startsWith('temp-') && msg.message === newMessage.message)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          
          if (!newMessage.from_user && !isOpen) {
            setUnreadCount((prev) => prev + 1);
          }
          
          if (isOpen) {
            setLastReadMessageId(newMessage.id);
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.isTyping) {
          setAdminTyping(true);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setAdminTyping(false);
          }, 3000);
        } else {
          setAdminTyping(false);
        }
      })
      .subscribe();

    channelRef.current = channel;
  }, [user, isOpen]);

  // טעינת שיחה
  const loadConversation = useCallback(async (forceUser?: any) => {
    const currentUser = forceUser || user;
    if (!sessionId && !currentUser) {
      return;
    }

    try {
      setLoading(true);
      
      const conversationsUrl = currentUser 
        ? `/api/chat/conversations`
        : `/api/chat/conversations?session_id=${sessionId}`;
      
      const conversationsRes = await fetch(conversationsUrl);
      
      if (!conversationsRes.ok) {
        throw new Error(`Failed to load conversations (${conversationsRes.status})`);
      }
      
      const conversationsData = await conversationsRes.json();
      
      let conversation: Conversation | null = null;
      
      if (conversationsData.conversations && conversationsData.conversations.length > 0) {
        conversation = conversationsData.conversations.find(
          (c: Conversation) => c.status === 'open'
        ) || conversationsData.conversations[0];
      }
      
      if (!conversation) {
        // יצירת שיחה חדשה
        const createRes = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });
        
        if (!createRes.ok) {
          throw new Error('Failed to create conversation');
        }
        
        const createData = await createRes.json();
        conversation = createData.conversation;
      }
      
      if (conversation) {
        setConversationId(conversation.id);
        
        // טעינת הודעות - אם משתמש מחובר, נטען את כל ההודעות שלו
        const messagesUrl = currentUser
          ? `/api/chat/messages/${conversation.id}`
          : `/api/chat/messages/${conversation.id}?session_id=${sessionId}`;
        
        const messagesRes = await fetch(messagesUrl);
        
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          setMessages(messagesData.messages || []);
        }
        
        // פתיחת Realtime subscription
        setupRealtime(conversation.id);
      }
    } catch (error: any) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user, setupRealtime]);

  // מיזוג אורח למשתמש - ללא timeouts
  const mergeGuestToUser = useCallback(async (sessionIdToMerge?: string) => {
    if (hasMergedRef.current) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/chat/merge-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionIdToMerge || null }),
      });
      
      if (!response.ok) {
        throw new Error('Merge failed');
      }

      const data = await response.json();
      hasMergedRef.current = true;

      // אם השרת החזיר conversation_id - נשתמש בו
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // עדכון המשתמש - שימוש ישיר ב-supabase.auth.getUser()
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      
      if (updatedUser) {
        setUser(updatedUser);
        // איפוס conversationId כדי לכפות טעינה מחדש
        setConversationId(null);
        setMessages([]);
        // נטען את השיחה מחדש
        await loadConversation(updatedUser);
      }
    } catch (error) {
      console.error('Merge error:', error);
    } finally {
      setLoading(false);
    }
  }, [loadConversation]);

  // טעינת שיחה כשמשתמש מחובר או כשפותחים את הצ'אט
  useEffect(() => {
    if (sessionId && !conversationId) {
      loadConversation();
    }
  }, [sessionId, user, loadConversation, conversationId]);

  // שליחת הודעה
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || !conversationId || loading) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setIsTyping(false);

    // Optimistic UI - הוספת הודעה זמנית
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      message: messageText,
      from_user: true,
      status: 'sent_to_server',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      setLoading(true);

      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: messageText,
          session_id: sessionId,
          page_url: window.location.href,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id ? { ...msg, status: 'failed' } : msg
          )
        );
        throw new Error(errorData.error || 'Unknown error');
      }

      const data = await response.json();

      if (data.success) {
        // אם נוצרה שיחה חדשה (כי השיחה הישנה הייתה מחוקה), עדכן את conversationId
        if (data.conversation_id && data.conversation_id !== conversationId) {
          setConversationId(data.conversation_id);
        }
        
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id
              ? { ...msg, id: data.message_id, status: data.status, conversation_id: data.conversation_id || conversationId }
              : msg
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id ? { ...msg, status: 'failed' } : msg
          )
        );
      }
    } catch (error: any) {
      setMessages((prev) => {
        const lastTemp = prev.find(msg => msg.id.startsWith('temp-'));
        if (lastTemp) {
          return prev.map((msg) =>
            msg.id === lastTemp.id ? { ...msg, status: 'failed' } : msg
          );
        }
        return prev;
      });
      throw error; // נזרוק את השגיאה כדי שהקומפוננטה תטפל בה
    } finally {
      setLoading(false);
    }
  }, [inputValue, conversationId, sessionId, loading]);

  // אינדיקטור "מקליד..." עם debounce
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (inputValue.length > 0 && conversationId && sessionId) {
      setIsTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        // שליחת אינדיקטור "מקליד..." ל-Telegram דרך API
        fetch('/api/chat/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            conversation_id: conversationId,
            session_id: sessionId 
          }),
        }).catch(() => {});
        
        // שליחת broadcast event ל-Realtime (למנהל)
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { isTyping: true, conversationId },
          }).catch(() => {});
        }
      }, 500);
    } else {
      setIsTyping(false);
      // שליחת broadcast event שהמשתמש הפסיק להקליד
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { isTyping: false, conversationId },
        }).catch(() => {});
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputValue, conversationId, sessionId]);

  // Polling חכם עם recursive setTimeout (בטוח יותר מ-setInterval)
  useEffect(() => {
    if (!conversationId) return;

    let timeoutId: NodeJS.Timeout;
    let isMounted = true;
    let isFetching = false; // מניעת race conditions

    const fetchMessages = async () => {
      if (!isMounted || !conversationId || isFetching) return;
      
      // אם המשתמש מחובר והצ'אט סגור - אל תעשה polling (תסתמך על Realtime)
      if (user && !isOpen) {
        return;
      }

      isFetching = true;
      
      try {
        const messagesUrl = user
          ? `/api/chat/messages/${conversationId}`
          : `/api/chat/messages/${conversationId}?session_id=${sessionId}`;
        
        if (messagesUrl.includes('undefined')) {
          isFetching = false;
          return;
        }

        const messagesRes = await fetch(messagesUrl);
        
        if (messagesRes.ok && isMounted) {
          const messagesData = await messagesRes.json();
          const fetchedMessages = messagesData.messages || [];
          
          // מיון ההודעות לפי תאריך
          const sortedMessages = fetchedMessages.sort((a: ChatMessage, b: ChatMessage) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          // עדכון פשוט - השרת מחזיר את כל ההודעות, אז פשוט נחליף
          setMessages((prev) => {
            // בדיקה אם יש שינוי - רק אם האורך שונה או ה-ID האחרון שונה
            const hasChanged = sortedMessages.length !== prev.length || 
              sortedMessages[sortedMessages.length - 1]?.id !== prev[prev.length - 1]?.id;
            
            if (hasChanged) {
              // עדכון unread count אם הצ'אט סגור (רק למשתמשים אנונימיים)
              if (!isOpen && !user) {
                const prevIds = new Set(prev.map(m => m.id));
                const unread = sortedMessages.filter((m: ChatMessage) => 
                  !m.from_user && !prevIds.has(m.id)
                ).length;
                
                if (unread > 0) {
                  // קריאה אסינכרונית כדי לא לחסום את ה-setState
                  setTimeout(() => {
                    setUnreadCount((count) => count + unread);
                  }, 0);
                }
              }
              
              return sortedMessages;
            }
            
            return prev; // אין שינוי - אל תעדכן
          });
        }
      } catch (error) {
        // ignore polling errors - נמשיך לנסות
      } finally {
        isFetching = false;
        
        // תזמן את הבקשה הבאה רק אחרי שהנוכחית הסתיימה (recursive setTimeout)
        if (isMounted) {
          // זמן המתנה דינמי:
          // - משתמש אנונימי + צ'אט פתוח: 2 שניות
          // - משתמש אנונימי + צ'אט סגור: 5 שניות (רק לבדיקת unread)
          // - משתמש מחובר + צ'אט פתוח: 10 שניות (גיבוי ל-Realtime)
          // - משתמש מחובר + צ'אט סגור: אין polling (Realtime בלבד)
          const delay = !user 
            ? (isOpen ? 2000 : 5000)
            : (isOpen ? 10000 : 0);
          
          if (delay > 0) {
            timeoutId = setTimeout(fetchMessages, delay);
          }
        }
      }
    };

    // התחלה ראשונית
    fetchMessages();

    // אם המשתמש מחובר - נשתמש גם ב-Realtime (בנוסף ל-polling)
    let notificationChannel: RealtimeChannel | null = null;
    if (user) {
      notificationChannel = supabase
        .channel(`chat-notifications:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'klumit_chat_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            if (!newMessage.from_user && !isOpen) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .subscribe();

      notificationChannelRef.current = notificationChannel;
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
      }
    };
  }, [conversationId, isOpen, user, sessionId]);

  // ניקוי בעת unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (notificationChannelRef.current) {
        supabase.removeChannel(notificationChannelRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      const newIsOpen = !prev;
      if (newIsOpen) {
        // איפוס הודעות שלא נקראו כשפותחים את הצ'אט
        if (messages.length > 0) {
          setLastReadMessageId(messages[messages.length - 1].id);
          setUnreadCount(0);
        }
        if (!conversationId) {
          loadConversation();
        }
      }
      return newIsOpen;
    });
  }, [messages, conversationId, loadConversation]);

  return {
    isOpen,
    toggleChat,
    messages,
    inputValue,
    setInputValue,
    loading,
    isTyping,
    adminTyping,
    user,
    unreadCount,
    conversationId,
    sessionId,
    sendMessage,
    showLoginModal,
    setShowLoginModal,
  };
}
