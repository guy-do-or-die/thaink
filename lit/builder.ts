import { terserOptions } from '../config'


export async function minifyWithTerser(code: string): Promise<string> {
    try {
        const { minify } = await import('terser')
        const result = await minify(code, terserOptions)
        return result.code || code
    } catch (error) {
        console.error('Terser minification failed:', error)
        return code
    }
}

export function injectFunctions(targetFn: Function, functionsToInject: Function[]): string {
    const injectedFunctionsCode = functionsToInject.map((fn) => fn.toString()).join('\n\n')

    const targetFnStr = targetFn.toString()
    const firstBraceIndex = targetFnStr.indexOf('{')

    return `${targetFnStr.slice(0, firstBraceIndex + 1)}
    ${injectedFunctionsCode}
    ${targetFnStr.slice(firstBraceIndex + 1)}`
}

export function createLitAction(mainFn: Function, functionsToInject: Function[] = []): string {
    const fnWithInjectedCode = injectFunctions(mainFn, functionsToInject)
    return `(${fnWithInjectedCode})()`
}