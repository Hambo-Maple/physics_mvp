import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MessageSquare, Maximize2, Minimize2, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatBoxProps {
  onVisualizationRequest?: (type: string) => void;
  onToggleCanvas?: () => void;
  isCanvasOpen?: boolean;
  onClose?: () => void;
}

export function ChatBox({ onVisualizationRequest, onToggleCanvas, isCanvasOpen = true, onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是物理可视化助手。我可以帮你创建平抛运动、自由落体等物理现象的可视化演示。试试问我一些物理问题吧！',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'recognizing'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    // 模拟AI响应
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '好的！让我为你创建一个平抛运动的可视化演示。你可以在右侧画布中看到物体的运动轨迹。',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsGenerating(false);
      
      if (onVisualizationRequest) {
        onVisualizationRequest('PROJECTILE');
      }
    }, 1500);
  };

  const handleVoiceInput = () => {
    if (voiceState === 'idle') {
      setVoiceState('recording');
      setTimeout(() => {
        setVoiceState('recognizing');
        setTimeout(() => {
          setVoiceState('idle');
        }, 1000);
      }, 2000);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-10 h-10 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-gray-800">物理可视化助手</h2>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCanvas}
              className="rounded-xl border-gray-200 hover:bg-gray-50"
            >
              {isCanvasOpen ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-2" />
                  关闭画布
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  打开画布
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-5">
        <div ref={scrollRef} className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    : 'bg-gray-50 text-gray-800 border border-gray-100'
                }`}
              >
                {message.content}
              </div>
              <span className="text-xs text-gray-400 mt-1">
                {message.timestamp}
              </span>
            </div>
          ))}
          {isGenerating && (
            <div className="flex items-start">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-5 border-t border-gray-100 bg-gray-50/50">
        <div className="flex flex-col gap-3">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入消息..."
            disabled={isGenerating}
            className="min-h-[80px] resize-none bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-100 rounded-xl"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleVoiceInput}
              disabled={isGenerating}
              className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
            >
              {voiceState === 'recording' && (
                <Badge className="mr-2 bg-red-100 text-red-600 hover:bg-red-100">
                  录音中
                </Badge>
              )}
              {voiceState === 'recognizing' && (
                <Badge className="mr-2 bg-blue-100 text-blue-600 hover:bg-blue-100">
                  识别中
                </Badge>
              )}
              <Mic className="w-4 h-4 mr-2" />
              {voiceState === 'idle' ? '语音输入' : voiceState === 'recording' ? '正在录音...' : '正在识别...'}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isGenerating}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Send className="w-4 h-4 mr-2" />
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}