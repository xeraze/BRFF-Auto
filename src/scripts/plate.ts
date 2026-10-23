import * as THREE from 'three';
import { scene, onFrame, view, mode, reduce, PLATE } from './stage';

const CANVAS_W = 1040;
const CANVAS_H = 224;
const FONT = 'Arial, Helvetica, sans-serif';
const TURNS = 2;

const canvas = document.createElement('canvas');
canvas.width = CANVAS_W * 2;
canvas.height = CANVAS_H * 2;
const ctx = canvas.getContext('2d')!;
ctx.scale(2, 2);

function drawPlate(main: string, region: string) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.roundRect(10, 10, CANVAS_W - 20, CANVAS_H - 20, 16);
  ctx.stroke();

  ctx.fillStyle = '#111';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '8px';
  let size = 160;
  do {
    ctx.font = `700 ${size}px ${FONT}`;
    size -= 6;
  } while (ctx.measureText(main).width > 660 && size > 50);
  ctx.fillText(main, 395, 120);

  ctx.letterSpacing = '0px';
  ctx.fillRect(768, 14, 7, CANVAS_H - 28);
  ctx.font = `700 118px ${FONT}`;
  ctx.fillText(region, 880, 92);
  ctx.font = `700 36px ${FONT}`;
  ctx.fillText('RUS', 850, 186);

  ['#fff', '#0039a6', '#d52b1e'].forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(900, 164 + i * 8, 48, 8);
  });
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.strokeRect(900, 164, 48, 24);
}
drawPlate('BRFF', '77');

const texture = new THREE.CanvasTexture(canvas);
texture.colorSpace = THREE.SRGBColorSpace;
texture.anisotropy = 8;

function roundedShape(w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - r);
  shape.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x + r, y + h);
  shape.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

const RADIUS = 0.13;
const DEPTH = 0.04;
const BEVEL = 0.008;
const outline = roundedShape(PLATE.w, PLATE.h, RADIUS);

const slabGeometry = new THREE.ExtrudeGeometry(outline, {
  depth: DEPTH,
  bevelEnabled: true,
  bevelThickness: BEVEL,
  bevelSize: BEVEL,
  bevelSegments: 2,
  curveSegments: 24,
});
slabGeometry.translate(0, 0, -DEPTH / 2);
const slab = new THREE.Mesh(
  slabGeometry,
  new THREE.MeshPhysicalMaterial({ color: 0xf4f4f4, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.15 }),
);

const frontGeometry = new THREE.ShapeGeometry(outline, 24);
const uv = frontGeometry.attributes.uv;
const position = frontGeometry.attributes.position;
for (let i = 0; i < uv.count; i++) {
  uv.setXY(i, position.getX(i) / PLATE.w + 0.5, position.getY(i) / PLATE.h + 0.5);
}
const front = new THREE.Mesh(
  frontGeometry,
  new THREE.MeshPhysicalMaterial({ map: texture, bumpMap: texture, bumpScale: 2, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.12 }),
);
front.position.z = DEPTH / 2 + BEVEL + 0.001;

const plate = new THREE.Group();
plate.add(slab, front);
scene.add(plate);

const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', Y: 'У', X: 'Х',
};
const ALLOWED_LETTERS = 'АВЕКМНОРСТУХ';
const PLACEHOLDER = { letter: 'А', digits: '777', letters: 'АА', region: '77' };
const HINT = 'Буквы только А В Е К М Н О Р С Т У Х. Регион: 2 цифры (01–99) или 3 (1xx, 7xx).';
const FIELD_LENGTHS = [1, 3, 2, 3];

const fields = ['pl-l1', 'pl-d', 'pl-l2', 'pl-r'].map((id) => document.getElementById(id) as HTMLInputElement);
const [letterField, digitsField, lettersField, regionField] = fields;
const hint = document.getElementById('pl-hint')!;

const onlyLetters = (value: string, limit: number) =>
  [...value.toUpperCase()]
    .map((char) => LATIN_TO_CYRILLIC[char] ?? char)
    .filter((char) => ALLOWED_LETTERS.includes(char))
    .slice(0, limit)
    .join('');
const onlyDigits = (value: string, limit: number) => value.replace(/\D/g, '').slice(0, limit);
const fill = (value: string, placeholder: string) => value + placeholder.slice(value.length);

function validate(digits: string, region: string) {
  if (digits === '000') return 'Цифры 000 на номерах не выдаются';
  if (region === '00') return 'Регион не может быть 00';
  if (region.length === 3 && !/^[17]/.test(region)) return 'Трёхзначный регион начинается с 1 или 7';
  return '';
}

function sync() {
  const letter = onlyLetters(letterField.value, 1);
  const digits = onlyDigits(digitsField.value, 3);
  const letters = onlyLetters(lettersField.value, 2);
  const region = onlyDigits(regionField.value, 3);
  letterField.value = letter;
  digitsField.value = digits;
  lettersField.value = letters;
  regionField.value = region;

  const error = validate(digits, region);
  hint.textContent = error || HINT;
  hint.classList.toggle('text-accent', !!error);

  if (!letter && !digits && !letters && !region) {
    drawPlate('BRFF', '77');
  } else {
    const main = `${fill(letter, PLACEHOLDER.letter)} ${fill(digits, PLACEHOLDER.digits)} ${fill(letters, PLACEHOLDER.letters)}`;
    drawPlate(main, region.length < 2 ? fill(region, PLACEHOLDER.region) : region);
  }
  texture.needsUpdate = true;
}

let pitch = 0;
let yaw = 0;
let pop = 0;

fields.forEach((field, i) => {
  field.addEventListener('input', () => {
    sync();
    if (i < fields.length - 1 && field.value.length === FIELD_LENGTHS[i]) fields[i + 1].focus();
    if (!reduce) pop = 0.08;
  });
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !field.value && i > 0) fields[i - 1].focus();
  });
});

onFrame((time) => {
  plate.visible = mode.current === 'plate';
  if (!plate.visible) return;

  const progress = view.sp;
  const sway = reduce ? 0 : Math.sin(time / 1800) * 0.1;
  const bob = reduce ? 0 : Math.sin(time / 900) * 0.04;

  yaw += (view.px * 0.35 + sway + progress * Math.PI * 2 * TURNS - yaw) * 0.07;
  pitch += (view.py * 0.2 - pitch) * 0.07;
  pop *= 0.88;

  plate.rotation.set(pitch, yaw, Math.sin(progress * 9) * 0.08);
  plate.position.y = 0.3 * (1 - Math.min(progress * 5, 1)) + 0.15 + bob;
  plate.scale.setScalar(1 - Math.sin(progress * Math.PI) * 0.3 + pop);
});
