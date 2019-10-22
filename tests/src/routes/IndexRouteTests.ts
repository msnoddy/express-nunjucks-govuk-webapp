import { Expect, Test, TestFixture } from "alsatian"
import { Response, Request } from "express"
import { Socket } from "net"
import { Substitute } from "@fluffy-spoon/substitute"
import { Logger } from "winston"

import { IndexRoute } from "../../../dist/routes/IndexRoute"

@TestFixture()
export class IndexRouteTests {
  @Test()
  public async when_handleRequest_called_then_greeting_is_returned() {
    let logger = Substitute.for<Logger>()
    let route = new IndexRoute(logger)

    let request = Substitute.for<Request>()
    let response = Substitute.for<Response>()
    let socket = Substitute.for<Socket>()
  
    request.get("host").returns("localhost")
    request.protocol.returns("https")
    request.originalUrl.returns("/")
    
    socket.remoteAddress.returns("?")
    socket.remotePort.returns(0)

    response.connection.returns(socket)

    let model = await route.handleRequest(request, response)

    Expect(model.greeting).toEqual("express-nunjucks-govuk-webapp")
  }
}
