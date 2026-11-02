"use client";

import { useState, useEffect } from "react";

interface MaintenanceState {
  enabled: boolean;
  reason: string;
  loading: boolean;
}

export function useMaintenance(isSuperAdmin: boolean) {
  const [state, setState] = useState<MaintenanceState>({
    enabled: false,
    reason: "",
    loading: true,
  });

  useEffect(() => {
    if (isSuperAdmin) {
      setState({ enabled: false, reason: "", loading: false });
      return;
    }

    let mounted = true;

    const check = async () => {
      try {
        const res = await fetch("/api/maintenance");
        const data = await res.json();
        if (mounted) {
          setState({
            enabled: !!data.enabled,
            reason: data.reason || "",
            loading: false,
          });
        }
      } catch {
        if (mounted) setState(s => ({ ...s, loading: false }));
      }
    };

    check();

    // Poll every 15 seconds for real-time updates
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isSuperAdmin]);

  return state;
}
