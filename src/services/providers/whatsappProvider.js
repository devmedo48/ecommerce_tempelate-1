import { logger } from "../../utils/logger.js";

/**
 * Sends a WhatsApp message using the configured provider.
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<boolean>} - True if successful
 */
export async function sendWhatsApp(to, message) {
  try {
    // TODO: Integrate with Meta Cloud API / Twilio
    logger.info(`[WhatsAppProvider] Sending to ${to}: ${message}`);

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return true;
  } catch (error) {
    logger.error(`[WhatsAppProvider] Error sending to ${to}:`, error);
    throw error;
  }
}
