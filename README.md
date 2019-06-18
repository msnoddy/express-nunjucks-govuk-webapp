# express-nunjucks-govuk-webapp

Simple web application for UK goverment services. 

This project uses:
 - TypeScript
 - Express
 - Nunjucks
 - GOV.UK Frontend

It provides a very simple wrapper which allows using the MVC pattern to add routes and views with minimal code changes.

**Docs:**

- [Configuration](#config)
- [Customising Header](#custom-header)
- [Customising Footer](#custom-footer)
- [Adding a View](#add-view)
- [Adding a View Model](#add-view-model)
- [Adding a Route without a View](#add-without-view)
- [Distribution](#distribution)
- [Docker](#docker)

## Quickstart

- Install either node.js v10.x or nvm
- Install yarn
- Run `yarn launch`
- Open a web browser @ http://localhost:8080

## <a id="config"></a>Configuration

- This app is driven by a json configuration file:

    ```json
    {
        "nunjuckTemplatePaths": [
            "dist/govuk-frontend/",
            "dist/govuk-frontend/components/",
            "views"
        ],
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
        }
    }
    ```

- `nunjuckTemplatePaths` - a list of paths that contain nunjuck template files
- `routes` - a map of URL path route & HTTP method to template/handler class; wires up MVC components, with a route handler acting as a controller
- `staticRoutes` - a list of paths that contain static assets (javascript, css etc.)

A default `config.json` is provided in this repository.

## <a id="custom-header"></a>Customising Header

Edit the `views/base.njk` file to override the header block:

```
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

- Run `yarn launch`

- Open a web browser @ http://localhost:8080/my-view to see your new page

## <a id="add-view-model"></a>Adding a View Model

- Add a new class to the `src/routes` directory:

    ```typescript
    import { Request, Response } from "express"

    import { IRoute } from "../interfaces/IRoute"

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

- Run `yarn launch`

- Open a web browser @ http://localhost:8080/my-view to see your page with model data in it

## <a id="add-without-view"></a>Adding a Route without a View

It is possible to add an route endpoint that does not have an associated template, where the response is sent by the route class itself.

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

- Run `yarn launch`

- To see your endpoint in action, run:

    ```
    curl http://localhost:8080/route-only
    ```

## <a id="distribution"></a>Distribution

- Run `yarn build`
- Copy the below to a new directory:
    - dist
    - node_modules
    - views
    - runApp.sh
- To start the app, use the `runApp.sh` script

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
