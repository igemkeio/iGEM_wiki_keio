import { useEffect, useRef } from "react";

const FORM_ORIGIN = "https://teams.igem.org";

// iGEMの貢献者フォーム。フォームが送る高さを受け取って、iframeの高さを合わせる。
export function AttributionForm({ src = "https://teams.igem.org/wiki/5539/attributions" }: { src?: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== FORM_ORIGIN || typeof event.data !== "string") return;
      let message: { type?: unknown; data?: unknown };
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message?.type !== "igem-attribution-form" || typeof message.data !== "number") return;
      if (frameRef.current) frameRef.current.style.height = `${message.data + 100}px`;
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <iframe ref={frameRef} id="igem-attribution-form" title="Attribution form" src={src} style={{ width: "100%" }} />;
}

export default AttributionForm;
