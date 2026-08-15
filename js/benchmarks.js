/**
 * WordMagic Literary Benchmarks & Estimator
 * Canonical word counts of iconic literary masterpieces and pacing calculator.
 */

export const LITERARY_BENCHMARKS = [
  {
    id: 'lotr',
    title: '«Властелин колец» (трилогия)',
    shortTitle: 'Властелин колец',
    author: 'Дж. Р. Р. Толкин',
    words: 481103,
    description: 'Величайший эпос фэнтези в 3 томах (Братство Кольца, Две крепости, Возвращение короля).'
  },
  {
    id: 'war-and-peace',
    title: '«Война и мир» (4 тома)',
    shortTitle: 'Война и мир',
    author: 'Лев Толстой',
    words: 587287,
    description: 'Масштабный роман-эпопея русской и мировой литературы.'
  },
  {
    id: 'crime-punishment',
    title: '«Преступление и наказание»',
    shortTitle: 'Преступление и наказ.',
    author: 'Фёдор Достоевский',
    words: 211591,
    description: 'Психологический шедевр о границах человеческой воли.'
  },
  {
    id: 'master-margarita',
    title: '«Мастер и Маргарита»',
    shortTitle: 'Мастер и Маргарита',
    author: 'Михаил Булгаков',
    words: 133000,
    description: 'Мистический роман о дьяволе, рукописях и вечной любви.'
  },
  {
    id: 'harry-potter-series',
    title: '«Гарри Поттер» (вся серия из 7 книг)',
    shortTitle: 'Гарри Поттер (7 книг)',
    author: 'Дж. К. Роулинг',
    words: 1084170,
    description: 'Полная сага о мальчике, который выжил (все семь томов).'
  },
  // Additional notable classics
  {
    id: 'monte-cristo',
    title: '«Граф Монте-Кристо»',
    shortTitle: 'Граф Монте-Кристо',
    author: 'Александр Дюма',
    words: 464000,
    description: 'Приключенческий роман о возмездии и надежде.'
  },
  {
    id: 'dune',
    title: '«Дюна» (первый роман)',
    shortTitle: 'Дюна',
    author: 'Фрэнк Герберт',
    words: 188000,
    description: 'Культовая научно-фантастическая эпопея Арракиса.'
  }
];

export class BenchmarkCalculator {
  /**
   * Calculate pacing and ETA for each benchmark book
   */
  static calculateEstimates(currentWords, dailyPace) {
    const pace = Math.max(1, dailyPace);

    return LITERARY_BENCHMARKS.map(book => {
      const remainingWords = Math.max(0, book.words - currentWords);
      const percentage = Math.min(100, Math.round((currentWords / book.words) * 1000) / 10);
      const isCompleted = currentWords >= book.words;

      const daysNeeded = Math.ceil(remainingWords / pace);
      const weeksNeeded = Math.ceil(daysNeeded / 7);

      let formattedTime = '';
      if (isCompleted) {
        formattedTime = 'Достигнуто!';
      } else if (daysNeeded <= 14) {
        formattedTime = `${daysNeeded} ${this.pluralizeDays(daysNeeded)}`;
      } else if (weeksNeeded <= 16) {
        formattedTime = `~${weeksNeeded} ${this.pluralizeWeeks(weeksNeeded)}`;
      } else {
        const months = (daysNeeded / 30.5).toFixed(1);
        formattedTime = `~${months} мес. (${weeksNeeded} нед.)`;
      }

      return {
        ...book,
        currentWords,
        remainingWords,
        percentage,
        isCompleted,
        daysNeeded,
        weeksNeeded,
        formattedTime
      };
    });
  }

  static pluralizeDays(n) {
    const abs = Math.abs(n) % 100;
    const num = abs % 10;
    if (abs > 10 && abs < 20) return 'дней';
    if (num > 1 && num < 5) return 'дня';
    if (num === 1) return 'день';
    return 'дней';
  }

  static pluralizeWeeks(n) {
    const abs = Math.abs(n) % 100;
    const num = abs % 10;
    if (abs > 10 && abs < 20) return 'недель';
    if (num > 1 && num < 5) return 'недели';
    if (num === 1) return 'неделя';
    return 'недель';
  }
}
