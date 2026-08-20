import { useEffect, useState } from "react";

export function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => { const update = () => setMobile(window.innerWidth < 768); update(); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update); }, []);
  return mobile;
}
