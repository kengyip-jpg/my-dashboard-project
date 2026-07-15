import { db } from '@vercel/postgres';

export async function openDashboardDb() {
  // 連線到 Vercel (Supabase) 雲端資料庫
  const client = await db.connect();
  
  // 1. 使用者資料表 (AUTOINCREMENT 變成 SERIAL，DATETIME 變成 TIMESTAMP)
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) CHECK(role IN ('admin', 'manager', 'user')) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. 表單事件資料表
  await client.query(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      attachment_url TEXT,
      status VARCHAR(50) CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. 通知資料表
  await client.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );
  `);
  
  // 💡 預先塞入三種角色的測試帳號 (SQLite 的 INSERT OR IGNORE 變成 ON CONFLICT DO NOTHING)
  await client.query(`INSERT INTO users (email, name, role) VALUES ('admin@company.com', 'System Admin', 'admin') ON CONFLICT (email) DO NOTHING;`);
  await client.query(`INSERT INTO users (email, name, role) VALUES ('manager@company.com', 'Team Manager', 'manager') ON CONFLICT (email) DO NOTHING;`);
  await client.query(`INSERT INTO users (email, name, role) VALUES ('user@company.com', 'John Doe', 'user') ON CONFLICT (email) DO NOTHING;`);

  // =========================================================================
  // 🚀 魔法轉接器 (Adapter)：
  // 讓你的 API 完全不用改，自動把 SQLite 語法翻譯成 Postgres 語法
  // =========================================================================
  return {
    async get(query: string, params: any[] = []) {
      let i = 1;
      const pgQuery = query.replace(/\?/g, () => `$${i++}`); // 將 ? 轉換成 $1, $2
      const { rows } = await client.query(pgQuery, params);
      return rows[0];
    },
    async all(query: string, params: any[] = []) {
      let i = 1;
      const pgQuery = query.replace(/\?/g, () => `$${i++}`);
      const { rows } = await client.query(pgQuery, params);
      return rows;
    },
    async run(query: string, params: any[] = []) {
      let i = 1;
      let finalQuery = query.replace(/\?/g, () => `$${i++}`);
      
      // 模擬 SQLite 的 lastID 功能
      if (finalQuery.trim().toUpperCase().startsWith('INSERT')) {
        finalQuery += ' RETURNING id';
      }
      
      const { rows } = await client.query(finalQuery, params);
      return { lastID: rows[0]?.id };
    }
  };
}