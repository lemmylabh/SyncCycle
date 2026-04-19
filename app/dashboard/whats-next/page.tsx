import { Construction } from "lucide-react";

export default function WhatsNextPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Construction size={28} className="text-amber-400" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-white text-xl font-bold tracking-tight">What&apos;s Next</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            We&apos;re working on something exciting. Check back soon for upcoming features and the SyncCycle roadmap.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Under Construction
        </div>
      </div>
    </div>
  );
}
