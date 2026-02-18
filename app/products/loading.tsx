export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-grow flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-light tracking-wider text-gray-400 uppercase">Klumit</span>
        </div>
      </div>
    </div>
  );
}
