import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Loader2, BarChart3, Building2, Globe, Search, ArrowRight } from 'lucide-react';
import { InputField } from './components/InputField';
import { ReportCard } from './components/ReportCard';
import { generateAnalysis, enrichCompanyDataIfNeeded } from './services/geminiService';
import { CustomerFormData, AnalysisReport } from './types';

// --- Data Definitions ---

const INDUSTRIES = [
  "資訊服務與軟體",
  "半導體 / 電子製造",
  "金融與保險",
  "製造業",
  "零售與電商",
  "電信與媒體",
  "醫療與生技",
  "政府與公共服務",
  "運輸與物流",
  "能源與公用事業",
  "其他"
];

interface CompanyProfile {
  name: string;
  keywordTokens: string[];
  companyId: string;
  website: string;
  industry: string;
  description: string;
}

const COMPANY_DB: CompanyProfile[] = [
  {
    name: "台灣積體電路製造股份有限公司（TSMC）",
    keywordTokens: ['台積', '台積電', 'TSMC', '2330'],
    companyId: '22099131',
    website: 'https://www.tsmc.com',
    industry: '半導體 / 電子製造',
    description: '台積電 (TSMC) 是全球領先的積體電路製造服務公司，成立於 1987 年，開創了專業積體電路製造服務商業模式。台積電專注於為客戶生產各種晶片，廣泛應用於電腦產品、通訊產品與消費性電子產品等多樣化領域。近年來，隨著高效能運算 (HPC)、人工智慧 (AI)、車用電子等新興科技的快速發展，台積電在先進製程技術 (如 3nm, 2nm) 保持全球領先地位。\n\n在數位轉型與 AI 導入情境方面，台積電不僅是 AI 晶片的製造者，自身也積極推動智慧製造 (Smart Manufacturing)。他們大量利用大數據分析、機器學習與自動化系統來優化良率、提升生產效率並預測機台維護需求。對於供應商或合作夥伴而言，若能提供協助其強化資安防護、提升供應鏈韌性、或優化綠色製造 (ESG) 的 AI 解決方案，將具有極高的切入價值。'
  },
  {
    name: "Google LLC（Google）",
    keywordTokens: ['Goog', 'Google', '谷歌', 'Alphabet'],
    companyId: 'NA',
    website: 'https://www.google.com',
    industry: '資訊服務與軟體',
    description: 'Google LLC 是一家專注於網際網路相關服務與產品的美國跨國科技公司，其業務範圍涵蓋搜尋引擎、雲端運算、軟體與硬體技術。作為 Alphabet Inc. 的子公司，Google 不僅主導全球搜尋市場，更透過 Google Cloud Platform (GCP) 為全球企業提供基礎設施現代化、數據分析與 AI/ML 服務。\n\n在企業市場 (B2B) 方面，Google 積極推廣其 Workspace 辦公套件與 Gemini 企業版，協助企業進行協作與生產力轉型。對於想要打入 Google 生態系的合作夥伴，關鍵在於能否運用 Google 的技術堆疊 (如 Vertex AI, BigQuery) 開發出具備產業垂直整合能力的應用，或是提供能優化多雲 (Multi-cloud) 管理、強化數據治理的第三方工具。此外，Google 高度重視可持續發展，能協助其達成 24/7 無碳能源目標的能源管理解決方案也是潛在切入點。'
  },
  {
    name: "聯發科技股份有限公司（MediaTek）",
    keywordTokens: ['聯發科', 'MediaTek', 'MTK', '2454'],
    companyId: '24540000',
    website: 'https://www.mediatek.com',
    industry: '半導體 / 電子製造',
    description: '聯發科技是全球第四大無晶圓廠半導體公司，在行動通訊、智慧家庭、無線連接技術等領域居於市場領先地位。每年驅動超過 20 億台終端裝置。近期積極佈局 AIoT 與邊緣運算晶片。\n\n面臨的挑戰包括高階手機晶片市場的激烈競爭以及研發人才的短缺。對於 AI 解決方案供應商，聯發科可能對能加速晶片設計流程 (EDA AI)、優化程式碼開發效率、或是提升跨國團隊協作效率的企業級軟體感興趣。'
  }
];

const INITIAL_DATA: CustomerFormData = {
  industry: '',
  website: '',
  companyName: '',
  companyId: '',
  rawData: ''
};

export default function App() {
  const [formData, setFormData] = useState<CustomerFormData>(INITIAL_DATA);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI States
  const [hasGeneratedReport, setHasGeneratedReport] = useState(false);
  const [suggestions, setSuggestions] = useState<CompanyProfile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Keyboard navigation state
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
  // Track selected company to manage data consistency
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  
  const formRef = useRef<HTMLDivElement>(null);

  const handleScrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // If the user manually changes the Company Name, we must clear related fields
      // to ensure they don't accidentally send "Starbucks" with "TSMC" data.
      if (name === 'companyName') {
        newData.website = '';
        newData.companyId = '';
        newData.rawData = '';
        newData.industry = ''; // Also reset industry to force re-selection for validity
      }
      return newData;
    });

    // Company Autocomplete Logic
    if (name === 'companyName') {
      // User is typing manually, so we are no longer "locked" to a suggested company
      setSelectedCompany(null);
      setActiveSuggestionIndex(null);

      if (value.length >= 2) {
        const matched = COMPANY_DB.filter(c => 
          c.name.toLowerCase().includes(value.toLowerCase()) || 
          c.keywordTokens.some(k => k.toLowerCase().includes(value.toLowerCase()))
        );
        setSuggestions(matched);
        setShowSuggestions(matched.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const handleSelectCompany = (company: CompanyProfile) => {
    setFormData({
      companyName: company.name,
      companyId: company.companyId,
      website: company.website,
      industry: company.industry,
      rawData: company.description // Auto-fill description into Raw Data
    });
    setSelectedCompany(company); // Record that we are using a valid selected company
    setShowSuggestions(false);
    setActiveSuggestionIndex(null);
    setError(null); // Clear any previous validation errors
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prevIndex) => {
        if (prevIndex === null) return 0;
        return (prevIndex + 1) % suggestions.length;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prevIndex) => {
        if (prevIndex === null) return suggestions.length - 1;
        return (prevIndex - 1 + suggestions.length) % suggestions.length;
      });
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex !== null) {
        e.preventDefault(); // Prevent form submission
        handleSelectCompany(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.companyName.trim()) {
      setError("請先輸入公司名稱");
      return;
    }
    if (!formData.industry) {
      setError("請選擇產業領域");
      return;
    }

    setLoading(true);
    setError(null);
    setHasGeneratedReport(false); // Reset view temporarily

    try {
      // Step 1: Enrich Data (if rawData or website is missing)
      let dataToAnalyze = { ...formData };
      
      try {
        const enriched = await enrichCompanyDataIfNeeded(dataToAnalyze);
        dataToAnalyze = { ...dataToAnalyze, ...enriched };
        setFormData(dataToAnalyze); // Update UI with enriched data
      } catch (enrichError) {
        console.warn("Company data enrichment failed, proceeding with original data:", enrichError);
        // Continue to generate analysis even if enrichment fails
      }

      // Step 2: Generate Analysis Report
      const result = await generateAnalysis(dataToAnalyze);
      
      // Ensure we have a valid result before proceeding
      if (!result) {
        throw new Error("分析結果為空，請重試");
      }
      
      setReport(result);
      setHasGeneratedReport(true);
      // Wait a tick for render then scroll to results
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error("Analysis generation failed:", err);
      setError(err.message || "分析生成失敗，請稍後再試。");
      // Ensure results are not shown on error
      setHasGeneratedReport(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white opacity-80 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-16 sm:pt-24 sm:pb-20 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-6 animate-fade-in-up">
              <Sparkles size={16} />
              <span>SalesAI 智能銷售助手</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              讓 AI 幫你梳理 <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">B2B 開發與銷售策略</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed">
              輸入潛在客戶資訊，秒生成結合精誠團隊 AI 解決方案的深度攻單策略。<br className="hidden sm:block" />
              支援 Gemini 實時分析，洞察產業趨勢與客戶痛點。
            </p>
            <button 
              onClick={handleScrollToForm}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              立即 Demo
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-12 -mt-10 relative z-20">
        
        {/* Central Input Card */}
        <div ref={formRef} className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 ring-1 ring-white/10">
          <div className="relative">
             {/* Decorative Top Gradient */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-500" />
            
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
                      <BarChart3 size={24} />
                    </div>
                    輸入目標客戶資料
                  </h2>
                  <p className="text-slate-400 mt-2 text-sm">請填寫以下欄位，AI 將為您生成專屬分析報告。</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700 text-xs text-slate-400">
                  <Bot size={14} />
                  Powered by Gemini 3 Pro
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Industry Select */}
                  <InputField 
                    label="產業領域 (必填)"
                    name="industry"
                    type="select"
                    value={formData.industry}
                    onChange={handleInputChange}
                    options={INDUSTRIES}
                    placeholder="請選擇產業類別"
                  />

                  {/* Company Name with Autocomplete */}
                  <div className="relative">
                    <InputField 
                      label="公司名稱 (必填)"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="請輸入關鍵字，例如：台積、Google..."
                      autoComplete="off"
                    />
                    {showSuggestions && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-50 border-b border-slate-100">
                          建議公司清單
                        </div>
                        {suggestions.map((company, index) => {
                          const isActive = index === activeSuggestionIndex;
                          return (
                            <button
                              key={company.name}
                              type="button"
                              onClick={() => handleSelectCompany(company)}
                              onMouseEnter={() => setActiveSuggestionIndex(index)}
                              className={`w-full text-left px-4 py-3 transition-colors border-b border-slate-100 last:border-0 group ${
                                isActive 
                                  ? 'bg-indigo-50' 
                                  : 'hover:bg-indigo-50'
                              }`}
                            >
                              <div className={`font-medium group-hover:text-indigo-700 ${isActive ? 'text-indigo-700' : 'text-slate-900'}`}>
                                {company.name}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{company.industry}</span>
                                {company.website && <span className="flex items-center gap-1"><Globe size={10} /> {new URL(company.website).hostname}</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField 
                    label="公司網址 (選填)"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="www.example.com"
                    type="url"
                  />
                  <InputField 
                    label="公司統一編號 (選填)"
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleInputChange}
                    placeholder="8 碼統一編號"
                  />
                </div>

                <InputField 
                  label="補充資料 / Raw Data (AI 將自動生成 100~200 字分析)"
                  name="rawData"
                  value={formData.rawData}
                  onChange={handleInputChange}
                  type="textarea"
                  rows={5}
                  placeholder="可貼上新聞、財報、活動紀錄或你對這家公司的理解 (選填)..."
                />

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span>
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary-500/25 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        Gemini 正在深入分析中...
                      </>
                    ) : (
                      <>
                        <Sparkles size={24} />
                        ⚡ 生成 AI 分析報告
                      </>
                    )}
                  </button>
                  <p className="text-center text-slate-500 text-xs mt-3">
                    點擊生成即表示您同意使用 Google Gemini Pro 進行資料處理。
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Results Section - Only shown after generation */}
        {hasGeneratedReport && report && (
          <div className="mt-12 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6 px-2">
              <div className="h-px bg-slate-300 flex-1" />
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="text-indigo-600" />
                分析報告結果
              </h3>
              <div className="h-px bg-slate-300 flex-1" />
            </div>
            
            <div className="bg-slate-900 rounded-2xl p-6 md:p-8 shadow-2xl ring-1 ring-slate-900/5">
               <ReportCard report={report} />
               
               <div className="mt-8 flex justify-center">
                 <button 
                   onClick={() => window.print()}
                   className="text-slate-400 hover:text-white text-sm underline decoration-slate-600 underline-offset-4"
                 >
                   列印或儲存此報告
                 </button>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} SalesAI Analytics. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
}