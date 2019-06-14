import { join as joinPath} from "path"

import express, { static as staticAssets, Express } from "express"
import { configure as configureNunjucks } from "nunjucks"

export class App {
    private static readonly ROOT_PATH = joinPath(__dirname, '/../')
    private static readonly STATIC_RESOURCES = {
        assets: "govuk-frontend/assets",
        "govuk-frontend": "govuk-frontend",
        html5shiv: "html5shiv/dist"
    }
    private static readonly NUNJUCK_TEMPLATES = [
        "node_modules/govuk-frontend/",
        "node_modules/govuk-frontend/components/",
        "views"
    ]

    public static run(port: number) {
        let expressApp = express()

        App.configureStaticResources(expressApp)

        configureNunjucks(App.NUNJUCK_TEMPLATES, { autoescape: true, express: expressApp})

        expressApp.get("/", (_, res) => res.render("index.njk"))

        expressApp.listen(port, () => console.log(`Listening on http://localhost:${port}`))
    }

    private static configureStaticResources(expressApp: Express) {
        for (let path in App.STATIC_RESOURCES) {
            expressApp.use(
                `/${path}`,
                staticAssets(joinPath(App.ROOT_PATH, `/node_modules/${App.STATIC_RESOURCES[path]}`))
            )
        }
    }
}
