import { describe, expect, it } from 'vitest'
import { expandLinks, isPlaylistUrl, parseMediaLinks, splitMediaLinks } from './ytdlp'

describe('parseMediaLinks', () => {
	it('takes one link per line, or several on a line, without repeats', () => {
		expect(parseMediaLinks('https://a.example/1\nhttps://a.example/2\r\n\n  https://a.example/1 https://a.example/3  ')).toEqual([
			'https://a.example/1',
			'https://a.example/2',
			'https://a.example/3',
		])
		expect(parseMediaLinks('   ')).toEqual([])
	})

	it('keeps only http and https links, so nothing else can reach yt-dlp as an option', () => {
		expect(parseMediaLinks('--exec=touch https://a.example/1 -a file:///etc/passwd http://b.example/2 javascript:alert(1)')).toEqual([
			'https://a.example/1',
			'http://b.example/2',
		])
		expect(splitMediaLinks('hello https://a.example/1 --update-to=x').rest).toEqual(['hello', '--update-to=x'])
	})
})

describe('isPlaylistUrl', () => {
	it('spots YouTube playlists and nothing else', () => {
		expect(isPlaylistUrl('https://www.youtube.com/playlist?list=PL123')).toBe(true)
		expect(isPlaylistUrl('https://www.youtube.com/watch?v=abc&list=PL123')).toBe(true)
		expect(isPlaylistUrl('https://www.youtube.com/watch?v=abc')).toBe(false)
		expect(isPlaylistUrl('not a link')).toBe(false)
	})
})

describe('expandLinks', () => {
	it('opens playlists, drops repeats and keeps failures apart', async () => {
		const expand = async (url: string) => {
			if (url.includes('bad')) throw new Error('no')
			return url.includes('list=') ? ['https://y.t/1', 'https://y.t/2'] : [url]
		}
		const result = await expandLinks(['https://y.t/1', 'https://y.t/p?list=x', 'https://y.t/bad?list=x'], expand)
		expect(result.links).toEqual(['https://y.t/1', 'https://y.t/2'])
		expect(result.failed.map(({ url }) => url)).toEqual(['https://y.t/bad?list=x'])
	})
})
