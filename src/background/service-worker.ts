import browser from 'webextension-polyfill'

browser.runtime.onInstalled.addListener(() => {
	// No background work needed for this extension.
})
