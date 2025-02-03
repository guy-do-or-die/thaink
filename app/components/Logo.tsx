export default function Logo({ height = 50 }: { height?: number }) {
  return (
    <img
      src="/assets/logo.png"
      alt="Logo"
      style={{ height: `${height}px` }}
    />
  );
}
