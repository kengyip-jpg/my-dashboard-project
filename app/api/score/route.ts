import { NextResponse } from 'next/server';
import { openDashboardDb } from '@/lib/dashboarddb';

export async function POST(request: Request) {
  try {
    const { email, pendingClicks } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = await openDashboardDb();
    
    // 1. 從資料庫撈出這個用戶「真正」擁有的道具數量
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. 計算正當的道具產出 (5 秒鐘的量)
    // 實習生每秒+1，資深每秒+5。5 秒鐘的話就是乘上 5
    const expectedAutoClicks = (user.interns * 1 + user.seniors * 5) * 5;

    // 3. 計算扣除道具產出後，剩下的「手動點擊次數」
    // 如果 pendingClicks 是負數 (代表前端在扣錢買道具)，我們不限制它
    let manualClicks = 0;
    if (pendingClicks > expectedAutoClicks) {
      manualClicks = pendingClicks - expectedAutoClicks;
    }

    // 🔒 【防修外掛機制 1】：限制人類瘋狂連點的極限值
    // 正常人類 5 秒鐘手動點擊很難超過 60 次 (每秒 12 下)。如果超過，直接判定為外掛，只給 60 分！
    if (manualClicks > 60) {
      console.log(`🚨 检测到作弊! ${email} 手动点击异常: ${manualClicks}次`);
      manualClicks = 60; 
    }

    // 🔒 【防多開分頁機制 2】：如果他是負數（前端扣錢買道具），要防範他有沒有改程式碼把扣分改小
    // 這邊我們直接根據後端計算出來的「合理增量」加上去
    const secureIncrement = (pendingClicks < 0) ? pendingClicks : (expectedAutoClicks + manualClicks);

    // 4. 安全地更新分數 (確保分數不會因為扣錢變成負數，用 MAX(0, ...) 保護)
    await db.run(
      'UPDATE users SET personal_score = MAX(0, personal_score + ?) WHERE email = ?',
      [secureIncrement, email]
    );
    
    // 5. 重新撈出最新資料回傳
    const updatedUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    return NextResponse.json({ 
      score: updatedUser.personal_score,
      interns: updatedUser.interns,
      seniors: updatedUser.seniors
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to sync score' }, { status: 500 });
  }
}