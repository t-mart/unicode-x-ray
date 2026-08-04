export type Example = readonly [text: string, description: string];

export const examples: readonly Example[] = [
	["\u{1F9DC}\u{1F3FB}‍♂️", "An emoji sequence"],
	["Z̷̲̫̼͓̑͂͆ã̴͚̆l̴̛͍͓̙̫̔g̵̛̦̰̉͐ó̶̫̓̚", "Combining marks, piled on"],
	["🇺🇸", "Regional indicators"],
	["ǝʇɐɯ ʎɐp,פ", "Upside-down text"],
	["ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖ", "Superscript letters"],
	["℘ℑℜℵ∭∰‱↉⅍", "Mathematical notation"],
	["𝓑𝓮𝓪𝓾𝓽𝓲𝓯𝓾𝓵", "Mathematical script letters"],
	["ﬆﬅﬃ", "Ligatures"],
	["𝔤𝔬𝔱𝔥𝔦𝔠", "Fraktur letters"],
	["⑴⑵⑶⒜⒝⒞", "Enclosed alphanumerics"],
	["⠓⠑⠇⠇⠕", "Braille patterns"],
	["Ｈｅｌｌｏ Ｗｏｒｌｄ １２３", "Fullwidth text"],
	["こんにちは", "Japanese hiragana"],
	["안녕하세요", "Korean hangul"],
	["你好", "Chinese hanzi"],
	["ᚹᛁᛋᛞᚩᛗ", "Old English runes"],
	["नमस्ते", "Devanagari script"],
	["မင်္ဂလာပါ", "Burmese script"],
	["สวัสดี", "Thai script"],
	["ꦱꦸꦒꦼꦁꦱꦶꦪꦁ", "Javanese script"],
	["ᓂᔅᑯᒧᐃᐧᐣ", "Canadian Aboriginal syllabics"],
	["ܫܠܡܐ", "Syriac script"],
	["ʤʢħŋɣʃθʊʏ", "Phonetic alphabet symbols"],
	["ᬓᬭᬫ ᬱᬗᬓᬭ", "Balinese script"],
	["♜♞♝♛♚♟", "Chess pieces"],
	["𝕎𝕙𝕒𝕥", "Double-struck letters"],
	["⌘⌥⇧⌫", "Mac keyboard symbols"],
	["௧௨௩௪", "Tamil numerals"],
	["የሰላም", "Ethiopic script"],
	["❶❷❸❹❺", "Circled numbers"],
	["السَّلامُ عَلَيْكُمْ", "Arabic script"],
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
