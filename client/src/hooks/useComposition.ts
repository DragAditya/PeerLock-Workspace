import { useRef } from "react";
import type { CompositionEvent, KeyboardEvent } from "react";

type Handlers<T> = {
  onKeyDown?: (event: KeyboardEvent<T>) => void;
  onCompositionStart?: (event: CompositionEvent<T>) => void;
  onCompositionEnd?: (event: CompositionEvent<T>) => void;
};

export function useComposition<T>({ onKeyDown, onCompositionStart, onCompositionEnd }: Handlers<T>) {
  const composing = useRef(false);
  return {
    onKeyDown: (event: KeyboardEvent<T>) => { if (!composing.current) onKeyDown?.(event); },
    onCompositionStart: (event: CompositionEvent<T>) => { composing.current = true; onCompositionStart?.(event); },
    onCompositionEnd: (event: CompositionEvent<T>) => { composing.current = false; onCompositionEnd?.(event); },
  };
}
