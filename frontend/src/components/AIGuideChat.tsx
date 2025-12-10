import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Loader2, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import ProductCard from "./ProductCard";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommendedProducts?: Array<{
    id: string | number;
    name: string;
    price: number;
    image: string;
    rating: number;
    sales: number;
  }>;
}

const AIGuideChat = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是AI导购助手，很高兴为您服务。请告诉我您想要什么样的商品？',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 直接调用 Django 后端 API
      const response = await fetch(`${API_BASE}/ai_guide/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          sessionId,
          useExternalLLM: true,  // 尝试使用外部 LLM，失败则自动降级到本地模拟
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI 助手响应失败');
      }

      const data = await response.json();

      const aiResponse: Message = {
        role: 'assistant',
        content: data.message,
        recommendedProducts: data.recommendedProducts,
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error('AI chat error:', error);
      toast.error(error.message || 'AI助手暂时无法响应，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = [
    '推荐降噪耳机',
    '性价比高的充电器',
    '适合运动的手环',
    '办公用的键盘',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl h-[600px] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-ai flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">AI导购助手</h3>
              <p className="text-xs text-muted-foreground">为您推荐最合适的商品</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary'
                      : 'bg-gradient-ai'
                  }`}
                >
                  {message.role === 'user' ? (
                    <span className="text-xs font-semibold text-primary-foreground">You</span>
                  ) : (
                    <Sparkles className="h-4 w-4 text-white" />
                  )}
                </div>

                <div
                  className={`flex flex-col gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.recommendedProducts && message.recommendedProducts.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 w-full">
                      {message.recommendedProducts.map(product => (
                        <div key={product.id} className="relative">
                          <ProductCard {...product} />
                          <Button
                            size="sm"
                            className="absolute bottom-2 right-2 gap-1"
                            onClick={() => {
                              navigate(`/product/${product.id}`);
                              onClose();
                            }}
                          >
                            查看详情
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReplies.map((reply) => (
                <Badge
                  key={reply}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => setInput(reply)}
                >
                  {reply}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="描述您的需求..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <Button 
              onClick={handleSend}
              size="icon"
              className="shrink-0"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIGuideChat;

  const quickReplies = [
    '推荐降噪耳机',
    '性价比高的充电器',
    '适合运动的手环',
    '办公用的键盘',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl h-[600px] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-ai flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">AI导购助手</h3>
              <p className="text-xs text-muted-foreground">为您推荐最合适的商品</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary'
                      : 'bg-gradient-ai'
                  }`}
                >
                  {message.role === 'user' ? (
                    <span className="text-xs font-semibold text-primary-foreground">You</span>
                  ) : (
                    <Sparkles className="h-4 w-4 text-white" />
                  )}
                </div>

                <div
                  className={`flex flex-col gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.recommendedProducts && message.recommendedProducts.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 w-full">
                      {message.recommendedProducts.map(product => (
                        <div key={product.id} className="relative">
                          <ProductCard {...product} />
                          <Button
                            size="sm"
                            className="absolute bottom-2 right-2 gap-1"
                            onClick={() => {
                              navigate(`/product/${product.id}`);
                              onClose();
                            }}
                          >
                            查看详情
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReplies.map((reply) => (
                <Badge
                  key={reply}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => setInput(reply)}
                >
                  {reply}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="描述您的需求..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <Button 
              onClick={handleSend}
              size="icon"
              className="shrink-0"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIGuideChat;