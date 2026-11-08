// Flip the card between the front (who) and the back (how to reach me).
const card = document.getElementById('card');
const front = document.getElementById('front');
const back = document.getElementById('back');
const openButton = document.getElementById('flip-open');
const closeButton = document.getElementById('flip-close');

function setFlipped(flipped) {
    card.classList.toggle('flipped', flipped);
    openButton.setAttribute('aria-expanded', String(flipped));

    // Only the visible face can be reached by keyboard or screen reader.
    front.inert = flipped;
    back.inert = !flipped;
    front.setAttribute('aria-hidden', String(flipped));
    back.setAttribute('aria-hidden', String(!flipped));

    (flipped ? closeButton : openButton).focus({ preventScroll: true });
}

// The whole front is a tap target. The button inside it bubbles up here too.
front.addEventListener('click', () => setFlipped(true));
closeButton.addEventListener('click', () => setFlipped(false));

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && card.classList.contains('flipped')) {
        setFlipped(false);
    }
});


// Tilt toward the mouse on desktop. Off for touch and for reduced motion.
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
        // -1 to 1 from the card's center, clamped so far-off pointers don't overdo it.
        const x = Math.max(-1, Math.min(1, (event.clientX - (box.left + box.width / 2)) / box.width));
        const y = Math.max(-1, Math.min(1, (event.clientY - (box.top + box.height / 2)) / box.height));
        tilt.style.setProperty('--rx', `${(-y * MAX_TILT).toFixed(2)}deg`);
        tilt.style.setProperty('--ry', `${(x * MAX_TILT).toFixed(2)}deg`);
    });
}

window.addEventListener('pointermove', onPointerMove);
document.documentElement.addEventListener('pointerleave', resetTilt);
reducedMotion.addEventListener('change', resetTilt);
