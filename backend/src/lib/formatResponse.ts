interface RankingItem {
  vendorName: string;
  rank: number;
  pros: string[];
  cons: string[];
}
export const formatComparisonToParagraph = (evaluation: any) => {
  const winnerLine = `Winner Recommendation: ${
    evaluation?.winner?.name || "N/A"
  }. ${evaluation?.winner?.reason || ""}`;

  const summaryLine = `\n\nAnalysis Summary: ${
    evaluation?.comparisonSummary || ""
  }`;

  const rankingLines = (evaluation?.rankings || [])
    .map((r: RankingItem) => {
      return `• Rank ${r.rank}: ${r.vendorName} - Pros: ${
        r?.pros?.join(", ") || "None"
      }. Cons: ${r?.cons?.join(", ") || "None"}.`;
    })
    .join("\n");

  return `${winnerLine}${summaryLine}\n\nDetailed Rankings:\n${rankingLines}`;
};
