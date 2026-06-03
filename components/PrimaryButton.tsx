import { type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * Primary action button: forest pill, white text, hover lightens to primary
 * green with a subtle scale.
 */
export function PrimaryButton({
  children,
  icon,
  fullWidth = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#1a5c38] px-7 py-3.5 font-semibold text-white transition-all duration-150 hover:scale-[1.02] hover:bg-[#2d8653] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d8653] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
