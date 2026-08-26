type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => { finished: Promise<unknown> } };

export function navigateWithRoomAccessTransition(navigate: (path: string) => void, path: string) {
  const supportsMotion = typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const documentWithTransition = document as ViewTransitionDocument;
  if (!supportsMotion || !documentWithTransition.startViewTransition) { navigate(path); return; }
  document.documentElement.dataset.roomAccessTransition = "active";
  const transition = documentWithTransition.startViewTransition(() => navigate(path));
  void transition.finished.finally(() => { delete document.documentElement.dataset.roomAccessTransition; });
}
