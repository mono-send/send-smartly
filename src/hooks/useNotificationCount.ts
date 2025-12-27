import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export function useNotificationCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    try {
      const response = await api("/notifications/count");
      if (response.ok) {
        const data = await response.json();
        setCount(data.count || 0);
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        console.error("Failed to fetch notification count:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();

    // Refresh every 60 seconds
    const interval = setInterval(fetchCount, 60000);

    return () => clearInterval(interval);
  }, [fetchCount]);

  return { count, isLoading, refetch: fetchCount };
}
