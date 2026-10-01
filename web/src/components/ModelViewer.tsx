import { useEffect, useState, type DetailedHTMLProps, type HTMLAttributes } from "react";
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
    return document.createElement("canvas").getContext("webgl") !== null;
  } catch {
    return false;
  }
}

// WebGLが使えると分かってからmodel-viewerを読み込む。読み込み前と非対応時はposterを出す。
export function ModelViewer({ src, poster, alt }: Partial<Model>) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src || !hasWebGL()) return;
    let cancelled = false;
    import("@google/model-viewer").then(
      () => !cancelled && setReady(true),
      (error) => console.warn("model-viewerを読み込めません", error),
    );
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) return null;
  return (
    <div className={styles.root}>
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
