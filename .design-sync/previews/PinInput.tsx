import { useState } from "react";
import { PinInput } from "@theokit/ui";



export const Numeric = () => {
  const [v, setV] = useState("");
  return <PinInput length={6} value={v} onChange={setV} aria-label="Verification code" />;
};

export const Alphanumeric = () => {
  const [v, setV] = useState("");
  return (
    <PinInput
      length={6}
      value={v}
      onChange={setV}
      inputMode="alphanumeric"
      aria-label="Alphanumeric code"
    />
  );
};

export const Length4 = () => {
  const [v, setV] = useState("");
  return <PinInput length={4} value={v} onChange={setV} aria-label="4-digit PIN" />;
};

export const ErrorState = () => {
  const [v, setV] = useState("1234");
  return <PinInput length={6} value={v} onChange={setV} error aria-label="Invalid code" />;
};

export const Disabled = () => (
  <PinInput length={6} value="123" onChange={() => undefined} disabled aria-label="Disabled code" />
);

export const Mask = () => {
  const [v, setV] = useState("");
  return <PinInput length={6} value={v} onChange={setV} mask aria-label="Masked PIN" />;
};

export const AutoFocus = () => {
  const [v, setV] = useState("");
  return <PinInput length={6} value={v} onChange={setV} autoFocus aria-label="Auto-focused code" />;
};
