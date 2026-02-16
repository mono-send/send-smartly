import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  codeGenerated?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  panelHeight: number;
}

interface ChatContextType extends ChatState {
  addMessage: (role: "user" | "assistant", content: string, codeGenerated?: string) => void;
  clearMessages: () => void;
  togglePanel: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setPanelHeight: (height: number) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [panelHeight, setPanelHeight] = useState(() => {
    const stored = localStorage.getItem("aiChatPanelHeight");
    return stored ? parseFloat(stored) : 75;
  });

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string, codeGenerated?: string) => {
      const newMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        role,
        content,
        timestamp: new Date(),
        codeGenerated,
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const updatePanelHeight = useCallback((height: number) => {
    const clampedHeight = Math.max(20, Math.min(70, height));
    setPanelHeight(clampedHeight);
    localStorage.setItem("aiChatPanelHeight", clampedHeight.toString());
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isOpen,
        isLoading,
        panelHeight,
        addMessage,
        clearMessages,
        togglePanel,
        setIsOpen,
        setIsLoading,
        setPanelHeight: updatePanelHeight,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
