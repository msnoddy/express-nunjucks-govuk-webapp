import { Request, Response } from "express"

export interface IRoute {
  handleRequest(req: Request, res: Response): Promise<Object | void>
}
