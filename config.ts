import * as chains from 'viem/chains'
import { config } from 'dotenv'

config()

export const supportedChains = {
  main: chains.base,
  test: chains.baseSepolia,
  local: chains.foundry,
}

const chainFromEnv = (process.env.VITE_CHAIN || import.meta.env?.VITE_CHAIN || 'local') as keyof typeof supportedChains

export const chain = supportedChains[chainFromEnv]

export const terserOptions = {
  mangle: {
    toplevel: false, // Don't mangle top-level names to preserve exports
    properties: false, // Don't mangle property names
  },
  compress: {
    booleans: false, // Don't optimize boolean expressions
    conditionals: false, // Don't optimize if-s and conditional expressions
    dead_code: false,
    defaults: false,
    drop_console: false, // Keep console.log statements
    drop_debugger: false, // Keep debugger statements
    evaluate: false, // Don't evaluate constant expressions
    global_defs: {
      undefined: undefined
    },
    inline: 0, // Don't inline functions
    keep_fargs: true, // keep arguments (in case you do `function(x=undefined)`)
    keep_infinity: true,
    passes: 1, // Just one pass to avoid over-optimization
    pure_funcs: [], // Empty array means no functions are considered pure (prevents removal)
    pure_getters: false, // Don't assume getters are pure
    reduce_vars: false, // Don't optimize variables
    sequences: false, // Don't join consecutive statements with commas
    side_effects: false,
    typeofs: true, // avoid changing typeof undefined
    unsafe: false, // Disable all unsafe optimizations
    unsafe_undefined: false, // Don't transform undefined to void 0
    unused: false,
  },
  output: {
    beautify: false, // Output compressed
    comments: false, // Remove comments
  },
  keep_classnames: true, // Keep class names
  keep_fnames: true, // Keep function names
  toplevel: false, // Don't transform top-level names
}