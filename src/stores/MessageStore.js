import { MessageStatus } from '@/constants';
import axios from '@/lib/axios';
import { create } from 'zustand';
import userStore from './useStore';

const useMessageStore = create((set, get) => ({
  // State properties for managing chat messages and their lifecycle.
  messages: null, // Array of message objects displayed in the chat.
  currentDraft: null, // The message currently being composed or uploaded.
  error: null, // Stores any errors related to message operations.
  uploadingMessages: new Map(), // Map to track messages that are in the process of uploading (key: temp_id/id, value: message object).
  unReadMessages: 0, // Count of unread messages.
  shouldScrollToBottom: false, // Flag to indicate if the chat should scroll to the latest message.

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
    // This action handles the submission of a message, which can either be a new message
    // or an update to an existing draft (e.g., adding text to a media-only draft).
    // It manages optimistic UI updates by adding the message to the store immediately
    // and then initiating server synchronization.
    set((state) => {
      const draft = state.currentDraft;
      // Scenario 1: An existing draft is present (e.g., user attached media first)
      if (draft) {
        const message = get().uploadingMessages.get(draft.id || draft.temp_id);

        if (message) {
          const new_message = {
            ...message,
            isUploading: true,
            upload_status: MessageStatus.UPLOADING,
            content,
            created_at: new Date().toISOString(),
          };
          get().addMessage(new_message);
        }
      } else {
        // Scenario 2: No existing draft, creating a new text-only message
        const currentAuthUser = userStore.getState().user;
        const tempId = crypto.randomUUID();
        const newDraft = {
          id: null,
          temp_id: tempId,
          content,
          status: 'draft',
          upload_status: MessageStatus.PENDING,
          user: currentAuthUser,
          media: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        // Add this new draft to the `uploadingMessages` map for tracking.
        get().createUploadingMessage(tempId, newDraft);
        // Initiate server synchronization to create a persistent draft on the backend.
        // This will eventually update the message with a real ID from the server.
        get().syncDraftWithServer(tempId);
        // Create a message object for immediate display in the UI.
        const new_message = {
          ...newDraft,
          isUploading: true,
          content,
          created_at: new Date().toISOString(),
        };
        get().addMessage(new_message);
      }
      // Reset the current draft and ensure the chat scrolls to the bottom after submission.
      return {
        currentDraft: null,
        shouldScrollToBottom: true,
      };
    });
  },

  displayFileInUI: (file, filePreview) => {
    // This function is responsible for preparing a selected file (image, PDF, etc.)
    // for immediate display in the UI (optimistic update) and initiating its upload process.
    // It creates a temporary representation of the file and associates it with the current draft message.
    const draft = get().currentDraft;

    let messageId = null;
    // If a server-assigned ID already exists for the current draft, use it.
    // Otherwise, the message will initially be tracked by its temporary ID.
    if (draft?.id) {
      messageId = draft.id;
    }

    // Generate a temporary ID for the file itself, for client-side tracking before server assignment.
    const fileTempId = crypto.randomUUID();

    // Create a file object with all necessary metadata for display and upload tracking.
    // This object will be stored in the `uploadingMessages` map.
    const fileObj = {
      id: '', // Server-assigned ID will populate this later
      name: file.name,
      file_name: file.name,
      mime_type: file.type,
      size: file.size,
      content: filePreview.content, // Base64 or text content for immediate preview
      attributes: {
        width: filePreview?.dimensions?.width,
        height: filePreview?.dimensions?.height,
      },
      file, // The actual File object for upload
      original_url: '', // Server-assigned URL after successful upload
      preview_url: '', // Server-assigned preview URL
      upload_progress: 0,
      upload_status: draft?.upload_status || MessageStatus.PENDING,
      isUploading: true,
      message_id: messageId, // Link to the parent message (server ID if available)
      message_temp_id: draft?.temp_id, // Link to the parent message (temp ID if server ID not available)
      temp_id: fileTempId, // Unique temporary ID for this specific file
    };

    console.log('draft --->', draft);

    // Add this file object to the media array of the corresponding uploading message.
    // This updates the UI to show the file preview.
    get().addUploadingMessageMediaItem(draft?.id || draft?.temp_id, fileObj);

    // If the draft message is already in an 'UPLOADING' state (meaning it has a server ID)
    // and a messageId is available, immediately start uploading the file to the server.
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

  /**
   * Uploads text message content to the server and updates its status.
   * @param {string} messageId - The ID of the message to upload.
   * @param {object} content - The JSON content of the message.
   */
  uploadTextMessage: async (messageId, content) => {
    try {
      // The `uploadInProgress` ref in the component handles preventing duplicate calls
      // from the component itself. Here, we just perform the API call.
      await axios.put(`/api/messages/text/${messageId}`, {
        content: JSON.stringify(content),
      });
      get().updateMessageContent(messageId, {
        upload_status: MessageStatus.COMPLETED,
      });
    } catch (error) {
      console.error('Text message upload failed:', error);
      // Optionally, update the message status to FAILED in the UI
      get().updateMessageContent(messageId, {
        upload_status: MessageStatus.FAILED,
      });
    }
  },
  syncDraftWithServer: (messageTempId) => {
    // This function is responsible for synchronizing a client-side draft message with the server.
    // It creates a persistent draft on the backend and updates the local state with the server-assigned ID.
    // This is a critical step for ensuring message durability and handling media uploads.
    // If the current draft already has a server-assigned ID, it means it's already synced or being synced,
    // so we can exit early to prevent duplicate server calls.
    if (get().currentDraft?.id) return;
    axios
      .post('/api/messages/text/draft')
      .then(({ data }) => {
        // After a successful server response, update the local state.
        // Check if the current draft's upload status is already 'UPLOADING'.
        // This can happen if a use submit message with media uploads, before the draft received a server ID.
        // If it's already uploading, we don't want to reset its status here
        if (get().currentDraft?.upload_status === MessageStatus.UPLOADING) {
          return;
        }

        // Map existing media items from the temporary uploading message to include the new server-assigned message_id.
        // Also, update their status to 'UPLOADING' as they are now ready to be sent to the server.
        const media = get()
          .uploadingMessages.get(messageTempId)
          ?.media.map((mediaItem) => ({
            ...mediaItem,
            message_id: data.id,
            upload_status: MessageStatus.UPLOADING,
            isUploading: true,
          }));

        // Update the key of the uploading message in the `uploadingMessages` map from its temporary ID
        // to the new server-assigned ID. Also, update its properties with data from the server.
        get().updateUploadingMessageKey(messageTempId, data.id, {
          ...data,
          temp_id: null,
          upload_status: MessageStatus.UPLOADING,
          media,
        });
        // If the synced draft is the currently active draft in the UI, update its properties.
        if (get().currentDraft?.temp_id === messageTempId) {
          get().setCurrentDraft({
            ...get().currentDraft,
            ...data,
            id: data.id,
            temp_id: null,
            upload_status: MessageStatus.UPLOADING,
            media,
          });
        }

        // Find the message in the main `messages` array using its temporary ID and update it.
        // This ensures the message displayed in the chat list reflects the server-assigned ID and status.
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

        // If there are media items associated with this message, initiate their upload to the server.
        if (media && media.length) {
          media.forEach((mediaItem) => {
            // Call uploadFile for each media item
            get().uploadFile(mediaItem, data.id);
          });
        }
      })
      .catch((error) => {
        console.error('Error generating draft from server:', error);
        get().updateMessageDraft(messageTempId, {
          upload_status: MessageStatus.FAILED,
        });
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
      id: null,
      temp_id: tempId,
      content: null,
      status: 'draft',
      upload_status: MessageStatus.PENDING,
      user,
      media: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set(() => ({
      currentDraft: draft,
    }));
    get().createUploadingMessage(tempId, draft);
    get().syncDraftWithServer(tempId);
    return draft;
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
      set({ error: `Failed to delete file ${error}` });
    }
  },
}));

export default useMessageStore;
