import { App } from "./App"

let port = process.env["EXPRESS_PORT"] || "8080";

(async () => {
    let app = new App(parseInt(port))

    await app.run()
})()
