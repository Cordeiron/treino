import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { CameraPreset, LiveryMode, TireCompound } from '../types/racing';

export interface F1SceneConfig {
  mode: 'starting_grid' | 'garage';
  cameraPreset: CameraPreset;
  livery: LiveryMode;
  tireCompound: TireCompound;
  drsOpen: boolean;
  trackSpeedActive: boolean;
  startLightsLit: number; // 0..5 red lights, -1 = lights out
}

const _camPosTarget = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();

const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  [CameraPreset.HERO]: { pos: [4.3, 1.85, 4.9], target: [0, 0.45, 0.2] },
  [CameraPreset.FRONT_WING]: { pos: [1.9, 0.85, 3.85], target: [0, 0.28, 1.9] },
  [CameraPreset.COCKPIT]: { pos: [1.35, 1.55, 0.35], target: [0, 0.65, 0.15] },
  [CameraPreset.SIDEPOD]: { pos: [3.6, 1.05, 0.1], target: [0, 0.45, -0.1] },
  [CameraPreset.OVERHEAD]: { pos: [0.01, 6.2, 0.8], target: [0, 0.3, 0] },
};

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createCarbonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#14181d';
  ctx.fillRect(0, 0, 128, 128);

  for (let y = 0; y < 128; y += 8) {
    for (let x = 0; x < 128; x += 8) {
      const offset = ((y / 8) % 2) * 4;
      ctx.fillStyle = '#1f262e';
      ctx.fillRect((x + offset) % 128, y, 4, 4);
      ctx.fillStyle = '#0d1014';
      ctx.fillRect((x + offset + 4) % 128, y + 4, 4, 4);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function createAsphaltGridTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark obsidian tarmac
  ctx.fillStyle = '#0a0d11';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle asphalt grain
  for (let i = 0; i < 9000; i++) {
    const x = (i * 73) % 1024;
    const y = ((i * 197) + Math.floor(i / 13) * 19) % 1024;
    const v = 14 + (i % 18);
    ctx.fillStyle = `rgb(${v},${v + 3},${v + 6})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Telemetry grid lines
  ctx.strokeStyle = 'rgba(197, 203, 208, 0.08)';
  ctx.lineWidth = 2;
  for (let g = 0; g <= 1024; g += 128) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(1024, g);
    ctx.stroke();
  }

  // F1 Starting Grid Box around car center
  ctx.strokeStyle = 'rgba(0, 210, 190, 0.68)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(352, 240);
  ctx.lineTo(672, 240);
  ctx.moveTo(352, 240);
  ctx.lineTo(352, 340);
  ctx.moveTo(672, 240);
  ctx.lineTo(672, 340);
  ctx.stroke();

  // P1 Pole Position subtle tarmac mark
  ctx.fillStyle = 'rgba(197, 203, 208, 0.25)';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('P1 · RR-01', 512, 208);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 256, 20, 128, 256, 220);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class F1CarScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  // Config & transition targets
  private config: F1SceneConfig;
  private transitionActive = false;
  private currentDrsAngle = 0;
  private targetDrsAngle = 0;

  // Dynamic 3D parts
  private carGroup = new THREE.Group();
  private wheels: THREE.Group[] = [];
  private tireStripes: THREE.Mesh[] = [];
  private drsFlapPivot = new THREE.Group();
  private gantryGroup = new THREE.Group();
  private gantryLights: THREE.Mesh[] = [];
  private rainLightMesh!: THREE.Mesh;
  private floorMesh!: THREE.Mesh;

  // Materials to update dynamically
  private bodyPaintMat!: THREE.MeshPhysicalMaterial;
  private aeroAccentMat!: THREE.MeshPhysicalMaterial;
  private carbonMat!: THREE.MeshStandardMaterial;
  private tireStripeMat!: THREE.MeshStandardMaterial;
  private trackTex!: THREE.CanvasTexture;

  private disposables: Array<{ dispose: () => void }> = [];

  constructor(container: HTMLElement, initialConfig: F1SceneConfig) {
    this.container = container;
    this.config = { ...initialConfig };
    this.isSoftwareGl = detectSoftwareGl();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080b0e);
    this.scene.fog = new THREE.FogExp2(0x080b0e, 0.042);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    const startPreset = CAMERA_PRESETS[this.config.cameraPreset];
    this.camera.position.set(...startPreset.pos);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    this.scene.environment = envTex;
    this.disposables.push(envTex);
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 9.5;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minPolarAngle = 0.12;
    this.controls.target.set(...startPreset.target);
    this.controls.autoRotate = this.config.mode === 'starting_grid' && !this.isSoftwareGl;
    this.controls.autoRotateSpeed = 0.55;

    this.controls.addEventListener('start', () => {
      this.transitionActive = false;
    });

    this.setupLighting();
    this.setupEnvironmentFloor();
    this.buildF1Car();
    this.buildStartingGantry();
    this.applyConfig(this.config, true);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    window.addEventListener('resize', this.handleResize);
    this.startLoop();
  }

  private setupLighting(): void {
    // Cool hemisphere fill
    const hemi = new THREE.HemisphereLight(0xb8d4e8, 0x090c10, 0.75);
    this.scene.add(hemi);

    // Warm key directional light with tight shadow frustum
    const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.35);
    keyLight.position.set(5.5, 7.5, 5.5);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 22;
    keyLight.shadow.camera.left = -4.5;
    keyLight.shadow.camera.right = 4.5;
    keyLight.shadow.camera.top = 4.5;
    keyLight.shadow.camera.bottom = -4.5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // Cool turquoise rim/back light
    const rimLight = new THREE.DirectionalLight(0x00d2be, 1.55);
    rimLight.position.set(-5.5, 3.8, -5.5);
    this.scene.add(rimLight);

    // Overhead studio softbox strip (skipped on software WebGL)
    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const topStrip = new THREE.RectAreaLight(0xdff9f6, 3.6, 1.2, 6.2);
      topStrip.position.set(0, 4.2, 0);
      topStrip.lookAt(0, 0, 0);
      this.scene.add(topStrip);

      const accentStrip = new THREE.RectAreaLight(0x00d2be, 2.2, 0.35, 5.4);
      accentStrip.position.set(-2.4, 1.8, 0.5);
      accentStrip.lookAt(0, 0.4, 0);
      this.scene.add(accentStrip);
    }
  }

  private setupEnvironmentFloor(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.trackTex = createAsphaltGridTexture(maxAniso);
    this.disposables.push(this.trackTex);

    const floorGeo = new THREE.PlaneGeometry(42, 42);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.trackTex,
      roughness: 0.72,
      metalness: 0.18,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = 0;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);
    this.disposables.push(floorGeo, floorMat);

    // Radial contact shadow plane directly beneath car
    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(3.2, 6.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.012;
    this.scene.add(contactShadow);
    this.disposables.push(shadowTex, shadowGeo, shadowMat);
  }

  private buildF1Car(): void {
    const carbonTex = createCarbonTexture();
    this.disposables.push(carbonTex);

    this.bodyPaintMat = new THREE.MeshPhysicalMaterial({
      color: 0xc5cbd0,
      metalness: 0.88,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });

    this.aeroAccentMat = new THREE.MeshPhysicalMaterial({
      color: 0x00d2be,
      metalness: 0.35,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    this.carbonMat = new THREE.MeshStandardMaterial({
      color: 0x181d24,
      roughness: 0.52,
      metalness: 0.28,
      bumpMap: carbonTex,
      bumpScale: 0.012,
    });

    const titaniumMat = new THREE.MeshPhysicalMaterial({
      color: 0x8e98a2,
      metalness: 0.94,
      roughness: 0.2,
      anisotropy: 0.7,
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x111316,
      roughness: 0.86,
      metalness: 0.04,
    });

    this.tireStripeMat = new THREE.MeshStandardMaterial({
      color: 0x00d2be,
      roughness: 0.45,
      metalness: 0.1,
      emissive: 0x003c36,
      emissiveIntensity: 0.4,
    });

    const rainLightMat = new THREE.MeshStandardMaterial({
      color: 0xff2b2b,
      emissive: 0xff1e1e,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    });

    this.disposables.push(
      this.bodyPaintMat,
      this.aeroAccentMat,
      this.carbonMat,
      titaniumMat,
      rubberMat,
      this.tireStripeMat,
      rainLightMat
    );

    // 1. Underfloor Venturi Plank & Diffuser
    const floorShape = new THREE.Shape();
    floorShape.moveTo(-0.78, -2.0);
    floorShape.lineTo(0.78, -2.0);
    floorShape.lineTo(0.84, 0.75);
    floorShape.lineTo(0.32, 1.35);
    floorShape.lineTo(-0.32, 1.35);
    floorShape.lineTo(-0.84, 0.75);
    floorShape.closePath();

    const floorGeo = new THREE.ExtrudeGeometry(floorShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    floorGeo.rotateX(Math.PI / 2);
    const floorPlank = new THREE.Mesh(floorGeo, this.carbonMat);
    floorPlank.position.set(0, 0.12, 0.05);
    floorPlank.castShadow = true;
    floorPlank.receiveShadow = true;
    this.carGroup.add(floorPlank);
    this.disposables.push(floorGeo);

    // Floor edge turquoise aero line
    const floorTrimGeo = new THREE.BoxGeometry(1.7, 0.018, 2.72);
    const floorTrim = new THREE.Mesh(floorTrimGeo, this.aeroAccentMat);
    floorTrim.position.set(0, 0.115, -0.58);
    this.carGroup.add(floorTrim);
    this.disposables.push(floorTrimGeo);

    // 2. Sculpted Monocoque Chassis & Tapered Nosecone (side profile extruded)
    const hullProfile = new THREE.Shape();
    hullProfile.moveTo(-2.15, 0.22); // rear tail
    hullProfile.lineTo(0.35, 0.2); // cockpit floor
    hullProfile.lineTo(2.48, 0.2); // nose tip bottom
    hullProfile.quadraticCurveTo(2.58, 0.26, 2.45, 0.31); // sleek rounded nose tip
    hullProfile.lineTo(0.92, 0.56); // front bulkhead rise
    hullProfile.lineTo(0.38, 0.57); // cockpit rim
    hullProfile.lineTo(-0.1, 0.58); // cockpit rear
    hullProfile.lineTo(-0.32, 0.92); // airbox intake top
    hullProfile.quadraticCurveTo(-1.15, 0.86, -2.15, 0.42); // engine cover taper
    hullProfile.closePath();

    const hullGeo = new THREE.ExtrudeGeometry(hullProfile, {
      depth: 0.44,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 3,
    });
    hullGeo.translate(0, 0, -0.22);
    hullGeo.rotateY(-Math.PI / 2); // Now +Z is forward nose!
    const hullMesh = new THREE.Mesh(hullGeo, this.bodyPaintMat);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    this.carGroup.add(hullMesh);
    this.disposables.push(hullGeo);

    // 3. Nosecone Turquoise Racing Stripe
    const stripeGeo = new THREE.BoxGeometry(0.14, 0.022, 1.55);
    const noseStripe = new THREE.Mesh(stripeGeo, this.aeroAccentMat);
    noseStripe.position.set(0, 0.46, 1.52);
    noseStripe.rotation.x = 0.165;
    this.carGroup.add(noseStripe);
    this.disposables.push(stripeGeo);

    // 4. Shark Fin & Airbox Intake
    const finShape = new THREE.Shape();
    finShape.moveTo(-0.35, 0.92);
    finShape.lineTo(-1.85, 0.72);
    finShape.lineTo(-1.95, 0.44);
    finShape.lineTo(-0.35, 0.62);
    finShape.closePath();
    const finGeo = new THREE.ExtrudeGeometry(finShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
    });
    finGeo.translate(0, 0, -0.0125);
    finGeo.rotateY(-Math.PI / 2);
    const sharkFin = new THREE.Mesh(finGeo, this.carbonMat);
    sharkFin.castShadow = true;
    this.carGroup.add(sharkFin);
    this.disposables.push(finGeo);

    // 5. Cockpit Interior & Titanium Halo Safety Hoop (TubeGeometry)
    const cockpitGeo = new THREE.BoxGeometry(0.36, 0.18, 0.68);
    const cockpitTub = new THREE.Mesh(cockpitGeo, this.carbonMat);
    cockpitTub.position.set(0, 0.5, 0.16);
    this.carGroup.add(cockpitTub);
    this.disposables.push(cockpitGeo);

    const haloLeftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.59, 0.66),
      new THREE.Vector3(-0.24, 0.73, 0.44),
      new THREE.Vector3(-0.23, 0.74, -0.08),
    ]);
    const haloRightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.59, 0.66),
      new THREE.Vector3(0.24, 0.73, 0.44),
      new THREE.Vector3(0.23, 0.74, -0.08),
    ]);
    const haloPillarCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.56, 0.68),
      new THREE.Vector3(0, 0.73, 0.48),
    ]);
    [haloLeftCurve, haloRightCurve, haloPillarCurve].forEach((curve) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 18, 0.028, 10, false);
      const mesh = new THREE.Mesh(tubeGeo, titaniumMat);
      mesh.castShadow = true;
      this.carGroup.add(mesh);
      this.disposables.push(tubeGeo);
    });

    // 6. Sculpted Sidepods (Left & Right)
    const sidepodProfile = new THREE.Shape();
    sidepodProfile.moveTo(-1.4, 0.16);
    sidepodProfile.lineTo(0.45, 0.16);
    sidepodProfile.lineTo(0.55, 0.52);
    sidepodProfile.quadraticCurveTo(0.05, 0.56, -0.65, 0.46);
    sidepodProfile.lineTo(-1.4, 0.28);
    sidepodProfile.closePath();

    const sidepodGeo = new THREE.ExtrudeGeometry(sidepodProfile, {
      depth: 0.36,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.04,
      bevelSegments: 3,
    });
    sidepodGeo.rotateY(-Math.PI / 2);

    const leftSidepod = new THREE.Mesh(sidepodGeo, this.bodyPaintMat);
    leftSidepod.position.set(-0.25, 0, -0.15);
    leftSidepod.castShadow = true;
    leftSidepod.receiveShadow = true;

    const rightSidepod = new THREE.Mesh(sidepodGeo, this.bodyPaintMat);
    rightSidepod.position.set(0.61, 0, -0.15);
    rightSidepod.castShadow = true;
    rightSidepod.receiveShadow = true;

    this.carGroup.add(leftSidepod, rightSidepod);
    this.disposables.push(sidepodGeo);

    // Sidepod turquoise livery sweep + dark intake mouths
    const intakeGeo = new THREE.BoxGeometry(0.32, 0.22, 0.06);
    const stripeSideGeo = new THREE.BoxGeometry(0.03, 0.055, 1.45);
    [-0.45, 0.45].forEach((xPos) => {
      const intake = new THREE.Mesh(intakeGeo, this.carbonMat);
      intake.position.set(xPos, 0.36, 0.39);
      this.carGroup.add(intake);

      const sideStripe = new THREE.Mesh(stripeSideGeo, this.aeroAccentMat);
      sideStripe.position.set(xPos > 0 ? 0.65 : -0.65, 0.34, -0.35);
      this.carGroup.add(sideStripe);
    });
    this.disposables.push(intakeGeo, stripeSideGeo);

    // 7. Multi-Element Front Wing + Endplates
    const frontWingGroup = new THREE.Group();
    frontWingGroup.position.set(0, 0.14, 2.35);

    const fwMainGeo = new THREE.BoxGeometry(1.98, 0.028, 0.38);
    const fwMain = new THREE.Mesh(fwMainGeo, this.carbonMat);
    fwMain.castShadow = true;
    frontWingGroup.add(fwMain);

    const fwUpperGeo = new THREE.BoxGeometry(1.9, 0.022, 0.22);
    const fwUpper = new THREE.Mesh(fwUpperGeo, this.bodyPaintMat);
    fwUpper.position.set(0, 0.045, -0.07);
    fwUpper.rotation.x = -0.18;
    frontWingGroup.add(fwUpper);

    const fwAccentGeo = new THREE.BoxGeometry(1.94, 0.015, 0.05);
    const fwAccent = new THREE.Mesh(fwAccentGeo, this.aeroAccentMat);
    fwAccent.position.set(0, 0.02, 0.18);
    frontWingGroup.add(fwAccent);

    const endplateGeo = new THREE.BoxGeometry(0.03, 0.22, 0.44);
    [-0.99, 0.99].forEach((x) => {
      const ep = new THREE.Mesh(endplateGeo, this.carbonMat);
      ep.position.set(x, 0.09, 0);
      ep.castShadow = true;
      frontWingGroup.add(ep);
    });

    this.carGroup.add(frontWingGroup);
    this.disposables.push(fwMainGeo, fwUpperGeo, fwAccentGeo, endplateGeo);

    // 8. Rear Wing + Articulated DRS Flap + Rear Rain Light
    const rearWingGroup = new THREE.Group();
    rearWingGroup.position.set(0, 0.86, -2.14);

    const rwMainGeo = new THREE.BoxGeometry(1.06, 0.032, 0.28);
    const rwMain = new THREE.Mesh(rwMainGeo, this.carbonMat);
    rwMain.rotation.x = -0.15;
    rwMain.castShadow = true;
    rearWingGroup.add(rwMain);

    // Articulated DRS Upper Flap
    this.drsFlapPivot.position.set(0, 0.09, -0.08);
    const drsGeo = new THREE.BoxGeometry(1.04, 0.025, 0.18);
    const drsMesh = new THREE.Mesh(drsGeo, this.aeroAccentMat);
    drsMesh.position.set(0, 0, 0.06);
    drsMesh.castShadow = true;
    this.drsFlapPivot.add(drsMesh);
    rearWingGroup.add(this.drsFlapPivot);

    const rwEndplateGeo = new THREE.BoxGeometry(0.03, 0.56, 0.44);
    [-0.54, 0.54].forEach((x) => {
      const ep = new THREE.Mesh(rwEndplateGeo, this.carbonMat);
      ep.position.set(x, -0.15, -0.02);
      ep.castShadow = true;
      rearWingGroup.add(ep);
    });

    const rwPylonGeo = new THREE.BoxGeometry(0.035, 0.45, 0.12);
    const rwPylon = new THREE.Mesh(rwPylonGeo, this.carbonMat);
    rwPylon.position.set(0, -0.24, 0.05);
    rearWingGroup.add(rwPylon);

    this.carGroup.add(rearWingGroup);
    this.disposables.push(rwMainGeo, drsGeo, rwEndplateGeo, rwPylonGeo);

    // Rear FIA Rain Light & Central Exhaust
    const rainGeo = new THREE.BoxGeometry(0.06, 0.1, 0.04);
    this.rainLightMesh = new THREE.Mesh(rainGeo, rainLightMat);
    this.rainLightMesh.position.set(0, 0.33, -2.23);
    this.carGroup.add(this.rainLightMesh);

    const exhaustGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.25, 16);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaust = new THREE.Mesh(exhaustGeo, titaniumMat);
    exhaust.position.set(0, 0.44, -2.14);
    this.carGroup.add(exhaust);
    this.disposables.push(rainGeo, exhaustGeo);

    // 9 & 10. 4 Grooved/Slick F1 Wheels (LatheGeometry tire profile + forged metallic spokes + brake calipers + wishbones)
    const tirePoints = [
      new THREE.Vector2(0.2, -0.19),
      new THREE.Vector2(0.32, -0.19),
      new THREE.Vector2(0.355, -0.14),
      new THREE.Vector2(0.36, 0.0),
      new THREE.Vector2(0.355, 0.14),
      new THREE.Vector2(0.32, 0.19),
      new THREE.Vector2(0.2, 0.19),
    ];
    const tireGeo = new THREE.LatheGeometry(tirePoints, 32);
    tireGeo.rotateZ(Math.PI / 2);

    const rimBarrelGeo = new THREE.CylinderGeometry(0.205, 0.205, 0.34, 24);
    rimBarrelGeo.rotateZ(Math.PI / 2);

    const spokeGeo = new THREE.BoxGeometry(0.025, 0.37, 0.032);
    const hubCapGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.38, 16);
    hubCapGeo.rotateZ(Math.PI / 2);

    const stripeRingGeo = new THREE.TorusGeometry(0.275, 0.012, 8, 32);
    stripeRingGeo.rotateY(Math.PI / 2);

    const caliperGeo = new THREE.BoxGeometry(0.08, 0.14, 0.11);
    const wishboneGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.56, 8);
    wishboneGeo.rotateZ(Math.PI / 2);

    this.disposables.push(
      tireGeo,
      rimBarrelGeo,
      spokeGeo,
      hubCapGeo,
      stripeRingGeo,
      caliperGeo,
      wishboneGeo
    );

    const wheelCoords: Array<{ x: number; z: number; isRear: boolean }> = [
      { x: -0.9, z: 1.56, isRear: false },
      { x: 0.9, z: 1.56, isRear: false },
      { x: -0.92, z: -1.42, isRear: true },
      { x: 0.92, z: -1.42, isRear: true },
    ];

    wheelCoords.forEach(({ x, z, isRear }) => {
      const wheelPivot = new THREE.Group();
      wheelPivot.position.set(x, 0.36, z);
      const widthScale = isRear ? 1.18 : 0.96;

      const tireMesh = new THREE.Mesh(tireGeo, rubberMat);
      tireMesh.scale.set(widthScale, 1, 1);
      tireMesh.castShadow = true;
      wheelPivot.add(tireMesh);

      const rimMesh = new THREE.Mesh(rimBarrelGeo, this.carbonMat);
      rimMesh.scale.set(widthScale, 1, 1);
      wheelPivot.add(rimMesh);

      const hub = new THREE.Mesh(hubCapGeo, titaniumMat);
      wheelPivot.add(hub);

      const outerSign = x > 0 ? 1 : -1;
      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(spokeGeo, titaniumMat);
        spoke.position.x = outerSign * 0.16;
        spoke.rotation.x = (s * Math.PI) / 5;
        wheelPivot.add(spoke);
      }

      const stripe = new THREE.Mesh(stripeRingGeo, this.tireStripeMat);
      stripe.position.x = outerSign * (isRear ? 0.222 : 0.182);
      wheelPivot.add(stripe);
      this.tireStripes.push(stripe);

      // Fixed brake caliper + wishbone suspension (mounted on carGroup, not spinning wheel)
      const caliper = new THREE.Mesh(caliperGeo, this.aeroAccentMat);
      caliper.position.set(x - outerSign * 0.04, 0.36, z - 0.1);
      this.carGroup.add(caliper);

      const upperArm = new THREE.Mesh(wishboneGeo, this.carbonMat);
      upperArm.position.set(x * 0.58, 0.42, z);
      upperArm.rotation.z = outerSign * -0.08;
      this.carGroup.add(upperArm);

      const lowerArm = new THREE.Mesh(wishboneGeo, this.carbonMat);
      lowerArm.position.set(x * 0.58, 0.26, z);
      lowerArm.rotation.z = outerSign * 0.06;
      this.carGroup.add(lowerArm);

      this.wheels.push(wheelPivot);
      this.carGroup.add(wheelPivot);
    });

    this.scene.add(this.carGroup);
  }

  private buildStartingGantry(): void {
    const beamGeo = new THREE.BoxGeometry(4.4, 0.16, 0.24);
    const beam = new THREE.Mesh(beamGeo, this.carbonMat);
    beam.position.set(0, 2.75, 2.8);
    this.gantryGroup.add(beam);

    const pillarGeo = new THREE.BoxGeometry(0.14, 2.8, 0.16);
    [-2.15, 2.15].forEach((x) => {
      const p = new THREE.Mesh(pillarGeo, this.carbonMat);
      p.position.set(x, 1.4, 2.8);
      this.gantryGroup.add(p);
    });

    const podGeo = new THREE.BoxGeometry(0.32, 0.46, 0.26);
    const bulbGeo = new THREE.SphereGeometry(0.085, 16, 16);
    this.disposables.push(beamGeo, pillarGeo, podGeo, bulbGeo);

    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 0.62;
      const pod = new THREE.Mesh(podGeo, this.carbonMat);
      pod.position.set(x, 2.48, 2.8);
      this.gantryGroup.add(pod);

      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0x220808,
        emissive: 0xff1e1e,
        emissiveIntensity: 0.0,
        roughness: 0.2,
      });
      this.disposables.push(bulbMat);

      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(x, 2.44, 2.91);
      this.gantryGroup.add(bulb);
      this.gantryLights.push(bulb);
    }

    this.scene.add(this.gantryGroup);
  }

  public updateConfig(nextConfig: Partial<F1SceneConfig>): void {
    const prevPreset = this.config.cameraPreset;
    const prevMode = this.config.mode;
    this.config = { ...this.config, ...nextConfig };
    const cameraChanged = prevPreset !== this.config.cameraPreset || prevMode !== this.config.mode;
    this.applyConfig(this.config, cameraChanged);
  }

  private applyConfig(cfg: F1SceneConfig, triggerCameraGlide: boolean): void {
    // Livery paint update
    if (cfg.livery === LiveryMode.SILVER_ARROW) {
      this.bodyPaintMat.color.setHex(0xc5cbd0);
      this.bodyPaintMat.metalness = 0.88;
      this.bodyPaintMat.roughness = 0.18;
      this.aeroAccentMat.color.setHex(0x00d2be);
    } else if (cfg.livery === LiveryMode.OBSIDIAN_CARBON) {
      this.bodyPaintMat.color.setHex(0x161b22);
      this.bodyPaintMat.metalness = 0.45;
      this.bodyPaintMat.roughness = 0.34;
      this.aeroAccentMat.color.setHex(0x00d2be);
    } else {
      this.bodyPaintMat.color.setHex(0x009e90);
      this.bodyPaintMat.metalness = 0.72;
      this.bodyPaintMat.roughness = 0.22;
      this.aeroAccentMat.color.setHex(0xffffff);
    }

    // Tire compound stripe color
    const compoundColors: Record<TireCompound, number> = {
      [TireCompound.QUALIFYING_TURQUOISE]: 0x00d2be,
      [TireCompound.SOFT]: 0xef4444,
      [TireCompound.MEDIUM]: 0xf59e0b,
      [TireCompound.HARD]: 0xe5e7eb,
    };
    this.tireStripeMat.color.setHex(compoundColors[cfg.tireCompound]);
    this.tireStripeMat.emissive.setHex(compoundColors[cfg.tireCompound]);
    this.tireStripeMat.emissiveIntensity = cfg.tireCompound === TireCompound.QUALIFYING_TURQUOISE ? 0.55 : 0.22;

    // DRS Flap target
    this.targetDrsAngle = cfg.drsOpen ? -0.58 : 0.0;

    // Gantry visibility & light sequence
    this.gantryGroup.visible = cfg.mode === 'starting_grid';
    this.gantryLights.forEach((bulb, idx) => {
      const mat = bulb.material as THREE.MeshStandardMaterial;
      if (cfg.startLightsLit === -1) {
        mat.emissive.setHex(0x00d2be);
        mat.emissiveIntensity = 0.35;
      } else if (idx < cfg.startLightsLit) {
        mat.emissive.setHex(0xff1e1e);
        mat.emissiveIntensity = 3.2;
      } else {
        mat.emissive.setHex(0x2a0808);
        mat.emissiveIntensity = 0.05;
      }
    });

    this.controls.autoRotate = cfg.mode === 'starting_grid' && !this.isSoftwareGl;

    if (triggerCameraGlide) {
      const preset = CAMERA_PRESETS[cfg.cameraPreset];
      _camPosTarget.set(...preset.pos);
      _camLookTarget.set(...preset.target);
      this.transitionActive = true;
    }
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private startLoop(): void {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.disposed) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.getElapsedTime();

      // Smooth DRS damping
      this.currentDrsAngle = THREE.MathUtils.damp(this.currentDrsAngle, this.targetDrsAngle, 10, dt);
      this.drsFlapPivot.rotation.x = this.currentDrsAngle;

      // Wheel rotation when track speed simulation is active
      if (this.config.trackSpeedActive) {
        const spin = dt * 16;
        for (let i = 0; i < this.wheels.length; i++) {
          this.wheels[i].rotation.x += spin;
        }
        this.carGroup.position.y = Math.sin(elapsed * 18) * 0.0025;
      } else {
        this.carGroup.position.y = THREE.MathUtils.damp(this.carGroup.position.y, 0, 8, dt);
      }

      // Subtle rain light pulse in garage or starting grid
      const rainMat = this.rainLightMesh.material as THREE.MeshStandardMaterial;
      rainMat.emissiveIntensity = 1.4 + Math.sin(elapsed * 6.0) * 0.8;

      // Smooth damped camera preset transitions
      if (this.transitionActive) {
        this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camPosTarget.x, 5.5, dt);
        this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camPosTarget.y, 5.5, dt);
        this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camPosTarget.z, 5.5, dt);

        this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, _camLookTarget.x, 6.5, dt);
        this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, _camLookTarget.y, 6.5, dt);
        this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, _camLookTarget.z, 6.5, dt);

        if (this.camera.position.distanceTo(_camPosTarget) < 0.025) {
          this.transitionActive = false;
        }
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.renderer.render(this.scene, this.camera);
      afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    this.controls.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
