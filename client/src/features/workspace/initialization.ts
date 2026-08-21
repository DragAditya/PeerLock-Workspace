export type InitializationRelease = "ready" | "timeout" | "failure";

export function createInitializationGate(timeoutMs: number, onRelease: (reason: InitializationRelease) => void) {
  let released = false;
  const release = (reason: InitializationRelease) => {
    if (released) return;
    released = true;
    clearTimeout(timeout);
    onRelease(reason);
  };
  const timeout = setTimeout(() => release("timeout"), timeoutMs);
  return { ready: () => release("ready"), fail: () => release("failure"), dispose: () => { released = true; clearTimeout(timeout); } };
}
