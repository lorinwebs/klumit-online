'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Conversation {
  id: string;
  user_id: string | null;
  session_id: string;
  user_name: string | null;
  user_phone: string | null;
  user_email: string | null;
  status: 'open' | 'waiting' | 'closed';
  last_message_at: string;
  viewed_by_admin_id: string | null;
  viewed_by_admin_at: string | null;
  unread_count?: number;
  needs_response?: boolean;
  last_message?: string | null;
  last_message_from_user?: boolean;
  last_message_replied_by?: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  message: string;
  from_user: boolean;
  telegram_chat_id: string | null;
  replied_by_name: string | null;
  status: string;
  created_at: string;
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);

  // טעינת שיחות
  const loadConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/chat/conversations?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      // Error loading conversations - ignore
    }
  }, [statusFilter, searchQuery]);

  // טעינת הודעות
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      // ניקוי heartbeat קודם
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // עדכון ה-ref לשיחה הנוכחית
      currentConversationIdRef.current = conversationId;

      const response = await fetch(`/api/admin/chat/messages/${conversationId}`);
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      setMessages(data.messages || []);
      
      // סימון שאנחנו צופים בשיחה
      await fetch(`/api/admin/chat/conversations/${conversationId}/view`, {
        method: 'POST',
      });

      // Heartbeat כל 30 שניות - רק אם השיחה עדיין נבחרת
      heartbeatIntervalRef.current = setInterval(() => {
        // בדיקה שהשיחה עדיין נבחרת לפני שליחת heartbeat
        const currentId = currentConversationIdRef.current;
        if (currentId === conversationId) {
          fetch(`/api/admin/chat/conversations/${conversationId}/view`, {
            method: 'PUT',
          }).catch(() => {}); // ignore errors
        } else {
          // אם השיחה השתנתה - נעצור את ה-heartbeat
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
        }
      }, 30000);
    } catch (error) {
      // Error loading messages - ignore
    }
  }, []);

  // טעינת סטטיסטיקות
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/chat/stats');
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      // Error loading stats - ignore
    }
  }, []);

  // שליחת הודעה
  const sendMessage = async () => {
    if (!selectedConversation || !inputValue.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/chat/messages/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          send_to_telegram: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      setMessages([...messages, data.message]);
      setInputValue('');
      await loadConversations();
    } catch (error) {
      alert('שגיאה בשליחת ההודעה');
    } finally {
      setLoading(false);
    }
  };

  // עדכון סטטוס שיחה
  const updateStatus = async (conversationId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/chat/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, status }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      await loadConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({ ...selectedConversation, status: status as any });
      }
    } catch (error) {
      // Error updating status - ignore
    }
  };

  // Realtime subscription
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`admin-chat-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'klumit_chat_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // בדיקה שההודעה לא קיימת כבר
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'klumit_chat_conversations',
          filter: `id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          // עדכון הסטטוס של השיחה הנבחרת
          if (payload.new && selectedConversation.id === payload.new.id) {
            setSelectedConversation({
              ...selectedConversation,
              status: payload.new.status as 'open' | 'waiting' | 'closed',
            });
          }
          loadConversations();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, loadConversations]);

  // טעינה ראשונית
  useEffect(() => {
    loadConversations();
    loadStats();
  }, [loadConversations, loadStats]);

  // טעינת הודעות כשמשנים שיחה
  useEffect(() => {
    // ניקוי heartbeat קודם לפני יצירת חדש
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // שחרור view של השיחה הקודמת (אם יש)
    const previousConversationId = currentConversationIdRef.current;
    
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    } else {
      currentConversationIdRef.current = null;
    }

    // ניקוי בעת יציאה
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      // שחרור view רק אם זו השיחה שהיינו בה
      if (previousConversationId) {
        fetch(`/api/admin/chat/conversations/${previousConversationId}/view`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    };
  }, [selectedConversation?.id, loadMessages]);

  // גלילה למטה כשמוסיפים הודעה
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusBadge = (status: string) => {
    const badges = {
      open: '🟢 פתוח',
      waiting: '🟡 ממתין',
      closed: '⚫ סגור',
    };
    return badges[status as keyof typeof badges] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">ניהול צ&apos;אט</h1>

        {/* סטטיסטיקות */}
        {stats && (
          <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center gap-8">
            <div>
              <span className="text-sm text-gray-600">סה&quot;כ שיחות: </span>
              <span className="text-xl font-bold">{stats.conversations.total}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">פתוחות: </span>
              <span className="text-xl font-bold text-green-600">{stats.conversations.open}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">ממתינות: </span>
              <span className="text-xl font-bold text-yellow-600">{stats.conversations.waiting}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">הודעות היום: </span>
              <span className="text-xl font-bold">{stats.messages_today}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* רשימת שיחות */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold mb-4">שיחות</h2>
              
              {/* סינון */}
              <div className="space-y-2 mb-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="all">כל הסטטוסים</option>
                  <option value="open">פתוחות</option>
                  <option value="waiting">ממתינות</option>
                  <option value="closed">סגורות</option>
                </select>
                
                <input
                  type="text"
                  placeholder="חיפוש..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 hover:bg-gray-50 ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div 
                    onClick={() => setSelectedConversation(conv)}
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold">
                        {conv.user_name || conv.user_email || 'אורח'}
                      </div>
                      <div className="text-xs">{getStatusBadge(conv.status)}</div>
                    </div>
                    
                    {conv.user_phone && (
                      <div className="text-sm text-gray-600 mb-1">📞 {conv.user_phone}</div>
                    )}
                    
                    {conv.user_email && (
                      <div className="text-sm text-gray-600 mb-1">✉️ {conv.user_email}</div>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-2">
                      {formatDate(conv.last_message_at)}
                    </div>
                    
                    {/* הצגת ההודעה האחרונה */}
                    {conv.last_message && (
                      <div className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {conv.last_message_from_user ? (
                          <>
                            <span className="font-medium underline">
                              {conv.user_name || conv.user_email || 'אורח'}
                            </span>
                            <span>: </span>
                            {conv.last_message}
                          </>
                        ) : (
                          <>
                            <span className="font-medium underline">
                              {conv.last_message_replied_by || 'קלומית'}
                            </span>
                            <span>: </span>
                            {conv.last_message}
                          </>
                        )}
                      </div>
                    )}
                    
                    {conv.needs_response && (
                      <div className="mt-2">
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                          צריך להגיב!
                        </span>
                      </div>
                    )}

                    {conv.viewed_by_admin_id && (
                      <div className="mt-2 text-xs text-blue-600">
                        👁️ מנהל אחר צופה בשיחה זו
                      </div>
                    )}
                  </div>
                  
                  {/* כפתור מחק */}
                  <div className="mt-2 pt-2 border-t">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('האם אתה בטוח שברצונך למחוק את השיחה?')) {
                          try {
                            const response = await fetch(`/api/admin/chat/conversations/${conv.id}`, {
                              method: 'DELETE',
                            });
                            
                            if (response.ok) {
                              // הסרה מה-UI
                              setConversations(conversations.filter(c => c.id !== conv.id));
                              if (selectedConversation?.id === conv.id) {
                                setSelectedConversation(null);
                              }
                            } else {
                              alert('שגיאה במחיקת השיחה');
                            }
                          } catch (error) {
                            alert('שגיאה במחיקת השיחה');
                          }
                        }
                      }}
                      className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 hover:border-red-300 transition-colors"
                    >
                      🗑️ מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* הודעות */}
          <div className="col-span-2 bg-white rounded-lg shadow flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {selectedConversation.user_name || selectedConversation.user_email || 'אורח'}
                      </h2>
                      {selectedConversation.user_phone && (
                        <div className="text-sm text-gray-600">📞 {selectedConversation.user_phone}</div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <select
                        value={selectedConversation.status}
                        onChange={(e) => updateStatus(selectedConversation.id, e.target.value)}
                        className="p-2 border rounded"
                      >
                        <option value="open">פתוח</option>
                        <option value="waiting">ממתין</option>
                        <option value="closed">סגור</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.from_user ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.from_user
                            ? 'bg-gray-100'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        <div className="text-sm">{msg.message}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {formatDate(msg.created_at)}
                          {!msg.from_user && msg.replied_by_name && (
                            <span> • {msg.replied_by_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="הקלד הודעה..."
                      className="flex-1 p-2 border rounded"
                      disabled={loading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || !inputValue.trim()}
                      className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loading ? 'שולח...' : 'שלח'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                בחר שיחה מהרשימה
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
