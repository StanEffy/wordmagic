/**
 * WordMagic Presets & Literary Sources
 * Preset texts for Acro-Prose mode and default starter prose.
 */

export const ACRO_PRESETS = [
  {
    id: 'pushkin-chudnoe',
    title: 'А.С. Пушкин — «Я помню чудное мгновенье»',
    category: 'Поэзия',
    text: `Я помню чудное мгновенье:
Передо мной явилась ты,
Как мимолетное виденье,
Как гений чистой красоты.

В томленьях грусти безнадежной,
В тревогах шумной суеты,
Звучал мне долго голос нежный
И снились милые черты.

Шли годы. Бурь порыв мятежный
Рассеял прежние мечты,
И я забыл твой голос нежный,
Твои небесные черты.`
  },
  {
    id: 'brodsky-komnata',
    title: 'И. Бродский — «Не выходи из комнаты»',
    category: 'Поэзия',
    text: `Не выходи из комнаты, не совершай ошибку.
Зачем тебе солнце, если ты куришь Шипку?
За дверью бессмысленно все, особенно — возглас счастья.
Только в уборную — и сразу же возвращайся.

О, не выходи из комнаты, не вызывай мотора.
Потому что пространство сделано из коридора
и кончается счетчиком. А если войдет живая
милка, пасть разевая, выгони не раздевая.`
  },
  {
    id: 'mayakovsky-listen',
    title: 'В. Маяковский — «Послушайте!»',
    category: 'Поэзия',
    text: `Послушайте!
Ведь, если звезды зажигают —
значит — это кому-нибудь нужно?
Значит — кто-то хочет, чтобы они были?
Значит — кто-то называет эти плевочки
жемчужиной?

И, надрываясь
в метелях полуденной пыли,
врывается к богу,
боится, что опоздал,
плачет,
целует ему жилистую руку,
просит —
чтоб обязательно была звезда!`
  },
  {
    id: 'russian-alphabet',
    title: 'Русский алфавит (А — Я)',
    category: 'Упражнение',
    text: `А Б В Г Д Е Ж З И К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Э Ю Я`
  },
  {
    id: 'pangram-shirad',
    title: 'Классическая панграмма',
    category: 'Упражнение',
    text: `В чащах юга жил бы цитрус? Да, но фальшивый экземпляр!`
  },
  {
    id: 'shakespeare-sonnet18',
    title: 'William Shakespeare — Sonnet 18',
    category: 'Poetry (EN)',
    text: `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date:
Sometime too hot the eye of heaven shines,
And often is his gold complexion dimm'd;
And every fair from fair sometime declines,
By chance, or nature's changing course, untrimm'd;
But thy eternal summer shall not fade,
Nor lose possession of that fair thou ow'st;
Nor shall death brag thou wand'rest in his shade,
When in eternal lines to Time thou grow'st:
So long as men can breathe, or eyes can see,
So long lives this, and this gives life to thee.`
  },
  {
    id: 'poe-raven',
    title: 'Edgar Allan Poe — The Raven',
    category: 'Poetry (EN)',
    text: `Once upon a midnight dreary, while I pondered, weak and weary,
Over many a quaint and curious volume of forgotten lore—
While I nodded, nearly napping, suddenly there came a tapping,
As of some one gently rapping, rapping at my chamber door.
“’Tis some visitor,” I muttered, “tapping at my chamber door—
Only this and nothing more.”`
  },
  {
    id: 'english-alphabet',
    title: 'English Alphabet (A — Z)',
    category: 'Exercise (EN)',
    text: `A B C D E F G H I J K L M N O P Q R S T U V W X Y Z`
  }
];

export const STARTER_PROSE = {
  id: 'doc_starter',
  title: 'Глава I. Туман над рекой',
  content: `Вечер опускался на город медленно, словно нехотя растворяя очертания старых крыш в густых сиреневых сумерках. 

Где-то далеко внизу мерно плескалась река, ударяясь о замшелые гранитные ступени набережной. В воздухе стоял терпкий запах прелой листвы и надвигающегося дождя. Андрей остановился у чугунной ограды, вглядываясь в дрожащие огни противоположного берега. Каждая страница, написанная им за эти долгие недели, казалась лишь робким подступом к тому главному слову, которое всё никак не давалось в руки.

Он достал из кармана старый блокнот в кожаном переплете. Бумага сохранила тепло утренней работы. Слово за словом, мысль за мыслью — только так рождается настоящая история.`,
  createdAt: Date.now() - 86400000 * 2,
  updatedAt: Date.now()
};
