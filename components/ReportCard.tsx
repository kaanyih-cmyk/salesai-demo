import React, { useState } from 'react';
import { AnalysisReport, RecommendedSystexSolution } from '../types';
import { generateRecommendedSolutions } from '../services/geminiService';
import { 
  TrendingUp, 
  AlertTriangle, 
  Target,
  ArrowRight,
  Loader2,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Zap,
  Building2
} from 'lucide-react';

interface ReportCardProps {
  report: AnalysisReport;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const [showSolutions, setShowSolutions] = useState(false);
  const [solutions, setSolutions] = useState<RecommendedSystexSolution[]>(report.recommendedSolutions || []);
  const [isFetchingSolutions, setIsFetchingSolutions] = useState(false);
  const [solutionsError, setSolutionsError] = useState<string | null>(null);

  const handleSearchSolutions = async () => {
    setIsFetchingSolutions(true);
    setSolutionsError(null);
    try {
      const results = await generateRecommendedSolutions(report.pain_points);
      setSolutions(results);
      setShowSolutions(true);
    } catch (err: any) {
      console.error("Fetch solutions error:", err);
      setSolutionsError(err.message || "搜尋失敗，請稍後再試");
    } finally {
      setIsFetchingSolutions(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Summary Section */}
      <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 border border-slate-700/50 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="bg-primary-500/20 text-primary-400 p-2 rounded-lg">
            <Target size={20} />
          </span>
          客戶背景摘要
        </h2>
        <p className="text-slate-300 text-base leading-relaxed">{report.summary}</p>
      </div>

      {/* Industry Trends */}
      <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 border border-slate-700/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">
            <TrendingUp size={20} />
          </span>
          產業趨勢
        </h3>
        <div className="space-y-4">
          {report.industry_trends?.map((trend, idx) => (
            <div key={idx} className="bg-slate-900/40 rounded-lg p-5 border border-slate-700/30">
              <p className="text-slate-200 text-base leading-7">
                {trend}
              </p>
            </div>
          )) || <p className="text-slate-500">暫無產業趨勢資料</p>}
        </div>
      </div>

      {/* Pain Points */}
      <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 border border-slate-700/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="bg-amber-500/20 text-amber-400 p-2 rounded-lg">
            <AlertTriangle size={20} />
          </span>
          客戶痛點
        </h3>
        <div className="space-y-4">
          {report.pain_points?.map((point, idx) => (
            <div key={idx} className="bg-slate-900/40 rounded-lg p-5 border border-slate-700/30">
              <p className="text-slate-200 text-base leading-7">
                {point}
              </p>
            </div>
          )) || <p className="text-slate-500">暫無痛點分析</p>}
        </div>
      </div>

      {/* Search Button Section */}
      {!showSolutions && (
        <section className="mt-8">
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5 shadow-inner">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-50">
                  搜尋精誠推薦解決方案
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  依據客戶痛點，自動比對精誠既有解決方案，點擊下方按鈕開始搜尋。
                </p>
              </div>
              <button
                type="button"
                onClick={handleSearchSolutions}
                disabled={isFetchingSolutions}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:bg-violet-500/50 disabled:cursor-not-allowed text-sm font-medium text-white shadow-md transition-all min-w-[120px]"
              >
                {isFetchingSolutions ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>搜尋中...</span>
                  </>
                ) : (
                  <>
                    <span>開始搜尋</span>
                    <span>🔍</span>
                  </>
                )}
              </button>
            </div>
            
            {solutionsError && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{solutionsError}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recommended Systex Solutions (Expanded) */}
      {showSolutions && (
        <section className="mt-8 animate-fade-in-up w-full">
          <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 border border-slate-700/50 backdrop-blur-sm w-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  精誠推薦解決方案
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  依據客戶痛點，自動比對精誠集團既有解決方案供業務提案參考。
                </p>
              </div>
            </div>

            {solutions.length > 0 ? (
              <div className="flex flex-col gap-8 w-full">
                {solutions.map((s, idx) => (
                  <div
                    key={idx}
                    className="relative flex flex-col w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-6 md:p-8 hover:border-violet-500/50 transition-all duration-300 group shadow-sm overflow-hidden"
                  >
                     {/* Light background accent */}
                    <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none z-0">
                      <Lightbulb size={150} />
                    </div>

                    {/* 1. Header Row: Owner Unit & Pain Points */}
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6 pb-6 border-b border-slate-700/60">
                      {/* Left: Owner Unit */}
                      <div>
                         {s.ownerUnit && (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-cyan-200 bg-cyan-500/15 border border-cyan-500/25 text-sm md:text-base font-medium">
                            <Building2 size={18} className="shrink-0" />
                            {s.ownerUnit}
                          </div>
                        )}
                      </div>

                      {/* Right: Pain Points */}
                       {s.matchedPainPoints && s.matchedPainPoints.length > 0 && (
                         <div className="flex flex-wrap gap-2 md:justify-end md:max-w-[60%]">
                           {s.matchedPainPoints.map((mp, i) => (
                             <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm md:text-base bg-red-500/10 text-red-300 rounded-lg border border-red-500/20 whitespace-normal break-words leading-snug">
                               <CheckCircle2 size={16} className="shrink-0" />
                               {mp}
                             </span>
                           ))}
                         </div>
                       )}
                    </div>

                    {/* 2. Main Content Grid */}
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      {/* Left Column: Title, Summary, Link */}
                      <div className="flex flex-col gap-4">
                         <h3 className="text-2xl md:text-3xl font-bold text-slate-50 group-hover:text-violet-300 transition-colors leading-tight">
                          {s.title}
                         </h3>
                         <p className="text-base md:text-lg text-slate-300 leading-relaxed whitespace-pre-line">
                           {s.summary}
                         </p>
                         
                         {s.sourceLink && (
                            <div className="mt-4">
                              <a href={s.sourceLink} target="_blank" rel="noreferrer" className="inline-flex items-center text-violet-400 hover:text-violet-300 text-base font-medium transition-colors hover:translate-x-1 duration-200">
                                了解更多 <ArrowRight size={18} className="ml-1" />
                              </a>
                            </div>
                          )}
                      </div>

                      {/* Right Column: Reasoning & Pitch */}
                      <div className="flex flex-col gap-4">
                         {/* Reason */}
                         {s.reason && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 h-full">
                              <div className="flex items-center gap-2 text-violet-300 text-base font-bold mb-3">
                                 <Lightbulb size={20} />
                                 推薦理由
                               </div>
                               <p className="text-slate-200 text-base leading-relaxed">
                                 {s.reason}
                               </p>
                            </div>
                         )}

                         {/* Pitch */}
                         {s.valuePitch && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 h-full">
                              <div className="flex items-center gap-2 text-amber-200 text-base font-bold mb-3">
                                 <Zap size={20} className="fill-amber-500/20" />
                                 業務話術
                               </div>
                               <p className="text-slate-200 text-base leading-relaxed italic">
                                 "{s.valuePitch}"
                               </p>
                            </div>
                         )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="bg-slate-900/50 rounded-xl p-12 text-center border border-slate-700/50 border-dashed">
                 <Lightbulb className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                 <h3 className="text-lg font-medium text-slate-300 mb-2">無精確匹配方案</h3>
                 <p className="text-slate-500 text-sm max-w-md mx-auto">
                   目前沒有找到完全匹配的解決方案，建議參考報告中的通用型建議。
                 </p>
               </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
