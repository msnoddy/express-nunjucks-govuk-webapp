import { App } from "./App"

let port = process.env["EXPRESS_PORT"] || "8080"

App.run(
    parseInt(port)
)
