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

const ENV = process.env

/**
 * Builds winston logger instances by parsing the configuration
 * provided to generate log transports.
 */
export class LoggerFactory {
  private static readonly DEFAULT_LOG_LEVEL = "info"
  private static readonly DEFAULT_LOG_PATH = "./logs"
  private static readonly NUM_BYTES_IN_MEGABYTE = 1000000

  public constructor(
    private readonly config: LoggingConfig
  ) {}

  public build(): Logger {
    let logTransports = this.config.appenders
      .filter(a => a.type && typeof a.type === "string")
      .map(a => this.buildLogTransport(a))

    return this.buildLogger(logTransports)
  }

  private buildLogTransport(appender: LogAppender) {
    let appenderType = appender.type.toLowerCase()
    let defaultLogLevel = (this.config.level || LoggerFactory.DEFAULT_LOG_LEVEL).toLowerCase()

    if (appenderType === "console") {
      return new transports.Console({
        level: appender.level || defaultLogLevel
      })
    } else if (appenderType === "file") {
      return this.buildFileAppender(appender, defaultLogLevel)
    }

    throw new Error(`Unknown log appender type: ${appender.type}`)
  }

  private buildFileAppender(appender: LogAppender, defaultLogLevel: string) {
    if (!appender.filename || !appender.maxBackups || !appender.maxSizeInMb) {
      throw new Error(
        "File log appenders must provide these fields: `filename`, `maxBackups` and `maxSizeInMb`"
      )
    }

    let filename = appender.filename.replace(
      "${LOG_PATH}",
      ENV.LOG_PATH || LoggerFactory.DEFAULT_LOG_PATH
    )

    return new transports.File({
      filename,
      level: appender.level || defaultLogLevel,
      maxFiles: appender.maxBackups,
      maxsize: appender.maxSizeInMb * LoggerFactory.NUM_BYTES_IN_MEGABYTE,
      tailable: true,
      zippedArchive: true
    })
  }

  private buildLogger(logTransports: Transport[]) {
    let pattern = (this.config.pattern || "${timestamp} ${level} ${message}").toLowerCase()

    return createLogger({
      format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, timestamp }) =>
          this.logMessage(pattern, level, message, timestamp)
        )
      ),
      levels: winstonConfig.npm.levels,
      transports: logTransports
    })
  }

  private logMessage(pattern: string, level: string, message: string, timestamp: string) {
    return pattern.replace("${timestamp}", timestamp)
      .replace("${level}", level.toUpperCase().padEnd(7, " "))
      .replace("${message}", message)
  }

  public static loadLogger(appConfig: AppConfig): Logger {
    let factory = new LoggerFactory(appConfig.logging)

    return factory.build()
  }
}
