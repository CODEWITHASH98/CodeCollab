import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Button = forwardRef(({
  className,
  variant = "primary",
  size = "md",
  glow = false,
  children,
  ...props
}, ref) => {
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 border-transparent",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent",
    outline: "bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5 border-transparent",
    glow: "bg-primary text-white border-transparent shadow-[0_0_20px_rgba(255,87,34,0.5)] hover:shadow-[0_0_30px_rgba(255,87,34,0.7)]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-4 text-lg font-semibold",
    icon: "p-2",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-[transform,box-shadow,background-color,border-color] duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variants[variant],
        sizes[size],
        glow && variant !== 'glow' && "shadow-[0_0_15px_rgba(255,87,34,0.3)] hover:shadow-[0_0_25px_rgba(255,87,34,0.5)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button };
