import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const PLATE = { w: 5.2, h: 1.12 };
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const scene = new THREE.Scene();
export const mode = { current: 'plate' as 'plate' | 'car' };
export const view = { screens: 0, max: 1, sp: 0, px: 0, py: 0 };

const FOV = 34;
const ROAD = { width: 12, length: 140, y: -0.75, z: -55 };
const POST_COUNT = 14;
const POST_GAP = 10;
const POST_LOOP = POST_COUNT * POST_GAP;
const POST_COLORS = [0xff5a1f, 0x4d6bff];

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('gl') as HTMLCanvasElement,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;

scene.fog = new THREE.Fog(0x090a0f, 10, 70);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);
const key = new THREE.DirectionalLight(0xffffff, 1.4);
scene.add(key);

function createRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#17191f';
  ctx.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 1024, 2, 2);
  }
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(14, 0, 10, 1024);
  ctx.fillRect(488, 0, 10, 1024);
  ctx.fillStyle = '#ff5a1f';
  ctx.fillRect(246, 64, 20, 384);
  ctx.fillRect(246, 576, 20, 384);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 14);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

const roadTexture = createRoadTexture();
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(ROAD.width, ROAD.length),
  new THREE.MeshStandardMaterial({ map: roadTexture, roughness: 0.55, metalness: 0.2 }),
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, ROAD.y, ROAD.z);
scene.add(road);

const postGeometry = new THREE.BoxGeometry(0.18, 0.9, 0.18);
const postMaterials = POST_COLORS.map((color) => new THREE.MeshBasicMaterial({ color }));
const posts: THREE.Mesh[] = [];
for (let i = 0; i < POST_COUNT; i++) {
  [-1, 1].forEach((side, index) => {
    const post = new THREE.Mesh(postGeometry, postMaterials[index]);
    post.position.set(side * 6.6, -0.3, 12 - i * POST_GAP);
    scene.add(post);
    posts.push(post);
  });
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  const unit = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const z = Math.max(PLATE.w / (0.84 * unit * camera.aspect), PLATE.h / (0.44 * unit));
  camera.position.set(0, 1 + z * 0.04, z);
  camera.lookAt(0, 0.1, 0);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

addEventListener('pointermove', (e) => {
  view.px = (e.clientX / innerWidth) * 2 - 1;
  view.py = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });

function onScroll() {
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  view.screens = scrollY / innerHeight;
  view.max = Math.max(1, scrollable / innerHeight);
  view.sp = scrollY / Math.max(1, scrollable);
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
onScroll();

const frameCallbacks: Array<(time: number) => void> = [];
export const onFrame = (callback: (time: number) => void) => {
  frameCallbacks.push(callback);
};

let speed = 0.05;
let lastScroll = scrollY;
renderer.setAnimationLoop((time) => {
  const scrolled = Math.abs(scrollY - lastScroll);
  lastScroll = scrollY;
  const target = reduce ? 0 : 0.06 + Math.min(scrolled, 80) * 0.012;
  speed += (target - speed) * 0.08;

  roadTexture.offset.y += speed / 10;
  for (const post of posts) {
    post.position.z += speed;
    if (post.position.z > 14) post.position.z -= POST_LOOP;
  }
  key.position.set(view.px * 6, -view.py * 4 + 3, 6);

  for (const callback of frameCallbacks) callback(time);
  renderer.render(scene, camera);
});
