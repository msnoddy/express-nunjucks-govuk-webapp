import { join as joinPath} from "path"

import express, { static as staticAssets, Express, Request, Response, RequestHandler } from "express"
import { configure as configureNunjucks } from "nunjucks"

import { IRoute } from "./interfaces/IRoute"
import { AppConfig } from "./model/AppConfig"
import { HttpMethod } from "./model/Routes"
import { DynamicRoute } from "./utils/DynamicRoute"

/**
 * Configurable wrapper around express and nunjucks. Providing
 * an instance of `AppConfig` will instruct this class to wire
 * up routes to static resources, code and templates.
 */
export class App {
    private static readonly ROOT_PATH = joinPath(__dirname, "/../")

    private readonly expressApp: Express

    public constructor(
        private readonly config: AppConfig,
        private readonly port: number
    ) {
        this.expressApp = express()
    }

    public async run() {
        configureNunjucks(
            this.config.nunjuckTemplatePaths, 
            { 
                autoescape: true,
                express: this.expressApp
            }
        )

        console.log(`Configured nunjuck paths: ${JSON.stringify(this.config.nunjuckTemplatePaths)}`)

        await this.configureRoutes()
        this.configureStaticRoutes()

        await this.startExpressApp()
    }

    /**
     * Wire up routes by generating route handler builders using
     * configured classes, which are used by `handleRoute` when express
     * handles the route.
     */
    private async configureRoutes() {
        let routes = this.config.routes

        for (let route in routes) {
            for (let method in routes[route]) {
                let httpMethod = method as HttpMethod
                let routeInfo = routes[route][method]
                let dynamicRoute = new DynamicRoute(route, httpMethod, routeInfo)

                if (!dynamicRoute.hasHandler && !dynamicRoute.hasTemplate) {
                    throw new Error(`Route: '[${method}] ${route}' has no template or handler class specified`)
                }

                await dynamicRoute.generateRouteHandlerBuilder()

                let expressRequestHandler: RequestHandler = async (req, res) => 
                    await this.handleRoute(dynamicRoute, req, res)

                this.configureExpressRoute(route, httpMethod, expressRequestHandler)

                console.log(
                    `Configured route: [${method}] ${route} => ` +
                    (dynamicRoute.hasHandler ? ` class: '${routeInfo.class}'` : "") +
                    (dynamicRoute.hasTemplate ? ` template: '${routeInfo.template}'` : "")
                )
            }
        }
    }

    /**
     * Handle the given route using the route class
     * provided by `routeHandlerBuilder` (if present)
     * and render a nunjucks template (if present).
     */
    private async handleRoute(route: DynamicRoute, req: Request, res: Response) {
        try {
            let model = {}

            if (route.hasHandler) {
                // build and call handler if present
                let handler: IRoute = route.handlerBuilder()

                model = await handler.handleRequest(req, res)
            }

            if (route.hasTemplate) {
                // populate template if present
                await this.renderTemplate(route.routeInfo.template, model, res)
            }
        } catch (ex) {
            console.error(
                `Error handling route '[${route.method}] ${route}'` +
                (route.hasHandler ? `, using class '${route.routeInfo.class}'` : "") +
                (route.hasTemplate ? `, using template ${route.routeInfo.template}` : "")
            )

            console.error(ex)

            // TODO: error page?
            res.status(500)
        }
    }

    /**
     * Render a nunjucks template with the given model, and
     * write the output HTML to the express response; includes
     * async error handling. 
     */
    private async renderTemplate(template: string, model: any, res: Response) {
        await new Promise((resolve, reject) => {
            res.render(`${template}.njk`, model, (err, html) => {
                if (err) {
                    reject(err)
                    return
                }

                // replicate nunjucks default behaviour
                res.status(200)
                    .contentType("text/html")
                    .send(html)

                resolve()
            })
        })
    }

    private configureExpressRoute(route: string, httpMethod: string, expressRequestHandler: RequestHandler) {
        if (httpMethod === "GET") {
            this.expressApp.get(route, expressRequestHandler)
        } else if (httpMethod === "POST") {
            this.expressApp.post(route, expressRequestHandler)
        } else if (httpMethod === "PUT") {
            this.expressApp.put(route, expressRequestHandler)
        } else if (httpMethod === "DELETE") {
            this.expressApp.delete(route, expressRequestHandler)
        } else {
            throw new Error(`Invalid HTTP method '${httpMethod}' used in route '${route}'`)
        }
    }

    /**
     * Configure static routes for javascript, css, images etc.
     */
    private configureStaticRoutes() {
        let staticRoutes = this.config.staticRoutes

        for (let route in staticRoutes) {
            let directoryPath = staticRoutes[route]
            let absolutePath = joinPath(App.ROOT_PATH, `/${directoryPath}`)

            this.expressApp.use(`/${route}`, staticAssets(absolutePath))

            console.log(`Configured static route: /${route} => ${directoryPath}`)
        }
    }

    private async startExpressApp() {
        await new Promise((resolve, reject) => {
            try {
                this.expressApp.listen(this.port, resolve)
            } catch (ex) {
                reject(ex)
            }
        })

        console.log(`Listening on http://localhost:${this.port}`)
    }
}
