#!/usr/bin/env bash
resultsDir=".test_results"

tapFile="${resultsDir}/results.tap"
junitFile="${resultsDir}/results.xml"
reportFile="${resultsDir}/results.html"
codeCoverageReportFile="${resultsDir}/coverage/index.html"

exitCode=0

# polyfill for realpath command using python
command -v realpath &> /dev/null || realpath() {
  python -c "import os; print os.path.abspath('$1')"
}

printReportSummary() {
  if [ -f "${reportFile}" ]; then
    echo "HTML Test Report: $(realpath ${reportFile})"
  fi

  echo "Code Coverage Report: $(realpath ${codeCoverageReportFile})"
  echo
}

generateTestReport() {
  if ! [ -x "$(command -v pipenv)" ]; then
    echo "pipenv not found, skipping HTML test report generation"

    return
  fi

  # install pipenv if required
  pipenv --venv > /dev/null 2>&1 || {
    pipenv install
  }

  pipenv run junit2html "${junitFile}" "${reportFile}"
}

determineExitCode() {
  exitCodes="$1"
  nonZeroExitCodes=${exitCodes//0/}

  if [ -n "${nonZeroExitCodes}" ]; then
    exitCode=1
  fi
}

runTestsWithCoverage() {
  nyc --reporter=lcov --reporter=html alsatian --tap "./tests/js/**/*Tests.js" 2>&1 | \
    tee "${tapFile}" | \
    tap-spec

  if [ -d coverage ]; then
    mv coverage .test_results
  fi

  determineExitCode "$(printf "%s" "${PIPESTATUS[@]}")"
}

runTests() {
  mkdir -p "${resultsDir}"

  runTestsWithCoverage

  cat "${tapFile}" | junit-bark > "${junitFile}"
}

cleanupOldResults() {
  rm -rf ".nyc_output"
  rm -rf "${resultsDir}"
}

main() {
  cleanupOldResults
  runTests
  generateTestReport

  printReportSummary

  exit ${exitCode}
}

main
