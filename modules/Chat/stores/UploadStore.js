import { create } from 'zustand';
import messageService from '@/modules/Chat/services/messageService';
import { MessageStatus } from '@/modules/Chat/constants';
import useDraftStore from './DraftStore';
import useMessageStore from './MessageStore';

const useUploadStore = create((set, get) => ({
  uploadingMessages: new Map(),
  error: null,

  // --- State Manipulation for Uploading Messages ---
  createUploadingMessage: (key, payload) =>
    set((state) => ({
      uploadingMessages: new Map(state.uploadingMessages).set(key, payload),
    })),
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
  updateFileInUploadingMessage: (messageId, fileTempId, updates) =>
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(messageId);
      if (existing) {
        const updatedMedia = existing.media.map((file) =>
          file.temp_id === fileTempId ? { ...file, ...updates } : file
        );
        newMap.set(messageId, { ...existing, media: updatedMedia });
      }
      return { uploadingMessages: newMap };
    }),

  /**
   * Updates a specific media item within an uploading message.
   * Finds the media item by its server ID or temporary ID.
   * @param {string} messageKey - The key (ID or temp_id) of the parent message.
   * @param {string} mediaId - The key (ID or temp_id) of the media item to update.
   * @param {object} updates - The new properties to apply to the media item.
   */
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
   * Updates the text content of a message being tracked for upload.
   * @param {string} messageId - The ID of the message.
   * @param {object} updateContent - The new text content.
   */
  updateUploadingMessageContent: (messageId, updateContent) => {
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(messageId);

      if (existing) {
        newMap.set(messageId, {
          ...existing,
          content: updateContent,
        });
      }
      return { uploadingMessages: newMap };
    });
  },
  /**
   * Orchestrates displaying a file preview and starting its upload.
   * @param {File} file - The file object to upload.
   * @param {object} filePreview - An object with content and dimensions for UI preview.
   */
  handleFileDisplayAndUpload: (file, filePreview) => {
    const draft = useDraftStore.getState().currentDraft;
    if (!draft) return;

    const messageKey = draft.id || draft.temp_id;
    const fileTempId = crypto.randomUUID();

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
      message_id: draft.id,
      temp_id: fileTempId,
    };

    get().addUploadingMessageMediaItem(messageKey, fileObj);

    if (draft?.upload_status === MessageStatus.UPLOADING && draft.id) {
      get().uploadFile(fileObj, draft.id);
    }
  },

  /**
   * Uploads a single file to the server.
   * @param {object} file - The file object from the media array.
   * @param {string} messageId - The server-assigned ID of the parent message.
   */
  uploadFile: async (file, messageId) => {
    const { file: fileToUpload, temp_id: fileTempId } = file;
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('temp_id', fileTempId);
    formData.append('message_id', messageId);

    try {
      const onUploadProgress = (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        get().updateFileInUploadingMessage(messageId, fileTempId, {
          upload_progress: progress,
        });
        useMessageStore
          .getState()
          .updateMessageMediaContent(messageId, fileTempId, {
            upload_progress: progress,
          });
      };

      const { api } = useMessageStore.getState();
      const { data } = await api.uploadFileToServer(
        messageId,
        formData,
        onUploadProgress
      );

      const updates = {
        ...data.media,
        upload_status: MessageStatus.COMPLETED,
        upload_progress: 100,
      };
      get().updateFileInUploadingMessage(messageId, fileTempId, updates);
      useMessageStore
        .getState()
        .updateMessageMediaContent(messageId, fileTempId, updates);
    } catch (error) {
      console.error('Error uploading file:', error);
      const updates = {
        upload_status: MessageStatus.FAILED,
        isUploading: false,
      };
      get().updateFileInUploadingMessage(messageId, fileTempId, updates);
      useMessageStore
        .getState()
        .updateMessageMediaContent(messageId, fileTempId, updates);
      set({ error: 'Failed to upload file' });
    }
  },

  /**
   * Deletes a file optimistically and then sends the request to the server.
   * @param {string} mediaId - The temp_id or id of the file to delete.
   * @param {string} messageId - The id of the parent message.
   */
  deleteFile: async (mediaId, messageId) => {
    // Optimistic UI update
    useDraftStore.getState().setCurrentDraft({
      ...useDraftStore.getState().currentDraft,
      media: useDraftStore
        .getState()
        .currentDraft.media.filter(
          (f) => f.id !== mediaId && f.temp_id !== mediaId
        ),
    });
    set((state) => {
      const newMap = new Map(state.uploadingMessages);
      const existing = newMap.get(messageId);
      if (existing) {
        newMap.set(messageId, {
          ...existing,
          media: existing.media.filter(
            (f) => f.id !== mediaId && f.temp_id !== mediaId
          ),
        });
      }
      return { uploadingMessages: newMap };
    });

    const { api } = useMessageStore.getState();

    try {
      await api.deleteFileFromServer(mediaId);
    } catch (error) {
      set({ error: `Failed to delete file ${error}` });
      // Here you could add logic to revert the optimistic deletion on failure
    }
  },
}));

export default useUploadStore;
