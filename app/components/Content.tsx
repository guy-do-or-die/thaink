export default function Content({ children }: { children: React.ReactNode }) {
  return (
    <div className="container pt-16 min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4 w-full md:w-2/3 lg:w-1/2">
      {children}
    </div>
  );
}
