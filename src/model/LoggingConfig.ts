import { LogAppender } from "./LogAppender"

export class LoggingConfig {
  public level: string
  public pattern: string
  public appenders: LogAppender[]
}
