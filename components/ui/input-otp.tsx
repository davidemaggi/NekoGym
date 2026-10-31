"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";

import { cn } from "@/lib/utils";

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput>) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn("flex items-center gap-2 disabled:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const slot = inputOTPContext.slots[index];

  return (
    <div
      data-slot="input-otp-slot"
      data-active={slot.isActive}
      className={cn(
        // One ticket-figure box per digit: 48px tall, readable at a glance, separate so the count is obvious.
        "tabular relative flex h-12 w-11 items-center justify-center rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-[1.375rem] font-semibold transition-shadow",
        "data-[active=true]:z-10 data-[active=true]:border-[var(--foreground)] data-[active=true]:ring-2 data-[active=true]:ring-[var(--foreground)]/20",
        className
      )}
      {...props}
    >
      {slot.char ?? slot.placeholderChar}
      {slot.hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-pulse bg-[var(--foreground)] duration-1000" />
        </div>
      ) : null}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      -
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };

