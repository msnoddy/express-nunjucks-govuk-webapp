import { Request, Response } from "express"

import { IRoute } from "../interfaces/IRoute"

export class IndexRoute implements IRoute {
    public async handleRequest(req: Request, res: Response) {
        let requestUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`

        console.log(
            `Processing request for ${requestUrl} from ${res.connection.remoteAddress}:${res.connection.remotePort}`
        )

        return {
            greeting: "express-nunjucks-govuk-webapp"
        }
    }
}
