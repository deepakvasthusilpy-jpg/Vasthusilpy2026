let sharedBroadcastChannel: BroadcastChannel | null = null;

export function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!sharedBroadcastChannel) {
    try {
      sharedBroadcastChannel = new BroadcastChannel("vasthusilpy_crm_sync_channel");
    } catch (e) {
      console.warn("BroadcastChannel initialization failed:", e);
      return null;
    }
  }
  return sharedBroadcastChannel;
}

export function broadcastMessage(msg: { type: string; data?: any }) {
  const bc = getBroadcastChannel();
  if (bc) {
    try {
      bc.postMessage(msg);
    } catch (e) {
      console.warn("Broadcast error:", e);
    }
  }
}
