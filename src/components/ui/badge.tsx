import type { HTMLAttributes } from "react";

const colors = {
  gray: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
} as const;

export type BadgeColor = keyof typeof colors;

export function Badge({
  color = "gray",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { color?: BadgeColor }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]} ${className}`}
      {...props}
    />
  );
}

/** Map ticket/order statuses to badge colors. */
export const STATUS_COLOR: Record<string, BadgeColor> = {
  ISSUED: "blue",
  PREPARING: "yellow",
  READY: "green",
  REDEEMED: "gray",
  EXPIRED: "red",
  CANCELLED: "red",
  PENDING_PAYMENT: "orange",
  PAID: "blue",
  PAYMENT_FAILED: "red",
  COMPLETED: "green",
  CLOSED: "gray",
};
