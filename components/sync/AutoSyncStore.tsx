import { useCallback, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";

export const [AutoSyncProvider, useAutoSync] = createContextHook(() => {
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  const manualSync = useCallback(async () => {
    const now = Date.now();
    console.log("[AutoSync] manualSync (disabled) called", { now });
    setLastSyncTime(now);
  }, []);

  const manualFetch = useCallback(async () => {
    console.log("[AutoSync] manualFetch (disabled) called");
  }, []);

  return useMemo(
    () => ({
      isSyncing: false,
      isFetching: false,
      lastSyncTime,
      manualSync,
      manualFetch,
    }),
    [lastSyncTime, manualSync, manualFetch],
  );
});
