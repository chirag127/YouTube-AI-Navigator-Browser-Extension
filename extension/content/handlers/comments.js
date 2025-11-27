export async function fetchCommentsFromDOM() {
    return new Promise(r => setTimeout(() => {
        const c = [], e = document.querySelectorAll('ytd-comment-thread-renderer')
        for (const el of e) {
            if (c.length >= 20) break
            try {
                const a = el.querySelector('#author-text')?.textContent?.trim(), t = el.querySelector('#content-text')?.textContent?.trim(), l = el.querySelector('#vote-count-middle')?.textContent?.trim() || '0'
                if (a && t) c.push({ author: a, text: t, likes: l })
            } catch (e) { }
        }
        r(c)
    }, 1000))
}
