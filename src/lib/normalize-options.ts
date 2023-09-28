export const normalizeOptions = (
	opts: Record<string, unknown>,
	defaultOptions: Record<string, unknown>
) => {
	const optionsObject = {} as Record<string, unknown>;
	for (let key in defaultOptions)
		optionsObject[key] =
			opts[key] !== undefined ? opts[key] : defaultOptions[key];
	return optionsObject;
};
