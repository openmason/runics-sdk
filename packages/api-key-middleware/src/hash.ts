/** SHA-256 hash a string and return the hex digest. Works in Workers and Node. */
export async function sha256(input: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = new Uint8Array(hashBuffer);
	return Array.from(hashArray)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

const KEY_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const KEY_BODY_LENGTH = 40;

/**
 * Generate a new API key with the format: `ck_live_<40 random chars>` (48 chars total).
 *
 * Returns the plaintext key, its SHA-256 hash, and the 8-char prefix for identification.
 */
export async function generateApiKey(
	environment: "live" | "test" = "live",
): Promise<{ apiKey: string; keyHash: string; prefix: string }> {
	const randomBytes = new Uint8Array(KEY_BODY_LENGTH);
	crypto.getRandomValues(randomBytes);

	const body = Array.from(randomBytes)
		.map((b) => KEY_CHARS[b % KEY_CHARS.length])
		.join("");

	const apiKey = `ck_${environment}_${body}`;
	const prefix = apiKey.slice(0, 12); // "ck_live_xxxx"
	const keyHash = await sha256(apiKey);

	return { apiKey, keyHash, prefix };
}
