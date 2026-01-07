// Indie Hackers podcast URL utilities
export function isIndieHackersUrl(urlStr: string): boolean {
	try {
		const url = new URL(urlStr)
		return /(^|\.)indiehackers\.com$/i.test(url.hostname)
	} catch {
		return false
	}
}

export function isIndieHackersPodcastUrl(urlStr: string): boolean {
	try {
		const url = new URL(urlStr)
		return isIndieHackersUrl(urlStr) && url.pathname.includes('/podcast/')
	} catch {
		return false
	}
}

export function extractEpisodeInfo(
	urlStr: string
): { episodeNumber: string; guestName: string } | null {
	try {
		const url = new URL(urlStr)
		if (!isIndieHackersPodcastUrl(urlStr)) return null

		const podcastPath = url.pathname.split('/podcast/')[1]
		if (!podcastPath) return null

		const parts = podcastPath.split('-')
		const episodeNumber = parts[0]
		const guestName = parts.slice(1).join(' ')

		return { episodeNumber, guestName }
	} catch {
		return null
	}
}
