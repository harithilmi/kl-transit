import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}