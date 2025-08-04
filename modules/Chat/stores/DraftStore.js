import { create } from 'zustand';
import { MessageStatus } from '@/modules/Chat/constants';
import messageService from '@/modules/Chat/services/messageService';
import useUploadStore from './UploadStore';
import useMessageStore from './MessageStore';

const useDraftStore = create((set, get) => ({
  currentDraft: null,

  setCurrentDraft: (draft) => set({ currentDraft: draft }),
  clearCurrentDraft: () => set({ currentDraft: null }),

  /**
   * Updates the text content of the current draft.
   * @param {object} content The new text content.
   */
  updateDraftContent: async (content) => {
    const { currentDraft } = get();
    if (!currentDraft?.id) return; // Can't update if not synced to the server yet

    // Optimistically update the content in the draft store
    set({ currentDraft: { ...currentDraft, content } });

    // Also update the content in the upload store's tracking map
    useUploadStore
      .getState()
      .updateUploadingMessageContent(currentDraft.id, content);

    try {
      const { api } = useMessageStore.getState();
      // Call the service to persist the change on the backend
      await api.updateDraftContentOnServer(currentDraft.id, content);
    } catch (error) {
      console.error('Failed to update draft content on server:', error);
      // Optionally, add logic here to revert the optimistic update on failure
    }
  },

  /**
   * Creates a new draft locally and initiates synchronization with the server.
   * @param {object} user - The current authenticated user object.
   * @param {object|null} content - The initial text content of the draft.
   * @returns {object} The locally created draft object.
   */
  createDraft: (user, content = null) => {
    const { currentDraft } = get();
    // Prevent creating a new draft if one already exists
    if (currentDraft?.id || currentDraft?.temp_id) return currentDraft;

    const tempId = crypto.randomUUID();
    const draft = {
      id: null,
      temp_id: tempId,
      content,
      status: 'draft',
      upload_status: MessageStatus.PENDING,
      user,
      media: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set({ currentDraft: draft });
    // Add to the upload queue to track its state and media
    useUploadStore.getState().createUploadingMessage(tempId, draft);
    // Begin synchronization with the backend
    get().syncDraftWithServer(tempId, draft.content);

    return draft;
  },

  /**
   * Synchronizes a new draft with the server to get a permanent ID and prepare for uploads.
   * @param {string} messageTempId - The client-side temporary ID of the draft.
   * @param {object} content - The text content to be sent to the server.
   */
  syncDraftWithServer: async (messageTempId, content) => {
    if (get().currentDraft?.id) return; // Already synced

    try {
      const { api } = useMessageStore.getState();

      const { data } = await api.createDraftOnServer(content);

      // If the draft was submitted before the server responded, abort the update.
      if (get().currentDraft?.upload_status === MessageStatus.UPLOADING) {
        return;
      }

      const media = await useUploadStore
        .getState()
        .handleDraftServerResponse(messageTempId, data);
      useMessageStore
        .getState()
        .handleDraftServerResponse(messageTempId, data, media);

      // Update the current draft with server data
      if (get().currentDraft?.temp_id === messageTempId) {
        set({
          currentDraft: {
            ...get().currentDraft,
            ...data,
            upload_status: MessageStatus.UPLOADING,
            media,
          },
        });
      }
    } catch (error) {
      console.error('Error generating draft from server:', error);
      useMessageStore.getState().updateMessageByTempId(messageTempId, {
        upload_status: MessageStatus.FAILED,
      });
    }
  },
}));

export default useDraftStore;
