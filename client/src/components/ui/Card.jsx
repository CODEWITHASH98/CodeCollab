import { cn } from "../../utils/cn";

export function Card({ children, className, glass = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 shadow-xl transition-[transform,box-shadow] duration-300 hover:shadow-2xl hover:-translate-y-1",
        glass
          ? "bg-white/10 backdrop-blur-lg border border-white/20"
          : "bg-white",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn("text-2xl font-bold", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }) {
  return (
    <p className={cn("text-sm mt-1", className)}>
      {children}
    </p>
  );
}
