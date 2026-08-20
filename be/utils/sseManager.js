/**
 * SSE Manager - Quản lý các kết nối Server-Sent Events cho Realtime Notification
 */

class SSEManager {
  constructor() {
    // Map<person_id, Set<res>>
    this.clients = new Map();

    // Heartbeat ping mỗi 25 giây để giữ kết nối không bị timeout qua Nginx/Cloudflare/AWS ALB
    this.heartbeatInterval = setInterval(() => {
      this.broadcastPing();
    }, 25000);
  }

  /**
   * Đăng ký kết nối SSE cho một người dùng
   * @param {number} personId 
   * @param {import('express').Response} res 
   */
  addClient(personId, res) {
    const pId = parseInt(personId, 10);
    if (!this.clients.has(pId)) {
      this.clients.set(pId, new Set());
    }
    this.clients.get(pId).add(res);

    console.log(`[SSE Manager] 🟢 Client connected: User #${pId} (Total connections for user: ${this.clients.get(pId).size})`);

    // Gửi sự kiện chào mừng khi kết nối thành công
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to notification stream', personId: pId, timestamp: Date.now() })}\n\n`);

    // Dọn dẹp khi client đóng kết nối (đóng tab / rời trang)
    res.on('close', () => {
      this.removeClient(pId, res);
    });
  }

  /**
   * Hủy đăng ký client
   */
  removeClient(personId, res) {
    const pId = parseInt(personId, 10);
    if (this.clients.has(pId)) {
      const userConnections = this.clients.get(pId);
      userConnections.delete(res);
      if (userConnections.size === 0) {
        this.clients.delete(pId);
      }
      console.log(`[SSE Manager] 🔴 Client disconnected: User #${pId} (Remaining connections for user: ${userConnections.size})`);
    }
  }

  /**
   * Gửi sự kiện tới một người dùng cụ thể (tất cả các tab đang mở của người đó)
   * @param {number} personId 
   * @param {string} eventName 
   * @param {any} data 
   */
  sendToUser(personId, eventName, data) {
    const pId = parseInt(personId, 10);
    if (!this.clients.has(pId)) return;

    const userConnections = this.clients.get(pId);
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

    userConnections.forEach((res) => {
      try {
        res.write(payload);
      } catch (err) {
        console.error(`[SSE Manager] Error sending event to User #${pId}:`, err.message);
      }
    });

    console.log(`[SSE Manager] ⚡ Sent event [${eventName}] to User #${pId} across ${userConnections.size} client(s)`);
  }

  /**
   * Gửi heartbeat ping giữ kết nối cho tất cả clients đang mở
   */
  broadcastPing() {
    if (this.clients.size === 0) return;
    const pingPayload = `: ping\n\n`;

    for (const [pId, userConnections] of this.clients.entries()) {
      userConnections.forEach((res) => {
        try {
          res.write(pingPayload);
        } catch (err) {
          // Connection broken, will be handled by 'close' listener
        }
      });
    }
  }
}

const sseManager = new SSEManager();

module.exports = sseManager;
