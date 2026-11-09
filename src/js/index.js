// Flip card.
const card = document.getElementById('card');
const front = document.getElementById('front');
const back = document.getElementById('back');
const openButton = document.getElementById('flip-open');
const closeButton = document.getElementById('flip-close');

function setFlipped(flipped, moveFocus) {
    card.classList.toggle('flipped', flipped);
    openButton.setAttribute('aria-expanded', String(flipped));

    // Only the visible face is focusable.
    front.inert = flipped;
    back.inert = !flipped;
    front.setAttribute('aria-hidden', String(flipped));
    back.setAttribute('aria-hidden', String(!flipped));

    if (moveFocus) {
        (flipped ? closeButton : openButton).focus({ preventScroll: true });
    }
}

// detail is 0 for keyboard clicks.
front.addEventListener('click', (event) => setFlipped(true, event.detail === 0));
closeButton.addEventListener('click', (event) => setFlipped(false, event.detail === 0));

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && card.classList.contains('flipped')) {
        setFlipped(false, true);
    }
});

// Share sheet.
const shareButton = document.getElementById('share-open');
const sheet = document.getElementById('share');
const shareLink = document.getElementById('share-link');
const shareClose = document.getElementById('share-close');
const shareStatus = document.getElementById('share-status');

shareButton.addEventListener('click', (event) => {
    // Clicks on the front flip the card; this one shouldn't.
    event.stopPropagation();
    shareStatus.textContent = '';
    sheet.showModal();
});

shareClose.addEventListener('click', () => sheet.close());
sheet.addEventListener('close', () => shareButton.focus({ preventScroll: true }));

// Overlay taps land on the dialog itself.
sheet.addEventListener('click', (event) => {
    if (event.target === sheet) sheet.close();
});

// Keep Tab inside the sheet.
sheet.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const edge = event.shiftKey ? shareLink : shareClose;
    if (document.activeElement === edge) {
        (event.shiftKey ? shareClose : shareLink).focus();
        event.preventDefault();
    }
});

// Phones get the share menu; elsewhere the link is copied.
shareLink.addEventListener('click', async () => {
    const url = shareLink.dataset.url;
    if (navigator.share) {
        // Rejects when the menu is dismissed.
        await navigator.share({ title: document.title, url }).catch(() => {});
        return;
    }
    try {
        await navigator.clipboard.writeText(url);
        shareStatus.textContent = 'Link copied.';
    } catch {
        shareStatus.textContent = `Copy this link: ${url}`;
    }
});

// Desktop tilt.
const tilt = document.getElementById('tilt');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const MAX_TILT = 6; // degrees

let frame = null;

function resetTilt() {
    tilt.style.setProperty('--rx', '0deg');
    tilt.style.setProperty('--ry', '0deg');
}

function onPointerMove(event) {
    if (!finePointer.matches || reducedMotion.matches || frame) return;

    frame = requestAnimationFrame(() => {
        frame = null;
        const box = tilt.getBoundingClientRect();
        // -1 to 1 from center.
        const x = Math.max(-1, Math.min(1, (event.clientX - (box.left + box.width / 2)) / box.width));
        const y = Math.max(-1, Math.min(1, (event.clientY - (box.top + box.height / 2)) / box.height));
        tilt.style.setProperty('--rx', `${(-y * MAX_TILT).toFixed(2)}deg`);
        tilt.style.setProperty('--ry', `${(x * MAX_TILT).toFixed(2)}deg`);
    });
}

window.addEventListener('pointermove', onPointerMove);
document.documentElement.addEventListener('pointerleave', resetTilt);
reducedMotion.addEventListener('change', resetTilt);

// Offline support. Skipped in dev so edits don't hide behind the cache.
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}
