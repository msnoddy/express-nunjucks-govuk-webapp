import { readFileSync } from "fs"

import { App } from "./App"
import { AppConfig } from './model/AppConfig';

let configPath = process.env["APP_CONFIG"] || "config.json";
let portAsString = process.env["EXPRESS_PORT"] || "8080";

(async () => {
    let configJson = readFileSync(configPath).toString()
    let config: AppConfig = JSON.parse(configJson) 

    let port = parseInt(portAsString)

    let app = new App(config, port)

    await app.run()
})()
