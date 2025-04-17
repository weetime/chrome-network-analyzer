/**
 * AI-Connector - Main entry point (for backward compatibility)
 */

// Import the modular version
import { AiConnectorManager } from './modules/ai/ai-connector-manager.js';

// Re-export as AiConnector for backward compatibility
export const AiConnector = AiConnectorManager;
