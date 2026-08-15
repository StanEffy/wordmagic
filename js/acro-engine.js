/**
 * WordMagic Acro-Prose Engine (Движок Акро-прозы)
 * Processes source texts into character target streams, provides real-time letter-by-letter prompts,
 * and handles strict normalization (no Ь/Ъ, Й->И, Ё->Е) & optional sound variability / phonetics.
 */

export class AcroEngine {
  // Russian Voiced / Unvoiced Consonants
  static PHONETIC_PAIRS = {
    'б': 'п', 'п': 'б',
    'в': 'ф', 'ф': 'в',
    'г': 'к', 'к': 'г',
    'д': 'т', 'т': 'д',
    'ж': 'ш', 'ш': 'ж',
    'з': 'с', 'с': 'з',
    'ц': 'с', 'ч': 'щ',
    'щ': 'ч'
  };

  // Vowel Reduction / Sound Equivalences
  static VOWEL_GROUPS = [
    new Set(['о', 'а']),
    new Set(['е', 'и', 'э']),
    new Set(['я', 'а']),
    new Set(['ю', 'у']),
    new Set(['ё', 'о', 'е'])
  ];

  /**
   * Normalize a character under strict or phonetic rules
   */
  static normalizeCharStrict(char) {
    if (!char) return '';
    let c = char.toLowerCase();
    
    // Default Strict Rules:
    // 1. Drop Ь and Ъ
    if (c === 'ь' || c === 'ъ') return '';

    // 2. Й -> И, Ё -> Е
    if (c === 'й') return 'и';
    if (c === 'ё') return 'е';

    return c;
  }

  /**
   * Build target character stream from arbitrary source text
   */
  static buildTargetStream(sourceText, config = {}) {
    if (!sourceText || typeof sourceText !== 'string') return [];

    const stream = [];
    const chars = Array.from(sourceText);

    for (let i = 0; i < chars.length; i++) {
      const originalChar = chars[i];
      // Check if it's a letter (Unicode Russian/Latin)
      if (/\p{L}/u.test(originalChar)) {
        const norm = this.normalizeCharStrict(originalChar);
        if (norm !== '') {
          stream.push({
            index: stream.length,
            originalChar,
            char: norm.toUpperCase(),
            rawChar: norm
          });
        }
      }
    }

    return stream;
  }

  /**
   * Extract input tokens from author's prose based on trigger mode
   */
  static extractAuthorTokens(text, trigger = 'words') {
    if (!text || typeof text !== 'string') return [];

    if (trigger === 'sentences') {
      const sentences = text.split(/[.!?…\n]+/).map(s => s.trim()).filter(s => s.length > 0);
      return sentences.map((s, idx) => {
        const firstLetterMatch = s.match(/\p{L}/u);
        const rawFirstLetter = firstLetterMatch ? firstLetterMatch[0] : '';
        return {
          index: idx,
          token: s,
          initial: this.normalizeCharStrict(rawFirstLetter),
          rawInitial: rawFirstLetter
        };
      });
    }

    if (trigger === 'paragraphs') {
      const paras = text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
      return paras.map((p, idx) => {
        const firstLetterMatch = p.match(/\p{L}/u);
        const rawFirstLetter = firstLetterMatch ? firstLetterMatch[0] : '';
        return {
          index: idx,
          token: p,
          initial: this.normalizeCharStrict(rawFirstLetter),
          rawInitial: rawFirstLetter
        };
      });
    }

    // Default: 'words' - first letter of each word
    const words = text.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || [];
    return words.map((w, idx) => {
      const firstLetterMatch = w.match(/\p{L}/u);
      const rawFirstLetter = firstLetterMatch ? firstLetterMatch[0] : '';
      return {
        index: idx,
        token: w,
        initial: this.normalizeCharStrict(rawFirstLetter),
        rawInitial: rawFirstLetter
      };
    });
  }

  /**
   * Test character match under strict vs phonetic rules
   * Returns: 'exact' | 'phonetic' | false
   */
  static checkMatch(typedRaw, targetRaw, mode = 'strict') {
    const typed = this.normalizeCharStrict(typedRaw);
    const target = this.normalizeCharStrict(targetRaw);

    if (!typed || !target) return false;

    // Strict exact match (Default)
    if (typed === target) {
      return 'exact';
    }

    // If phonetic mode enabled, test sound equivalence
    if (mode === 'phonetic') {
      // Check voiced/unvoiced consonants pair
      if (this.PHONETIC_PAIRS[target] === typed) {
        return 'phonetic';
      }

      // Check vowel group reduction
      for (const set of this.VOWEL_GROUPS) {
        if (set.has(target) && set.has(typed)) {
          return 'phonetic';
        }
      }
    }

    return false;
  }

  /**
   * Evaluate full prose state against target stream
   */
  static evaluateState(authorText, targetStream, config = {}, startOffset = 0) {
    const mode = config.mode || 'strict';
    const trigger = config.trigger || 'words';

    const authorTokens = this.extractAuthorTokens(authorText, trigger);
    const evaluatedTokens = [];

    let currentStreamIdx = Math.min(targetStream.length, Math.max(0, startOffset));
    let exactMatches = 0;
    let phoneticMatches = 0;
    let mismatches = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    for (let i = 0; i < authorTokens.length; i++) {
      const token = authorTokens[i];
      if (currentStreamIdx < targetStream.length) {
        const targetItem = targetStream[currentStreamIdx];
        const matchResult = this.checkMatch(token.initial, targetItem.rawChar, mode);

        if (matchResult) {
          if (matchResult === 'exact') exactMatches++;
          if (matchResult === 'phonetic') phoneticMatches++;
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;

          evaluatedTokens.push({
            ...token,
            targetItem,
            matchType: matchResult,
            matched: true
          });
          currentStreamIdx++;
        } else {
          mismatches++;
          currentStreak = 0;
          evaluatedTokens.push({
            ...token,
            targetItem,
            matchType: 'mismatch',
            matched: false
          });
          currentStreamIdx++;
        }
      } else {
        // Exceeded target stream length
        evaluatedTokens.push({
          ...token,
          targetItem: null,
          matchType: 'overflow',
          matched: false
        });
      }
    }

    const totalProcessed = authorTokens.length;
    const accuracy = totalProcessed > 0
      ? Math.round(((exactMatches + phoneticMatches) / totalProcessed) * 100)
      : 100;

    const progressPct = targetStream.length > 0
      ? Math.min(100, Math.round((currentStreamIdx / targetStream.length) * 100))
      : 0;

    // Build the visual tape around current index
    const tape = this.getTapeWindow(targetStream, currentStreamIdx);

    return {
      startOffset,
      currentIndex: currentStreamIdx,
      targetLength: targetStream.length,
      isCompleted: currentStreamIdx >= targetStream.length && targetStream.length > 0,
      currentTarget: targetStream[currentStreamIdx] || null,
      evaluatedTokens,
      exactMatches,
      phoneticMatches,
      mismatches,
      currentStreak,
      maxStreak,
      accuracy,
      progressPct,
      tape,
      mode
    };
  }

  /**
   * Get sliding window of letters for visual tape prompter
   */
  static getTapeWindow(targetStream, currentIndex, pastCount = 3, futureCount = 10) {
    const tape = [];
    if (!targetStream || targetStream.length === 0) return tape;

    // Past items
    const startIdx = Math.max(0, currentIndex - pastCount);
    for (let i = startIdx; i < currentIndex; i++) {
      tape.push({
        ...targetStream[i],
        role: 'past'
      });
    }

    // Current item
    if (currentIndex < targetStream.length) {
      tape.push({
        ...targetStream[currentIndex],
        role: 'current'
      });
    }

    // Future items
    const endIdx = Math.min(targetStream.length, currentIndex + 1 + futureCount);
    for (let i = currentIndex + 1; i < endIdx; i++) {
      tape.push({
        ...targetStream[i],
        role: 'upcoming'
      });
    }

    return tape;
  }
}
