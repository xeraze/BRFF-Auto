import { reduce, mode } from './stage';

const FADE_MS = 220;

document.querySelectorAll<HTMLElement>('.glass').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });
});

const words = document.getElementById('words')!;
words.innerHTML = words.textContent!.trim().split(/\s+/).map((word) => `<span>${word}</span> `).join('');
const spans = [...words.querySelectorAll('span')];
const upButton = document.querySelector<HTMLButtonElement>('.up')!;
const marquee = document.querySelector<HTMLElement>('.marquee')!;

function onScroll() {
  upButton.classList.toggle('show', scrollY > 500);
  marquee.style.opacity = String(Math.max(0, 1 - scrollY / (innerHeight * 0.45)));

  const rect = words.getBoundingClientRect();
  const progress = (innerHeight * 0.85 - rect.top) / (rect.height + innerHeight * 0.3);
  spans.forEach((span, i) => span.classList.toggle('on', i / spans.length < progress));
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

upButton.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

const canvas = document.getElementById('gl') as HTMLCanvasElement;
document.querySelectorAll<HTMLButtonElement>('[data-m]').forEach((button) => {
  button.addEventListener('click', () => {
    const next = button.dataset.m as 'plate' | 'car';
    if (next === mode.current) return;
    canvas.style.opacity = '0';
    setTimeout(() => {
      mode.current = next;
      document.documentElement.dataset.mode = next;
      scrollTo({ top: 0, behavior: 'instant' });
      canvas.style.opacity = '1';
    }, reduce ? 0 : FADE_MS);
  });
});
