const User = require('../models/User');
const Conversation = require('../models/Conversation');
const chatSocketService = require('./chatSocketService');
const logger = require('../utils/logger');

class ChatRoutingService {
  /**
   * Assign a conversation to an available agent
   * @param {Object} conversation - Conversation document
   * @returns {Object|null} Assigned agent or null
   */
  async assignConversation(conversation) {
    try {
      // Get online agents from socket service
      const onlineAgentIds = chatSocketService.getOnlineAgents();

      if (onlineAgentIds.length === 0) {
        logger.info('No online agents available for assignment');
        return null;
      }

      // Get agent details with current conversation counts
      const agents = await User.find({
        _id: { $in: onlineAgentIds },
        role: { $in: ['admin', 'agent'] }
      });

      if (agents.length === 0) {
        return null;
      }

      // Get conversation counts for each agent
      const agentConversationCounts = await Promise.all(
        agents.map(async (agent) => {
          const count = await Conversation.countDocuments({
            assignedTo: agent._id,
            status: { $in: ['active', 'waiting'] }
          });
          return {
            agent,
            count
          };
        })
      );

      // Filter agents with less than 5 active conversations
      const availableAgents = agentConversationCounts.filter(
        ({ count }) => count < 5
      );

      if (availableAgents.length === 0) {
        logger.info('All agents are at maximum capacity (5 conversations)');
        return null;
      }

      // Prioritize B2B customers
      const isB2BCustomer = conversation.customer.userId 
        ? await this.isB2BCustomer(conversation.customer.userId)
        : false;

      // Sort by conversation count (load balancing)
      availableAgents.sort((a, b) => a.count - b.count);

      // Assign to agent with lowest conversation count
      const selectedAgent = availableAgents[0].agent;

      logger.info(
        `Conversation ${conversation.conversationId} assigned to agent ${selectedAgent._id} ` +
        `(current load: ${availableAgents[0].count} conversations)` +
        `${isB2BCustomer ? ' [B2B Priority]' : ''}`
      );

      return selectedAgent;
    } catch (error) {
      logger.error(`Error in assignConversation: ${error.message}`);
      return null;
    }
  }

  /**
   * Reassign conversation if agent doesn't respond
   * @param {String} conversationId - Conversation ID
   * @param {Number} timeoutSeconds - Timeout in seconds (default: 60)
   */
  async scheduleReassignment(conversationId, timeoutSeconds = 60) {
    setTimeout(async () => {
      try {
        const conversation = await Conversation.findOne({ conversationId });

        if (!conversation) {
          return;
        }

        // Check if agent has responded
        const agentMessages = await require('../models/Message').countDocuments({
          conversationId,
          'sender.type': 'agent',
          createdAt: { $gte: conversation.createdAt }
        });

        if (agentMessages === 0 && conversation.status === 'active') {
          logger.info(`Agent did not respond to ${conversationId}, reassigning...`);

          // Mark current agent as unresponsive (could track this for metrics)
          conversation.assignedTo = null;
          conversation.status = 'waiting';
          await conversation.save();

          // Try to assign to another agent
          const newAgent = await this.assignConversation(conversation);

          if (newAgent) {
            conversation.assignedTo = newAgent._id;
            conversation.status = 'active';
            await conversation.save();

            // Notify new agent
            chatSocketService.sendToUser(newAgent._id, 'chat:new:assignment', {
              conversation: conversation.toObject(),
              reason: 'reassigned_due_to_timeout'
            });
          }
        }
      } catch (error) {
        logger.error(`Error in scheduleReassignment: ${error.message}`);
      }
    }, timeoutSeconds * 1000);
  }

  /**
   * Check if user is a B2B customer
   * @param {String} userId - User ID
   * @returns {Boolean}
   */
  async isB2BCustomer(userId) {
    try {
      const user = await User.findById(userId).select('role');
      return user && user.role === 'b2b_customer';
    } catch (error) {
      logger.error(`Error checking B2B status: ${error.message}`);
      return false;
    }
  }

  /**
   * Get available agents count
   * @returns {Number}
   */
  async getAvailableAgentsCount() {
    const onlineAgentIds = chatSocketService.getOnlineAgents();
    
    if (onlineAgentIds.length === 0) {
      return 0;
    }

    // Count agents with less than 5 active conversations
    let availableCount = 0;

    for (const agentId of onlineAgentIds) {
      const count = await Conversation.countDocuments({
        assignedTo: agentId,
        status: { $in: ['active', 'waiting'] }
      });

      if (count < 5) {
        availableCount++;
      }
    }

    return availableCount;
  }

  /**
   * Get queue statistics
   * @returns {Object} Queue stats
   */
  async getQueueStats() {
    const [waitingCount, activeCount, onlineAgents] = await Promise.all([
      Conversation.countDocuments({ status: 'waiting' }),
      Conversation.countDocuments({ status: 'active' }),
      this.getAvailableAgentsCount()
    ]);

    return {
      waiting: waitingCount,
      active: activeCount,
      onlineAgents,
      avgWaitTime: await this.calculateAverageWaitTime()
    };
  }

  /**
   * Calculate average wait time for conversations
   * @returns {Number} Average wait time in seconds
   */
  async calculateAverageWaitTime() {
    try {
      const recentConversations = await Conversation.find({
        firstResponseAt: { $ne: null },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).select('createdAt firstResponseAt');

      if (recentConversations.length === 0) {
        return 0;
      }

      const totalWaitTime = recentConversations.reduce((sum, conv) => {
        const waitTime = (conv.firstResponseAt - conv.createdAt) / 1000; // in seconds
        return sum + waitTime;
      }, 0);

      return Math.round(totalWaitTime / recentConversations.length);
    } catch (error) {
      logger.error(`Error calculating average wait time: ${error.message}`);
      return 0;
    }
  }

  /**
   * Process waiting queue
   * Assigns waiting conversations to available agents
   */
  async processWaitingQueue() {
    try {
      const waitingConversations = await Conversation.find({
        status: 'waiting'
      }).sort({ createdAt: 1 }); // FIFO

      if (waitingConversations.length === 0) {
        return;
      }

      logger.info(`Processing ${waitingConversations.length} waiting conversations`);

      for (const conversation of waitingConversations) {
        const agent = await this.assignConversation(conversation);

        if (agent) {
          conversation.assignedTo = agent._id;
          conversation.status = 'active';
          await conversation.save();

          // Notify agent
          chatSocketService.sendToUser(agent._id, 'chat:new:assignment', {
            conversation: conversation.toObject()
          });

          // Schedule reassignment if no response
          this.scheduleReassignment(conversation.conversationId);
        } else {
          // No agents available, stop processing
          break;
        }
      }
    } catch (error) {
      logger.error(`Error processing waiting queue: ${error.message}`);
    }
  }

  /**
   * Start queue processor (runs every 30 seconds)
   */
  startQueueProcessor() {
    setInterval(() => {
      this.processWaitingQueue();
    }, 30000); // 30 seconds

    logger.info('✅ Chat queue processor started');
  }
}

// Export singleton instance
module.exports = new ChatRoutingService();
