import { NextResponse } from 'next/server';
import { openDashboardDb } from '@/lib/dashboarddb';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    const db = await openDashboardDb();

    // 1. 檢查資料庫有沒有這組 Email 和驗證碼，且檢查是否過期
    const currentTime = new Date().toISOString();
    const otpRecord = await db.get(
      'SELECT * FROM otps WHERE email = ? AND code = ? AND expires_at > ? ORDER BY id DESC LIMIT 1',
      [email, code, currentTime]
    );

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 400 });
    }

    // 驗證成功後，把用過的驗證碼刪除，避免重複使用
    await db.run('DELETE FROM otps WHERE email = ?', [email]);

    // 2. 檢查 users 表格裡有沒有這個人，沒有就幫他註冊一個新帳號
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      await db.run(
        'INSERT INTO users (email, personal_score, interns, seniors) VALUES (?, 0, 0, 0)',
        [email]
      );
      user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    // 3. 回傳登入成功訊息與使用者的資料
    return NextResponse.json({ 
      message: 'Login successful',
      user: {
        email: user.email,
        personal_score: user.personal_score,
        interns: user.interns,
        seniors: user.seniors
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}