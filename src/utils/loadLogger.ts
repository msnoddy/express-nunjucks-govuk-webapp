import { readFileSync } from "fs"

import { config as winstonConfig, createLogger, format, transports, config, Logger } from 'winston';
import * as Transport from "winston-transport"

import { errorAndExit } from "./errorAndExit"
import { LoggingConfig } from "../model/LoggingConfig"
import { LogAppender } from "../model/LogAppender"

const DEFAULT_LOG_PATH = "./logs";
const ENV = process.env
const NUM_BYTES_IN_MEGABYTE = 1000000;

function buildLogger(loggingConfig: LoggingConfig, transports: Transport[]) {
    return createLogger({
        levels: winstonConfig.npm.levels,
        format: format.combine(
          format.timestamp(),
          format.printf(({ level, message, timestamp }) =>
            loggingConfig.pattern
                .toLowerCase()
                .replace("${timestamp}", timestamp)
                .replace("${level}", level.toUpperCase().padEnd(7, " "))
                .replace("${message}", message)
          )
        ),
        transports
    });
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
            throw new Error("File log appenders must provide these fields: `filename`, `maxBackups` and `maxSizeInMb`")
        }

        let filename = appender.filename.replace("${LOG_PATH}", ENV.LOG_PATH || DEFAULT_LOG_PATH)

        return new transports.File({
            level: appender.level || configLevel,
            filename: filename,
            maxsize: appender.maxSizeInMb * NUM_BYTES_IN_MEGABYTE,
            maxFiles: appender.maxBackups,
            zippedArchive: true,
            tailable: true
        })
    }

    throw new Error(`Unknown log appender type: ${appender.type}`)
}

function loadLoggingConfig() {
    let configPath = "logging-config.json"

    try {
        configPath = ENV.APP_LOG_CONFIG || configPath

        let configJson = readFileSync(configPath).toString()

        return JSON.parse(configJson) as LoggingConfig
    } catch (ex) {
        errorAndExit(`Unable to load logging config from file '${configPath}':`, ex)
    }
}

export function loadLogger(): Logger {
    let loggingConfig = loadLoggingConfig()
    let transports = loggingConfig.appenders
        .filter(a => a.type && (typeof a.type === "string"))
        .map(a => buildLogTransport(loggingConfig, a))

    return buildLogger(loggingConfig, transports)
}
