#! /usr/bin/env sh
set -ex

deployViews() {
  cp -R views dist
}

cleanFiles() {
  find dist/govuk-frontend -name '*.scss' -type f -delete
  find dist/govuk-frontend -type d -depth -empty -exec rmdir '{}' \;
}

buildCss() {
  node-sass dist/govuk-frontend/all-ie8.scss dist/govuk-frontend/all-ie8.css
  node-sass dist/govuk-frontend/all.scss dist/govuk-frontend/all.css
}

deploy() {
  cp -r node_modules/govuk-frontend/govuk dist/govuk-frontend

  buildCss
  cleanFiles

  deployViews
}

deploy
