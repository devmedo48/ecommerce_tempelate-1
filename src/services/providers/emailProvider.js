import { logger } from "../../utils/logger.js";

/**
 * Sends an email using the configured provider.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 * @returns {Promise<boolean>} - True if successful
 */
export async function sendEmail(to, subject, html) {
  try {
    // TODO: Integrate with SendGrid / Resend / Nodemailer
    logger.info(`[EmailProvider] Sending to ${to}: ${subject}`);
    logger.debug(`[EmailProvider] Content: ${html.substring(0, 50)}...`);

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return true;
  } catch (error) {
    logger.error(`[EmailProvider] Error sending to ${to}:`, error);
    throw error;
  }
}
