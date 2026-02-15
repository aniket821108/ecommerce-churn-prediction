const axios = require('axios');
const logger = require('../utils/logger');

class MLIntegrationService {
  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 10000; // 10 seconds
  }
  
  // Health check for ML service
  async healthCheck() {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/health`, {
        timeout: this.timeout
      });
      
      return {
        status: 'healthy',
        response: response.data
      };
    } catch (error) {
      logger.error('ML service health check failed:', error.message);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  // Predict churn for users
  async predictChurn(usersData) {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/predict/churn`,
        { users: usersData },
        {
          timeout: this.timeout,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      return response.data.predictions;
    } catch (error) {
      logger.error('Churn prediction failed:', error.message);
      
      // Fallback to simple heuristic if ML service fails
      return this.getFallbackPredictions(usersData);
    }
  }
  
  // Fallback predictions (simple heuristic)
  getFallbackPredictions(usersData) {
    return usersData.map(user => {
      const features = user.features || {};
      
      // Simple churn prediction logic
      let churnScore = 0;
      let reasons = [];
      
      // Days since last order
      if (features.daysSinceLastOrder > 60) {
        churnScore += 0.6;
        reasons.push('Inactive for more than 60 days');
      } else if (features.daysSinceLastOrder > 30) {
        churnScore += 0.4;
        reasons.push('Inactive for 30-60 days');
      }
      
      // Low order frequency
      if (features.totalOrders > 0) {
        const orderFrequency = features.avgOrderFrequency || 0;
        if (orderFrequency > 60) { // More than 60 days between orders
          churnScore += 0.3;
          reasons.push('Low order frequency');
        }
      }
      
      // Low total spend
      if (features.totalSpent < 1000) {
        churnScore += 0.1;
        reasons.push('Low total spend');
      }
      
      // Normalize score to 0-1
      churnScore = Math.min(churnScore, 1);
      
      // Determine risk level
      let churnRisk = 'low';
      if (churnScore >= 0.7) churnRisk = 'high';
      else if (churnScore >= 0.4) churnRisk = 'medium';
      
      return {
        userId: user.userId,
        churnScore,
        churnRisk,
        probability: churnScore,
        reasons: reasons.length > 0 ? reasons : ['Active customer'],
        features: {
          daysSinceLastOrder: features.daysSinceLastOrder || 0,
          totalOrders: features.totalOrders || 0,
          totalSpent: features.totalSpent || 0,
          avgOrderFrequency: features.avgOrderFrequency || 0
        }
      };
    });
  }
  
  // Get product recommendations
  async getRecommendations(userId, limit = 10) {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/recommend`,
        { userId, limit },
        { timeout: this.timeout }
      );
      
      return response.data.recommendations;
    } catch (error) {
      logger.error('Failed to get recommendations:', error.message);
      return [];
    }
  }
  
  // Get sales forecast
  async getSalesForecast(days = 30) {
    try {
      const response = await axios.get(
        `${this.mlServiceUrl}/forecast/sales?days=${days}`,
        { timeout: this.timeout }
      );
      
      return response.data.forecast;
    } catch (error) {
      logger.error('Failed to get sales forecast:', error.message);
      return null;
    }
  }
  
  // Get customer segmentation
  async getCustomerSegmentation() {
    try {
      const response = await axios.get(
        `${this.mlServiceUrl}/segmentation/customers`,
        { timeout: this.timeout }
      );
      
      return response.data.segments;
    } catch (error) {
      logger.error('Failed to get customer segmentation:', error.message);
      return [];
    }
  }
}

// Create singleton instance
const mlIntegrationService = new MLIntegrationService();

module.exports = mlIntegrationService;