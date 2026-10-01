import { useEffect, useRef, useState, type DetailedHTMLProps, type HTMLAttributes } from "react";
import { withBase } from "../base";
import type { Model } from "../content";
import styles from "./ModelViewer.module.css";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        alt?: string;
        loading?: "auto" | "lazy" | "eager";
        reveal?: "auto" | "manual";
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
      };
    }
  }
}

function hasWebGL(): boolean {
  if (!window.WebGLRenderingContext) return false;
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

// 外部(gstatic.com)に出ないよう、デコーダーの場所を自サイト内に向ける。
function setDecoderLocations() {
  (window as unknown as { ModelViewerElement: object }).ModelViewerElement = {
    dracoDecoderLocation: withBase("/models/decoders/draco/"),
    ktx2TranscoderLocation: withBase("/models/decoders/basis/"),
  };
}

// WebGLが使え、画面に近づいてからmodel-viewerを読み込む。それまでと非対応時はposterを出す。
export function ModelViewer({ src, poster, alt }: Partial<Model>) {
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!src || !el || !hasWebGL()) return;
    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    const load = () => {
      observer?.disconnect();
      setDecoderLocations();
      import("@google/model-viewer").then(
        () => !cancelled && setReady(true),
        (error) => console.warn("model-viewerを読み込めません", error),
      );
    };
    if (typeof IntersectionObserver === "undefined") {
      load();
    } else {
      observer = new IntersectionObserver(
        (entries) => entries.some((e) => e.isIntersecting) && load(),
        { rootMargin: "200px" },
      );
      observer.observe(el);
    }
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [src]);

  if (!src) return null;
  return (
    <div ref={rootRef} className={styles.root}>
      {ready ? (
        <model-viewer
          className={styles.viewer}
          src={src}
          poster={poster}
          alt={alt}
          loading="lazy"
          reveal="auto"
          camera-controls
          auto-rotate
        />
      ) : (
        poster && <img className={styles.poster} src={poster} alt={alt ?? ""} />
      )}
    </div>
  );
}

export default ModelViewer;
