/**
 * WordMagic Statistics & 52-Week Extrapolation Engine
 */

export class StatsEngine {
  /**
   * Count words in text handling Russian, English, punctuation, and newlines
   */
  static countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    const matches = text.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu);
    return matches ? matches.length : 0;
  }

  /**
   * Extract comprehensive text statistics
   */
  static getDetailedMetrics(text) {
    if (!text) {
      return {
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        readingTimeMinutes: 0,
        avgSentenceWords: 0
      };
    }

    const words = this.countWords(text);
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    
    // Paragraphs (non-empty lines)
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length;

    // Sentences (splitting by . ! ? …)
    const sentenceMatches = text.split(/[.!?…]+/).filter(s => s.trim().length > 0);
    const sentences = sentenceMatches.length || (words > 0 ? 1 : 0);

    const readingTimeMinutes = Math.ceil(words / 200); // 200 wpm
    const avgSentenceWords = sentences > 0 ? Math.round(words / sentences) : 0;

    return {
      words,
      characters,
      charactersNoSpaces,
      sentences,
      paragraphs,
      readingTimeMinutes,
      avgSentenceWords
    };
  }

  /**
   * Get 7-day history list
   */
  static getSevenDaySummary(dailyLogs, currentWordCount) {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
      const formattedDate = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

      let log = dailyLogs[dateStr];

      if (i === 0) {
        // Today
        const start = log ? log.startWords : currentWordCount;
        const end = currentWordCount;
        const net = Math.max(0, end - start);
        days.push({
          dateStr,
          dayName,
          formattedDate,
          isToday: true,
          startWords: start,
          endWords: end,
          netWords: net
        });
      } else {
        // Past days
        if (log) {
          days.push({
            dateStr,
            dayName,
            formattedDate,
            isToday: false,
            startWords: log.startWords || 0,
            endWords: log.endWords || 0,
            netWords: log.netWords || Math.max(0, (log.endWords || 0) - (log.startWords || 0))
          });
        } else {
          // Empty past day
          days.push({
            dateStr,
            dayName,
            formattedDate,
            isToday: false,
            startWords: 0,
            endWords: 0,
            netWords: 0
          });
        }
      }
    }

    return days;
  }

  /**
   * Calculate average daily writing pace (words/day)
   */
  static calculateDailyPace(sevenDaySummary, defaultPace = 450) {
    const activeDays = sevenDaySummary.filter(d => d.netWords > 0);
    if (activeDays.length === 0) {
      return defaultPace;
    }
    const totalWritten = activeDays.reduce((acc, d) => acc + d.netWords, 0);
    // Average over active days or full week
    return Math.max(100, Math.round(totalWritten / Math.max(1, activeDays.length)));
  }

  /**
   * Calculate 52-week extrapolation data
   */
  static get52WeekProjection(currentWordCount, dailyPace, daysPerWeek = 6) {
    const weeklyVelocity = dailyPace * daysPerWeek;
    const weeks = [];

    for (let w = 1; w <= 52; w++) {
      const cumulativeWords = currentWordCount + (weeklyVelocity * w);
      weeks.push({
        week: w,
        words: Math.round(cumulativeWords),
        writtenSinceNow: Math.round(weeklyVelocity * w)
      });
    }

    return {
      dailyPace,
      weeklyVelocity,
      weeks,
      yearEndWords: weeks[51].words
    };
  }

  /**
   * Render high-DPI 52-week projection chart on HTML5 Canvas
   */
  static renderProjectionChart(canvas, projectionData, targetBooks = []) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 40, bottom: 40, left: 65 };

    ctx.clearRect(0, 0, width, height);

    const weeks = projectionData.weeks;
    if (!weeks || weeks.length === 0) return;

    const maxWords = Math.max(
      weeks[weeks.length - 1].words * 1.1,
      600000 // Ensure War & Peace milestone scale visibility
    );

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const getX = (weekIndex) => padding.left + (weekIndex / 51) * chartW;
    const getY = (words) => padding.top + chartH - (words / maxWords) * chartH;

    // Background Grid lines
    ctx.strokeStyle = 'rgba(150, 140, 130, 0.15)';
    ctx.lineWidth = 1;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(140, 130, 120, 0.7)';
    ctx.textAlign = 'right';

    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const val = (maxWords / ySteps) * i;
      const y = getY(val);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const label = val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.round(val / 1000)}k`;
      ctx.fillText(label, padding.left - 8, y + 3);
    }

    // X-axis Weeks Marks (Week 1, 13, 26, 39, 52)
    ctx.textAlign = 'center';
    const xMilestones = [1, 13, 26, 39, 52];
    xMilestones.forEach(w => {
      const x = getX(w - 1);
      ctx.fillText(`нед. ${w}`, x, height - padding.bottom + 18);
    });

    // Milestone Book lines
    targetBooks.forEach(book => {
      if (book.words <= maxWords) {
        const bookY = getY(book.words);
        ctx.strokeStyle = 'rgba(179, 126, 41, 0.35)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, bookY);
        ctx.lineTo(width - padding.right, bookY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(179, 126, 41, 0.9)';
        ctx.textAlign = 'left';
        ctx.fillText(`«${book.shortTitle}» (${Math.round(book.words / 1000)}k)`, padding.left + 8, bookY - 4);
      }
    });

    // Filled Gradient Area under curve
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(138, 59, 41, 0.35)');
    gradient.addColorStop(1, 'rgba(138, 59, 41, 0.02)');

    ctx.beginPath();
    ctx.moveTo(getX(0), height - padding.bottom);
    weeks.forEach((pt, idx) => {
      ctx.lineTo(getX(idx), getY(pt.words));
    });
    ctx.lineTo(getX(51), height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main Curve Line
    ctx.strokeStyle = '#8a3b29';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    weeks.forEach((pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.words);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Start & End Dots
    const startX = getX(0);
    const startY = getY(weeks[0].words);
    const endX = getX(51);
    const endY = getY(weeks[51].words);

    ctx.fillStyle = '#8a3b29';
    ctx.beginPath();
    ctx.arc(startX, startY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b37e29';
    ctx.beginPath();
    ctx.arc(endX, endY, 5, 0, Math.PI * 2);
    ctx.fill();

    // End point value bubble
    ctx.fillStyle = '#27231e';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    const endText = `~${Math.round(weeks[51].words).toLocaleString()} сл. через год`;
    ctx.fillText(endText, endX, endY - 10);
  }
}
