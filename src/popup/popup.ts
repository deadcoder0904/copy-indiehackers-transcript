import browser from 'webextension-polyfill'

const HOST_NAME = 'Courtland Allen'
const PODCAST_PATH = '/podcast/'

function qs<T extends Element = Element>(sel: string): T {
	const el = document.querySelector(sel)
	if (!el) throw new Error(`Missing element: ${sel}`)
	return el as T
}

function setStatus(el: HTMLElement, text: string) {
	el.textContent = text
}

function buildFilename(): string {
	return 'transcript.txt'
}

function stripImageLines(value: string): string {
	const lines = value.split('\n')
	const filtered = lines.filter((line) => !line.trim().startsWith('![]('))
	return filtered
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim()
}

type TranscriptPayload = {
	markdown: string
	text: string
	guestName: string
	error?: string
}

function extractTranscriptFromPage(hostName: string): TranscriptPayload {
	const toMarkdownAnchor = (text: string, href: string) => (href ? `[${text}](${href})` : text)
	const toPlainAnchor = (text: string, href: string) => (href ? `${text} (${href})` : text)

	const nodeToString = (node: Node, mode: 'markdown' | 'text'): string => {
		if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
		if (node.nodeType !== Node.ELEMENT_NODE) return ''

		const el = node as HTMLElement
		const tag = el.tagName.toLowerCase()

		if (tag === 'br') return '\n'
		if (tag === 'a') {
			const text = el.textContent?.trim() ?? ''
			const href = (el as HTMLAnchorElement).getAttribute('href') ?? ''
			return mode === 'markdown' ? toMarkdownAnchor(text, href) : toPlainAnchor(text, href)
		}

		return Array.from(el.childNodes)
			.map((child) => nodeToString(child, mode))
			.join('')
	}

	const normalizeParagraph = (text: string) => text.replace(/\n{3,}/g, '\n\n').trim()

	const transcriptRoot = document.querySelector('.episode-transcript')
	if (!transcriptRoot) {
		return { markdown: '', text: '', guestName: '', error: 'Transcript not found on this page.' }
	}

	const turns = Array.from(transcriptRoot.querySelectorAll('.episode-transcript__speaking-turn'))

	if (!turns.length) {
		return { markdown: '', text: '', guestName: '', error: 'Transcript is empty.' }
	}

	let guestName = ''

	type TurnData = {
		speaker: string
		timestamp: string
		markdownParagraphs: string[]
		textParagraphs: string[]
	}

	const collected: TurnData[] = []

	for (const turn of turns) {
		const speakerEl = turn.querySelector('.episode-transcript__speaker-name')
		const timeEl = turn.querySelector('.episode-transcript__timestamp span')
		const speaker = speakerEl?.textContent?.trim() ?? ''
		if (!speaker) continue

		const timestamp = timeEl?.textContent?.trim() ?? ''
		if (speaker !== hostName && !guestName) guestName = speaker

		const paragraphs = Array.from(turn.querySelectorAll('.episode-transcript__paragraph'))
		const markdownParagraphs = paragraphs
			.map((p) => normalizeParagraph(nodeToString(p, 'markdown')))
			.filter(Boolean)
		const textParagraphs = paragraphs
			.map((p) => normalizeParagraph(nodeToString(p, 'text')))
			.filter(Boolean)

		collected.push({ speaker, timestamp, markdownParagraphs, textParagraphs })
	}

	const resolvedGuestName = guestName || 'Guest'

	const markdownBlocks = collected.map((turn) => {
		const header = `${turn.speaker} ${turn.timestamp}`.trim()
		const body = turn.markdownParagraphs.join('\n\n')
		return body ? `${header}\n\n${body}` : header
	})

	const textBlocks = collected.map((turn) => {
		const header = `${turn.speaker} ${turn.timestamp}`.trim()
		const body = turn.textParagraphs.join('\n\n')
		return body ? `${header}\n\n${body}` : header
	})

	const headerLines = `${hostName} = Host of IndieHackers Podcast\n${resolvedGuestName} = Guest`

	return {
		markdown: `${headerLines}\n\n${markdownBlocks.join('\n\n')}`.trim(),
		text: `${headerLines}\n\n${textBlocks.join('\n\n')}`.trim(),
		guestName: resolvedGuestName,
	}
}

async function getActiveTab() {
	const tabs = await browser.tabs.query({ active: true, currentWindow: true })
	return tabs[0]
}

async function loadTranscript(
	outputEl: HTMLTextAreaElement,
	statusEl: HTMLElement,
	copyButton: HTMLButtonElement,
	saveButton: HTMLButtonElement
) {
	setStatus(statusEl, 'Loading transcript...')
	outputEl.value = ''
	copyButton.disabled = true
	saveButton.disabled = true

	const tab = await getActiveTab()
	const url = tab?.url ?? ''
	if (!url || !url.includes('indiehackers.com') || !url.includes(PODCAST_PATH)) {
		setStatus(statusEl, 'Open an Indie Hackers podcast episode tab first.')
		return
	}

	if (!tab?.id) {
		setStatus(statusEl, 'Could not access the active tab.')
		return
	}

	const [result] = await browser.scripting.executeScript({
		target: { tabId: tab.id },
		func: extractTranscriptFromPage,
		args: [HOST_NAME],
	})

	const payload = (result?.result ?? {
		markdown: '',
		text: '',
		guestName: '',
		error: 'Unable to read transcript.',
	}) as TranscriptPayload

	if (payload.error || !payload.markdown) {
		setStatus(statusEl, payload.error ?? 'Transcript not found.')
		return
	}

	const cleanedMarkdown = stripImageLines(payload.markdown)
	const cleanedText = stripImageLines(payload.text)

	outputEl.value = cleanedMarkdown
	copyButton.disabled = false
	saveButton.disabled = false
	setStatus(statusEl, `Loaded guest: ${payload.guestName}`)

	return { markdown: cleanedMarkdown, text: cleanedText, filename: buildFilename() }
}

async function init() {
	const output = qs<HTMLTextAreaElement>('#output')
	const status = qs<HTMLDivElement>('#status')
	const copyButton = qs<HTMLButtonElement>('#copyMarkdown')
	const saveButton = qs<HTMLButtonElement>('#saveTxt')

	let latestMarkdown = ''
	let latestText = ''
	let latestFilename = 'transcript.txt'

	const data = await loadTranscript(output, status, copyButton, saveButton)
	if (data) {
		latestMarkdown = data.markdown
		latestText = data.text
		latestFilename = data.filename
	}

	copyButton.addEventListener('click', async () => {
		if (!latestMarkdown) return
		await navigator.clipboard.writeText(latestMarkdown)
		setStatus(status, 'Copied markdown to clipboard.')
	})

	saveButton.addEventListener('click', async () => {
		if (!latestText) return
		const blob = new Blob([latestText], { type: 'text/plain' })
		const blobUrl = URL.createObjectURL(blob)

		// Create a temporary anchor element to trigger download with correct filename
		const a = document.createElement('a')
		a.href = blobUrl
		a.download = latestFilename
		a.style.display = 'none'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)

		// Clean up the blob URL after a short delay
		setTimeout(() => {
			URL.revokeObjectURL(blobUrl)
		}, 100)

		setStatus(status, `Saved ${latestFilename}`)
	})
}

document.addEventListener('DOMContentLoaded', init)
