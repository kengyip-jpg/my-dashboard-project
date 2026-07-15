import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { openDashboardDb } from '@/lib/dashboarddb';

export async function POST(request: Request) {
  try {
    // 1. 解析前端傳過來的 FormData (內含檔案與文字)
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('attachment') as File | null;

    if (!email || !title) {
      return NextResponse.json({ error: 'Email and Title are required' }, { status: 400 });
    }

    const db = await openDashboardDb();

    // 2. 驗證權限：確認該 Email 真的存在且是 'user' 角色
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.role !== 'user') {
      return NextResponse.json({ error: 'Forbidden: Only Normal Users can upload forms' }, { status: 403 });
    }

    // 3. 處理檔案上傳 (升級為 Vercel Blob 雲端上傳 🚀)
    let attachmentUrl = '';
    if (file && file.size > 0) {
      // 呼叫 Vercel Blob 的 API 直接把檔案丟上雲端
      // Vercel 會自動幫你處理檔名重複的問題
      const blob = await put(file.name, file, {
        access: 'public', // 設為公開，這樣前端才看得到圖片
      });
      
      // 直接拿到雲端的圖片 HTTPS 網址
      attachmentUrl = blob.url; 
    }

    // 4. 將事件寫入資料庫
    const result = await db.run(
      'INSERT INTO events (user_id, title, description, attachment_url, status) VALUES (?, ?, ?, ?, ?)',
      [user.id, title, description, attachmentUrl, 'pending']
    );

    const newEventId = result.lastID;

    // 5. 【重要連動】發送通知給 Manager
    await db.run(
      'INSERT INTO notifications (event_id, message, is_read) VALUES (?, ?, 0)',
      [newEventId, `New event submitted by ${user.name || email}: "${title}"`]
    );

    return NextResponse.json({ message: 'Form submitted successfully!', eventId: newEventId });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}