import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

const modelId = "models/gemini-1.5-pro";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS（讓前端可以呼叫）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });

    const ai = new GoogleGenAI({ apiKey });

    const data = req.body;

    const prompt = `
請擔任一位頂尖的 B2B 銷售顧問與產業分析師。
我將提供關於潛在客戶的資訊，請你根據這些資訊生成一份結構化的銷售分析報告。

客戶資訊如下：
- 產業別: ${data.industry}
- 公司名稱: ${data.companyName}
- 公司網站: ${data.website}
- 公司統編/ID: ${data.companyId}
- 原始情資:
"""
${data.rawData}
"""

請回傳繁體中文，並嚴格遵守 JSON 格式（不要加任何多餘文字）。
    `.trim();

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            industry_trends: { type: Type.ARRAY, items: { type: Type.STRING } },
            pain_points: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summary", "industry_trends", "pain_points"],
        },
      },
    });

    const text = response.text;
    if (!text) return res.status(500).json({ error: "Empty response from Gemini" });

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "INVALID_JSON", raw: text });
    }

    return res.status(200).json(json);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}


