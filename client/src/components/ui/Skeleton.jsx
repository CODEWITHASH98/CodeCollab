import { cn } from "../../utils/cn";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-shimmer bg-gray-200 rounded", className)}
      {...props}
    />
  );
}

export function EditorSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-40 h-8" />
            <Skeleton className="w-32 h-8" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex gap-3">
          <Skeleton className="w-32 h-10" />
          <Skeleton className="w-24 h-10" />
          <Skeleton className="w-24 h-10" />
        </div>
      </div>

      {/* Editor + Output Skeleton */}
      <div className="flex-1 flex">
        <div className="flex-1 p-4">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="w-96 border-l border-gray-200 p-4">
          <Skeleton className="w-full h-1/2 mb-4" />
          <Skeleton className="w-full h-1/2" />
        </div>
      </div>
    </div>
  );
}
