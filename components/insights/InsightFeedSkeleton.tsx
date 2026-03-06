"use client";

function SkeletonCard({ wide }: { wide?: boolean }) {
  return (
    <div className="bg-[#1e1e2a] rounded-2xl border border-white/5 p-4 space-y-3 animate-pulse">
      {/* Hashtag badges */}
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-lg bg-white/5" />
        <div className="h-6 w-20 rounded-lg bg-white/5" />
        {wide && <div className="h-6 w-14 rounded-lg bg-white/5" />}
      </div>
      {/* Body lines */}
      <div className="space-y-2">
        <div className="h-3.5 rounded bg-white/5 w-full" />
        <div className="h-3.5 rounded bg-white/5 w-[90%]" />
        <div className="h-3.5 rounded bg-white/5 w-[75%]" />
      </div>
    </div>
  );
}

export function InsightFeedSkeleton({ message }: { message?: string }) {
  return (
    <div className="space-y-6">
      {message && (
        <div className="flex items-center gap-3 px-1">
          <div className="w-4 h-4 rounded-full border-2 border-rose-500/50 border-t-rose-400 animate-spin flex-shrink-0" />
          <p className="text-gray-400 text-sm">{message}</p>
        </div>
      )}
      <div className="space-y-5">
        <SkeletonCard />
        <SkeletonCard wide />
        <SkeletonCard />
        <SkeletonCard wide />
        <SkeletonCard />
      </div>
    </div>
  );
}
