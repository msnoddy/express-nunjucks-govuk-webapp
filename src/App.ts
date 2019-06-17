import { join as joinPath} from "path"

import express, { static as staticAssets, Express, Request, Response, RequestHandler } from "express"
import { configure as configureNunjucks } from "nunjucks"

import { IRoute } from "./interfaces/IRoute"
import { AppConfig } from "./model/AppConfig"
import { RouteInfo } from "./model/RouteInfo"
import { HttpMethod } from './model/Routes';

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

        this.configureRoutes()
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
                let routeHandlerBuilder = await this.generateRouteHandlerBuilder(route, routeInfo)

                let expressRequestHandler: RequestHandler = async (req, res) => 
                    await this.handleRoute(
                        route, 
                        method,
                        routeInfo, 
                        routeHandlerBuilder,
                        req,
                        res
                    )

                this.configureExpressRoute(route, httpMethod, expressRequestHandler)

                console.log(`Configured route: [${method}] ${route} => ${routeInfo.class}`)
            }
        }
    }

    /**
     * Dynamically import a route handler class and return
     * a builder function that generates instances of type
     * `IRoute`.
     */
    private async generateRouteHandlerBuilder(route: string, routeInfo: RouteInfo): Promise<() => IRoute> {
        if (!routeInfo || !routeInfo.class || routeInfo.class.trim() === "") {
            throw new Error(`Class for route '${route}' is null or blank`)
        }

        try {
            let handlerClassImport = await import(`./routes/${routeInfo.class}`)
            let handlerClass = handlerClassImport[routeInfo.class]

            return () => new handlerClass()
        } catch (ex) {
            throw new Error(`Handler for route '${route}' was not found, expected path: ${__dirname}/routes/${routeInfo.class}.js`)
        }
    }

    /**
     * Handle the given route using the route class
     * provided by `routeHandlerBuilder` and render
     * a nunjucks template if configured.
     */
    private async handleRoute(
        route: string,
        method: string,
        routeInfo: RouteInfo,
        routeHandlerBuilder: () => IRoute,
        req: Request,
        res: Response
    ) {
        let routeHasTemplate = routeInfo.template && routeInfo.template.trim() !== ""

        try {
            let handler: IRoute = routeHandlerBuilder()
            let model = await handler.handleRequest(req, res)

            if (routeHasTemplate) {
                await this.renderTemplate(routeInfo.template, model, res)
            }
        } catch (ex) {
            console.error(`Error handling route '[${method}] ${route}' using class '${routeInfo.class}'${routeHasTemplate ? ` and template ${routeInfo.template}` : ""}`)
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
