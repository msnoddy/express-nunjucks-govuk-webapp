import { readFileSync } from "fs"

import { App } from "./App"
import { AppConfig } from "./model/AppConfig"

function errorAndExit(message: string, ex: Error) {
    console.error(message)
    console.error(ex)

    process.exit(1)
}

function loadPort() {
    let portAsString =  "8080"

    try {
        portAsString = process.env["EXPRESS_PORT"] || portAsString

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
        configPath = process.env["APP_CONFIG"] || configPath

        let configJson = readFileSync(configPath).toString()

        return JSON.parse(configJson) as AppConfig
    } catch (ex) {
        errorAndExit(`Unable to load config from file '${configPath}':`, ex)
    }
}

async function main() {
    let app = new App(
        loadConfig(),
        loadPort()
    )

    await app.run()
}

(async () => main())()
