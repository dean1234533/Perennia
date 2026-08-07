import * as logger from 'firebase-functions/logger'

/**
 * Structured logging wrapper. Cloud Logging captures these as JSON, so
 * downstream monitoring/alerting can filter on `event` without parsing text.
 *
 * IMPORTANT: never pass compatibility records, sheet rows, or matrix
 * contents through `data` — see redact() for the one place that's enforced.
 */

type LogData = Record<string, unknown>

/** Strips anything that looks like proprietary compatibility data before it hits a log line. */
function redact(data?: LogData): LogData | undefined {
  if (!data) return data
  const denylist = ['compatibilityMatrix', 'rows', 'sheetData', 'records']
  const clean: LogData = {}
  for (const [key, value] of Object.entries(data)) {
    clean[key] = denylist.includes(key) ? '[redacted]' : value
  }
  return clean
}

export const log = {
  info: (event: string, data?: LogData) => logger.info(event, redact(data)),
  warn: (event: string, data?: LogData) => logger.warn(event, redact(data)),
  error: (event: string, data?: LogData) => logger.error(event, redact(data)),
  debug: (event: string, data?: LogData) => logger.debug(event, redact(data)),
}
