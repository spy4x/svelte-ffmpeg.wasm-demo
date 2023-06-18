/**
 * Returns random string of given length
 * @param length length of string, default is 5, max is 9
 * @returns random string
 */
export function getRandomString(length = 5): string {
	return Math.random().toString(36).substring(length);
}
