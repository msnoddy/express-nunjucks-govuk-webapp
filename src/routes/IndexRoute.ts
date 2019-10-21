import { Request, Response } from "express"
import { Logger } from "winston"

import { IRoute } from "../interfaces/IRoute"

export class IndexRoute implements IRoute {
    public constructor (
        private readonly logger: Logger
    ) {
    }

    public async handleRequest(req: Request, res: Response) {
        let requestUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`

        this.logger.info(
            `Processing request for ${requestUrl} from ${res.connection.remoteAddress}:${res.connection.remotePort}`
        )

        return {
            greeting: "express-nunjucks-govuk-webapp"
        }
    }
}
