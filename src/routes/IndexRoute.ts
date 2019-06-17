import { Request, Response } from "express"

import { IRoute } from "../interfaces/IRoute"

export class IndexRoute implements IRoute {
    public async handleRequest(req: Request, res: Response) {
        return {
            greeting: "express-nunjucks-govuk-webapp"
        }
    }
}
