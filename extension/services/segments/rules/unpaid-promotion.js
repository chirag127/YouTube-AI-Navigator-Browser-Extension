// Unpaid Promotion Classification Rule
export const type = 'unpaidpromo'
export const description = 'Shout-outs to friends, charities, or free promotions'

export const detect = (text) => {
    const keywords = ['shout out', 'shoutout', 'check out', 'charity', 'donate', 'support', 'friend', 'channel']
    return keywords.some(k => text.toLowerCase().includes(k))
}
