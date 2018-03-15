// Event Coloring //////////////////////////////////////////////////////////////////////////////////////////////////////////////
export class ColorGenerator {
	private static eventColors: string[] = [
		'#555B6E', '#BD955A', '#800029',
		'#8B173C', '#C39E69', '#64697B',
		'#972E4F', '#C9A878', '#737888',
		'#750026', '#AC8852', '#4E5364',
		'#690022', '#9B7A4A', '#464B5B',
	];
	// '#A24563', '#CFB187', '#838795', // lighter deviations from base colors
	// '#AE5C76', '#D5BB96', '#9296A2', 
	// '#5E001E', '#8A6D42', '#3E4351', // darker deviations from base colors
	// '#52001B', '#795F3A', '#373A46'

	static getHash = (s: string) => {
		let hash = 0;
		for (let i = 0; i < s.length; i++) {
			let char = s.charCodeAt(i);
			hash += char;
		}
		return hash;
	}

	public static getColor = (s: string): string => {
		let hash = ColorGenerator.getHash(s);
		let index = hash % ColorGenerator.eventColors.length;

		return ColorGenerator.eventColors[index];
	}
}