import api from './api';

export const chatService = {
  /**
   * Send a query to the Storefront Customer Assistant
   * @param {Object} payload { message: string, conversationHistory: Array<{role: string, content: string}> }
   */
  sendCustomerMessage: (payload) => api.post('/chat/customer', payload),

  /**
   * Send a query to the Admin Operations Copilot
   * @param {Object} payload { message: string, conversationHistory: Array<{role: string, content: string}> }
   */
  sendAdminMessage: (payload) => api.post('/chat/admin', payload)
};

export default chatService;

