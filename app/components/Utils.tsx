import { chain } from '@/wallet'

export function txLink(hash: string, text: string) {
  return (
    <a
      href={`${chain.blockExplorers?.default.url}/tx/${hash}`}
      className="font-bold underline"
      rel="noopener noreferrer"
      target="_blank"
    >
      {text}
    </a>
  )
}
