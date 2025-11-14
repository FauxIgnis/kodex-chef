import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { 
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string | null;
  documentContent?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
}

export function AIChatSidebar({ isOpen, onClose, documentId, documentContent }: AIChatSidebarProps) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const generateAIResponse = useAction(api.chat.generateAIResponse);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");
    setIsLoading(true);

    try {
      // Prepare context for AI
      let contextualMessage = currentMessage;
      if (documentContent && documentContent.trim()) {
        contextualMessage = `Document context: "${documentContent.substring(0, 500)}${documentContent.length > 500 ? '...' : ''}"\n\nUser question: ${currentMessage}`;
      }

      const aiResponse = await generateAIResponse({
        userMessage: contextualMessage,
        documentId: documentId as Id<"documents"> | undefined,
      });

      if (aiResponse) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiResponse,
          timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("AI response error:", error);
      toast.error("Failed to get AI response");
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I apologize, but I'm currently unable to provide a response. Please try again later.",
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col transition-all duration-300 ease-in-out shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIcon className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="font-semibold text-gray-900 font-sans">Legal AI Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close AI Assistant"
          >
            <XMarkIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1 font-sans">
          Get instant legal insights and document analysis
        </p>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
        {chatHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 font-sans">
              Welcome to Legal AI Assistant
            </h4>
            <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed font-sans">
              Ask questions about legal concepts, document analysis, compliance requirements, or get help with your legal research.
            </p>
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium text-gray-700 font-sans">Try asking:</p>
              <div className="space-y-1">
                <button
                  onClick={() => handleSuggestedQuestion("What are the key elements of a valid contract?")}
                  className="block w-full text-left text-xs text-gray-600 hover:text-purple-600 p-2 hover:bg-white rounded transition-colors font-sans"
                >
                  "What are the key elements of a valid contract?"
                </button>
                <button
                  onClick={() => handleSuggestedQuestion("Help me review this document for compliance issues")}
                  className="block w-full text-left text-xs text-gray-600 hover:text-purple-600 p-2 hover:bg-white rounded transition-colors font-sans"
                >
                  "Help me review this document for compliance issues"
                </button>
                <button
                  onClick={() => handleSuggestedQuestion("What are common legal risks in business agreements?")}
                  className="block w-full text-left text-xs text-gray-600 hover:text-purple-600 p-2 hover:bg-white rounded transition-colors font-sans"
                >
                  "What are common legal risks in business agreements?"
                </button>
                {documentContent && (
                  <button
                    onClick={() => handleSuggestedQuestion("Analyze this document for potential legal issues")}
                    className="block w-full text-left text-xs text-gray-600 hover:text-purple-600 p-2 hover:bg-white rounded transition-colors font-sans"
                  >
                    "Analyze this document for potential legal issues"
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm px-4 py-3 rounded-2xl ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.content}
                  </p>
                  <p className={`text-xs mt-2 font-sans ${
                    msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-800 shadow-sm px-4 py-3 rounded-2xl max-w-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 font-sans">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about legal concepts, document analysis, compliance..."
              className="w-full p-3 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-sans leading-relaxed"
              rows={2}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 font-sans leading-relaxed">
          Press Enter to send, Shift+Enter for new line. AI responses are for informational purposes only.
        </p>
      </div>
    </div>
  );
}
