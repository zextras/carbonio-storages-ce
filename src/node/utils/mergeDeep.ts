export type DeepPartial<T> = {
	[P in keyof T]?: DeepPartial<T[P]>;
};

export function mergeDeep<T>(target:T, ...sources:DeepPartial<T>[]): T {
	if (!sources.length) return target;
	const source = sources.shift();

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				mergeDeep(target[key], source[key] as any);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}

	return mergeDeep(target, ...sources);
}

export function isObject(item:any):boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}