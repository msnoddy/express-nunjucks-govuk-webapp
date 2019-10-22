import { Container } from "inversify"
import { Logger } from "winston"

import { AppTypes } from "./AppTypes"

export class AppContainer extends Container {
  public constructor() {
    super({
      autoBindInjectable: true
    })
  }

  public configure(logger: Logger) {
    this.bind<Logger>(AppTypes.Logger).toConstantValue(logger)
  }
}
