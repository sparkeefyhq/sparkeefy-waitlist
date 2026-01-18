/**
 * SSE Connection Manager
 * 
 * Manages Server-Sent Events connections for real-time referral updates.
 * Handles connection lifecycle, event broadcasting, and memory management.
 * 
 * @module sse/SSEManager
 */

import { Response } from 'express';
import type { 
  SSEConnection, 
  SSEEvent, 
  ReferralCreditedEventData,
  TierUpgradedEventData,
  MilestoneReachedEventData,
  TierType 
} from "../types";
import { logger } from "../logging/logger";
import { calculateTier, getTierInfo, getMilestoneReached } from "../utils/tiers";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Heartbeat Interval
 * Send keep-alive comment every 30 seconds to prevent connection timeout
 */
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

/**
 * Connection Timeout
 * Close inactive connections after 5 minutes of no activity
 */
const CONNECTION_TIMEOUT = 300000; // 5 minutes

// ============================================================================
// SSE MANAGER CLASS
// ============================================================================

export class SSEManager {
  /**
   * Active SSE Connections
   * Map of user ID to their active connections
   */
  private connections: Map<string, Set<SSEConnection>>;

  /**
   * Heartbeat Intervals
   * Map of connection ID to their heartbeat interval timers
   */
  private heartbeatIntervals: Map<string, NodeJS.Timeout>;

  /**
   * Connection Timeouts
   * Map of connection ID to their timeout timers
   */
  private connectionTimeouts: Map<string, NodeJS.Timeout>;

  constructor() {
    this.connections = new Map();
    this.heartbeatIntervals = new Map();
    this.connectionTimeouts = new Map();

    logger.info("SSEManager initialized");
  }

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================

  /**
   * Add SSE Connection
   * 
   * Registers a new SSE connection for a user.
   * Sets up heartbeat and timeout timers.
   * 
   * @param {string} userId - User ID
   * @param {Response} res - Express response object
   * @param {string} requestId - Request correlation ID
   * @returns {string} Connection ID
   * 
   * @example
   * const connectionId = sseManager.addConnection(userId, res, requestId);
   */
  addConnection(userId: string, res: Response, requestId: string): string {
    const connectionId = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const connection: SSEConnection = {
      id: connectionId,
      userId,
      response: res,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    // Add to connections map
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(connection);

    // Set up heartbeat
    this.startHeartbeat(connection);

    // Set up connection timeout
    this.resetConnectionTimeout(connection);

    logger.info("SSE connection established", {
      userId,
      connectionId,
      requestId,
      totalConnections: this.getTotalConnectionCount(),
    });

    // Send initial connection success event
    this.sendEvent(connection, {
      type: "connected",
      timestamp: new Date().toISOString(),
      data: { message: "Connected to referral updates" },
    });

    return connectionId;
  }

  /**
   * Remove SSE Connection
   * 
   * Removes a connection and cleans up associated timers.
   * 
   * @param {string} userId - User ID
   * @param {string} connectionId - Connection ID
   */
  removeConnection(userId: string, connectionId: string): void {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    // Find and remove connection
    for (const conn of userConnections) {
      if (conn.id === connectionId) {
        userConnections.delete(conn);
        break;
      }
    }

    // Clean up empty user connection sets
    if (userConnections.size === 0) {
      this.connections.delete(userId);
    }

    // Clean up timers
    this.clearHeartbeat(connectionId);
    this.clearConnectionTimeout(connectionId);

    logger.info("SSE connection closed", {
      userId,
      connectionId,
      remainingConnections: this.getTotalConnectionCount(),
    });
  }

  /**
   * Get User Connections
   * 
   * Returns all active connections for a specific user.
   * 
   * @param {string} userId - User ID
   * @returns {Set<SSEConnection>} User's connections
   */
  private getUserConnections(userId: string): Set<SSEConnection> {
    return this.connections.get(userId) || new Set();
  }

  // ==========================================================================
  // EVENT BROADCASTING
  // ==========================================================================

  /**
   * Broadcast to User
   * 
   * Sends an event to all connections of a specific user.
   * 
   * @param {string} userId - User ID to broadcast to
   * @param {SSEEvent} event - Event to send
   * 
   * @example
   * sseManager.broadcastToUser(userId, {
   *   type: "referral_updated",
   *   timestamp: new Date().toISOString(),
   *   data: { count: 5 }
   * });
   */
  broadcastToUser(userId: string, event: SSEEvent<any>): void {
    const userConnections = this.getUserConnections(userId);

    if (userConnections.size === 0) {
      logger.debug("No active connections for user", { userId, eventType: event.type });
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const connection of userConnections) {
      try {
        this.sendEvent(connection, event);
        successCount++;
      } catch (error) {
        failureCount++;
        logger.error("Failed to send SSE event", {
          error,
          userId,
          connectionId: connection.id,
          eventType: event.type,
        });
        // Remove failed connection
        this.removeConnection(userId, connection.id);
      }
    }

    logger.info("Broadcasted event to user", {
      userId,
      eventType: event.type,
      successCount,
      failureCount,
    });
  }

  /**
   * Send Referral Updated Event
   * 
   * Notifies user that their referral count has changed.
   * 
   * @param {string} userId - User ID
   * @param {number} previousCount - Previous referral count
   * @param {number} newCount - New referral count
   */
  sendReferralUpdated(userId: string, previousCount: number, newCount: number): void {
    const previousTier = calculateTier(previousCount);
    const newTier = calculateTier(newCount);

    const event: SSEEvent<ReferralCreditedEventData> = {
      type: "referral_updated",
      timestamp: new Date().toISOString(),
      data: {
        actualReferralCount: newCount,  // REQUIRED
        displayReferralCount: Math.min(newCount, 10),  // REQUIRED
        tier: newTier,  // REQUIRED
        previousCount,  // Optional
        newCount,  // Optional
        displayCount: Math.min(newCount, 10),  // Optional
      },
    };

    this.broadcastToUser(userId, event);

    // Check for tier upgrade
    if (newTier !== previousTier) {
      this.sendTierUpgraded(userId, previousTier, newTier, newCount);
    }

    // Check for milestone
    const milestone = getMilestoneReached(previousCount, newCount);
    if (milestone) {
      this.sendMilestoneReached(userId, milestone, newCount);
    }
  }

  /**
   * Send Tier Upgraded Event
   * 
   * Notifies user of tier upgrade with congratulations.
   * 
   * @param {string} userId - User ID
   * @param {string} previousTier - Previous tier
   * @param {string} newTier - New tier
   * @param {number} referralCount - Current referral count
   */
  private sendTierUpgraded(
    userId: string,
    previousTier: TierType,
    newTier: TierType,
    referralCount: number
  ): void {
    const tierInfo = getTierInfo(newTier as any);

    const event: SSEEvent<TierUpgradedEventData> = {
      type: "tier_upgraded",
      timestamp: new Date().toISOString(),
      data: {
        previousTier,
        newTier,
        newTierLabel: tierInfo.label,
        referralCount,
        message: `Congratulations! You've reached ${tierInfo.label}!`,
      },
    };

    this.broadcastToUser(userId, event);

    logger.info("Tier upgraded", {
      userId,
      previousTier,
      newTier,
      referralCount,
    });
  }

  /**
   * Send Milestone Reached Event
   * 
   * Notifies user when they hit a special milestone.
   * 
   * @param {string} userId - User ID
   * @param {number} milestone - Milestone reached (3, 5, 10, etc.)
   * @param {number} totalReferrals - Total referral count
   */
  private sendMilestoneReached(
    userId: string,
    milestone: number,
    totalReferrals: number
  ): void {
    const event: SSEEvent<MilestoneReachedEventData> = {
      type: "milestone_reached",
      timestamp: new Date().toISOString(),
      data: {
        milestone,
        referralCount: totalReferrals, 
        totalReferrals, 
        message: `Amazing! You've reached ${milestone} referrals!`,
      },
    };

    this.broadcastToUser(userId, event);

    logger.info("Milestone reached", {
      userId,
      milestone,
      totalReferrals,
    });
  }

  // ==========================================================================
  // LOW-LEVEL EVENT SENDING
  // ==========================================================================

  /**
   * Send Event to Connection
   * 
   * Sends an SSE event to a specific connection.
   * Updates last activity timestamp.
   * 
   * @param {SSEConnection} connection - Connection to send to
   * @param {SSEEvent} event - Event to send
   */
  private sendEvent(connection: SSEConnection, event: SSEEvent<any>): void {
    const { response } = connection;

    // Format SSE message
    const eventData = JSON.stringify(event);
    response.write(`event: ${event.type}\n`);
    response.write(`data: ${eventData}\n\n`);

    // Update last activity
    connection.lastActivity = new Date();

    // Reset connection timeout
    this.resetConnectionTimeout(connection);
  }

  /**
   * Send Heartbeat
   * 
   * Sends a keep-alive comment to prevent connection timeout.
   * 
   * @param {SSEConnection} connection - Connection to send heartbeat to
   */
  private sendHeartbeat(connection: SSEConnection): void {
    try {
      connection.response.write(`: heartbeat ${Date.now()}\n\n`);
      connection.lastActivity = new Date();
      this.resetConnectionTimeout(connection);
    } catch (error) {
      logger.warn("Heartbeat failed, removing connection", {
        userId: connection.userId,
        connectionId: connection.id,
        error,
      });
      this.removeConnection(connection.userId, connection.id);
    }
  }

  // ==========================================================================
  // TIMER MANAGEMENT
  // ==========================================================================

  /**
   * Start Heartbeat
   * 
   * Starts periodic heartbeat for a connection.
   * 
   * @param {SSEConnection} connection - Connection to start heartbeat for
   */
  private startHeartbeat(connection: SSEConnection): void {
    const interval = setInterval(() => {
      this.sendHeartbeat(connection);
    }, HEARTBEAT_INTERVAL);

    this.heartbeatIntervals.set(connection.id, interval);
  }

  /**
   * Clear Heartbeat
   * 
   * Stops heartbeat for a connection.
   * 
   * @param {string} connectionId - Connection ID
   */
  private clearHeartbeat(connectionId: string): void {
    const interval = this.heartbeatIntervals.get(connectionId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(connectionId);
    }
  }

  /**
   * Reset Connection Timeout
   * 
   * Resets the inactivity timeout for a connection.
   * 
   * @param {SSEConnection} connection - Connection to reset timeout for
   */
  private resetConnectionTimeout(connection: SSEConnection): void {
    // Clear existing timeout
    this.clearConnectionTimeout(connection.id);

    // Set new timeout
    const timeout = setTimeout(() => {
      logger.info("Connection timed out due to inactivity", {
        userId: connection.userId,
        connectionId: connection.id,
        lastActivity: connection.lastActivity,
      });
      this.removeConnection(connection.userId, connection.id);
      connection.response.end();
    }, CONNECTION_TIMEOUT);

    this.connectionTimeouts.set(connection.id, timeout);
  }

  /**
   * Clear Connection Timeout
   * 
   * Clears the inactivity timeout for a connection.
   * 
   * @param {string} connectionId - Connection ID
   */
  private clearConnectionTimeout(connectionId: string): void {
    const timeout = this.connectionTimeouts.get(connectionId);
    if (timeout) {
      clearTimeout(timeout);
      this.connectionTimeouts.delete(connectionId);
    }
  }

  // ==========================================================================
  // STATISTICS & MONITORING
  // ==========================================================================

  /**
   * Get Total Connection Count
   * 
   * Returns total number of active SSE connections.
   * 
   * @returns {number} Total connection count
   */
  getTotalConnectionCount(): number {
    let count = 0;
    for (const userConnections of this.connections.values()) {
      count += userConnections.size;
    }
    return count;
  }

  /**
   * Get User Connection Count
   * 
   * Returns number of active connections for a specific user.
   * 
   * @param {string} userId - User ID
   * @returns {number} User connection count
   */
  getUserConnectionCount(userId: string): number {
    return this.getUserConnections(userId).size;
  }

  /**
   * Get Active Users Count
   * 
   * Returns number of users with at least one active connection.
   * 
   * @returns {number} Active users count
   */
  getActiveUsersCount(): number {
    return this.connections.size;
  }

  /**
   * Get Connection Stats
   * 
   * Returns comprehensive connection statistics.
   * 
   * @returns {object} Connection statistics
   */
  getConnectionStats() {
    return {
      totalConnections: this.getTotalConnectionCount(),
      activeUsers: this.getActiveUsersCount(),
      heartbeatIntervals: this.heartbeatIntervals.size,
      connectionTimeouts: this.connectionTimeouts.size,
    };
  }

  /**
   * Close All Connections
   * 
   * Closes all active SSE connections.
   * Used during server shutdown.
   */
  closeAllConnections(): void {
    logger.info("Closing all SSE connections", {
      totalConnections: this.getTotalConnectionCount(),
    });

    for (const [userId, userConnections] of this.connections.entries()) {
      for (const connection of userConnections) {
        try {
          connection.response.end();
          this.removeConnection(userId, connection.id);
        } catch (error) {
          logger.error("Error closing connection", { error, userId, connectionId: connection.id });
        }
      }
    }

    this.connections.clear();
    this.heartbeatIntervals.clear();
    this.connectionTimeouts.clear();

    logger.info("All SSE connections closed");
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global SSEManager Instance
 * Singleton pattern for single-server deployment
 */
export const sseManager = new SSEManager();