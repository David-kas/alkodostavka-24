/**
 * Генерирует catalog-grid из ассортимента bokaluna.ru (цены и названия).
 * Запуск: node scripts/sync-catalog-bokaluna.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CATALOG = path.join(ROOT, 'catalog.html');
const IMAGES_DIR = path.join(ROOT, 'images');

const PLACEHOLDER = {
  strong: 'placeholder-strong.svg',
  wine: 'placeholder-wine.svg',
  beer: 'placeholder-beer.svg',
  snacks: 'placeholder-snack.svg',
};

/** @type {{ name: string; price: number; cat: 'strong'|'wine'|'beer'|'snacks'; desc?: string; img?: string }[]} */
const PRODUCTS = [
  // —— Водка ——
  { name: 'Водка «ABSOLUT» 0.5 л', price: 2590, cat: 'strong' },
  { name: 'Водка «ABSOLUT» 0.7 л', price: 3390, cat: 'strong' },
  { name: 'Водка «BELUGA» Noble 1 л', price: 3590, cat: 'strong', img: 'beluga.jpg' },
  { name: 'Водка «BELUGA» Transatlantic Racing 0.7 л', price: 2990, cat: 'strong', img: 'beluga.jpg' },
  { name: 'Водка «Beluga» Allure 0.7 л', price: 3590, cat: 'strong', img: 'beluga.jpg' },
  { name: 'Водка «FINLANDIA» Classic 0.7 л', price: 2890, cat: 'strong', img: 'finlandia.jpg' },
  { name: 'Водка «FINLANDIA» клюква 0.7 л', price: 2890, cat: 'strong', img: 'finlandia.jpg' },
  { name: 'Водка «Беленькая» 0.5 л', price: 990, cat: 'strong' },
  { name: 'Водка «Березка» Люкс 0.5 л', price: 990, cat: 'strong', img: 'berezka.jpg', desc: 'Мягкая классическая водка.' },
  { name: 'Водка «Пять озер» 0.5 л', price: 990, cat: 'strong', img: '5ozerprem.jpg' },
  { name: 'Водка «Пять озер» Премиум 0.5 л', price: 990, cat: 'strong', img: '5ozerprem.jpg' },
  { name: 'Водка «Пять озер» 0.7 л', price: 1390, cat: 'strong', img: '5ozer.jpg' },
  { name: 'Водка «Пять озер» 1 л', price: 1690, cat: 'strong', img: '5ozer.jpg' },
  { name: 'Водка «Русский стандарт» 0.5 л', price: 1490, cat: 'strong', img: 'russian-standart.jpg' },
  { name: 'Водка «Русский стандарт» Platinum 0.7 л', price: 1890, cat: 'strong', img: 'russian-standart.jpg' },
  { name: 'Водка «Русский стандарт» 1 л', price: 1990, cat: 'strong', img: 'russian-standart.jpg' },
  { name: 'Водка «Талка» Люкс 0.5 л', price: 990, cat: 'strong', img: 'талка.jpg' },
  { name: 'Водка «Хортица» Платинум 0.5 л', price: 1190, cat: 'strong', img: 'khortytsia.jpg' },
  { name: 'Водка «Хортица» Мягкая 0.5 л', price: 1190, cat: 'strong', img: 'khortytsia.jpg' },
  { name: 'Водка «Хортица» Платинум 0.7 л', price: 1490, cat: 'strong', img: 'khortytsia.jpg' },
  { name: 'Водка «Nemiroff» Медовая с перцем 0.5 л', price: 1190, cat: 'strong', img: 'nemiroff.jpg' },
  { name: 'Водка «Мягков» Silver 0.5 л', price: 990, cat: 'strong', img: 'мягков.jpg' },
  { name: 'Водка «Зеленая марка» Кедровая 0.5 л', price: 990, cat: 'strong', img: 'зеленаямарка.jpg' },

  // —— Виски ——
  { name: 'Виски «Ballantine\'s» 0.5 л', price: 3390, cat: 'strong' },
  { name: 'Виски «Ballantine\'s» 0.7 л', price: 3990, cat: 'strong' },
  { name: 'Виски «Ballantine\'s» 1 л', price: 4390, cat: 'strong' },
  { name: 'Виски «Bell\'s» 0.5 л', price: 2390, cat: 'strong' },
  { name: 'Виски «Bell\'s» 0.7 л', price: 2590, cat: 'strong' },
  { name: 'Виски «Bell\'s» 1 л', price: 2990, cat: 'strong' },
  { name: 'Виски «Chivas Regal» 12 yo 0.5 л', price: 8190, cat: 'strong', img: 'Chivas Regal 12 yo.jpg' },
  { name: 'Виски «Chivas Regal» 12 yo 0.7 л', price: 9190, cat: 'strong', img: 'Chivas Regal 12 yo.jpg' },
  { name: 'Виски «Glenfiddich» 0.5 л', price: 7990, cat: 'strong' },
  { name: 'Виски «Jack Daniel\'s» Old No.7 0.5 л', price: 3890, cat: 'strong', img: 'виски джек.jpg' },
  { name: 'Виски «Jack Daniel\'s» Old No.7 0.7 л', price: 4590, cat: 'strong', img: 'виски джек.jpg' },
  { name: 'Виски «Jameson» Irish 0.5 л', price: 4290, cat: 'strong', img: 'джеймсон.jpg' },
  { name: 'Виски «Jameson» Irish 0.7 л', price: 4990, cat: 'strong', img: 'джеймсон.jpg' },
  { name: 'Виски «Johnnie Walker» Black Label 0.7 л', price: 5590, cat: 'strong', img: 'blacklabel.jpg' },
  { name: 'Виски «Macallan» 12 лет 0.7 л', price: 17990, cat: 'strong' },
  { name: 'Виски «William Lawson\'s» 0.5 л', price: 1890, cat: 'strong' },
  { name: 'Виски «William Lawson\'s» 0.7 л', price: 2290, cat: 'strong' },

  // —— Коньяк ——
  { name: 'Коньяк «Remy Martin» VS 0.7 л', price: 10390, cat: 'strong' },
  { name: 'Коньяк «Hennessy» VS 0.7 л', price: 8990, cat: 'strong', img: 'КоньякHennessyVSOP.jpg' },
  { name: 'Коньяк «Hennessy» VSOP 0.5 л', price: 8990, cat: 'strong', img: 'КоньякHennessyVSOP.jpg' },
  { name: 'Коньяк «Арарат» 5 звёзд 0.5 л', price: 2490, cat: 'strong', img: 'арарат.jpeg' },
  { name: 'Коньяк «Арарат» 5 звёзд 0.7 л', price: 3290, cat: 'strong', img: 'арарат.jpeg' },
  { name: 'Коньяк «Лезгинка» 0.5 л', price: 1790, cat: 'strong' },
  { name: 'Коньяк «Старейшина» 5 лет 0.5 л', price: 1790, cat: 'strong', img: 'старейшина12.jpg' },
  { name: 'Коньяк «Старейшина» 7 лет 0.5 л', price: 1790, cat: 'strong', img: 'старейшина12.jpg' },
  { name: 'Коньяк «Старый Кенигсберг» 5-летний 0.5 л', price: 1790, cat: 'strong' },
  { name: 'Коньяк «Старый Кенигсберг» 4-летний 0.5 л', price: 1790, cat: 'strong' },
  { name: 'Коньяк David Iverieli «Варцихе» 7 лет 0.5 л', price: 1790, cat: 'strong' },

  // —— Джин ——
  { name: 'Джин «Beefeater» 0.7 л', price: 3590, cat: 'strong' },
  { name: 'Джин «Bombay Sapphire» 0.7 л', price: 3590, cat: 'strong' },
  { name: 'Джин «Gordon\'s» 0.7 л', price: 3590, cat: 'strong' },

  // —— Ром ——
  { name: 'Ром Barcelo Blanco 0.5 л', price: 2590, cat: 'strong' },
  { name: 'Ром Barcelo Blanco 0.7 л', price: 3190, cat: 'strong' },
  { name: 'Ром Barcelo Blanco 1 л', price: 3790, cat: 'strong' },
  { name: 'Ром Havana Club Anejo Especial 3 года 0.7 л', price: 3400, cat: 'strong' },
  { name: 'Ром «Капитан Морган» Золотой 0.5 л', price: 2500, cat: 'strong' },
  { name: 'Ром «Капитан Морган» Золотой 0.7 л', price: 3590, cat: 'strong' },

  // —— Текила ——
  { name: 'Текила «Olmeca» 0.5 л', price: 3490, cat: 'strong' },
  { name: 'Текила «Olmeca» 0.7 л', price: 3990, cat: 'strong' },
  { name: 'Текила «Sauza Gold» 0.5 л', price: 3490, cat: 'strong' },
  { name: 'Текила «Sauza Gold» 0.7 л', price: 3990, cat: 'strong' },
  { name: 'Текила «Sauza Silver» 0.5 л', price: 3490, cat: 'strong' },
  { name: 'Текила «Sauza Silver» 0.7 л', price: 3990, cat: 'strong' },

  // —— Ликёр ——
  { name: 'Ликёр «Becherovka» 0.7 л', price: 3990, cat: 'strong' },
  { name: 'Ликёр Baileys 0.7 л', price: 3590, cat: 'strong' },
  { name: 'Ликёр Sambuca Extra 0.5 л', price: 1690, cat: 'strong' },
  { name: 'Ликёр Cointreau 0.7 л', price: 3990, cat: 'strong' },
  { name: 'Ликёр Limoncello 0.5 л', price: 1590, cat: 'strong' },
  { name: 'Ликёр Sheridan\'s 0.5 л', price: 3690, cat: 'strong' },
  { name: 'Ликёр Jägermeister 0.7 л', price: 3890, cat: 'strong' },

  // —— Вино ——
  { name: 'ВИЛЛА ФРАНЧЕСКА 0.75 л, белое полусладкое', price: 1790, cat: 'wine' },
  { name: 'ВИЛЛА ФРАНЧЕСКА 0.75 л, белое сухое', price: 1790, cat: 'wine' },
  { name: 'ВИЛЛА ФРАНЧЕСКА 0.75 л, красное полусладкое', price: 1790, cat: 'wine' },
  { name: 'ВИЛЛА ФРАНЧЕСКА 0.75 л, красное сухое', price: 1790, cat: 'wine' },
  { name: 'Вино «Mancura Cabernet Sauvignon» 0.7 л', price: 1690, cat: 'wine' },
  { name: 'Вино «Mancura Chardonnay» 0.7 л', price: 1690, cat: 'wine' },
  { name: 'Вино «Mancura Merlot» 0.7 л', price: 1690, cat: 'wine' },
  { name: 'Вино «Mancura Moscato» 0.7 л', price: 1790, cat: 'wine' },
  { name: 'Вино «Mancura Carmenere» 0.7 л', price: 1690, cat: 'wine' },
  { name: 'Вино «Petit Chablis» 0.7 л', price: 4590, cat: 'wine' },
  { name: 'Вино «Pinot Grigio» 0.7 л', price: 1990, cat: 'wine' },
  { name: 'Вино «Torre De Rejas Semisweet» 0.7 л', price: 1690, cat: 'wine' },
  { name: 'Вино «Музаради Саперави» 0.7 л', price: 1690, cat: 'wine' },
  { name: 'Вино «Сигнахи Киндзмараули» 0.7 л', price: 1690, cat: 'wine' },
  { name: 'Вино Chianti DOCG 0.7 л (Италия)', price: 1890, cat: 'wine' },

  // —— Вермут ——
  { name: 'Вермут «Cinzano Bianco» 0.7 л', price: 2190, cat: 'wine' },
  { name: 'Вермут «Cinzano Bianco» 1 л', price: 2690, cat: 'wine' },
  { name: 'Вермут «Martini Bianco» 0.5 л', price: 1990, cat: 'wine' },
  { name: 'Вермут «Martini Bianco» 0.7 л', price: 2390, cat: 'wine' },
  { name: 'Вермут «Martini Bianco» 1 л', price: 2790, cat: 'wine' },
  { name: 'Вермут «Martini Extra Dry» 0.5 л', price: 1990, cat: 'wine' },
  { name: 'Вермут «Martini Extra Dry» 0.7 л', price: 2390, cat: 'wine' },
  { name: 'Вермут «Martini Extra Dry» 1 л', price: 2790, cat: 'wine' },
  { name: 'Вермут «Martini Fiero» 0.5 л', price: 1990, cat: 'wine' },
  { name: 'Вермут «Martini Fiero» 0.7 л', price: 2290, cat: 'wine' },
  { name: 'Вермут «Martini Fiero» 1 л', price: 2790, cat: 'wine' },
  { name: 'Вермут Cinzano Bianco 0.5 л', price: 1990, cat: 'wine' },

  // —— Шампанское / игристое ——
  { name: 'Игристое Atto Primo Prosecco 0.75 л', price: 1890, cat: 'wine' },
  { name: 'Шампанское «Gancia Prosecco» 0.75 л', price: 2390, cat: 'wine' },
  { name: 'Шампанское «Martini Asti» 0.75 л', price: 2590, cat: 'wine' },
  { name: 'Шампанское «Martini Prosecco» 0.75 л', price: 2590, cat: 'wine' },
  { name: 'Шампанское «Mondoro Asti» 0.75 л', price: 2590, cat: 'wine' },
  { name: 'Шампанское «Mondoro Prosecco» 0.75 л', price: 2590, cat: 'wine' },
  { name: 'Шампанское «Riondo Prosecco» 0.75 л', price: 1990, cat: 'wine' },
  { name: 'Шампанское «Абрау-Дюрсо» Брют 0.75 л', price: 1490, cat: 'wine' },
  { name: 'Шампанское «Абрау-Дюрсо» полусладкое 0.75 л', price: 1490, cat: 'wine' },
  { name: 'Шампанское «Абрау-Дюрсо» сладкое 0.75 л', price: 1490, cat: 'wine' },
  { name: 'Шампанское Faldeo Prosecco 0.75 л', price: 1990, cat: 'wine' },

  // —— Пиво ——
  { name: 'Пиво 1664 Blanco 0.5 л', price: 200, cat: 'beer' },
  { name: 'Пиво Bud 0.45 л', price: 150, cat: 'beer', img: 'Budweiser.jpg' },
  { name: 'Пиво Corona Extra 0.33 л', price: 300, cat: 'beer', img: 'corona.jpg' },
  { name: 'Пиво Hoegaarden 0.5 л', price: 250, cat: 'beer', img: 'hugarden.jpg' },
  { name: 'Пиво Kozel светлое 0.45 л', price: 150, cat: 'beer', img: 'Velkopopovický.jpg' },
  { name: 'Пиво Kozel тёмное 0.5 л', price: 150, cat: 'beer', img: 'Velkopopovický.jpg' },
  { name: 'Пиво Krušovice 0.45 л', price: 150, cat: 'beer', img: 'Krušovice.jpg' },
  { name: 'Пиво Miller 0.5 л', price: 400, cat: 'beer' },
  { name: 'Пиво Paulaner Weissbier 0.5 л', price: 300, cat: 'beer' },
  { name: 'Пиво «Жигулёвское» 0.45 л', price: 150, cat: 'beer', img: 'zhig.jpg' },
  { name: 'Пиво «Охота» крепкое 8.1% 0.45 л', price: 150, cat: 'beer' },
  { name: 'Пиво «Шпатен» 0.5 л', price: 300, cat: 'beer' },
  { name: 'Пиво «Балтика №3» 0.5 л', price: 150, cat: 'beer', img: 'baltica3.jpg' },
  { name: 'Пиво «Клинское» 0.5 л', price: 150, cat: 'beer', img: 'klin.jpg' },
  { name: 'Пиво «Хамовники» 0.5 л', price: 250, cat: 'beer', img: 'hamovniki.jpg' },
  { name: 'Пиво Staropramen 0.5 л', price: 330, cat: 'beer', img: 'images.jpg' },
  { name: 'Пиво Leffe Blonde 0.5 л', price: 450, cat: 'beer', img: 'images1.jpg' },
  { name: 'Пиво Guinness Original 0.5 л', price: 490, cat: 'beer', img: 'guiness.jpg' },
  { name: 'Пиво Budweiser Budvar 0.5 л', price: 290, cat: 'beer', img: 'Budweiser.jpg' },
  { name: 'Живое «Ермолино» 1 л', price: 250, cat: 'beer', img: 'zhivoe.jpg' },
  { name: 'Сидр «St. Anton» 0.5 л', price: 290, cat: 'beer', img: 'sidr.jpg' },

  // —— Закуски ——
  { name: 'Лещ вяленый 150 г', price: 392, cat: 'snacks', img: 'лещ.webp', desc: 'Крупный, жирный, к светлому пиву.' },
  { name: 'Вобла вяленая 100 г', price: 266, cat: 'snacks', img: 'вобла.jpg' },
  { name: 'Тарань вяленая 100 г', price: 238, cat: 'snacks', img: 'тарань.webp' },
  { name: 'Кольца кальмара сушёные 80 г', price: 294, cat: 'snacks', img: 'кальмар.jpg' },
  { name: 'Креветки сушёные 70 г', price: 322, cat: 'snacks', img: 'креветки.jpg' },
  { name: 'Раки варено-мороженые 500 г', price: 1190, cat: 'snacks', img: 'раки.webp' },
  { name: 'Сухарики «Кириешки» с беконом 90 г', price: 91, cat: 'snacks', img: 'кириешки.webp' },
  { name: 'Сухарики «Воронцовские» с чесноком 100 г', price: 98, cat: 'snacks', img: 'гренки.webp' },
  { name: 'Сухарики «Три корочки» с сыром 90 г', price: 95, cat: 'snacks', img: 'тиркорочкисемга.webp' },
  { name: 'Арахис жареный солёный 150 г', price: 168, cat: 'snacks', img: 'арахисжаренный.webp' },
  { name: 'Фисташки солёные 100 г', price: 392, cat: 'snacks', img: 'фисташки.webp' },
  { name: 'Кешью жареный с солью 100 г', price: 448, cat: 'snacks', img: 'кешью.webp' },
  { name: 'Чипсы Lays с солью 150 г', price: 252, cat: 'snacks', img: 'лейс.webp' },
  { name: 'Чипсы Pringles Original 165 г', price: 476, cat: 'snacks', img: 'принглс.jpg' },
  { name: 'Оливки зелёные с косточкой 300 г', price: 350, cat: 'snacks', img: 'оливки.jpg' },
];

const IMAGE_HINTS = [
  ['finlandia', 'finlandia.jpg'],
  ['beluga', 'beluga.jpg'],
  ['berezka', 'berezka.jpg'],
  ['березка', 'berezka.jpg'],
  ['пять озер', '5ozerprem.jpg'],
  ['русский стандарт', 'russian-standart.jpg'],
  ['талка', 'талка.jpg'],
  ['хортица', 'khortytsia.jpg'],
  ['nemiroff', 'nemiroff.jpg'],
  ['мягков', 'мягков.jpg'],
  ['зеленая марка', 'зеленаямарка.jpg'],
  ['chivas', 'Chivas Regal 12 yo.jpg'],
  ['jack daniel', 'виски джек.jpg'],
  ['jameson', 'джеймсон.jpg'],
  ['johnnie walker', 'blacklabel.jpg'],
  ['black label', 'blacklabel.jpg'],
  ['hennessy', 'КоньякHennessyVSOP.jpg'],
  ['арарат', 'арарат.jpeg'],
  ['старейшина', 'старейшина12.jpg'],
  ['жигул', 'zhig.jpg'],
  ['балтика', 'baltica3.jpg'],
  ['клинск', 'klin.jpg'],
  ['kozel', 'Velkopopovický.jpg'],
  ['krušovice', 'Krušovice.jpg'],
  ['hoegaarden', 'hugarden.jpg'],
  ['corona', 'corona.jpg'],
  ['guinness', 'guiness.jpg'],
  ['staropramen', 'images.jpg'],
  ['leffe', 'images1.jpg'],
  ['budweiser', 'Budweiser.jpg'],
  ['ermolino', 'zhivoe.jpg'],
  ['ермолино', 'zhivoe.jpg'],
  ['sidr', 'sidr.jpg'],
  ['лещ', 'лещ.webp'],
  ['вобла', 'вобла.jpg'],
  ['тарань', 'тарань.webp'],
  ['кальмар', 'кальмар.jpg'],
  ['кревет', 'креветки.jpg'],
  ['раки', 'раки.webp'],
  ['кириеш', 'кириешки.webp'],
  ['воронцов', 'гренки.webp'],
  ['три короч', 'тиркорочкисемга.webp'],
  ['арахис', 'арахисжаренный.webp'],
  ['фисташ', 'фисташки.webp'],
  ['кешью', 'кешью.webp'],
  ['lays', 'лейс.webp'],
  ['pringles', 'принглс.jpg'],
  ['оливк', 'оливки.jpg'],
  ['absolut', 'absolut-vodka.jpg'],
  ['ballantine', 'ballantines.webp'],
  ["bell", 'bells-whisky.png'],
  ['glenfiddich', 'glenfiddich-12.jpg'],
  ['remy', 'remy-martin-vs.jpg'],
  ['лезгинка', 'lezginka.png'],
  ['кенигсберг', 'kenigsberg-5.png'],
  ['barcelo', 'barcelo-blanco-07.png'],
  ['капитан', 'captain-morgan.jpg'],
  ['becherovka', 'becherovka.png'],
  ['baileys', 'baileys.jpg'],
  ['sambuca', 'sambuca.jpg'],
  ['cointreau', 'cointreau.jpg'],
  ['jagermeister', 'jagermeister.jpg'],
  ['olmeca', 'olmeca.jpg'],
  ['sauza gold', 'sauza-gold.jpg'],
  ['sauza silver', 'sauza-silver.jpg'],
  ['вилла', 'villa-francesca-rosso.png'],
  ['mancura moscato', 'mancura-moscato.png'],
  ['mancura chardonnay', 'mancura-chardonnay.png'],
  ['pinot grigio', 'pinot-grigio.png'],
  ['torre de rejas', 'torre-de-rejas.png'],
  ['музаради', 'muzaradi-saperavi.png'],
  ['киндзмараули', 'kindzmarauli.png'],
  ['chianti', 'chianti-docg.png'],
  ['atto primo', 'atto-primo-prosecco.png'],
  ['gancia', 'gancia-prosecco.jpg'],
  ['martini prosecco', 'martini-prosecco.png'],
  ['mondoro asti', 'mondoro-asti.png'],
  ['mondoro prosecco', 'mondoro-prosecco.png'],
  ['riondo', 'riondo-prosecco.png'],
  ['абрау', 'abrau-durso-brut.png'],
  ['faldeo', 'faldeo-prosecco.png'],
  ['martini bianco', 'martini-bianco.jpg'],
  ['martini fiero', 'martini-fiero.jpg'],
];

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function norm(s) {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ');
}

function dedupeProducts(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    const key = norm(p.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function pickImage(product, imageFiles) {
  if (product.img && imageFiles.includes(product.img)) return product.img;
  const n = norm(product.name);
  for (const [hint, file] of IMAGE_HINTS) {
    if (n.includes(hint) && imageFiles.includes(file)) return file;
  }
  return PLACEHOLDER[product.cat] || PLACEHOLDER.strong;
}

function defaultDesc(name) {
  const vol = name.match(/(\d+[.,]?\d*)\s*(л|ml|мл|г)/i);
  return vol ? `Объём ${vol[0]}. Доставка по Москве 24/7.` : 'Доставка по Москве 24/7.';
}

function cardHtml(p, imageFiles) {
  const img = pickImage(p, imageFiles);
  const desc = p.desc || defaultDesc(p.name);
  const alt = escapeHtml(p.name);
  const title = escapeHtml(p.name);
  const price = p.price.toLocaleString('ru-RU');
  return `                <div class="product-card" data-category="${p.cat}">
                    <div class="product-image">
                        <img loading="lazy" decoding="async" src="images/${encodeURI(img)}" alt="${alt}">
                    </div>
                    <h3>${title}</h3>
                    <p class="product-desc">${escapeHtml(desc)}</p>
                    <span class="product-price">${price} ₽</span>
                </div>`;
}

function buildGrid(products, imageFiles) {
  const sections = [
    { label: 'Крепкий алкоголь', cat: 'strong' },
    { label: 'Вино и игристое', cat: 'wine' },
    { label: 'Пиво', cat: 'beer' },
    { label: 'Закуски', cat: 'snacks' },
  ];
  const lines = [];
  for (const sec of sections) {
    const items = products.filter((p) => p.cat === sec.cat);
    if (!items.length) continue;
    lines.push(`                <!-- ${sec.label.toUpperCase()} -->`);
    for (const p of items) lines.push(cardHtml(p, imageFiles));
  }
  return lines.join('\n');
}

const imageFiles = fs.readdirSync(IMAGES_DIR);
const products = dedupeProducts(PRODUCTS);
const gridHtml = buildGrid(products, imageFiles);

let html = fs.readFileSync(CATALOG, 'utf8');

const filters = `            <div class="catalog-categories">
                <button class="category-btn active" data-category="all">Все товары</button>
                <button class="category-btn" data-category="strong">Крепкий алкоголь</button>
                <button class="category-btn" data-category="wine">Вино и игристое</button>
                <button class="category-btn" data-category="beer">Пиво</button>
                <button class="category-btn" data-category="snacks">Закуски</button>
            </div>`;

html = html.replace(/<div class="catalog-categories">[\s\S]*?<\/div>\s*\n\s*<!-- Сетка товаров -->/, `${filters}\n\n            <!-- Сетка товаров -->`);

html = html.replace(
  /(<div class="catalog-grid">)[\s\S]*?(<\/div>\s*\n\s*<!-- SEO-текст)/,
  `$1\n${gridHtml}\n            $2`
);

html = html.replace(/"numberOfItems":\s*\d+/, `"numberOfItems": ${Math.min(products.length, 20)}`);

fs.writeFileSync(CATALOG, html, 'utf8');

const withPhoto = products.filter((p) => !pickImage(p, imageFiles).startsWith('placeholder-')).length;
console.log(`sync-catalog-bokaluna: ${products.length} товаров, ${withPhoto} с фото, ${products.length - withPhoto} с плейсхолдером`);
