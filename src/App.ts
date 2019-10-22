import { join as joinPath } from "path"

import express, {
  static as staticAssets,
  Express,
  Request,
  Response,
  RequestHandler
} from "express"
import { configure as configureNunjucks } from "nunjucks"
import { Logger } from "winston"

import { AppContainer } from "./AppContainer"
import { DynamicRoute } from "./DynamicRoute"
import { IRoute } from "./interfaces/IRoute"
import { AppConfig } from "./model/AppConfig"
import { HttpMethod } from "./model/Routes"

/**
 * Configurable wrapper around express and nunjucks. Providing
 * an instance of `AppConfig` will instruct this class to wire
 * up routes to static resources, code and templates.
 */
export class App {
  private static readonly ROOT_PATH = __dirname

  private readonly expressApp: Express
  private readonly container: AppContainer

  public constructor(
    private readonly config: AppConfig,
    private readonly port: number,
    private readonly logger: Logger
  ) {
    this.expressApp = express()
    this.container = new AppContainer()
  }

  public async run() {
    this.container.configure(this.logger)

    await this.configureRoutes()
    this.configureStaticRoutes()
    this.configureTemplates()

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
      if (!routes.hasOwnProperty(route)) {
        continue
      }

      for (let method in routes[route]) {
        if (!routes[route].hasOwnProperty(method)) {
          continue
        }

        this.configureRoute(route, method as HttpMethod)
      }
    }
  }

  private async configureRoute(route: string, method: HttpMethod) {
    let routeInfo = this.config.routes[route][method]

    let dynamicRoute = new DynamicRoute(
      this.container,
      route,
      method,
      routeInfo,
      this.logger
    )

    if (!dynamicRoute.hasHandler && !dynamicRoute.hasTemplate) {
      throw new Error(
        `Route: '[${method}] ${route}' has no template or handler class specified`
      )
    }

    await dynamicRoute.generateRouteHandlerBuilder()

    let expressRequestHandler: RequestHandler = async (req, res) =>
      await this.handleRoute(dynamicRoute, req, res)

    this.configureExpressRoute(route, method, expressRequestHandler)

    this.logger.info(
      `Configured route: [${method}] ${route} => ` +
        (dynamicRoute.hasHandler ? ` class: '${routeInfo.class}'` : "") +
        (dynamicRoute.hasTemplate
          ? ` template: '${routeInfo.template}'`
          : "")
    )
  }

  /**
   * Handle the given route using the route class
   * provided by `routeHandlerBuilder` (if present)
   * and render a nunjucks template (if present).
   */
  private async handleRoute(route: DynamicRoute, req: Request, res: Response) {
    try {
      let model: Object = {}

      if (route.hasHandler) {
        // build and call handler if present
        let handler: IRoute = route.handlerBuilder()

        model = (await handler.handleRequest(req, res)) || {}
      }

      if (route.hasTemplate) {
        // populate template if present
        await this.renderTemplate(route.routeInfo.template, model, res)
      }
    } catch (ex) {
      this.logger.error(
        `Error handling route '[${route.method}] ${route.route}'` +
          (route.hasHandler ? `, using class '${route.routeInfo.class}'` : "") +
          (route.hasTemplate
            ? `, using template '${route.routeInfo.template}'`
            : "") +
          `\n${ex.stack}`
      )

      // TODO: error page?
      res.status(500).send()
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

  private configureExpressRoute(
    route: string,
    httpMethod: string,
    expressRequestHandler: RequestHandler
  ) {
    if (httpMethod === "GET") {
      this.expressApp.get(route, expressRequestHandler)
    } else if (httpMethod === "POST") {
      this.expressApp.post(route, expressRequestHandler)
    } else if (httpMethod === "PUT") {
      this.expressApp.put(route, expressRequestHandler)
    } else if (httpMethod === "DELETE") {
      this.expressApp.delete(route, expressRequestHandler)
    } else {
      throw new Error(
        `Invalid HTTP method '${httpMethod}' used in route '${route}'`
      )
    }
  }

  /**
   * Configure static routes for javascript, css, images etc.
   */
  private configureStaticRoutes() {
    let staticRoutes = this.config.staticRoutes

    for (let route in staticRoutes) {
      if (!staticRoutes.hasOwnProperty(route)) {
        continue
      }

      let absolutePath = joinPath(App.ROOT_PATH, `/${staticRoutes[route]}`)

      this.expressApp.use(`/${route}`, staticAssets(absolutePath))

      this.logger.debug(
        `Configured static route: /${route} => ${absolutePath}`
      )
    }
  }

  private configureTemplates() {
    let absoluteTemplatePaths = this.config.templatePaths.map(p =>
      joinPath(App.ROOT_PATH, `/${p}`)
    )

    configureNunjucks(absoluteTemplatePaths, {
      autoescape: true,
      express: this.expressApp
    })

    this.logger.debug(
      `Configured nunjuck paths: ${JSON.stringify(absoluteTemplatePaths)}`
    )
  }

  private async startExpressApp() {
    await new Promise((resolve, reject) => {
      try {
        this.expressApp.listen(this.port, resolve)
      } catch (ex) {
        reject(ex)
      }
    })

    this.logger.info(`Listening on http://localhost:${this.port}`)
  }
}
