import { join as joinPath } from "path"

import { Container } from "inversify"
import { Logger } from "winston"

import { IRoute } from "./interfaces/IRoute"
import { RouteInfo } from "./model/RouteInfo"
import { HttpMethod } from "./model/Routes"

export type RouteHandlerBuilder = () => IRoute

/**
 * Wrapper around a route info object that provides
 * calculated metadata and can produce a builder that
 * constructs instances of the target handler class with
 * dependency injection
 */
export class DynamicRoute {
  private static readonly ROUTES_PATH = joinPath(__dirname, "/routes")

  private _handlerBuilder: RouteHandlerBuilder

  get hasHandler(): boolean {
    return this.routeInfo && this.routeInfo.class && this.routeInfo.class.trim() !== ""
  }

  get hasTemplate(): boolean {
    return this.routeInfo && this.routeInfo.template && this.routeInfo.template.trim() !== ""
  }

  get handlerBuilder(): RouteHandlerBuilder {
    return this._handlerBuilder
  }

  public constructor(
    private readonly container: Container,
    public readonly route: string,
    public readonly method: HttpMethod,
    public readonly routeInfo: RouteInfo,
    public readonly logger: Logger
  ) {}

  /**
   * Dynamically import a route handler class and return
   * a builder function that generates instances of type
   * `IRoute`.
   */
  public async generateRouteHandlerBuilder(): Promise<void> {
    if (!this.hasHandler) {
      // no class defined, no builder to generate
      return
    }

    try {
      // get the constructor for a handler class by importing it
      let handlerClassName = this.routeInfo.class
      let handlerClassImport = await import(`${DynamicRoute.ROUTES_PATH}/${handlerClassName}`)
      let handlerConstructor = handlerClassImport[handlerClassName].prototype.constructor

      // build an instance by passing the constructor to inversify for dependency injection
      this._handlerBuilder = () => this.container.get(handlerConstructor)
    } catch (ex) {
      throw new Error(`Error loading route '${this.route}'\n${ex.stack}`)
    }
  }
}
