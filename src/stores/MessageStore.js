import { CURRENT_USER, MessageStatus } from '@/constants';
import { axios } from '@/lib/axios';
import { create } from 'zustand';

const useMessageStore = create((set, get) => ({
  messages: null,
  currentDraft: null,
  error: null,
  uploadingMessages: new Map(),
  unReadMessages: 0,
  shouldScrollToBottom: false,
  setShouldScrollToBottom: (shouldScrollToBottom) =>
    set({ shouldScrollToBottom }),
  setCurrentDraft: (draft) => set({ currentDraft: draft }),
  clearCurrentDraft: () => {
    set({ currentDraft: null });
  },
  setMessages: (messages) => set({ messages }),
  updateMessage: (messageId, updatedMessage) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? updatedMessage : msg
      ),
    })),
  updateMessageContent: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),
  updateMessageDraft: (tempId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.temp_id === tempId
          ? { ...msg, ...updates, content: msg.content }
          : msg
      ),
    })),
  updateMessageMediaContent: (message_id, temp_id, newMediaContent) =>
    set((state) => ({
      messages: state.messages.map((message) => {
        if (message.id === message_id) {
          return {
            ...message,
            media: message.media.map((mediaItem) => {
              if (mediaItem.temp_id === temp_id) {
                return {
                  ...mediaItem,
                  ...newMediaContent, // Merges the new content
                };
              }
              return mediaItem;
            }),
          };
        }
        return message;
      }),
    })),
  addMessage: (newMessage) =>
    set((state) => {
      return { messages: [...state.messages, newMessage] };
    }),
  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),

  submitMessage: async (content) => {
    set((state) => {
      const draft = state.currentDraft;
      if (draft) {
        const message = get().uploadingMessages.get(draft.id || draft.temp_id);
        if (!message) {
          console.error(
            'No message found for the current draft.',
            draft,
            get().uploadingMessages
          );
          return;
        }
        if (message) {
          const new_message = {
            ...message,
            isUploading: true,
            content,
            created_at: new Date().toISOString(),
          };
          get().addMessage(new_message);
        }
      } else {
        //While a user use only content without media

        const tempId = crypto.randomUUID();
        const newDraft = {
          // id: response.data.id,
          temp_id: tempId,
          content,
          status: 'draft',
          upload_status: MessageStatus.PENDING,
          user: {
            id: CURRENT_USER,
            name: 'Current User',
          },
          media: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        get().createUploadingMessage(tempId, newDraft);
        get().generateDraftIsFromServe(tempId);
        const new_message = {
          ...newDraft,
          isUploading: true,
          content,
          created_at: new Date().toISOString(),
        };
        get().addMessage(new_message);
      }

      return {
        currentDraft: null,
        shouldScrollToBottom: true,
      };
    });
  },

  displayFileInUI: (file, filePreview) => {
    const draft = get().currentDraft;

    let messageId = null;
    if (draft?.id) {
      messageId = draft.id;
    }

    const fileTempId = crypto.randomUUID();

    // Create file object for tracking
    const fileObj = {
      id: '',
      name: file.name,
      file_name: file.name,
      mime_type: file.type,
      size: file.size,
      content: filePreview.content,
      attributes: {
        width: filePreview?.dimensions?.width,
        height: filePreview?.dimensions?.height,
      },
      file,
      original_url: '',
      preview_url: '',
      upload_progress: 0,
      upload_status: draft?.upload_status || MessageStatus.PENDING,
      isUploading: true,
      message_id: messageId,
      message_temp_id: draft?.temp_id,
      temp_id: fileTempId,
    };

    // TODO: add this file to the current draft media array

    get().addUploadingMessageMediaItem(draft?.id || draft?.temp_id, fileObj);

    if (draft?.upload_status === MessageStatus.UPLOADING && messageId) {
      get().uploadFile(fileObj, messageId);
    }
  },
  createUploadingMessage: (tempId, payload) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      newMap.set(tempId, payload);
      return { uploadingMessages: newMap };
    });
  },
  updateUploadingMessage: (messageId, media) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(messageId);
      if (existing) {
        newMap.set(messageId, {
          ...existing,
          media,
        });
      }
      return { uploadingMessages: newMap };
    });
  },
  updateUploadingMessageKey: (oldKey, newKey, data = {}) =>
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const message = newMap.get(oldKey);
      if (message) {
        newMap.delete(oldKey);
        newMap.set(newKey, { ...message, ...data });
      }
      return { uploadingMessages: newMap };
    }),
  addUploadingMessageMediaItem: (messageKey, mediaItem) =>
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(messageKey);
      if (existing) {
        newMap.set(messageKey, {
          ...existing,
          media: [...existing.media, mediaItem],
        });
      }
      return { uploadingMessages: newMap };
    }),
  updateUploadingMessageMediaItem: (messageKey, mediaId, updates) =>
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(messageKey);
      if (existing) {
        const updatedMedia = existing.media.map((item) =>
          (item.id && item.id === mediaId) || item.temp_id === mediaId
            ? { ...item, ...updates }
            : item
        );
        newMap.set(messageKey, { ...existing, media: updatedMedia });
      }
      return { uploadingMessages: newMap };
    }),
  generateDraftIsFromServe: (messageTempId) => {
    const { currentDraft } = get();

    if (currentDraft?.id) return;
    axios
      .post('/api/messages/text/draft')
      .then(({ data }) => {
        if (get().currentDraft?.upload_status === MessageStatus.UPLOADING) {
          return;
        }

        const media = get()
          .uploadingMessages.get(messageTempId)
          ?.media.map((mediaItem) => ({
            ...mediaItem,
            message_id: data.id,
            upload_status: MessageStatus.UPLOADING,
            isUploading: true,
          }));

        get().updateUploadingMessageKey(messageTempId, data.id, {
          ...data,
          temp_id: null,
          upload_status: MessageStatus.UPLOADING,
          media,
        });

        if (currentDraft?.temp_id === messageTempId) {
          get().setCurrentDraft({
            ...currentDraft,
            ...data,
            id: data.id,
            temp_id: null,
            upload_status: MessageStatus.UPLOADING,
            media,
          });
        }

        const messageExisting = get().messages.find(
          (msg) => msg.temp_id === messageTempId
        );
        if (messageExisting) {
          get().updateMessageDraft(messageTempId, {
            ...data,
            temp_id: null,
            upload_status: MessageStatus.UPLOADING,
            media,
          });
        }

        if (media && media.length) {
          // If the media not in the draft, but exist in the messsage so we need to add it to a separate uploading message
          media.forEach((mediaItem) => {
            get().uploadFile(mediaItem, data.id);
          });
        }
      })
      .catch((error) => {
        console.error('Error generating draft from server:', error);
      });
  },
  updateFileInUploadingMessage: (messageId, fileId, updates) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(messageId);

      if (existing) {
        newMap.set(messageId, {
          ...existing,
          media: existing.media.map((file) =>
            file.temp_id === fileId ? { ...file, ...updates } : file
          ),
        });
      }
      return { uploadingMessages: newMap };
    });
  },
  // The first function that used
  uploadFile: async (file, messageId) => {
    const { file: fileToUpload, temp_id: fileTempId } = file;

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('temp_id', fileTempId);
    formData.append('message_id', messageId);

    axios
      .post('/api/messages/text/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          get().updateFileInUploadingMessage(messageId, fileTempId, {
            upload_progress: progress,
          });
        },
      })
      .then(({ data }) => {
        get().updateFileInUploadingMessage(messageId, fileTempId, {
          ...data.media,
          upload_status: MessageStatus.COMPLETED,
          isUploading: true, // keep it true to make the imagePreview in mode upload
          upload_progress: 100,
        });
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        get().updateFileInUploadingMessage(messageId, fileTempId, {
          upload_status: MessageStatus.FAILED,
          isUploading: false,
        });
        set({ error: 'Failed to upload file' });
      });
  },
  createDraft: (user) => {
    const { currentDraft } = get();
    if (currentDraft?.id || currentDraft?.temp_id) return currentDraft;
    // create a new message width a unique ID
    const tempId = crypto.randomUUID();
    const draft = {
      // id: response.data.id,
      temp_id: tempId,
      content: null,
      status: 'draft',
      upload_status: MessageStatus.PENDING,
      user,
      media: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({
      currentDraft: draft,
    }));
    get().createUploadingMessage(tempId, draft);
    get().generateDraftIsFromServe(tempId);
    return draft;
  },
  // TODO: implement this function
  deleteFile: async (mediaId, messageId) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(messageId);
      if (existing) {
        newMap.set(messageId, {
          ...existing,
          media: existing.media.filter(
            (file) => file.id !== mediaId && file.temp_id !== mediaId
          ),
        });
      }

      //TODO: remove the file from the current draft media array
      const newCurrentDraft = state.currentDraft;
      if (newCurrentDraft) {
        const updatedMedia = newCurrentDraft.media.filter(
          (file) => file.id !== mediaId && file.temp_id !== mediaId
        );
        return {
          uploadingMessages: newMap,
          currentDraft: { ...newCurrentDraft, media: updatedMedia },
        };
      }

      return { uploadingMessages: newMap };
    });

    try {
      await axios.delete('/api/messages/text/file', {
        data: { media_id: mediaId },
      });
    } catch (error) {
      set({ error: 'Failed to delete file' });
    }
  },
}));

export default useMessageStore;
