/**
 * Moyasar Payment Service
 * Handles online payment processing via Moyasar gateway
 * Docs: https://docs.moyasar.com/
 */

import axios from "axios";

const MOYASAR_API_URL = "https://api.moyasar.com/v1";
const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET_KEY;

// Create axios instance with Moyasar auth
const moyasarClient = axios.create({
  baseURL: MOYASAR_API_URL,
  auth: {
    username: MOYASAR_SECRET_KEY,
    password: "",
  },
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Create a payment with Moyasar
 * @param {Object} params Payment parameters
 * @param {number} params.amount Amount in smallest currency unit (100 = 1 SAR)
 * @param {string} params.currency ISO-4217 currency code (default: SAR)
 * @param {string} params.description Payment description
 * @param {string} params.callbackUrl URL to redirect after payment
 * @param {Object} params.source Payment source (creditcard, applepay, stcpay)
 * @param {Object} params.metadata Additional metadata (orderId, etc.)
 * @returns {Promise<Object>} Moyasar payment response
 */
export const createPayment = async ({
  amount,
  currency = "SAR",
  description,
  callbackUrl,
  source,
  metadata = {},
}) => {
  try {
    const response = await moyasarClient.post("/payments", {
      amount,
      currency,
      description,
      callback_url: callbackUrl,
      source,
      metadata,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Moyasar create payment error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.message || "Payment creation failed",
      details: error.response?.data,
    };
  }
};

/**
 * Fetch payment details by ID
 * @param {string} paymentId Moyasar payment ID
 * @returns {Promise<Object>} Payment details
 */
export const getPayment = async (paymentId) => {
  try {
    const response = await moyasarClient.get(`/payments/${paymentId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Moyasar get payment error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch payment",
    };
  }
};

/**
 * Verify payment status and amount
 * @param {string} paymentId Moyasar payment ID
 * @param {number} expectedAmount Expected amount in smallest currency unit
 * @param {string} expectedCurrency Expected currency
 * @returns {Promise<Object>} Verification result
 */
export const verifyPayment = async (
  paymentId,
  expectedAmount,
  expectedCurrency = "SAR"
) => {
  const result = await getPayment(paymentId);

  if (!result.success) {
    return { verified: false, error: result.error };
  }

  const payment = result.data;

  // Check if payment is successful
  if (payment.status !== "paid") {
    return {
      verified: false,
      status: payment.status,
      error: `Payment status is ${payment.status}, expected paid`,
    };
  }

  // Verify amount matches
  if (payment.amount !== expectedAmount) {
    return {
      verified: false,
      error: `Amount mismatch: expected ${expectedAmount}, got ${payment.amount}`,
    };
  }

  // Verify currency matches
  if (payment.currency.toLowerCase() !== expectedCurrency.toLowerCase()) {
    return {
      verified: false,
      error: `Currency mismatch: expected ${expectedCurrency}, got ${payment.currency}`,
    };
  }

  return {
    verified: true,
    payment,
  };
};

/**
 * Refund a payment (full or partial)
 * @param {string} paymentId Moyasar payment ID
 * @param {number} amount Amount to refund (optional, defaults to full refund)
 * @returns {Promise<Object>} Refund result
 */
export const refundPayment = async (paymentId, amount = null) => {
  try {
    const payload = amount ? { amount } : {};
    const response = await moyasarClient.post(
      `/payments/${paymentId}/refund`,
      payload
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Moyasar refund error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.message || "Refund failed",
    };
  }
};

/**
 * Convert amount to smallest currency unit
 * @param {number} amount Amount in main currency unit
 * @param {string} currency Currency code
 * @returns {number} Amount in smallest unit
 */
export const toSmallestUnit = (amount, currency = "SAR") => {
  // Most currencies use 2 decimal places (100 subunits)
  // KWD, BHD, OMR use 3 decimal places (1000 subunits)
  // JPY uses 0 decimal places (1 subunit)
  const multipliers = {
    KWD: 1000,
    BHD: 1000,
    OMR: 1000,
    JPY: 1,
  };

  const multiplier = multipliers[currency.toUpperCase()] || 100;
  return Math.round(amount * multiplier);
};

/**
 * Check if payment requires 3DS redirect
 * @param {Object} payment Moyasar payment response
 * @returns {boolean}
 */
export const requiresRedirect = (payment) => {
  return payment.status === "initiated" && payment.source?.transaction_url;
};

export default {
  createPayment,
  getPayment,
  verifyPayment,
  refundPayment,
  toSmallestUnit,
  requiresRedirect,
};
