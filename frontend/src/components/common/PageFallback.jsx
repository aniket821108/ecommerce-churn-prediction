export const PageFallback = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[50vh] flex flex-col items-center justify-center p-8 gap-4 font-sans"
    >
      <div className="relative w-10 h-10">
        <div className="w-10 h-10 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">
        Loading View...
      </p>
      <span className="sr-only">Loading page view, please wait.</span>
    </div>
  );
};

export default PageFallback;
