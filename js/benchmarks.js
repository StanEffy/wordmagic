/**
 * WordMagic Literary Benchmarks & Estimator
 * Canonical word counts of iconic literary masterpieces and pacing calculator.
 */

export const LITERARY_BENCHMARKS = [
  {
    id: 'lotr',
    title: '«Властелин колец» (трилогия)',
    titleEn: 'The Lord of the Rings (Trilogy)',
    shortTitle: 'Властелин колец',
    shortTitleEn: 'Lord of the Rings',
    author: 'Дж. Р. Р. Толкин',
    authorEn: 'J. R. R. Tolkien',
    words: 481103,
    description: 'Величайший эпос фэнтези в 3 томах.',
    descriptionEn: 'The monumental high fantasy epic across 3 volumes.'
  },
  {
    id: 'war-and-peace',
    title: '«Война и мир» (4 тома)',
    titleEn: 'War and Peace (4 Volumes)',
    shortTitle: 'Война и мир',
    shortTitleEn: 'War and Peace',
    author: 'Лев Толстой',
    authorEn: 'Leo Tolstoy',
    words: 587287,
    description: 'Масштабный роман-эпопея русской и мировой литературы.',
    descriptionEn: 'The epic masterpiece of historical literature.'
  },
  {
    id: 'crime-punishment',
    title: '«Преступление и наказание»',
    titleEn: 'Crime and Punishment',
    shortTitle: 'Преступление и наказ.',
    shortTitleEn: 'Crime & Punishment',
    author: 'Фёдор Достоевский',
    authorEn: 'Fyodor Dostoevsky',
    words: 211591,
    description: 'Психологический шедевр о границах человеческой воли.',
    descriptionEn: 'The psychological exploration of guilt, redemption and free will.'
  },
  {
    id: 'master-margarita',
    title: '«Мастер и Маргарита»',
    titleEn: 'The Master and Margarita',
    shortTitle: 'Мастер и Маргарита',
    shortTitleEn: 'Master & Margarita',
    author: 'Михаил Булгаков',
    authorEn: 'Mikhail Bulgakov',
    words: 133000,
    description: 'Мистический роман о дьяволе, рукописях и вечной любви.',
    descriptionEn: 'A satirical and philosophical fantasy of art and love.'
  },
  {
    id: 'harry-potter-series',
    title: '«Гарри Поттер» (вся серия из 7 книг)',
    titleEn: 'Harry Potter (Complete 7-Book Series)',
    shortTitle: 'Гарри Поттер (7 книг)',
    shortTitleEn: 'Harry Potter (7 Books)',
    author: 'Дж. К. Роулинг',
    authorEn: 'J. K. Rowling',
    words: 1084170,
    description: 'Полная сага о мальчике, который выжил.',
    descriptionEn: 'The complete seven-volume wizarding fantasy saga.'
  },
  {
    id: 'monte-cristo',
    title: '«Граф Монте-Кристо»',
    titleEn: 'The Count of Monte Cristo',
    shortTitle: 'Граф Монте-Кристо',
    shortTitleEn: 'Count of Monte Cristo',
    author: 'Александр Дюма',
    authorEn: 'Alexandre Dumas',
    words: 464000,
    description: 'Приключенческий роман о возмездии и надежде.',
    descriptionEn: 'The classic adventure tale of betrayal, revenge, and justice.'
  },
  {
    id: 'dune',
    title: '«Дюна» (первый роман)',
    titleEn: 'Dune (First Novel)',
    shortTitle: 'Дюна',
    shortTitleEn: 'Dune',
    author: 'Фрэнк Герберт',
    authorEn: 'Frank Herbert',
    words: 188000,
    description: 'Культовая научно-фантастическая эпопея Арракиса.',
    descriptionEn: 'The iconic sci-fi masterpiece of ecology, politics and destiny.'
  }
];

export class BenchmarkCalculator {
  /**
   * Calculate pacing and ETA for each benchmark book
   */
  static calculateEstimates(currentWords, dailyPace, lang = 'ru') {
    const pace = Math.max(1, dailyPace);

    return LITERARY_BENCHMARKS.map(book => {
      const remainingWords = Math.max(0, book.words - currentWords);
      const percentage = Math.min(100, Math.round((currentWords / book.words) * 1000) / 10);
      const isCompleted = currentWords >= book.words;

      const daysNeeded = Math.ceil(remainingWords / pace);
      const weeksNeeded = Math.ceil(daysNeeded / 7);

      let formattedTime = '';
      if (isCompleted) {
        formattedTime = lang === 'en' ? 'Completed!' : 'Достигнуто!';
      } else if (daysNeeded <= 14) {
        formattedTime = lang === 'en' 
          ? `${daysNeeded} ${daysNeeded === 1 ? 'day' : 'days'}`
          : `${daysNeeded} ${this.pluralizeDays(daysNeeded)}`;
      } else if (weeksNeeded <= 16) {
        formattedTime = lang === 'en'
          ? `~${weeksNeeded} ${weeksNeeded === 1 ? 'week' : 'weeks'}`
          : `~${weeksNeeded} ${this.pluralizeWeeks(weeksNeeded)}`;
      } else {
        const months = (daysNeeded / 30.5).toFixed(1);
        formattedTime = lang === 'en'
          ? `~${months} mo. (${weeksNeeded} wks)`
          : `~${months} мес. (${weeksNeeded} нед.)`;
      }

      return {
        ...book,
        displayTitle: (lang === 'en' && book.titleEn) ? book.titleEn : book.title,
        displayAuthor: (lang === 'en' && book.authorEn) ? book.authorEn : book.author,
        displayShortTitle: (lang === 'en' && book.shortTitleEn) ? book.shortTitleEn : book.shortTitle,
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
