import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  // 取得訪客瀏覽器傳來的授權資訊
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // 解碼 Basic Auth 字串
    const [user, pwd] = atob(authValue).split(':');

    // 🔒 在這裡設定你想給客戶的測試帳號跟密碼！
    if (user === 'demo' && pwd === 'test1234') {
      return NextResponse.next(); // 密碼正確，放行讓他們看網頁！
    }
  }

  // 如果沒輸入密碼，或密碼錯誤，強制彈出原生輸入框，並阻擋載入
  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// 設定這道鎖要保護哪些網址 (這裡設定為保護所有路徑)
export const config = {
  matcher: '/:path*',
};