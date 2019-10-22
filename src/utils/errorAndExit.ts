// tslint:disable: no-console
export function errorAndExit(message: string, ex: Error) {
    console.error(message)
    console.error(ex)

    process.exit(1)
}
