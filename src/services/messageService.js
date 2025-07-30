import axios from '@/lib/axios';

/**
 * A service object that centralizes all API calls related to messages.
 * This decouples the stores from the actual HTTP request implementation.
 */
export default class messageService {
  constructor() {
    this.baseUrl = '/api';
    this.contentableType = null;
    this.contentableId = null;
  }

  initialize(contentableType, contentableId) {
    this.contentableType = contentableType;
    this.contentableId = contentableId;
    return this;
  }

  get urls() {
    if (!this.contentableType || !this.contentableId) {
      throw new Error(
        'MessageService must be initialized with contentableType and contentableId'
      );
    }

    return {
      contents: `${this.baseUrl}/contents/${this.contentableType}/${this.contentableId}`, // method GET
      getDraft: `${this.baseUrl}/contents/${this.contentableType}/${this.contentableId}/draft`, // method GET
      createDraft: `${this.baseUrl}/contents/${this.contentableType}/${this.contentableId}/draft`, // method POST
      updateDraft: (id) =>
        `${this.baseUrl}/contents/${this.contentableType}/${this.contentableId}/draft/${id}`, // ADD draft id
      storeAudio: `${this.baseUrl}/contents/${this.contentableType}/${this.contentableId}/audio`, // method POST
      storeText: `${this.baseUrl}/contents/${this.contentableType}/${this.contentableId}/text`, // method POST
      uploadFile: (id) => `${this.baseUrl}/contents/${id}/upload`, // method POST
      finalizeDraft: (id) => `${this.baseUrl}/contents/drafts/${id}/finalize`, // method POST
      deleteFile: (id) =>
        `${this.baseUrl}/contents/${this.contentableType}/${this.contentableId}/file/${id}`,
      // create: `${this.baseUrl}/${this.contentableType}/${this.contentableId}/messages`,
      // update: (messageId) =>
      //   `${this.baseUrl}/${this.contentableType}/${this.contentableId}/messages/${messageId}`,
      // delete: (messageId) =>
      //   `${this.baseUrl}/${this.contentableType}/${this.contentableId}/messages/${messageId}`,
    };
  }

  /**
   * Creates a new draft message on the server.

   * @param {object | null} content - The initial content of the draft.
   * @returns {Promise} Axios promise resolving with the new draft data from the server.
   */
  createDraftOnServer(content) {
    return axios.post(this.urls.createDraft, {
      content: JSON.stringify(content),
    });
  }

  /**
   * Updates the text content of an existing draft on the server.

   * @param {string} draftId - The server-assigned ID of the draft.
   * @param {object} content - The new content for the draft.
   * @returns {Promise} Axios promise.
   */
  updateDraftContentOnServer(draftId, content) {
    return axios.put(this.urls.updateDraft(draftId), {
      content: JSON.stringify(content),
    });
  }

  /**
   * Finalizes a message by submitting its full content, changing its status from 'draft'.
   * @param {string} messageId - The ID of the message to finalize.
   * @param {object} content - The JSON content of the message.
   * @returns {Promise} Axios promise.
   */
  submitTextMessageToServer(messageId, content) {
    return axios.put(this.urls.finalizeDraft(messageId), {
      content: JSON.stringify(content),
    });
  }

  /**
   * Uploads a file associated with a message.
   * @param {FormData} formData - The form data containing the file and related IDs.
   * @param {function} onUploadProgress - A callback function to track upload progress.
   * @returns {Promise} Axios promise resolving with the uploaded media data.
   */
  uploadFileToServer(messageId, formData, onUploadProgress) {
    return axios.post(this.urls.uploadFile(messageId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  }

  /**
   * Deletes a file from the server.
   * @param {string} mediaId - The ID of the media file to delete.
   * @returns {Promise} Axios promise.
   */
  deleteFileFromServer(mediaId) {
    return axios.delete(this.urls.deleteFile(mediaId), {
      data: { media_id: mediaId },
    });
  }
}

// export default messageService;
