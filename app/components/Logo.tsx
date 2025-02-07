
export default function Logo({ height = 50 }: { height?: number }) {
  return <img src="/assets/logo.svg" alt="Logo" style={{ height: `${height}px` }} />
}
