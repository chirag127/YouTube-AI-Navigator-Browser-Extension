export const LC = {
    S: 'sponsor',
    SP: 'selfpromo',
    UP: 'selfpromo',
    IR: 'interaction',
    I: 'intro',
    EC: 'outro',
    P: 'preview',
    NM: 'music_offtopic',
    H: 'poi_highlight',
    T: 'filler',
    EA: 'exclusive_access',
    G: 'intro',
    C: 'content',
};
export const LM = {
    S: 'Sponsor',
    SP: 'Self Promotion/Unpaid Promotion',
    UP: 'Self Promotion/Unpaid Promotion',
    IR: 'Interaction Reminder',
    I: 'Intermission/Intro Animation',
    EC: 'Endcards/Credits',
    P: 'Preview/Recap',
    NM: 'Music: Non-Music Section',
    H: 'Highlight',
    T: 'Tangents/Jokes',
    EA: 'Exclusive Access',
    G: 'Hook/Greetings',
    C: 'Content',
};
export const CM = {
    S: '#00d26a',
    SP: '#ffff00',
    IR: '#a020f0',
    I: '#00ffff',
    EC: '#0000ff',
    P: '#00bfff',
    NM: '#ff9900',
    H: '#ff0055',
    T: '#9400d3',
    EA: '#008b45',
    G: '#4169e1',
    C: '#999999',
};
export const lk = l => {
    if (!l) return 'content';
    if (LC[l]) return LC[l];
    const fm = {
        Sponsor: 'sponsor',
        'Self Promotion': 'selfpromo',
        'Self Promotion/Unpaid Promotion': 'selfpromo',
        'Unpaid/Self Promotion': 'selfpromo',
        'Interaction Reminder': 'interaction',
        'Intermission/Intro Animation': 'intro',
        'Intermission/Intro': 'intro',
        'Endcards/Credits': 'outro',
        'Preview/Recap': 'preview',
        'Tangents/Jokes': 'filler',
        'Filler/Tangent': 'filler',
        Highlight: 'poi_highlight',
        'Exclusive Access': 'exclusive_access',
        'Off-Topic': 'music_offtopic',
        'Music: Non-Music Section': 'music_offtopic',
        'Hook/Greetings': 'intro',
        Content: 'content',
        'Main Content': 'content',
        'Content (Main Video)': 'content',
    };
    return fm[l] || l.toLowerCase().replace(/\s+/g, '_');
};
export const ln = c => LM[c] || c;
export const lgc = c => CM[c] || '#999999';
