import { cn } from "../../utils/cn";

export function Input({ className, "aria-label": ariaLabel, ...props }) {
  return (
    <input
      aria-label={ariaLabel}
      className={cn(
        "w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white",
        "focus-visible:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-200 focus-visible:outline-none",
        "transition-[border-color,box-shadow] duration-200 placeholder:text-gray-400",
        className
      )}
      {...props}
    />
  );
}
