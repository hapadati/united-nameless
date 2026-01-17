// logger.js - Google Sheets Logging
import { google } from "googleapis";
import dotenv from 'dotenv';
dotenv.config();

let sheetsClient = null;
let isInitialized = false;

/**
 * Initialize Google Sheets client
 */
async function initializeSheets() {
  if (isInitialized) return true;

  try {
    const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "/etc/secrets/service-account.json";

    const auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    sheetsClient = google.sheets({ version: "v4", auth });
    isInitialized = true;
    console.log("✅ Google Sheets logger initialized");
    return true;
  } catch (err) {
    console.error("❌ Failed to initialize Google Sheets logger:", err.message);
    isInitialized = false;
    return false;
  }
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || "シート1";

/**
 * Log to Google Sheets
 * @param {Object} logData
 */
export async function logToSheets({
  serverId = "",
  userId = "",
  channelId = "",
  level = "INFO",
  timestamp = "",
  cmd = "",
  message = "",
}) {
  // Early return if SPREADSHEET_ID is not configured
  if (!SPREADSHEET_ID) {
    // 開発環境ではログ出力をスキップ
    return;
  }

  try {
    // Lazy initialization
    if (!isInitialized) {
      const success = await initializeSheets();
      if (!success) return; // Skip logging if init failed
    }

    const values = [[
      serverId,
      userId,
      channelId,
      level,
      timestamp || new Date().toISOString(),
      cmd,
      message,
    ]];

    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    console.log(`[LOGGED] ${level}: ${cmd} - ${message}`);
  } catch (err) {
    // ログ失敗してもBotは落ちない
    console.error("[Logger] Failed to write log to Sheets:", err.message);
  }
}

/**
 * Convenience logging functions
 */
export const logger = {
  info: (cmd, message, context = {}) => logToSheets({
    level: 'INFO',
    cmd,
    message,
    timestamp: new Date().toISOString(),
    ...context
  }),

  warn: (cmd, message, context = {}) => logToSheets({
    level: 'WARN',
    cmd,
    message,
    timestamp: new Date().toISOString(),
    ...context
  }),

  error: (cmd, message, context = {}) => logToSheets({
    level: 'ERROR',
    cmd,
    message,
    timestamp: new Date().toISOString(),
    ...context
  })
};
