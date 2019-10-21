import { readFileSync } from "fs"

import { App } from "./App"
import { AppConfig } from "./model/AppConfig"
import { errorAndExit } from "./utils/errorAndExit"
import { loadLogger } from "./utils/loadLogger"

const ENV = process.env

function loadPort() {
    let portAsString =  "8080"

    try {
        portAsString = ENV.EXPRESS_PORT || portAsString

        let port = parseInt(portAsString, 10)

        if (port === NaN || port < 1024 || port > 65535) {
            throw new Error(`Invalid port number '${port}'`)
        }

        return port
    } catch (ex) {
        errorAndExit("Unable to parse express port from environment variable 'EXPRESS_PORT'", ex)
    }
}

function loadConfig() {
    let configPath = "config.json"

    try {
        configPath = ENV.APP_CONFIG || configPath

        let configJson = readFileSync(configPath).toString()

        return JSON.parse(configJson) as AppConfig
    } catch (ex) {
        errorAndExit(`Unable to load config from file '${configPath}':`, ex)
    }
}

async function main() {
    let app = new App(
        loadConfig(),
        loadPort(),
        loadLogger()
    )

    await app.run()
}

(async () => main())()
