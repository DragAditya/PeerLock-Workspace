import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import type { ButtonHTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";

interface LiquidMetalButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  detail?: string;
}

/**
 * Local preview component inspired by the supplied shader-button reference.
 * It keeps a fully usable CSS fallback and never mounts a shader for reduced-motion users.
 */
export function LiquidMetalButton({ label, detail, className = "", ...buttonProps }: LiquidMetalButtonProps) {
  const shaderRef = useRef<HTMLDivElement>(null);
  const shaderMount = useRef<ShaderMount | null>(null);
  const [shaderReady, setShaderReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !shaderRef.current) return;

    try {
      shaderMount.current = new ShaderMount(shaderRef.current, liquidMetalFragmentShader, {
        u_repetition: 3.2,
        u_softness: 0.7,
        u_shiftRed: 0.12,
        u_shiftBlue: 0.08,
        u_distortion: 0.08,
        u_contour: 0.18,
        u_angle: 22,
        u_scale: 7.5,
        u_shape: 1,
        u_offsetX: 0.08,
        u_offsetY: -0.12,
      });
      shaderMount.current.setSpeed?.(0.18);
      setShaderReady(true);
    } catch {
      setShaderReady(false);
    }

    return () => {
      (shaderMount.current as unknown as { destroy?: () => void } | null)?.destroy?.();
      shaderMount.current = null;
    };
  }, []);

  return <button
    {...buttonProps}
    className={`liquid-metal-button ${shaderReady ? "liquid-metal-button-ready" : ""} ${className}`}
    onPointerEnter={(event) => { shaderMount.current?.setSpeed?.(0.45); buttonProps.onPointerEnter?.(event); }}
    onPointerLeave={(event) => { shaderMount.current?.setSpeed?.(0.18); buttonProps.onPointerLeave?.(event); }}
  >
    <span ref={shaderRef} className="liquid-metal-shader" aria-hidden="true" />
    <span className="liquid-metal-content"><span>{label}</span>{detail && <small>{detail}</small>}</span>
    <span className="liquid-metal-arrow" aria-hidden="true">↗</span>
  </button>;
}
