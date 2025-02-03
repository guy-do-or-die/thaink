export default function Content({ children }: { children: React.ReactNode }) {
  return (
    <div className="container pt-16 min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
      {children}
    </div>
  );
}
