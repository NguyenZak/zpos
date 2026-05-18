import * as React from "react";

/**
 * React hook that tracks the browser's online/offline state.
 * Initial value is `true` to keep SSR markup stable; the real value is
 * resolved after mount.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => {
      window.removeEventListener("online", onOn);
      window.removeEventListener("offline", onOff);
    };
  }, []);

  return online;
}
