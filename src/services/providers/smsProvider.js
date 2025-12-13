import { logger } from "../../utils/logger.js";

/**
 * Sends an SMS using the configured provider.
 * @param {string} to - Recipient phone number
 * @param {string} message - SMS content
 * @returns {Promise<boolean>} - True if successful
 */
export async function sendSMS(to, message) {
  try {
    // TODO: Integrate with Twilio / Infobip
    logger.info(`[SMSProvider] Sending to ${to}: ${message}`);

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return true;
  } catch (error) {
    logger.error(`[SMSProvider] Error sending to ${to}:`, error);
    throw error;
  }
}
