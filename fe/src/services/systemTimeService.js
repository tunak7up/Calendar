import { apiFetch, updateServerTimeOffset, getServerTimeOffset, getLastSyncTime } from "./api";

export const syncSystemTime = async () => {
  try {
    const start = Date.now();
    const res = await apiFetch("/daily-report/system-time");
    const end = Date.now();
    const latency = Math.floor((end - start) / 2);
    if (res && res.success && res.data) {
      const serverTs = res.data.timestamp + latency;
      updateServerTimeOffset(serverTs);
      return res.data;
    }
  } catch (err) {
    console.warn("Failed to sync system time:", err);
  }
  return null;
};

export const getSystemDate = () => {
  return new Date(Date.now() + getServerTimeOffset());
};

export const getSystemDateStrSync = () => {
  const d = getSystemDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const getSystemDateStr = async () => {
  const lastSync = getLastSyncTime();
  if (!lastSync || Date.now() - lastSync > 5 * 60 * 1000) {
    const data = await syncSystemTime();
    if (data?.dateStr) return data.dateStr;
  }
  return getSystemDateStrSync();
};
