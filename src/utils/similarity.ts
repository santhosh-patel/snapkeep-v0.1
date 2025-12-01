// Duplicate detection utilities

export interface SimilarityResult {
  score: number;
  matchedFile: {
    id: string;
    name: string;
  };
  matchType: 'exact' | 'high' | 'medium' | 'low';
}

// Simple text similarity using Jaccard index
function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 && words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Check file name similarity
function fileNameSimilarity(name1: string, name2: string): number {
  const clean1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (clean1 === clean2) return 1;
  
  // Check if one contains the other
  if (clean1.includes(clean2) || clean2.includes(clean1)) {
    return 0.8;
  }
  
  // Levenshtein-like similarity (simplified)
  const maxLen = Math.max(clean1.length, clean2.length);
  if (maxLen === 0) return 0;
  
  let matches = 0;
  const len = Math.min(clean1.length, clean2.length);
  for (let i = 0; i < len; i++) {
    if (clean1[i] === clean2[i]) matches++;
  }
  
  return matches / maxLen;
}

export function findDuplicates(
  newFileText: string,
  newFileName: string,
  existingFiles: Array<{ id: string; name: string; extractedText: string }>
): SimilarityResult[] {
  const results: SimilarityResult[] = [];

  for (const file of existingFiles) {
    const textSimilarity = jaccardSimilarity(newFileText, file.extractedText);
    const nameSimilarity = fileNameSimilarity(newFileName, file.name);
    
    // Weighted score: text similarity is more important
    const score = textSimilarity * 0.7 + nameSimilarity * 0.3;
    
    let matchType: SimilarityResult['matchType'];
    if (score >= 0.9) {
      matchType = 'exact';
    } else if (score >= 0.7) {
      matchType = 'high';
    } else if (score >= 0.5) {
      matchType = 'medium';
    } else {
      matchType = 'low';
    }

    if (score >= 0.5) {
      results.push({
        score,
        matchedFile: { id: file.id, name: file.name },
        matchType,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function formatSimilarityPercentage(score: number): string {
  return `${Math.round(score * 100)}%`;
}
