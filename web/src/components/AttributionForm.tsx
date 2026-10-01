import { useEffect, useRef } from "react";

const FORM_ORIGIN = "https://teams.igem.org";
const MAX_HEIGHT = 20000;

// iGEMの貢献者フォーム。フォームが送る高さを受け取って、iframeの高さを合わせる。
export function AttributionForm({ src }: { src: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== FORM_ORIGIN || typeof event.data !== "string") return;
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      let message: { type?: unknown; data?: unknown };
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message?.type !== "igem-attribution-form" || !Number.isFinite(message.data)) return;
      const height = Math.min(Math.max((message.data as number) + 100, 0), MAX_HEIGHT);
      frame.style.height = `${height}px`;
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <iframe ref={frameRef} id="igem-attribution-form" title="Attribution form" src={src} loading="lazy" style={{ width: "100%" }} />;
}

export default AttributionForm;
