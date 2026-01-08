import { describe, expect, it } from 'bun:test'
import {
  extractEpisodeInfo,
  isIndieHackersPodcastUrl,
  isIndieHackersUrl,
} from '../../src/shared/utils'

describe('Indie Hackers URL utilities', () => {
  it('should identify Indie Hackers URLs', () => {
    expect(
      isIndieHackersUrl('https://www.indiehackers.com/podcast/086-lynne-tye-of-key-values')
    ).toBeTrue()
    expect(
      isIndieHackersUrl('https://indiehackers.com/podcast/086-lynne-tye-of-key-values')
    ).toBeTrue()
    expect(isIndieHackersUrl('https://google.com')).toBeFalse()
  })

  it('should identify Indie Hackers podcast URLs', () => {
    expect(
      isIndieHackersPodcastUrl('https://www.indiehackers.com/podcast/086-lynne-tye-of-key-values')
    ).toBeTrue()
    expect(
      isIndieHackersPodcastUrl('https://indiehackers.com/podcast/086-lynne-tye-of-key-values')
    ).toBeTrue()
    expect(isIndieHackersPodcastUrl('https://www.indiehackers.com/')).toBeFalse()
    expect(isIndieHackersPodcastUrl('https://google.com')).toBeFalse()
  })

  it('should extract episode info from podcast URL', () => {
    const testUrl = 'https://www.indiehackers.com/podcast/086-lynne-tye-of-key-values'
    const info = extractEpisodeInfo(testUrl)
    expect(info).not.toBeNull()
    expect(info?.episodeNumber).toBe('086')
    expect(info?.guestName).toBe('lynne tye of key values')
  })

  it('should handle the specific URL from the request', () => {
    const requestUrl = 'https://www.indiehackers.com/podcast/086-lynne-tye-of-key-values'
    expect(isIndieHackersPodcastUrl(requestUrl)).toBeTrue()
    const info = extractEpisodeInfo(requestUrl)
    expect(info).not.toBeNull()
    expect(info?.episodeNumber).toBe('086')
    expect(info?.guestName).toBe('lynne tye of key values')
  })

  it('should handle various Indie Hackers podcast URL formats', () => {
    const urls = [
      'https://www.indiehackers.com/podcast/086-lynne-tye-of-key-values',
      'https://indiehackers.com/podcast/086-lynne-tye-of-key-values',
      'https://www.indiehackers.com/podcast/086-lynne-tye-of-key-values/',
    ]

    urls.forEach((url) => {
      expect(isIndieHackersPodcastUrl(url)).toBeTrue()
      const info = extractEpisodeInfo(url)
      expect(info).not.toBeNull()
      expect(info?.episodeNumber).toBe('086')
    })
  })

  it('should return null for non-podcast URLs', () => {
    expect(extractEpisodeInfo('https://www.indiehackers.com/')).toBeNull()
    expect(extractEpisodeInfo('https://google.com')).toBeNull()
    expect(extractEpisodeInfo('not-a-url')).toBeNull()
  })

  it('should handle edge cases for podcast URLs', () => {
    // URL with trailing slash
    expect(
      extractEpisodeInfo('https://www.indiehackers.com/podcast/086-lynne-tye-of-key-values/')
    ).not.toBeNull()

    // URL with query parameters
    expect(
      extractEpisodeInfo(
        'https://www.indiehackers.com/podcast/086-lynne-tye-of-key-values?utm_source=twitter'
      )
    ).not.toBeNull()

    // URL with hash
    expect(
      extractEpisodeInfo(
        'https://www.indiehackers.com/podcast/086-lynne-tye-of-key-values#comments'
      )
    ).not.toBeNull()
  })
})
