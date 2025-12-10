import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, MessageSquare, Clock, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Chat {
  id: string;
  customer_id: string;
  operator_id: string | null;
  status: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

export const CustomerService = ({ userRole }: { userRole: 'customer' | 'operator' | 'admin' }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newChatSubject, setNewChatSubject] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchChats();
      subscribeToChats();
    }
  }, [currentUserId, userRole]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchChats = async () => {
    try {
      let query = supabase
        .from('customer_service_chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (userRole === 'customer') {
        query = query.eq('customer_id', currentUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const { data, error } = await supabase
        .from('customer_service_messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const subscribeToChats = () => {
    const channel = supabase
      .channel('chats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_service_chats'
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToMessages = () => {
    if (!selectedChat) return;

    const channel = supabase
      .channel(`messages-${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_service_messages',
          filter: `chat_id=eq.${selectedChat.id}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreateChat = async () => {
    if (!newChatSubject.trim()) {
      toast.error('请输入咨询主题');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customer_service_chats')
        .insert({
          customer_id: currentUserId,
          subject: newChatSubject,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('咨询已创建');
      setNewChatSubject('');
      setShowNewChat(false);
      fetchChats();
      setSelectedChat(data);
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('创建咨询失败');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const { error } = await supabase
        .from('customer_service_messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: currentUserId,
          sender_role: userRole,
          content: newMessage
        });

      if (error) throw error;

      // 更新对话状态
      if (selectedChat.status === 'pending' && userRole === 'operator') {
        await supabase
          .from('customer_service_chats')
          .update({ 
            status: 'active',
            operator_id: currentUserId
          })
          .eq('id', selectedChat.id);
      }

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('发送消息失败');
    }
  };

  const handleCloseChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('customer_service_chats')
        .update({ 
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) throw error;

      toast.success('对话已关闭');
      fetchChats();
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Failed to close chat:', error);
      toast.error('关闭对话失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { label: '待处理', variant: 'secondary' as const, icon: Clock },
      active: { label: '进行中', variant: 'default' as const, icon: MessageSquare },
      closed: { label: '已关闭', variant: 'outline' as const, icon: CheckCircle2 }
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* 对话列表 */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>客服对话</CardTitle>
            {userRole === 'customer' && (
              <Button size="sm" onClick={() => setShowNewChat(true)}>
                新建
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2 p-4">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedChat?.id === chat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {chat.subject || '无主题'}
                    </h4>
                    {getStatusBadge(chat.status)}
                  </div>
                  <p className="text-xs opacity-70">
                    {new Date(chat.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              ))}
              {chats.length === 0 && (
                <p className="text-center text-muted-foreground py-8">暂无对话</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 消息区域 */}
      <Card className="lg:col-span-2">
        {showNewChat ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">创建新咨询</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowNewChat(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">咨询主题</label>
                <Input
                  value={newChatSubject}
                  onChange={(e) => setNewChatSubject(e.target.value)}
                  placeholder="请简要描述您的问题"
                />
              </div>
              <Button onClick={handleCreateChat} className="w-full">
                创建咨询
              </Button>
            </div>
          </div>
        ) : selectedChat ? (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedChat.subject || '无主题'}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getStatusBadge(selectedChat.status)}
                  </p>
                </div>
                {selectedChat.status !== 'closed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloseChat(selectedChat.id)}
                  >
                    关闭对话
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[380px] pr-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.sender_id === currentUserId;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">
                            {message.sender_role === 'customer' ? '客户' : '客服'}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="输入消息..."
                  className="min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={selectedChat.status === 'closed'}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || selectedChat.status === 'closed'}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {userRole === 'customer' ? '选择对话或创建新咨询' : '选择一个对话开始'}
          </div>
        )}
      </Card>
    </div>
  );
};
