export default function Content({ children }: { children: React.ReactNode }) {
  return (
    <div className="container pt-24 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
      {children}
    </div>
  );
}
