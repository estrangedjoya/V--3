'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import useStore from '@/app/store';

const API_URL = 'https://v-e40n.onrender.com/api';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, getAuthHeaders } = useStore();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchConversations();
  }, [user]);

  useEffect(() => {
    // Check if we need to start a conversation with a specific user
    const targetUserId = searchParams.get('user');
    if (targetUserId && user) {
      startConversation(parseInt(targetUserId));
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/conversations`, {
        headers: getAuthHeaders(),
      });
      // Transform data to expected format
      const transformed = response.data.map(conv => ({
        ...conv,
        participants: [
          { user: conv.user1 },
          { user: conv.user2 }
        ]
      }));
      setConversations(transformed);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
        headers: getAuthHeaders(),
      });
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const startConversation = async (userId) => {
    try {
      const response = await axios.post(
        `${API_URL}/conversations`,
        { recipientId: userId },
        { headers: getAuthHeaders() }
      );
      // Transform to expected format
      const conv = {
        ...response.data,
        participants: [
          { user: response.data.user1 },
          { user: response.data.user2 }
        ]
      };
      setSelectedConversation(conv);
      fetchConversations();
    } catch (err) {
      console.error('Error starting conversation:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await axios.post(
        `${API_URL}/conversations/${selectedConversation.id}/messages`,
        { content: newMessage },
        { headers: getAuthHeaders() }
      );
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find((p) => p.user.id !== user.id)?.user;
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-pixel text-xl neon-text-cyan animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-pixel text-3xl neon-text-pink mb-8">MESSAGES</h1>

      <div className="grid md:grid-cols-3 gap-6 h-[70vh]">
        {/* Conversations List */}
        <div className="retro-card neon-border-purple overflow-hidden flex flex-col">
          <div className="p-4 border-b border-retro-border">
            <h2 className="font-arcade text-sm text-neon-cyan">CONVERSATIONS</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center">
                <p className="font-arcade text-xs text-gray-500">NO CONVERSATIONS</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const otherUser = getOtherParticipant(conv);
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b border-retro-border cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-retro-darker border-l-2 border-l-neon-cyan'
                        : 'hover:bg-retro-darker'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-retro-darker border border-neon-purple flex items-center justify-center flex-shrink-0">
                        <span className="font-pixel text-sm text-neon-purple">
                          {otherUser?.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-arcade text-sm text-white truncate">
                          {otherUser?.username}
                        </p>
                        {conv.messages && conv.messages[0] && (
                          <p className="font-arcade text-xs text-gray-500 truncate">
                            {conv.messages[0].content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="md:col-span-2 retro-card neon-border-cyan overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-retro-border">
                <h2 className="font-arcade text-sm text-neon-cyan">
                  {getOtherParticipant(selectedConversation)?.username}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderId === user.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded ${
                        msg.senderId === user.id
                          ? 'bg-neon-purple/20 border border-neon-purple'
                          : 'bg-retro-darker border border-retro-border'
                      }`}
                    >
                      <p className="font-arcade text-sm text-white break-words">
                        {msg.content}
                      </p>
                      <p className="font-arcade text-xs text-gray-500 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-retro-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="retro-input flex-1"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="retro-btn"
                  >
                    {sending ? '...' : 'SEND'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-arcade text-sm text-gray-500">
                SELECT A CONVERSATION
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-pixel text-xl neon-text-cyan animate-pulse">
          LOADING...
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
