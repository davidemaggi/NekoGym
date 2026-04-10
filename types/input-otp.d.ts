declare module "input-otp" {
  import * as React from "react";

  export type OTPSlot = {
    char: string | null;
    hasFakeCaret: boolean;
    isActive: boolean;
    placeholderChar: string | null;
  };

  export const OTPInputContext: React.Context<{
    slots: OTPSlot[];
  }>;

  export type OTPInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
    value?: string;
    onChange?: (value: string) => void;
    maxLength: number;
    containerClassName?: string;
    render?: (props: { slots: OTPSlot[] }) => React.ReactNode;
  };

  export const OTPInput: React.ForwardRefExoticComponent<
    OTPInputProps & React.RefAttributes<HTMLInputElement>
  >;
}

