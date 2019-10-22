#! /usr/bin/env sh
set -ex

cleanFiles() {
  rm -f dist/config.json
  find dist -name '*.d.ts' -type f -delete
  find dist -name '*.js.map' -type f -delete
}

deployNodeModules() {
  rm -rf node_modules
  yarn install --production

  cp -R node_modules dist
}

deployBin() {
  mv dist/bin/run.js dist/bin/run

  chmod +x dist/bin/run
}

deploy() {
  deployBin
  deployNodeModules

  cleanFiles
}

deploy
