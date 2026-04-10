"use client";

import { useState } from "react";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type OtpCodeFieldProps = {
  name?: string;
  length?: number;
};

export function OtpCodeField({ name = "code", length = 6 }: OtpCodeFieldProps) {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-2">
      <InputOTP maxLength={length} value={value} onChange={setValue}>
        <InputOTPGroup>
          {Array.from({ length }).map((_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

