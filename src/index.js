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
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";

import alea from "alea";
import { createNoise2D } from "simplex-noise";

const prng = alea(fxrand() * 1000000);
const noise2D = createNoise2D(prng);

let scene, camera, renderer, exporter, mesh;
const geometries = [];

const maxSize = 250;

const materialColor = "#e0e1dd";
const materialLineColor = "#415a77";
//const backgroundColor = "#002082";
const backgroundColor = "#0d1b2a";
let material;

/* blueprint colors, RGB GLSL
#002082 0.0, 0.125, 0.510
#4A6DE5 0.290, 0.427, 0.898
#CED8F7 0.808, 0.847, 0.969
*/

init();
animate();

function fbm(x, z) {
  let amplitude = 5;
  let frequency = 0.5;
  let lacunarity = 2;
  let gain = 0.5;
  let octaves = 5;
  let scale = 0.05;

  let y = amplitude / 2;

  for (let i = 0; i < octaves; i++) {
    y += amplitude * noise2D(scale * x * frequency, scale * z * frequency);
    frequency *= lacunarity;
    amplitude *= gain;
  }

  return y;
}

function paramTerrain(u, v, target) {
  u = 2 * (u - 0.5);
  v = 2 * (v - 0.5);

  let w = maxSize;

  let x = (u * w) / 2;
  let z = (v * w) / 2;

  let y = fbm(x, z);

  return { x, y, z };
}

function parametricNoisySphere(u, v, target) {
  let theta = 2 * Math.PI * u;
  let phi = Math.PI * (v - 0.5);

  let xoff = (Math.cos(theta) * Math.cos(phi) * maxSize) / 2;
  let yoff = (Math.sin(theta) * Math.cos(phi) * maxSize) / 2;

  let r = 30;
  r += fbm(xoff, yoff);

  let x = r * Math.cos(theta) * Math.cos(phi);
  let z = r * Math.sin(theta) * Math.cos(phi);
  let y = r * Math.sin(phi);

  return { x, y, z };
}

function parametricDoubleSpiral(u, v, target) {
  let theta = 2 * Math.PI * u;
  let phi = Math.PI * (v - 0.5);

  let r0 = 20;
  let r = r0;
  let n = 1;

  //r = r + 20 * Math.sin(n * theta) * Math.sin(n * phi);

  let x = r * Math.cos(theta) * Math.cos(phi);
  let z = r * Math.sin(theta) * Math.cos(phi);
  let y = r * Math.sin(phi);

  let ph = Math.atan(z, x);
  let th = Math.acos(y / r);

  n = 4;
  r = r + r * Math.sin(1 * th);

  let xr = r * Math.cos(n * th) * Math.cos(n * ph);
  let zr = r * Math.sin(n * th) * Math.cos(n * ph);
  let yr = r * Math.sin(n * ph);

  x += xr;
  z += zr;
  y += yr;
  y += 0.6 * r0;

  return { x, y, z };
}

function parametricCurve(u, v, target) {
  let s = parametricDoubleSpiral(u, v, target);

  target.set(s.x, s.y, s.z);
}

function init() {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(120, 90, 120);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  // The X axis is red. The Y axis is green. The Z axis is blue.
  //let axesHelper = new THREE.AxesHelper(60);
  //scene.add(axesHelper);

  exporter = new STLExporter();

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffbe0b, 1);
  dirLight.position.set(1, 0.25, 0);
  scene.add(dirLight);

  const floorGeometry = new THREE.BoxGeometry(maxSize, 1, maxSize);
  //geometries.push(floorGeometry);

  const mountainGeometry = new ParametricGeometry(
    parametricCurve,
    maxSize,
    maxSize
  );
  geometries.push(mountainGeometry);

  //const material = new THREE.MeshPhongMaterial({
  //color: materialColor,
  //side: THREE.DoubleSide,
  //});

  let vertexShader = `
  varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
    `;

  material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
    },
    vertexShader,
    fragmentShader: `
uniform float time;

varying vec3 vPosition;
varying vec3 vNormal;

vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);

    return a + b*cos( 6.28318*(c*t+d) );
}

void main() {
    if (vPosition.z > 0.0 && vPosition.x > -10.0) discard;

    vec2 uv = vPosition.xy * 0.01 + 0.5;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for (float i = 0.0; i < 5.0; i++) {
        uv = fract(uv * 1.5) - 0.5;

        float d = length(uv) * exp(-length(uv0));

        vec3 col = palette(length(uv0) + i*.4 + 0.75*time*.4);

        d = sin(d*8. + 0.75*time)/8.;
        d = abs(d);

        d = pow(0.005 / d, 1.2);

        finalColor += col * d;
    }

    gl_FragColor = vec4(finalColor, 0.25);
    gl_FragColor = vec4( 0.290, 0.427, 0.898, 1.0);
}
    `,
    side: THREE.DoubleSide,
    depthTest: true,
    transparent: true,
  });

  const lineMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: `
        varying vec3 vPosition;
        void main() {
            //if (vPosition.z > 0.0 && vPosition.x > -10.0) discard;
            gl_FragColor = vec4(0.808, 0.847, 0.969, 0.25);
        }
    `,
    depthTest: true,
    transparent: true,
  });

  let merged = BufferGeometryUtils.mergeGeometries([
    //floorGeometry,
    mountainGeometry,
  ]);

  mesh = new THREE.Mesh(merged, material);
  //mesh.position.set(0, 0, 2);
  scene.add(mesh);

  const wireframe = new THREE.WireframeGeometry(merged);
  const line = new THREE.LineSegments(wireframe, lineMaterial);

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

  //const gui = new GUI();
  //gui.add(params, "exportBinary").name("Export STL");
  //gui.open();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  scene.rotation.y += 0.0025;
  camera.lookAt(0, 20, 0);
  renderer.render(scene, camera);

  material.uniforms.time.value = performance.now() / 1000;
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
