import { NextResponse } from 'next/server';
import { openDashboardDb } from '@/lib/dashboarddb';
import { sendOTPEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // 1. 隨機產生 6 位數驗證碼
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. 設定 5 分鐘後過期 (SQLite 沒有 datetime('now', '+5 minutes') 的直接時區處理，我們用 JavaScript 計算)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 3. 存入資料庫的 otps 表格
    const db = await openDashboardDb();
    await db.run(
      'INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)',
      [email, otpCode, expiresAt]
    );

    // 4. 透過郵差寄出信件
    const emailSent = await sendOTPEmail(email, otpCode);

    if (emailSent) {
      return NextResponse.json({ message: 'OTP sent successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to send email via SMTP' }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}