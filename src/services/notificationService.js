import prisma from "../config/database.js";
import { logger } from "../utils/logger.js";
import { sendEmail } from "./providers/emailProvider.js";
import { sendSMS } from "./providers/smsProvider.js";
import { sendWhatsApp } from "./providers/whatsappProvider.js";

// Map channels to providers
const providers = {
  EMAIL: sendEmail,
  SMS: sendSMS,
  WHATSAPP: sendWhatsApp,
  // PUSH: sendPushNotification // To be implemented later
};

/**
 * Adds a notification to the database queue.
 * @param {string} channel - EMAIL, SMS, WHATSAPP, PUSH
 * @param {string} recipient - Email or Phone
 * @param {string} content - Message body
 * @param {string} [subject] - Optional subject (for email)
 * @param {object} [metadata] - Optional metadata
 */
export async function addToQueue(
  channel,
  recipient,
  content,
  subject = null,
  metadata = {}
) {
  try {
    await prisma.notificationJob.create({
      data: {
        channel,
        recipient,
        content,
        subject,
        metadata,
        status: "PENDING",
      },
    });
    logger.info(`[Notification] Queued ${channel} for ${recipient}`);
  } catch (error) {
    logger.error(`[Notification] Failed to queue job:`, error);
    // Don't throw for now to avoid breaking main flow, but ideally should alert
  }
}

/**
 * Processes pending notification jobs from the database.
 * Designed to be called by a cron job or interval.
 */
export async function processQueue() {
  const jobs = await prisma.notificationJob.findMany({
    where: { status: "PENDING" },
    take: 10, // Process batch of 10
    orderBy: { createdAt: "asc" },
  });

  if (jobs.length === 0) return;

  logger.info(`[Notification] Processing ${jobs.length} jobs...`);

  for (const job of jobs) {
    try {
      // Mark as PROCESSING
      await prisma.notificationJob.update({
        where: { id: job.id },
        data: { status: "PROCESSING" },
      });

      const provider = providers[job.channel];
      if (provider) {
        if (job.channel === "EMAIL") {
          await provider(job.recipient, job.subject, job.content);
        } else {
          await provider(job.recipient, job.content);
        }

        // Mark as COMPLETED
        await prisma.notificationJob.update({
          where: { id: job.id },
          data: { status: "COMPLETED", processedAt: new Date() },
        });
      } else {
        throw new Error(`No provider for channel ${job.channel}`);
      }
    } catch (error) {
      logger.error(`[Notification] Job ${job.id} failed:`, error);

      // Update with FAILED status and error message
      await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: error.message,
          attempts: { increment: 1 },
        },
      });
    }
  }
}

// Start polling (simple interval for now, replace with true cron later)
// Only run if not in test mode
if (process.env.NODE_ENV !== "test") {
  setInterval(processQueue, 10000); // Check every 10 seconds
}

// Wrappers for backward compatibility / convenience
export const sendOTP = async (phone, otp) => {
  // Try WhatsApp first, maybe fallback to SMS?
  // For now, let's use SMS for OTP as it's more standard
  // Or usage: addToQueue('SMS', phone, `Your OTP is ${otp}`);
  await addToQueue("SMS", phone, `Your verification code is ${otp}`);
};

export const sendWelcomeEmail = async (email, name) => {
  await addToQueue(
    "EMAIL",
    email,
    `Hi ${name}, welcome to our store!`,
    "Welcome!"
  );
};
