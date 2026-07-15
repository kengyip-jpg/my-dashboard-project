import { NextResponse } from 'next/server';
import { openDashboardDb } from '@/lib/dashboarddb';

export async function POST(request: Request) {
  try {
    const { email, itemType } = await request.json(); // itemType 可以是 'intern' 或 'senior'
    const db = await openDashboardDb();

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 在後端計算公式價格，前端改了也沒用
    const internCost = 10 + user.interns * 5;
    const seniorCost = 50 + user.seniors * 20;

    if (itemType === 'intern') {
      if (user.personal_score < internCost) return NextResponse.json({ error: 'Not enough energy' }, { status: 400 });
      await db.run('UPDATE users SET personal_score = personal_score - ?, interns = interns + 1 WHERE email = ?', [internCost, email]);
    } else if (itemType === 'senior') {
      if (user.personal_score < seniorCost) return NextResponse.json({ error: 'Not enough energy' }, { status: 400 });
      await db.run('UPDATE users SET personal_score = personal_score - ?, seniors = seniors + 1 WHERE email = ?', [seniorCost, email]);
    }

    const updatedUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    return NextResponse.json({
      score: updatedUser.personal_score,
      interns: updatedUser.interns,
      seniors: updatedUser.seniors
    });
  } catch (error) {
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 });
  }
}