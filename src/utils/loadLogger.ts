import {
  config as winstonConfig,
  createLogger,
  format,
  transports,
  Logger
} from "winston"
import * as Transport from "winston-transport"

import { AppConfig } from "../model/AppConfig"
import { LogAppender } from "../model/LogAppender"
import { LoggingConfig } from "../model/LoggingConfig"

const DEFAULT_LOG_PATH = "./logs"
const ENV = process.env
const NUM_BYTES_IN_MEGABYTE = 1000000

function buildLogger(loggingConfig: LoggingConfig, logTransports: Transport[]) {
  return createLogger({
    format: format.combine(
      format.timestamp(),
      format.printf(({ level, message, timestamp }) =>
        (loggingConfig.pattern || "${timestamp} ${level} ${message}")
          .toLowerCase()
          .replace("${timestamp}", timestamp)
          .replace("${level}", level.toUpperCase().padEnd(7, " "))
          .replace("${message}", message)
      )
    ),
    levels: winstonConfig.npm.levels,
    transports: logTransports
  })
}

function buildLogTransport(config: LoggingConfig, appender: LogAppender) {
  let appenderType = appender.type.toLowerCase()
  let configLevel = (config.level || "info").toLowerCase()

  if (appenderType === "console") {
    return new transports.Console({
      level: appender.level || configLevel
    })
  } else if (appenderType === "file") {
    if (!appender.filename || !appender.maxBackups || !appender.maxSizeInMb) {
      throw new Error(
        "File log appenders must provide these fields: `filename`, `maxBackups` and `maxSizeInMb`"
      )
    }

    let filename = appender.filename.replace(
      "${LOG_PATH}",
      ENV.LOG_PATH || DEFAULT_LOG_PATH
    )

    return new transports.File({
      filename,
      level: appender.level || configLevel,
      maxFiles: appender.maxBackups,
      maxsize: appender.maxSizeInMb * NUM_BYTES_IN_MEGABYTE,
      tailable: true,
      zippedArchive: true
    })
  }

  throw new Error(`Unknown log appender type: ${appender.type}`)
}

export function loadLogger(appConfig: AppConfig): Logger {
  let loggingConfig = appConfig.logging
  let logTransports = loggingConfig.appenders
    .filter(a => a.type && typeof a.type === "string")
    .map(a => buildLogTransport(loggingConfig, a))

  return buildLogger(loggingConfig, logTransports)
}
