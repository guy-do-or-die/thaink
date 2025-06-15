/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAIN: string
  readonly VITE_RPC_URL: string
  readonly VITE_PKP_PUBLIC_KEY: string
  readonly VITE_PKP_TOKEN_ID: string
  // add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
