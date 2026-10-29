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
  sendAdminMessage: (payload) => api.post('/chat/admin', payload),

  /**
   * Send a confirmed promotional/CRM email to a customer
   * @param {Object} payload { customerEmail: string, customerName?: string, subject?: string, body: string, dealCode?: string, discountPercent?: number }
   */
  sendAdminEmail: (payload) => api.post('/chat/admin/send-email', payload)
};

export default chatService;
