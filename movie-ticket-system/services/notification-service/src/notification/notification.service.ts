import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NotificationService {
  private readonly logDir: string;
  private readonly logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'notifications.log');

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  handlePaymentCompleted(data: any) {
    const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const consoleMsg = `✅ [NOTIFICATION] Booking #${data.bookingId} thanh toán thành công!`;
    const emailMsg = `📧 Gửi email tới user ${data.userId}: "Đặt vé thành công - ${data.movieTitle || 'N/A'} - Số tiền: ${data.amount?.toLocaleString('vi-VN')} VND"`;

    console.log(consoleMsg);
    console.log(emailMsg);

    const logEntry = `[${timestamp}] PAYMENT_COMPLETED | bookingId=${data.bookingId} | userId=${data.userId} | amount=${data.amount} | movie=${data.movieTitle || 'N/A'}\n`;
    this.writeLog(logEntry);
  }

  handleBookingFailed(data: any) {
    const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const consoleMsg = `❌ [NOTIFICATION] Booking #${data.bookingId} thanh toán thất bại — ${data.reason}`;
    console.log(consoleMsg);

    const logEntry = `[${timestamp}] BOOKING_FAILED | bookingId=${data.bookingId} | userId=${data.userId} | reason=${data.reason}\n`;
    this.writeLog(logEntry);
  }

  private writeLog(entry: string) {
    try {
      fs.appendFileSync(this.logFile, entry, 'utf8');
    } catch (err) {
      console.error('[Notification] Failed to write log:', err.message);
    }
  }
}
