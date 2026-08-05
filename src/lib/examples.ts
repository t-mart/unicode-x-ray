export type Example = readonly [text: string, description: string];

/**
 * A tour of the standard, not a list of pretty strings. Each entry should show
 * the reader something the last one did not: a script, an encoding trick, a
 * hidden code point, or a name worth reading.
 *
 * Where a script is real, the sample is real text in that script. The comment
 * says what it means.
 */
export const examples: readonly Example[] = [
	// The first three are the opening view, so keep them varied
	["👩🏽‍🚀", "One emoji, four code points"],
	["Z̷̲̫̼͓̑͂͆ã̴͚̆l̴̛͍͓̙̫̔g̵̛̦̰̉͐ó̶̫̓̚", "Combining marks, piled on"],
	["𓁹𓂀𓃒", "Egyptian hieroglyphs, described in full"], // an eye, the eye of Horus, a bull

	// Emoji, which are sequences pretending to be characters
	["👨‍👩‍👧‍👦", "A family held together by invisible joiners"],
	["🇺🇸🇯🇵", "Every flag is a pair of letters"],
	["🏴󠁧󠁢󠁳󠁣󠁴󠁿", "This flag spells its own name, invisibly"],
	["❤️", "The selector that turns a heart red"],
	["1️⃣", "A keycap in three pieces"],

	// Marks that hang off other characters
	["e\u0301", "One letter, or two?"], // e and a combining acute accent
	["\u0E01\u0E35\u0E48", "Thai marks that stack"], // ki, with a vowel and a tone mark above it

	// Text that is not what it looks like
	["‮gnp.exe", "An override that reverses what you read"],
	["﻿hello", "A hidden byte order mark"],
	["a\u00A0b\u2009c\u3000d", "Four spaces, all different"],
	["soft­hyphen", "A hyphen that appears only when needed"],
	["\uE000\uF8FF", "Private use, where fonts hide their logos"],
	["�", "The character that means the text broke"],

	// Living scripts
	["नमस्ते", "Devanagari, for Hindi, Marathi, and Sanskrit"], // namaste, a greeting
	["สวัสดี", "Thai"], // sawatdi, hello
	["မင်္ဂလာပါ", "Burmese"], // mingalaba, hello
	["ꦱꦸꦒꦼꦁꦱꦶꦪꦁ", "Javanese"], // sugeng siyang, good afternoon
	["ܫܠܡܐ", "Syriac, for Aramaic"], // shlama, peace
	["ሰላም", "Ethiopic, for Amharic and Tigrinya"], // selam, peace
	["ᏣᎳᎩ", "Cherokee, a syllabary invented by one man"], // Tsalagi, the Cherokee word for Cherokee
	["ᐃᓄᒃᑎᑐᑦ", "Canadian Aboriginal syllabics, for Inuktitut"], // Inuktitut
	["ⵜⵉⴼⵉⵏⴰⵖ", "Tifinagh, for the Amazigh languages"], // Tifinagh, the name of the script
	["𞤀𞤣𞤤𞤢𞤥", "Adlam, for Fulani, invented in the 1980s"], // Adlam, the name of the script
	["ᬅᬓ᭄ᬱᬭ", "Balinese"], // aksara, meaning letter
	["ˈlæŋɡwɪdʒ", "The phonetic alphabet"], // the English word language
	["السَّلامُ عَلَيْكُمْ", "Arabic, with the vowels written in"], // as-salamu alaykum, peace be upon you
	["﷽", "One character, the whole phrase"], // bismillah ar-rahman ar-rahim
	["עברית", "Hebrew, read right to left"], // Ivrit, meaning Hebrew
	["௧௨௩௪", "Tamil digits"], // 1 2 3 4

	// Dead scripts
	["𒀭𒂗𒆠", "Cuneiform, for Sumerian and Akkadian"], // Enki, a god, after the sign that marks a deity
	["𐀷𐀙𐀏", "Linear B, for Mycenaean Greek"], // wa-na-ka, king
	["𐌰𐍄𐍄𐌰 𐌿𐌽𐍃𐌰𐍂", "Gothic, from the fourth century"], // atta unsar, our father
	["ᚹᛁᛋᛞᚩᛗ", "Anglo-Saxon runes"], // the English word wisdom
	["ᚁᚂᚃᚄᚅ", "Ogham, for early Irish"], // beith, luis, fearn, sail, nion: the first five letters
	["𗀀𗀁𗀂", "Tangut, a dead script with 6,000 signs"], // the first three ideographs in code point order
	["𛅰𛅱𛅲", "Nushu, written only by women"], // the first three characters in code point order

	// East Asian
	["你好", "Chinese hanzi"], // ni hao, hello
	["こんにちは", "Japanese hiragana"], // konnichiwa, good afternoon
	["𠮷野家", "A name that lives outside the first plane"], // Yoshinoya, with the rare tsuchiyoshi form
	["⿰木木", "A way to describe a character by its parts"], // left to right, tree and tree: the character for grove
	["안녕하세요", "Korean hangul syllables"], // annyeonghaseyo, hello
	["\u1112\u1161\u11AB", "A Korean syllable, spelled out in letters"], // hieuh, a, nieun: the jamo that make han
	["㍻㍿", "Whole words squeezed into one square"], // the Heisei era, and kabushiki gaisha, meaning corporation

	// Symbols
	["𝄞𝅘𝅥𝅮𝅗𝅥", "Musical notation"], // treble clef, eighth note, half note
	["♜♞♝♛♚♟", "Chess pieces"], // the black rook, knight, bishop, queen, king, and pawn
	["🜁🜂🜃🜄", "Alchemical symbols"], // air, fire, earth, water: the four elements
	["🀄🀇🀐", "Mahjong tiles"], // red dragon, one of characters, one of bamboo
	["🂡🂢🂣", "Playing cards"], // the ace, two, and three of spades
	["(+/⍵)÷≢⍵", "APL, a language you cannot type"], // the mean of a list of numbers
	["𝋁𝋀", "Kaktovik numerals, counted in twenties"], // one and zero: the number twenty
	["䷀䷁䷂", "Yijing hexagrams"], // the creative, the receptive, difficulty at the beginning
	["⠓⠑⠇⠇⠕", "Braille patterns"], // hello
	["┌─┬─┐", "Box drawing"], // the top edge of a table
	["⇧⌘4", "Mac keyboard symbols"], // the screenshot shortcut
	["₹₿₽₺", "Currency symbols"], // rupee, bitcoin, ruble, lira
	["∀ε>0 ∃δ>0", "Mathematical notation"], // the opening of an epsilon-delta proof

	// Characters that are really other characters
	["𝒫(𝒜)", "Calligraphic letters"], // the power set of A
	["𝔰𝔲(2)", "Fraktur letters"], // the Lie algebra su(2)
	["ℝ ℕ ℤ ℚ ℂ", "Double-struck letters"], // Mathematical spaces
	["6.022×10²³ mol⁻¹", "Superscript digits, for exponents"], // Avogadro's number
	["C₆H₁₂O₆", "Subscript digits, for chemistry"], // glucose
	["ＣＤプレーヤー", "Fullwidth Latin, sized to match the kana"], // a CD player, in Japanese
	["oﬃce", "Ligatures held over from print"], // one character for f, f, and i
	["⑴⑵⒜⒝", "Enclosed alphanumerics"], // list markers
	["Henry Ⅷ", "A Roman numeral in a single character"], // the numeral eight
];

/** Fisher-Yates on a copy. The source array never moves. */
export function pickExamples(count: number, random = Math.random): Example[] {
	const pool = [...examples];

	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		const a = pool[i];
		const b = pool[j];
		if (a && b) {
			pool[i] = b;
			pool[j] = a;
		}
	}

	return pool.slice(0, count);
}
