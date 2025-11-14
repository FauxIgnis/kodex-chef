import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { 
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface ChatPanelProps {
  documentId: string | null;
}

export function ChatPanel({ documentId }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = useQuery(
    api.chat.getChatMessages,
    documentId ? { documentId: documentId as Id<"documents"> } : {}
  ) || [];

  const sendMessage = useMutation(api.chat.sendMessage);
  const addReaction = useMutation(api.chat.addReaction);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    try {
      let fileId = null;
      
      if (selectedFile) {
        // Upload file first
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        
        if (!result.ok) {
          throw new Error("File upload failed");
        }
        
        const { storageId } = await result.json();
        
        fileId = await saveFile({
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          storageId,
          documentId: documentId as Id<"documents"> | undefined,
        });
      }

      const messageContent = selectedFile 
        ? `${message.trim() || "Shared a file"} [File: ${selectedFile.name}]`
        : message;

      await sendMessage({
        content: messageContent,
        documentId: documentId as Id<"documents"> | undefined,
      });

      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Send message error:", error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction({
        messageId: messageId as Id<"chatMessages">,
        emoji,
      });
    } catch (error) {
      toast.error("Failed to add reaction");
      console.error("Reaction error:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const commonReactions = ["👍", "👎", "❤️", "😂", "😮", "😢", "😡"];

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {documentId ? "Document Chat" : "General Chat"}
            </h2>
            <p className="text-sm text-gray-600">
              {documentId 
                ? "Discuss this document with your team" 
                : "Team collaboration and AI assistance"
              }
            </p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <SparklesIcon className="w-4 h-4 mr-1" />
            AI Assistant Active
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ask legal questions, discuss documents, or collaborate with your team. 
              Our AI assistant is here to help with legal research and analysis.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.isAI ? 'justify-start' : 'justify-start'} group`}
            >
              <div className="flex items-start space-x-3 max-w-3xl">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  msg.isAI 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                    : 'bg-blue-500'
                }`}>
                  {msg.isAI ? '🤖' : (msg.author?.name?.[0] || 'U')}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {msg.isAI ? 'Legal AI Assistant' : (msg.author?.name || 'Unknown User')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    msg.isAI 
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <p className="text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  
                  {/* Reactions */}
                  <div className="flex items-center mt-2 space-x-1">
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex space-x-1">
                        {Object.entries(
                          msg.reactions.reduce((acc: Record<string, number>, reaction) => {
                            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg._id, emoji)}
                            className="px-2 py-1 bg-white border border-gray-200 rounded-full text-xs hover:bg-gray-50"
                          >
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      {commonReactions.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg._id, emoji)}
                          className="w-6 h-6 hover:bg-gray-100 rounded text-sm"
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        {selectedFile && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <PaperClipIcon className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">{selectedFile.name}</span>
              <span className="text-xs text-blue-600 ml-2">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a legal question or start a discussion..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Attach file"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>
            
            <button
              type="submit"
              disabled={!message.trim() && !selectedFile}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
        
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line. AI responses are for informational purposes only.
        </p>
      </div>
    </div>
  );
}
