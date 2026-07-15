import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function openDashboardDb() {
  const db = await open({
    filename: './user_dashboard.sqlite', // 新的後台專案資料庫檔案
    driver: sqlite3.Database
  });
  
  // 1. 使用者資料表 (包含角色欄位)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT CHECK(role IN ('admin', 'manager', 'user')) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. 表單事件資料表 (由 Normal User 提交，Manager 審核)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      attachment_url TEXT, -- 用來存上傳的圖片或檔案路徑
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. 通知資料表 (當 User 提交事件時，寫入通知給 Manager 看)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0, -- 0 = 未讀, 1 = 已讀
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );
  `);
  
  // 💡 預先塞入三種角色的測試帳號 (如果不存在的話)
  await db.run(`INSERT OR IGNORE INTO users (email, name, role) VALUES ('admin@company.com', 'System Admin', 'admin')`);
  await db.run(`INSERT OR IGNORE INTO users (email, name, role) VALUES ('manager@company.com', 'Team Manager', 'manager')`);
  await db.run(`INSERT OR IGNORE INTO users (email, name, role) VALUES ('user@company.com', 'John Doe', 'user')`);

  return db;
}