// DOM utility shortcuts

// addEventListener
export const ael = (element, event, handler) => {
    if (element) element.addEventListener(event, handler);
};

// setTextContent
export const stc = (element, text) => {
    if (element) element.textContent = text;
};

// innerHTML
export const ih = (element, html) => {
    if (element) element.innerHTML = html;
};

// appendChild
export const ac = (parent, child) => {
    if (parent && child) parent.appendChild(child);
};
