import { join as joinPath} from "path"

import express, { static as staticAssets, Express } from "express"
import { configure as configureNunjucks } from "nunjucks"

export class App {
    private static readonly ROOT_PATH = joinPath(__dirname, '/../')
    // URL path to file system path mappings
    private static readonly STATIC_RESOURCES = {
        assets: "dist/govuk-frontend/assets",
        "govuk-frontend": "dist/govuk-frontend",
        html5shiv: "node_modules/html5shiv/dist"
    }
    private static readonly NUNJUCK_TEMPLATES = [
        "dist/govuk-frontend/",
        "dist/govuk-frontend/components/",
        "views"
    ]

    private readonly expressApp: Express;

    public constructor(private readonly port: number) {
        this.expressApp = express()
    }

    public async run() {
        this.configureStaticResources()
        configureNunjucks(App.NUNJUCK_TEMPLATES, { autoescape: true, express: this.expressApp })

        this.expressApp.get("/", (_, res) => res.render("index.njk"))

        await this.startExpressApp()
    }

    private configureStaticResources() {
        for (let urlPath in App.STATIC_RESOURCES) {
            let directoryPath = App.STATIC_RESOURCES[urlPath]

            this.expressApp.use(
                `/${urlPath}`,
                staticAssets(joinPath(App.ROOT_PATH, `/${directoryPath}`))
            )
        }
    }

    private async startExpressApp() {
        await new Promise((resolve, reject) => {
            try {
                this.expressApp.listen(this.port, resolve)
            } catch (ex) {
                reject(ex)
            }
        });

        console.log(`Listening on http://localhost:${this.port}`)
    }
}
