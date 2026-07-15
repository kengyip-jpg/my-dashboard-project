import { NextResponse } from 'next/server';
import { openDashboardDb } from '@/lib/dashboarddb';

// 驗證發出請求的人是否為 Admin 的輔助函式
async function verifyAdmin(db: any, email: string | null) {
  if (!email) return false;
  const user = await db.get('SELECT role FROM users WHERE email = ?', [email]);
  return user && user.role === 'admin';
}

// 1. GET: 獲取使用者列表與系統統計報表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminEmail = searchParams.get('email');
    const db = await openDashboardDb();

    if (!(await verifyAdmin(db, adminEmail))) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    // 撈出所有使用者
    const allUsers = await db.all('SELECT id, email, name, role, created_at FROM users ORDER BY id ASC');

    // 📊 計算報表數據 (Generate Report)
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const roleStats = await db.all('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    const eventStats = await db.all('SELECT status, COUNT(*) as count FROM events GROUP BY status');

    const report = {
      totalUsers: totalUsers.count,
      roles: {
        admin: roleStats.find(r => r.role === 'admin')?.count || 0,
        manager: roleStats.find(r => r.role === 'manager')?.count || 0,
        user: roleStats.find(r => r.role === 'user')?.count || 0,
      },
      events: {
        pending: eventStats.find(e => e.status === 'pending')?.count || 0,
        approved: eventStats.find(e => e.status === 'approved')?.count || 0,
        rejected: eventStats.find(e => e.status === 'rejected')?.count || 0,
      }
    };

    return NextResponse.json({ users: allUsers, report });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 2. PATCH: 修改使用者角色 (Modify Role)
export async function PATCH(request: Request) {
  try {
    const { adminEmail, targetUserId, newRole } = await request.json();
    const db = await openDashboardDb();

    if (!(await verifyAdmin(db, adminEmail))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!['admin', 'manager', 'user'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await db.run('UPDATE users SET role = ? WHERE id = ?', [newRole, targetUserId]);
    return NextResponse.json({ message: 'User role updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 3. DELETE: 刪除使用者 (Remove a User)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminEmail = searchParams.get('adminEmail');
    const targetUserId = searchParams.get('targetUserId');
    const db = await openDashboardDb();

    if (!(await verifyAdmin(db, adminEmail))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 防止管理員不小心把自己刪掉
    const targetUser = await db.get('SELECT email FROM users WHERE id = ?', [targetUserId]);
    if (targetUser && targetUser.email === adminEmail) {
      return NextResponse.json({ error: 'Cannot remove your own admin account' }, { status: 400 });
    }

    await db.run('DELETE FROM users WHERE id = ?', [targetUserId]);
    return NextResponse.json({ message: 'User removed from system' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}