import { RouteInfo } from "./RouteInfo"

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export type Routes = { [method in HttpMethod]: RouteInfo }
