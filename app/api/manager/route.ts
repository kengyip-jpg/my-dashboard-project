import { NextResponse } from 'next/server';
import { openDashboardDb } from '@/lib/dashboarddb';

// GET: Fetch all events and unread notifications for Manager/Admin
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const db = await openDashboardDb();
    
    // 驗證權限：只有 manager 和 admin 可以讀取
    const user = await db.get('SELECT role FROM users WHERE email = ?', [email]);
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 撈出所有事件，並串接提交者的姓名/Email
    const events = await db.all(`
      SELECT e.*, u.name as user_name, u.email as user_email 
      FROM events e 
      JOIN users u ON e.user_id = u.id 
      ORDER BY e.created_at DESC
    `);

    // 撈出所有未讀通知
    const notifications = await db.all('SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC');

    return NextResponse.json({ events, notifications });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Approve or Reject an event
export async function PATCH(request: Request) {
  try {
    const { email, eventId, status } = await request.json(); // status: 'approved' or 'rejected'

    if (!email || !eventId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const db = await openDashboardDb();

    // 驗證權限
    const user = await db.get('SELECT role FROM users WHERE email = ?', [email]);
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. 更新事件狀態
    await db.run(
      'UPDATE events SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, eventId]
    );

    // 2. 將該事件關聯的通知都標記為已讀 (表示主管已經處理了)
    await db.run('UPDATE notifications SET is_read = 1 WHERE event_id = ?', [eventId]);

    return NextResponse.json({ message: `Event has been ${status}` });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}