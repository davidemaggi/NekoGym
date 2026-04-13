"use client";

import { useState } from "react";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type OtpCodeFieldProps = {
  name?: string;
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
};

export function OtpCodeField({ name = "code", length = 6, value, onChange }: OtpCodeFieldProps) {
  const [internalValue, setInternalValue] = useState("");
  const currentValue = value ?? internalValue;

  function handleChange(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  }

  return (
    <div className="space-y-2">
      <InputOTP maxLength={length} value={currentValue} onChange={handleChange}>
        <InputOTPGroup>
          {Array.from({ length }).map((_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <input type="hidden" name={name} value={currentValue} />
    </div>
  );
}
