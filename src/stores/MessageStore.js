import { create } from 'zustand';

const useMessageStore = create((set) => ({
  messages: null,
  unReadMessages: 0,
  shouldScrollToBottom: true,
  setShouldScrollToBottom: (shouldScrollToBottom) => set({ shouldScrollToBottom }),
  incrementUnreadMessages: () =>
    set((state) => ({ unReadMessages: state.unReadMessages + 1 })),
  resetUnreadMessages: () => set({ unReadMessages: 0 }),
  setMessages: (messages) => set({ messages }),
  updateMessage: (messageId, updatedMessage) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg,
      ),
    })),
  addMessage: (newMessage) =>
    set((state) => {
      const messageExists = state.messages.some(
        (msg) => msg.id === newMessage.id,
      );

      if (messageExists) return state;

      return { messages: [newMessage, ...state.messages] };
    }),
  removeMessage: (messageId) =>
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== messageId),
      })),
  
  
}));

export default useMessageStore;
