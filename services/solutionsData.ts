export type SystexSolution = {
  id: string;
  title: string;
  summary: string;        // 100–200字摘要
  painPoints: string[];   // 可解的痛點（用於比對）
  valuePitch: string;     // 80–120字業務話術
  ownerUnit: string;      // 精誠負責單位
  sourceType: "ppt_or_pdf";
  sourceFileName: string;
  sourceLink?: string;
};

function splitPainPoints(input: string): string[] {
  // 支援 "；" ";" "," "，" 以及換行
  return input
    .split(/[\n;,，；]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

export const SYSTEX_SOLUTIONS: SystexSolution[] = [
  {
    id: "systex-hybrid-rag-ai-data-copilot",
    title: "AI數據幕僚（SYSTEX Hybrid RAG 平台）",
    summary:
      "AI數據幕僚（SYSTEX Hybrid RAG 平台）是一套專為企業高階管理層與部門主管打造的 AI 決策輔助平台。透過 Hybrid RAG 架構，整合企業內部的結構化與非結構化資料，如 ERP、MES、Excel、報表與會議紀錄，讓資料不再分散於多個系統。平台可即時以自然語言查詢關鍵資訊，支援跨部門決策分析，協助企業提升決策效率與營運敏捷度。",
    painPoints: splitPainPoints(
      "資料分散,查詢依賴IT,決策速度慢,跨部門資訊不透明,知識無法重用"
    ),
    valuePitch:
      "我們協助您打造一位真正能「隨問即答」的 AI 數據幕僚，讓主管不必再等待 IT 或整理報表，只要用自然語言就能即時掌握營運關鍵。透過整合企業內部資料與 AI 分析能力，幫助您在決策速度、組織效率與知識管理上全面升級，讓數據真正成為管理優勢。",
    ownerUnit: "智慧應用中心 / AI 數據平台事業部",
    sourceType: "ppt_or_pdf",
    sourceFileName: "AI數據幕僚_SYSTEX_Hybrid_RAG平台_客戶版_20250720.pdf",
    sourceLink: ""
  }
];
