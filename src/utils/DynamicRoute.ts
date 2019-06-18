import { join as joinPath} from "path"

import { IRoute } from "../interfaces/IRoute"
import { RouteInfo } from "../model/RouteInfo"
import { HttpMethod } from "../model/Routes"

export type RouteHandlerBuilder = () => IRoute

/**
 * Wrapper around a route info object that provides
 * calculated metadata and can produce a builder that
 * constructs instances of the target handler class.
 */
export class DynamicRoute {
    private static readonly ROUTES_PATH = joinPath(__dirname, "/../../dist/routes")

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
        public readonly route: string, 
        public readonly method: HttpMethod, 
        public readonly routeInfo: RouteInfo
    ) {
    }

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
            let handlerClassImport = await import(`${DynamicRoute.ROUTES_PATH}/${this.routeInfo.class}`)
            let handlerClass = handlerClassImport[this.routeInfo.class]

            this._handlerBuilder = () => new handlerClass()
        } catch (ex) {
            throw new Error(
                `Handler for route '${this.route}' was not found, expected path: ` +
                `${DynamicRoute.ROUTES_PATH}/${this.routeInfo.class}.js`
            )
        }
    }
}
