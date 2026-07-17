export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2" aria-hidden>
            <span className="w-1.5 h-1.5 rounded-full bg-black/25 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-black/35 animate-pulse [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-black/25 animate-pulse [animation-delay:300ms]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={i < 4 ? 'block' : i < 6 ? 'hidden md:block' : 'hidden lg:block'}
            >
              <div className="aspect-[3/4] bg-black/[0.04] mb-3 animate-pulse" />
              <div className="h-3 bg-black/[0.04] mb-2 w-1/3 mx-auto animate-pulse" />
              <div className="h-4 bg-black/[0.06] mb-1.5 w-2/3 mx-auto animate-pulse" />
              <div className="h-3 bg-black/[0.04] w-1/4 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
