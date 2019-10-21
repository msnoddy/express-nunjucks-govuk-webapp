#! /usr/bin/env sh
set -e

scriptPath=$( cd "$( dirname "$0" )" && pwd )

function runApp() {
    if [ ! -x "$(command -v node)" ]; then
        >&2 echo "[ERROR] Unable to find node binary, is it installed and on the path?"
        exit 1
    fi

    cd "${scriptPath}"
    node "dist/main.js"
}

runApp
