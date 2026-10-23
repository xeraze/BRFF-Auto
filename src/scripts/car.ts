import * as THREE from 'three';
import { scene, onFrame, view, mode } from './stage';

const MODEL_URL = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/dodge.glb`;
const CAR_LENGTH = 6;
const ROAD_Y = -0.75;
const DRIVE_DISTANCE = 95;

async function loadModel() {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
  return gltf.scene;
}

function rearTurn(model: THREE.Group, box: THREE.Box3, size: THREE.Vector3) {
  const alongX = size.x > size.z;
  const axis = alongX ? 'x' : 'z';
  const middle = (box.min[axis] + box.max[axis]) / 2;
  const roofLevel = box.max.y - size.y * 0.15;
  const vertex = new THREE.Vector3();
  let sum = 0;
  let count = 0;

  model.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
      if (vertex.y > roofLevel) {
        sum += vertex[axis];
        count++;
      }
    }
  });

  const rearIsPositive = (count ? sum / count : middle) > middle;
  if (alongX) return rearIsPositive ? -Math.PI / 2 : Math.PI / 2;
  return rearIsPositive ? 0 : Math.PI;
}

async function init() {
  let model: THREE.Group;
  try {
    model = await loadModel();
  } catch {
    return;
  }

  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -box.min.y, -center.z);

  const holder = new THREE.Group();
  holder.add(model);
  holder.rotation.y = rearTurn(model, box, size);
  holder.scale.setScalar(CAR_LENGTH / Math.max(size.x, size.z));

  const car = new THREE.Group();
  car.add(holder);
  car.visible = false;
  scene.add(car);

  onFrame((time) => {
    car.visible = mode.current === 'car';
    if (!car.visible) return;
    const progress = Math.min(1, view.screens / Math.max(0.5, view.max));
    car.position.set(
      Math.sin(progress * 5) * 0.25,
      ROAD_Y + Math.sin(time / 90) * 0.004,
      -1 - DRIVE_DISTANCE * Math.pow(progress, 1.4),
    );
  });
}

let started = false;
onFrame(() => {
  if (started || mode.current !== 'car') return;
  started = true;
  init();
});
