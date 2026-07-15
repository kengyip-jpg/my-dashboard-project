import { NextResponse } from 'next/server';
import { openDashboardDb } from '@/lib/dashboarddb'; // 確保路徑與你的新 db 檔名一致
import fs from 'fs';
import path from 'path';

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

    // 3. 處理檔案上傳
    let attachmentUrl = '';
    if (file && file.size > 0) {
      // 確保 public/uploads 資料夾存在
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // 防止檔名重複，加上時間戳記
      const uniqueFileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(uploadDir, uniqueFileName);
      
      // 將 File 物件轉成 Buffer 並寫入硬碟
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.promises.writeFile(filePath, buffer);
      
      // 未來前端可以直接用這個網址存取圖片
      attachmentUrl = `/uploads/${uniqueFileName}`;
    }

    // 4. 將事件寫入 SQLite 的 events 表格
    const result = await db.run(
      'INSERT INTO events (user_id, title, description, attachment_url, status) VALUES (?, ?, ?, ?, ?)',
      [user.id, title, description, attachmentUrl, 'pending']
    );

    const newEventId = result.lastID;

    // 5. 【重要連動】發送通知給 Manager
    // 當 User 提交事件時，自動在 notifications 表格塞入一筆未讀資料
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