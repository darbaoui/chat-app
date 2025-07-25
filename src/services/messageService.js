import axios from '@/lib/axios';

/**
 * A service object that centralizes all API calls related to messages.
 * This decouples the stores from the actual HTTP request implementation.
 */
const messageService = {
  /**
   * Creates a new draft message on the server.
   * @param {object | null} content - The initial content of the draft.
   * @returns {Promise} Axios promise resolving with the new draft data from the server.
   */
  createDraftOnServer: (content) => {
    return axios.post('/api/messages/text/draft', {
      content: JSON.stringify(content),
    });
  },

  /**
   * Updates the text content of an existing draft on the server.
   * @param {string} draftId - The server-assigned ID of the draft.
   * @param {object} content - The new content for the draft.
   * @returns {Promise} Axios promise.
   */
  updateDraftContentOnServer: (draftId, content) => {
    return axios.put(`/api/messages/text/draft/${draftId}`, {
      content: JSON.stringify(content),
    });
  },

  /**
   * Finalizes a message by submitting its full content, changing its status from 'draft'.
   * @param {string} messageId - The ID of the message to finalize.
   * @param {object} content - The JSON content of the message.
   * @returns {Promise} Axios promise.
   */
  submitTextMessageToServer: (messageId, content) => {
    return axios.put(`/api/messages/text/${messageId}`, {
      content: JSON.stringify(content),
    });
  },

  /**
   * Uploads a file associated with a message.
   * @param {FormData} formData - The form data containing the file and related IDs.
   * @param {function} onUploadProgress - A callback function to track upload progress.
   * @returns {Promise} Axios promise resolving with the uploaded media data.
   */
  uploadFileToServer: (formData, onUploadProgress) => {
    return axios.post('/api/messages/text/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },

  /**
   * Deletes a file from the server.
   * @param {string} mediaId - The ID of the media file to delete.
   * @returns {Promise} Axios promise.
   */
  deleteFileFromServer: (mediaId) => {
    return axios.delete('/api/messages/text/file', {
      data: { media_id: mediaId },
    });
  },
};

export default messageService;
