// these are the variables you can use as inputs to your algorithms
console.log(fxhash); // the 64 chars hex number fed to your algorithm

// note about the fxrand() function
// when the "fxhash" is always the same, it will generate the same sequence of
// pseudo random numbers, always

//----------------------
// defining features
//----------------------
// You can define some token features by populating the $fxhashFeatures property
// of the window object.
// More about it in the guide, section features:
// [https://fxhash.xyz/articles/guide-mint-generative-token#features]
//
// window.$fxhashFeatures = {
//   "Background": "Black",
//   "Number of lines": 10,
//   "Inverted": true
// }

import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

let scene, camera, renderer, exporter, mesh;
const geometries = [];

const materialColor = 0x118ab2;
const backgroundColor = 0x073b4c;

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(120, 50, 120);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  // The X axis is red. The Y axis is green. The Z axis is blue.
  //let axesHelper = new THREE.AxesHelper(60);
  //scene.add(axesHelper);

  exporter = new STLExporter();

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
  scene.add(hemiLight);

  const material = new THREE.MeshPhongMaterial({ color: materialColor });

  const floorGeometry = new THREE.BoxGeometry(80, 1, 80);
  geometries.push(floorGeometry);

  let merged = BufferGeometryUtils.mergeGeometries([floorGeometry]);

  mesh = new THREE.Mesh(merged, material);
  //mesh.position.set(0, 0, 2);
  scene.add(mesh);

  const wireframe = new THREE.WireframeGeometry(merged);
  const line = new THREE.LineSegments(wireframe);
  //line.material.depthTest = false;
  line.material.opacity = 0.25;
  line.material.transparent = true;

  scene.add(line);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 10);
  controls.update();

  window.addEventListener("resize", onWindowResize);

  const params = {
    exportBinary: exportBinary,
  };

  const gui = new GUI();
  gui.add(params, "exportBinary").name("Export STL");
  gui.open();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  scene.rotation.y += 0.0025;
  camera.lookAt(0, 10, 0);
  renderer.render(scene, camera);
}

function exportBinary() {
  // we need to apply a transform to the mesh
  // because blender is a z-up application,
  let meshMaterial = new THREE.MeshPhongMaterial({ color: materialColor });
  const mesh = new THREE.Mesh(
    BufferGeometryUtils.mergeGeometries(geometries),
    meshMaterial
  );
  mesh.rotateX(Math.PI / 2);
  mesh.rotateY(0);
  mesh.updateMatrix();
  mesh.geometry.applyMatrix4(mesh.matrix);

  const result = exporter.parse(mesh, { binary: true });
  saveArrayBuffer(result, `${fxhash}.stl`);
}

function saveArrayBuffer(buffer, filename) {
  save(new Blob([buffer], { type: "application/octet-stream" }), filename);
}

const link = document.createElement("a");
link.style.display = "none";
document.body.appendChild(link);

function save(blob, filename) {
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
