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

const params = {
  exportASCII: exportASCII,
};

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(100, 25, 150);
  camera.up.set(0, 0, 1);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);

  // The X axis is red. The Y axis is green. The Z axis is blue.
  let axesHelper = new THREE.AxesHelper(60);
  scene.add(axesHelper);

  exporter = new STLExporter();

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(50, 0, 100);
  scene.add(hemiLight);

  const material = new THREE.MeshPhongMaterial({ color: 0xcccccc });

  const geometry0 = new THREE.BoxGeometry(80, 80, 1);

  const length = 6;
  const width = 4;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, width);
  shape.lineTo(length, width);
  shape.lineTo(length, 0);
  shape.lineTo(0, 0);

  const extrudeSettings = {
    steps: 1,
    depth: 4,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  let merged = BufferGeometryUtils.mergeBufferGeometries([
    geometry0.toNonIndexed(),
    geometry,
  ]);

  mesh = new THREE.Mesh(merged, material);
  //mesh.position.set(0, 0, 2);
  scene.add(mesh);

  /*
  const wireframe = new THREE.WireframeGeometry(geometry);
  const line = new THREE.LineSegments(wireframe);
  line.material.depthTest = false;
  line.material.opacity = 0.25;
  line.material.transparent = true;

  scene.add(line);
*/

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 10);
  controls.update();

  window.addEventListener("resize", onWindowResize);

  const gui = new GUI();
  gui.add(params, "exportASCII").name("Export STL (ASCII)");
  gui.open();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function exportASCII() {
  const result = exporter.parse(mesh);
  saveString(result, `${fxhash}.stl`);
}

function saveString(text, filename) {
  save(new Blob([text], { type: "text/plain" }), filename);
}

const link = document.createElement("a");
link.style.display = "none";
document.body.appendChild(link);

function save(blob, filename) {
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
