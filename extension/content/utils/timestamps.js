/**
 * Make timestamps in text clickable
 */

import { seekVideo } from './dom.js'

/**
 * Make all timestamps in container clickable
 * @param {HTMLElement} container - Container element
 */
export function makeTimestampsClickable(container) {
    const pattern = /(\[|\()?(\d{1,2}):(\d{2})(\]|\))?/g
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    const nodes = []

    let node
    while ((node = walker.nextNode())) {
        if (pattern.test(node.textContent)) {
            nodes.push(node)
        }
    }

    nodes.forEach(textNode => {
        const text = textNode.textContent
        const fragment = document.createDocumentFragment()
        let lastIndex = 0

        text.replace(pattern, (match, p1, mins, secs, p4, offset) => {
            // Add text before match
            if (offset > lastIndex) {
                fragment.appendChild(
                    document.createTextNode(text.substring(lastIndex, offset))
                )
            }

            // Create clickable timestamp
            const totalSecs = parseInt(mins) * 60 + parseInt(secs)
            const link = document.createElement('span')
            link.textContent = match
            link.className = 'yt-ai-clickable-timestamp'
            link.style.cssText = 'color:var(--yt-ai-accent);cursor:pointer;font-weight:600;text-decoration:underline;'
            link.addEventListener('click', () => seekVideo(totalSecs))
            fragment.appendChild(link)

            lastIndex = offset + match.length
        })

        // Add remaining text
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)))
        }

        textNode.parentNode.replaceChild(fragment, textNode)
    })
}
