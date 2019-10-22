import { Request, Response } from "express"
import { inject, injectable } from "inversify"
import { Logger } from "winston"

import { AppTypes } from "../AppTypes"
import { IRoute } from "../interfaces/IRoute"

@injectable()
export class IndexRoute implements IRoute {
  public constructor(
    @inject(AppTypes.Logger) private readonly logger: Logger
  ) {}

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
