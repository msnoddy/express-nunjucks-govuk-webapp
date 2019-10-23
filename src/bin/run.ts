#! /usr/bin/env node
import "reflect-metadata"             // required for inversify to work
import "source-map-support/register"  // provides ts file lines in stack traces

import { readFileSync } from "fs"

import { App } from "../App"
import { AppConfig } from "../model/AppConfig"
import { LoggerFactory } from "../utils/LoggerFactory"

const ENV = process.env

const DEFAULT_CONFIG_PATH = "config.json"
const DEFAULT_PORT = 8080

// tslint:disable: no-console
function errorAndExit(message: string, ex: Error) {
  console.error(message)
  console.error(ex)

  process.exit(1)
}

function resolvePort() {
  let portAsString = `${DEFAULT_PORT}`

  try {
    portAsString = ENV.EXPRESS_PORT || portAsString

    let port = parseInt(portAsString, 10)

    if (isNaN(port) || port < 0 || port > 65535) {
      throw new Error(`Invalid port number '${port}'`)
    }

    return port
  } catch (ex) {
    errorAndExit(
      "Unable to parse express port from environment variable 'EXPRESS_PORT'",
      ex
    )
  }
}

function resolveConfig() {
  let configPath = DEFAULT_CONFIG_PATH

  try {
    configPath = ENV.APP_CONFIG || configPath

    let configJson = readFileSync(configPath).toString()

    return JSON.parse(configJson) as AppConfig
  } catch (ex) {
    errorAndExit(`Unable to load config from file '${configPath}':`, ex)
  }
}

async function main() {
  let config = resolveConfig()
  let app = new App(
    config,
    resolvePort(),
    LoggerFactory.loadLogger(config)
  )

  await app.run()
}

(async () => main())()
