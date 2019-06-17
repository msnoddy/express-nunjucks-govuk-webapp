import { Routes } from "./Routes"

export class AppConfig {
    public nunjuckTemplatePaths: string[]
    public routes: Routes
    public staticRoutes: { [url: string]: string }
}
