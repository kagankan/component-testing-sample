import { useState, useEffect } from "react";

/**
 * ResizeObserverを使用して、モバイルかどうかを判定する
 * （要素の表示非表示は本来CSSで実現できるが、ここではコンポーネントテストの検証のためReactのuseStateを使用）
 */
export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => {
      const viewportWidth = window.innerWidth;
      setIsMobile(viewportWidth < 768);
    };

    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });

    // documentのbodyを監視
    resizeObserver.observe(document.body);

    // 初回実行
    onResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { isMobile };
};
