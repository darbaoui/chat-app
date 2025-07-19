import { axios } from '@/lib/axios';
import { create } from 'zustand';

const useMessageStore = create((set, get) => ({
  messages: null,
  currentTempDraft: null,
  currentDraft: null,
  error: null,
  uploadingMessages: new Map(),
  unReadMessages: 0,
  shouldScrollToBottom: true,
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

  updateMessageByTempId: (tempId, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.temp_id === tempId ? { ...msg, ...updates } : msg
      ),
    }));
  },
  createUploadingMessage: (tempId, payload) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      newMap.set(tempId, payload);
      return { uploadingMessages: newMap };
    });
  },
  updatingUploadingMessageTempId: (tempId, id, payload) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      if (newMap.has(tempId)) {
        const existing = newMap.get(tempId);
        if (existing) {
          newMap.set(id, { ...existing, id, user: payload.user });
          newMap.delete(tempId);
        }
        return { uploadingMessages: newMap };
      }
    });
  },

  updateUploadingMessage: (tempId, updates) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(tempId);
      if (existing) {
        newMap.set(tempId, { ...existing, ...updates });
      }
      return { uploadingMessages: newMap };
    });
  },

  addFileToUploadingMessage: (tempId, file) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(tempId);
      if (existing) {
        newMap.set(tempId, {
          ...existing,
          media: [...existing.media, file],
        });
      }
      return { uploadingMessages: newMap };
    });
  },

  updateFileInUploadingMessage: (tempId, fileId, updates) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(tempId);
      if (existing) {
        newMap.set(tempId, {
          ...existing,
          media: existing.media.map((file) =>
            file.temp_id === fileId ? { ...file, ...updates } : file
          ),
        });
      }
      return { uploadingMessages: newMap };
    });
  },

  removeUploadingMessage: (tempId) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      newMap.delete(tempId);
      return { uploadingMessages: newMap };
    });
  },

  displayFileInUI: (file, filePreview, messageId) => {
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
      upload_status: 'uploading',
      isUploading: true,
      message_id: messageId,
      temp_id: fileTempId,
    };

    // Add file to uploading message
    get().addFileToUploadingMessage(messageId, fileObj);
  },

  uploadFiles: (draft) => {
    const draftId = draft?.id;
    if (!draftId) {
      console.error('Please make sure the draft exist!');
      return;
    }

    const files = get().uploadingMessages.get(draftId)?.media || [];
    if (files.length === 0) {
      console.warn('No files to upload');
      return;
    }

    files.forEach((file) => {
      get().uploadFile(file, draftId); // Upload each file via Zustand
    });
  },

  // The first function that used
  uploadFile: async (file, messageId) => {
    // console.log('Uploading file:', file);
    // const fileTempId = crypto.randomUUID();
    // // Create file object for tracking
    // const fileObj = {
    //   id: '',
    //   name: file.name,
    //   file_name: file.name,
    //   mime_type: file.type,
    //   size: file.size,
    //   content: filePreview.content,
    //   attributes: {
    //     width: filePreview?.dimensions?.width,
    //     height: filePreview?.dimensions?.height,
    //   },
    //   original_url: '',
    //   file,
    //   preview_url: '',
    //   upload_progress: 0,
    //   upload_status: 'uploading',
    //   isUploading: true,
    //   message_id: messageId,
    //   temp_id: fileTempId,
    // };

    // Add file to uploading message
    // get().addFileToUploadingMessage(messageId, fileObj);
    const { file: fileToUpload, temp_id: fileTempId } = file;

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('temp_id', fileTempId);
      if (messageId) {
        formData.append('message_id', messageId);
      }

      const response = await axios.post('/api/messages/text/upload', formData, {
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
      });

      if (response.data.success) {
        get().updateFileInUploadingMessage(messageId, fileTempId, {
          ...response.data.media,
          upload_status: 'completed',
          isUploading: false,
          upload_progress: 100,
        });

        get().updateMessageMediaContent(messageId, fileTempId, {
          ...response.data.media,
          isUploading: false,
        });
      }
    } catch (error) {
      get().updateFileInUploadingMessage(messageId, fileTempId, {
        upload_status: 'failed',
      });
      set({ error: 'Failed to upload file' });
    }
  },

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
  /**
   *
   * @param  messageId  can be message id or temp_id
   * @param  content editor object
   */
  submitMessage: async (messageId, content) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(messageId);
      if (existing) {
        const new_message = { ...existing, isUploading: true, content };
        newMap.set(messageId, new_message);
        get().addMessage(new_message);
      }

      return {
        uploadingMessages: newMap,
        currentDraft: null,
        currentTempDraft: null,
      };
    });
  },
  createTempDraft: (user) => {
    const tempId = crypto.randomUUID();
    const tempDraft = {
      id: tempId,
      temp_id: tempId,
      content: null,
      status: 'draft',
      user,
      media: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set({ currentTempDraft: tempDraft });
    get().createUploadingMessage(tempId, tempDraft);

    return tempDraft;
  },
  createDraft: async (tempId) => {
    if (get().currentDraft?.id) return;
    try {
      const response = await axios.post('/api/messages/text/draft');
      if (response.data) {
        const draft = {
          id: response.data.id,
          // temp_id: tempId,
          content: null,
          status: 'draft',
          user: response.data.user,
          media: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.log('tempId --->', tempId);
        if (tempId) {
          get().updatingUploadingMessageTempId(tempId, response.data.id, draft);
        } else {
          get().createUploadingMessage(response.data.id, draft);
        }
        set({ currentDraft: draft });
        return draft;
      }
    } catch (error) {
      set({ error: 'Failed to create draft' });
      return null;
    }
  },
}));

export default useMessageStore;
