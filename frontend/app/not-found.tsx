export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl font-mono font-bold text-slate-700 mb-3">404</div>
      <p className="text-slate-400 text-sm">Halaman tidak ditemukan.</p>
      <a href="/" className="mt-5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg font-medium transition-colors">
        Kembali ke Dashboard
      </a>
    </div>
  );
}
