import type { CustomerFormData, AnalysisReport, RecommendedSystexSolution } from "../types";

/**
 * 前端只做「呼叫後端 API」
 * ✅ 這個檔案不應該再出現 GoogleGenAI / prompt / apiKey
 */

/** 產生 AI 分析報告：改成呼叫後端 /api/generateAnalysis */
export const generateAnalysis = async (
  data: CustomerFormData
): Promise<AnalysisReport> => {
  const resp = await fetch("/api/generateAnalysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    // 後端若回 { error: "..." } 會走這裡
    throw new Error(result?.error || "Failed to call analysis API");
  }

  return result as AnalysisReport;
};

/**
 * （可選）公司資料補全：如果你沒有做後端補全 API，就先「原樣回傳」
 * 之後你要做成 /api/enrichCompany 再把這裡改成 fetch 即可。
 */
export const enrichCompanyDataIfNeeded = async (
  data: CustomerFormData
): Promise<Partial<CustomerFormData>> => {
  return data;
};

/** 推薦解決方案：改成呼叫後端 /api/recommendSolutions（如果你有做這支 API） */
export const generateRecommendedSolutions = async (
  painPoints: string[]
): Promise<RecommendedSystexSolution[]> => {
  const resp = await fetch("/api/recommendSolutions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ painPoints }),
  });

  const result = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new Error(result?.error || "Failed to call recommendSolutions API");
  }

  return (result?.solutions || result) as RecommendedSystexSolution[];
};
