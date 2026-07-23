import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 1. 接收前端傳來的資料，加入 avatarImage
    const { environment, furniture, description, avatarImage } = body;

    if (!environment || !furniture) {
      return NextResponse.json({ error: 'Environment and furniture are required' }, { status: 400 });
    }

    // 2. 🪄 咒語擴寫
    let magicPrompt = `A photorealistic interior design of a ${environment}. The room prominently features a ${furniture}. ${description ? description + '.' : ''} Professional architectural photography, 8k resolution, highly detailed, beautiful cinematic lighting, masterpiece.`;

    // 🌟 如果偵測到有上傳照片，就在咒語加上人物的設定
    if (avatarImage) {
      magicPrompt += ` There is a person naturally present in the room, blending perfectly with the environment's lighting and interior style.`;
    }

    console.log("正在召喚奈米香蕉 PRO 引擎，使用的咒語是:", magicPrompt);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       return NextResponse.json({ error: 'API Key is missing' }, { status: 500 });
    }

    // 3. 準備送給 Google API 的 parts 陣列 (第一部分永遠是文字咒語)
    const parts: any[] = [
      { text: magicPrompt }
    ];

    // 4. 📸 如果有照片，解析 Base64 格式並塞進 parts 裡面
    if (avatarImage) {
      // 前端傳來的格式是 "data:image/jpeg;base64,/9j/4AAQ..."
      // 我們用正則表達式把它切開，分離出 mimeType (如 image/jpeg) 和純資料字串
      const matches = avatarImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
        console.log("📸 偵測到使用者上傳照片，已成功附加上傳圖檔，啟動圖生圖 (Multimodal) 模式！");
      } else {
        console.log("⚠️ 照片格式解析失敗，將退回純文字生圖模式。");
      }
    }

    // 5. 🚀 呼叫你的 nano-banana-pro-preview 模型
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: parts // 這裡換成我們剛剛動態組合好的 parts 陣列
            }
          ]
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Google API 報錯:", data);
      return NextResponse.json({ error: data.error?.message || 'API Error' }, { status: response.status });
    }

    // 6. 🎨 解析新版 API 回傳的圖片 (維持你原本的邏輯，這段完全不需動)
    const generatedPart = data.candidates?.[0]?.content?.parts?.[0];
    
    if (generatedPart?.inlineData) {
      const base64Image = generatedPart.inlineData.data;
      const mimeType = generatedPart.inlineData.mimeType || 'image/jpeg';
      const imageUrl = `data:${mimeType};base64,${base64Image}`;
      
      return NextResponse.json({ imageUrl });
    } else {
      console.error("未找到圖片資料，API 回傳:", data);
      return NextResponse.json({ error: '模型沒有回傳圖片' }, { status: 500 });
    }

  } catch (error) {
    console.error("系統發生未預期錯誤:", error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}