import { LoggingConfig } from "./LoggingConfig"
import { Routes } from "./Routes"

export class AppConfig {
  public logging: LoggingConfig
  public routes: Routes
  public staticRoutes: { [url: string]: string }
  public templatePaths: string[]
}
