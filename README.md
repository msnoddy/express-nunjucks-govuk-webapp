# express-nunjucks-govuk-webapp

Simple web application for UK government services. 

This project uses:

  - Node.js v12 LTS *(runtime)*
  - Typescript *(language)*
  - Express *(web server)*
  - InversifyJS *(IOC container)*
  - Nunjucks *(template engine)*
  - GOV.UK Frontend *(UI)*

Testing tools:

  - tslint *(code style)*
  - alsatian *(test framework)*
  - substitute *(mocking)*
  - nyc *(code coverage)*

It provides a simple wrapper which allows using the MVC pattern to add routes and views using config instead of code.

**Docs:**

- [Configuration](#config)
  - [Logging Config](#log-cfg)
  - [Environment Variables](#env-vars)
- [Customising Header](#custom-header)
- [Customising Footer](#custom-footer)
- [Adding a View](#add-view)
- [Adding a View Model](#add-view-model)
- [Adding a Route without a View](#add-without-view)
- [Distribution](#distribution)
- [Docker](#docker)
- [Yarn Shell](#yarn-shell)

## Quickstart

- Install `nvm`
- Install `yarn`
- Setup `node`:

  ```shell
  nvm install $(<.nvmrc)
  nvm use
  ```

- Launch the app:
 
  ```shell
  yarn launch
  ```

- Open a web browser @ http://localhost:8080

## <a id="config"></a>Configuration

- This app is driven by a json configuration file:

    ```json
    {
      "logging": {
        "level": "info",
        "pattern": "${timestamp} ${level} ${message}",
        "appenders": [
          {
            "type": "console"
          }
        ]
      }
      "routes": {
        "/": {
          "GET": {
            "class": "IndexRoute",
            "template": "index"
          }
        }
      },
      "staticRoutes": {
        "assets": "dist/govuk-frontend/assets",
        "govuk-frontend": "dist/govuk-frontend",
        "html5shiv": "node_modules/html5shiv/dist"
      },
      "templatePaths": [
        "dist/govuk-frontend/",
        "dist/govuk-frontend/components/",
        "views"
      ]
    }
    ```

- `logging` - setup for logging to stdout and files
- `routes` - a map of URL path route & HTTP method to template/handler class; wires up MVC components, with a route handler acting as a controller
- `staticRoutes` - a list of paths that contain static assets (javascript, css etc.)
- `templatePaths` - a list of paths that contain nunjuck template files

A default `config.json` is provided in the root of this repository.

### <a id="log-cfg"></a>Logging Config

The `logging` config key allows simple configuration of the `winston` npm module.

Options:

- `level`: Minimum level to log, one of `{error, warn, info, verbose, debug, silly}` (default is `info`)
- `pattern`: Output pattern for log lines, placeholders available are `timestamp`, `level` and `message` (default is `${timestamp} ${level} ${message}`)
- `appenders`: Appenders to write log lines to
  - `type`: Either `console` or `file`
  - `filename`: Path to the output log file; placeholder for the environment variable `LOG_PATH` is available, use `${LOG_PATH}` (required if type is `file`)
  - `maxBackups`: Maximum amount of zipped log files to keep (required if type is `file`)
  - `maxSizeInMb`: Maximum size of the log file (in MB) before it gets zipped to keep (required if type is `file`)

### <a id="env-vars"></a>Environment Variables

Several variables provide low level configuration for the app:

- `EXPRESS_PORT`: TCP port to listen of requests on (default is `8080`)
- `APP_CONFIG`: Path to the JSON configuration file (default is `./config.json`)
- `LOG_PATH`: The directory to write log files to (default is `./logs`)

## <a id="custom-header"></a>Customising Header

Edit the `views/base.njk` file to override the header block:

  ```nunjucks
  {% block header %}
      {{ 
          govukHeader({
              homepageUrl: "#",
              serviceName: "Service name",
              serviceUrl: "#"
          }) 
      }}
  {% endblock %}
  ```

See https://design-system.service.gov.uk/components/header/#options-example-default for all the options available.

## <a id="custom-footer"></a>Customising Footer

Edit the `views/base.njk` file to override the header block:

```
{% block footer %}
    {{
        govukFooter({
            meta: {
                items: [
                    {
                        href: "#1",
                        text: "Item 1"
                    }
                ]
            }
        })
    }}
{% endblock %}
```

See https://design-system.service.gov.uk/components/footer/#options-example-default for all the options available.

## <a id="add-view"></a>Adding a View

- Add a new `njk` file in the `views` directory which contains a `content` block:

    ```
    {% extends "base.njk" %}

    {% block content %}
    <h1 class="govuk-heading-xl">
        My View
    </h1>
    {% endblock %}
    ```
    *e.g. `my-view.njk`*

- Add a new route to your config file which wires up your template:

    ```json
    {
      // ...
      "routes": {
        "/my-view": {
          "GET": {
            "template": "my-view"
          }
        }
      }
      // ...
    }
    ```

- Launch the app

- Open a web browser @ http://localhost:8080/my-view to see your new page

## <a id="add-view-model"></a>Adding a View Model

- Add a new class to the `src/routes` directory:

    ```typescript
    import { Request, Response } from "express"
    import { injectable } from "inversify"

    import { IRoute } from "../interfaces/IRoute"

    @injectable()
    export class MyRoute implements IRoute {
      public async handleRequest(req: Request, res: Response) {
        return {
          greeting: "express-nunjucks-govuk-webapp"
        }
      }
    }
    ```
    *e.g. MyRoute.ts*

- Update your view template to use your new model:

    ```
    {% extends "base.njk" %}

    {% block content %}
    <h1 class="govuk-heading-xl">
        {{ greeting }}
    </h1>
    {% endblock %}
    ```
    *e.g. `my-view.njk`*

- Update your config json to point to your class:

    ```json
    {
      // ...
      "routes": {
        "/my-view": {
          "GET": {
            "class": "MyRoute",
            "template": "my-view"
          }
        }
      }
      // ...
    }
    ```

- Launch the app

- Open a web browser @ http://localhost:8080/my-view to see your page with model data in it

## <a id="add-without-view"></a>Adding a Route without a View

It is possible to add an route endpoint that does not have an associated template, where the response is sent by the route class itself; this is useful to create API endpoints.

- Add a route in your config json with a `class` only:

    ```json
    {
      // ...
      "routes": {
        "/route-only": {
          "GET": {
            "class": "AnotherRoute"
          }
        }
      }
      // ...
    }
    ```

- Handle the response in your route class:

    ```typescript
    import { Request, Response } from "express"

    import { IRoute } from "../interfaces/IRoute"

    export class AnotherRoute implements IRoute {
      public async handleRequest(req: Request, res: Response) {
        let responseData = {
          hello: "world"
        }

        res.status(200)
          .contentType("json")
          .send(responseData)
      }
    }
    ```
    *e.g. AnotherRoute.ts*

- Launch the app

- To see your endpoint in action, run:

    ```
    curl -vvvv http://localhost:8080/route-only
    ```

## <a id="di"></a>Dependency Injection

An IOC container is provided by the `InversifyJs` package. To bind new types, and a symbol for the type to [src/AppTypes.ts](src/AppTypes.ts) and update the [src/AppContainer.ts](src/AppContainer.ts) `configure` method.

All route classes must be decorated with `@injectable()` for dependency injection to work, then you can use constructor injection:

  ```typescript
  import { Request, Response } from "express"
  import { inject, injectable } from "inversify"

  import { AppTypes } from "../AppTypes"
  import { MyType } from "../MyType"
  import { IRoute } from "../interfaces/IRoute"

  @injectable()
  export class Route implements IRoute {
    public constructor(
      @inject(AppTypes.MyType) private readonly myTypeInstance: MyType
    ) {}

    public async handleRequest(req: Request, res: Response) {
      // do something with this.myTypeInstance

      return {
        greeting: "express-nunjucks-govuk-webapp"
      }
    }
  }
  ```

## <a id="tests"></a>Tests

A simple test has been added to show how testing can be done. It mocks out the express request and response objects and executes a route handler.

This uses the `substitute` package to mock interfaces and the `alsatian` framework to execute tests.

See: [tests/src/routes/IndexRouteTests.ts](tests/src/routes/IndexRouteTests.ts)

## <a id="distribution"></a>Distribution

- Run `yarn package`
- The `dist` directory will now have all the files needed to run the app (except a config file)
- To start the app from the distribution, use the `bin/run` script

## <a id="docker"></a>Docker

The repository contains a `Dockerfile`, build a docker image by running:

```
    docker build . -t govuk-webapp
```

Start a new container by running:

```
    docker run --rm -p 8080:80 govuk-webapp
```

You can now hit the app @ http://localhost:8080

## <a id="yarn-shell"></a>Yarn Shell

All build tool binaries used are installed locally to this project and not as global packages. To quickly test something you can hop into an interactive shell which has these tools on the path.

Run:

  ```shell
  yarn shell
  ```
