import { SystexSolution } from "./services/solutionsData";

export interface Solution {
  title: string;
  description: string;
}

export interface SalesStrategy {
  positioning: string;
  messages: string[];
  next_steps: string[];
}

export interface RecommendedSystexSolution extends SystexSolution {
  reason?: string;
  matchedPainPoints?: string[];
}

export interface AnalysisReport {
  summary: string;
  industry_trends: string[];
  pain_points: string[];
  solutions: Solution[];
  sales_strategy: SalesStrategy;
  recommendedSolutions?: RecommendedSystexSolution[];
}

export interface CustomerFormData {
  industry: string;
  website: string;
  companyName: string;
  companyId: string;
  rawData: string;
}
