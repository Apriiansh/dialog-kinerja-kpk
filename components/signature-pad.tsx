"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { EraserIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function SignaturePadField({
  onChange,
  disabled,
  label = "Tanda Tangan",
}: {
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const onChangeRef = useRef(onChange);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(ratio, ratio);

    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(11, 28, 48)",
      minWidth: 1,
      maxWidth: 2.5,
    });
    padRef.current = pad;

    const handleEnd = () => {
      if (pad.isEmpty()) {
        setHasValue(false);
        onChangeRef.current(null);
      } else {
        setHasValue(true);
        onChangeRef.current(pad.toDataURL("image/png"));
      }
    };
    canvas.addEventListener("pointerup", handleEnd);

    const handleResize = () => {
      const data = pad.toData();
      const newRatio = Math.max(window.devicePixelRatio || 1, 1);
      const newWidth = canvas.clientWidth;
      const newHeight = canvas.clientHeight;
      canvas.width = newWidth * newRatio;
      canvas.height = newHeight * newRatio;
      const ctx2 = canvas.getContext("2d");
      if (ctx2) ctx2.scale(newRatio, newRatio);
      pad.fromData(data);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      canvas.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("resize", handleResize);
      pad.off();
    };
  }, []);

  useEffect(() => {
    if (disabled) padRef.current?.off();
    else padRef.current?.on();
  }, [disabled]);

  function clear() {
    padRef.current?.clear();
    setHasValue(false);
    onChangeRef.current(null);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
        {label}
      </span>
      <div
        className={`overflow-hidden rounded-md border transition-colors ${
          hasValue ? "border-primary" : "border-outline"
        }`}
      >
        <div className="h-40 w-full bg-white">
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%" }}
            className="touch-none"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs leading-4 text-ink-muted">
          {hasValue
            ? "Tanda tangan telah diisi."
            : "Gambar tanda tangan Anda di atas."}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={disabled || !hasValue}
          leadingIcon={<EraserIcon size={14} weight="bold" />}
        >
          Bersihkan
        </Button>
      </div>
    </div>
  );
}