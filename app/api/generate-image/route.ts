import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { environment, furniture, description } = body;

    if (!environment || !furniture) {
      return NextResponse.json({ error: 'Environment and furniture are required' }, { status: 400 });
    }

    // 🪄 咒語擴寫
    const magicPrompt = `A photorealistic interior design of a ${environment}. The room prominently features a ${furniture}. ${description ? description + '.' : ''} Professional architectural photography, 8k resolution, highly detailed, beautiful cinematic lighting, masterpiece.`;

    console.log("正在召喚奈米香蕉 PRO 引擎，使用的咒語是:", magicPrompt);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       return NextResponse.json({ error: 'API Key is missing' }, { status: 500 });
    }

    // 🚀 換成呼叫最新的 nano-banana-pro-preview 模型，並使用 generateContent 方法
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 新版 API 的資料結構長得不太一樣
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: magicPrompt }
              ]
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

    // 🎨 解析新版 API 回傳的圖片
    // 新版模型會把圖片放在 candidates -> content -> parts 裡面的 inlineData 中
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