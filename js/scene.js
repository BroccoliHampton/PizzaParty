// js/scene.js

// --- Private Module Variables ---
let scene, camera, renderer, pizzaGroup, sauceMaterial, cheeseMaterial, crustMaterial, toppingMeshes = [];
let isDragging = false;
let previousPointerX = 0;
let previousPointerY = 0;
let initialPinchDistance = 0;
let currentCameraZ = 10;
let isThreeJSInitialized = false; 
let pizzaSpinSpeed = 0.005;

let composer;
let inversionPass;
let clock = new THREE.Clock();

const NegativeShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "time":     { value: 0.0 }
    },
    vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}"
    ].join( "\n" ),
    fragmentShader: [
        "uniform float time;",
        "uniform sampler2D tDiffuse;",
        "varying vec2 vUv;",
        "void main() {",
            "vec4 texel = texture2D( tDiffuse, vUv );",
            "vec3 inverted = vec3(1.0 - texel.r, 1.0 - texel.g, 1.0 - texel.b);",
            "float t = sin(time * 0.5) * 0.05 + 0.05;",
            "inverted.r = inverted.r * (1.0 - t * 0.5);",
            "inverted.g = inverted.g + t;",
            "inverted.b = inverted.b * (1.0 - t * 0.8);",
            "float contrast = 1.3;",
            "inverted = (inverted - 0.5) * contrast + 0.5;",
            "gl_FragColor = vec4(inverted, texel.a);",
        "}"
    ].join( "\n" )
};

const MIN_ZOOM_Z = 3;
const MAX_ZOOM_Z = 20;

// --- Pizza Customization ---
const sauceColors = [
    0xBF3A3A, // Classic Red
    0x5E8C3A, // Pesto Green
    0xFFE4C4, // Alfredo White
    0x7B4E2E  // BBQ Brown
];
let currentSauceColorIndex = 0;

const crustColors = [
    0xDEB887, // Standard
    0x5C3317, // Well Done
    0xF5DEB3, // Light
    null      // Wireframe
];
let currentCrustColorIndex = 0;

const toppingColorSets = [
    [0xC8493A, 0xB73E2E], // Pepperoni
    [0x333333, 0x222222], // Olives
    [0xD2B48C, 0xB8860B], // Mushrooms
    [0x3A6B3A, 0x4A8B4A]  // Green Peppers
];
let currentToppingColorSetIndex = 0;

// --- Private Functions ---

function createCrustTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#DEB887'; // Base crust color
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 1.5 + 0.5;
        const alpha = Math.random() * 0.3 + 0.2;
        const shade = 20 + Math.floor(Math.random() * 40);
        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`; 
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 20 + 10;
        const alpha = Math.random() * 0.05 + 0.02;
        ctx.fillStyle = `rgba(92, 51, 23, ${alpha})`; // Brownish splotches
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

function createCheeseTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFACD'; // Base cheese color
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 5 + 3;
        const alpha = Math.random() * 0.1 + 0.05;
        ctx.fillStyle = `rgba(210, 105, 30, ${alpha})`; // Browned cheese spots
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

function createToppings() {
    toppingMeshes.forEach(topping => pizzaGroup.remove(topping));
    toppingMeshes = [];

    const currentColors = toppingColorSets[currentToppingColorSetIndex];
    const toppingGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16);
    const numToppings = 20;
    const sliceRadius = 3.5;
    const sliceAngle = Math.PI / 4; // 45 degrees

    for (let i = 0; i < numToppings; i++) {
        const color = currentColors[Math.floor(Math.random() * currentColors.length)];
        const toppingMaterial = new THREE.MeshStandardMaterial({ color: color });
        const topping = new THREE.Mesh(toppingGeometry, toppingMaterial);
        
        // Scatter within a triangular sector
        const r = Math.random() * sliceRadius * 0.9; // 0.9 to avoid edge
        const a = (Math.random() - 0.5) * sliceAngle * 0.9;
        
        topping.position.x = r * Math.cos(a);
        topping.position.y = r * Math.sin(a);
        topping.position.z = 0.2; // Place on top of cheese/sauce
        
        topping.rotation.x = Math.PI / 2;
        topping.rotation.y = Math.random() * Math.PI;

        pizzaGroup.add(topping);
        toppingMeshes.push(topping);
    }
}

function onResize(dom) {
    if (renderer && camera && dom.pizzeria.rainContainer) {
        const container = dom.pizzeria.rainContainer;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            if (composer) {
                composer.setSize(w, h);
            }
        }
    }
}

let pointers = [];

function getPinchDistance(e) {
    if (e.touches && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    return 0;
}

function onPointerDown(e) {
    pointers.push(e);
    if (pointers.length === 1) {
        isDragging = true;
        previousPointerX = e.clientX;
        previousPointerY = e.clientY;
    }
    e.target.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
    const index = pointers.findIndex(p => p.pointerId === e.pointerId);
    if (index > -1) {
        pointers[index] = e;
    }

    if (pointers.length === 2 && initialPinchDistance > 0) {
        const currentPinchDistance = getPinchDistance(e);
        if (currentPinchDistance === 0) return;
        
        const zoomFactor = initialPinchDistance / currentPinchDistance;
        let newZ = currentCameraZ * zoomFactor;
        
        newZ = Math.max(MIN_ZOOM_Z, Math.min(MAX_ZOOM_Z, newZ));
        camera.position.z = newZ;
        camera.updateProjectionMatrix();
        
        document.getElementById('pizzeria-zoom-slider').value = newZ;

        initialPinchDistance = currentPinchDistance;
        currentCameraZ = newZ;

    }
    if (isDragging && pointers.length === 1) { 
        const deltaX = e.clientX - previousPointerX;
        const deltaY = e.clientY - previousPointerY;
        
        pizzaGroup.rotation.z -= deltaX * 0.01; // Spin on Z axis
        pizzaGroup.rotation.x += deltaY * 0.01;
        
        previousPointerX = e.clientX;
        previousPointerY = e.clientY;
    }
}

function onPointerUp(e) {
    pointers = pointers.filter(p => p.pointerId !== e.pointerId);
    e.target.releasePointerCapture(e.pointerId);

    if (isDragging && pointers.length === 0) {
        isDragging = false;
    }

    if (pointers.length < 2) {
        initialPinchDistance = 0;
    }
}

function onMouseWheel(e) {
    e.preventDefault();
    let newZ = currentCameraZ + e.deltaY * 0.02;
    newZ = Math.max(MIN_ZOOM_Z, Math.min(MAX_ZOOM_Z, newZ));
    camera.position.z = newZ;
    camera.updateProjectionMatrix();
    
    document.getElementById('pizzeria-zoom-slider').value = newZ;
    currentCameraZ = newZ;
}

// --- Exported Functions ---

/**
 * Initializes the Three.js scene, camera, renderer, and pizza.
 * @param {object} dom - The cached DOM elements object.
 */
export function initThreeJS(dom) {
    if (isThreeJSInitialized) return; 
    
    scene = new THREE.Scene();
    
    const container = dom.pizzeria.rainContainer;
    if (!container) return;
    const w = container.clientWidth || 300;
    const h = container.clientHeight || 300;

    camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = currentCameraZ;

    if (!dom.pizzeria.canvas) return;
    renderer = new THREE.WebGLRenderer({ 
        canvas: dom.pizzeria.canvas,
        alpha: true
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));

    inversionPass = new THREE.ShaderPass(NegativeShader);
    composer.addPass(inversionPass);
    composer.enabled = false;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7); 
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    pizzaGroup = new THREE.Group();
    
    // --- Create Pizza Slice ---
    const sliceRadius = 4;
    const sliceAngle = Math.PI / 4; // 45 degrees
    const sliceHeight = 0.15;
    
    const sliceShape = new THREE.Shape();
    sliceShape.moveTo(0, 0);
    sliceShape.absarc(0, 0, sliceRadius, -sliceAngle / 2, sliceAngle / 2, false);
    sliceShape.lineTo(0, 0);
    
    const extrudeSettings = {
        depth: sliceHeight,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 2
    };

    // 1. Cheese Layer
    const cheeseTexture = createCheeseTexture(512);
    cheeseTexture.wrapS = cheeseTexture.wrapT = THREE.RepeatWrapping;
    cheeseTexture.repeat.set(2, 2);
    
    const cheeseGeometry = new THREE.ExtrudeGeometry(sliceShape, extrudeSettings);
    cheeseMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFACD,
        map: cheeseTexture,
        roughness: 0.8,
        metalness: 0.1
    });
    const cheeseMesh = new THREE.Mesh(cheeseGeometry, cheeseMaterial);
    cheeseMesh.position.z = -sliceHeight / 2; // Center it
    pizzaGroup.add(cheeseMesh);
    
    // 2. Sauce Layer (slightly smaller)
    const sauceShape = new THREE.Shape();
    sauceShape.moveTo(0, 0);
    sauceShape.absarc(0, 0, sliceRadius * 0.95, -sliceAngle / 2, sliceAngle / 2, false);
    sauceShape.lineTo(0, 0);
    
    const sauceExtrudeSettings = { ...extrudeSettings, depth: 0.05, bevelEnabled: false };
    const sauceGeometry = new THREE.ExtrudeGeometry(sauceShape, sauceExtrudeSettings);
    sauceMaterial = new THREE.MeshStandardMaterial({
        color: sauceColors[currentSauceColorIndex],
        roughness: 0.6
    });
    const sauceMesh = new THREE.Mesh(sauceGeometry, sauceMaterial);
    sauceMesh.position.z = sliceHeight / 2; // On top of cheese
    pizzaGroup.add(sauceMesh);

    // 3. Crust
    const crustRadius = sliceRadius;
    const crustTubeRadius = 0.25;
    const crustSegments = 16;
    const crustArc = sliceAngle;
    
    const crustPath = new THREE.Path();
    crustPath.absarc(0, 0, crustRadius, -crustArc / 2, crustArc / 2, false);
    
    const crustGeometry = new THREE.TubeGeometry(crustPath, 20, crustTubeRadius, crustSegments, false);
    
    const crustTexture = createCrustTexture(512);
    crustTexture.wrapS = crustTexture.wrapT = THREE.RepeatWrapping;
    crustTexture.repeat.set(4, 1);

    crustMaterial = new THREE.MeshStandardMaterial({
        color: crustColors[currentCrustColorIndex],
        map: crustTexture,
        roughness: 0.9
    });
    const crustMesh = new THREE.Mesh(crustGeometry, crustMaterial);
    crustMesh.position.z = (sliceHeight / 2) - 0.05;
    pizzaGroup.add(crustMesh);
    
    // 4. Toppings
    createToppings();
    
    // Rotate group to be "flat" relative to camera
    pizzaGroup.rotation.x = -0.5;
    scene.add(pizzaGroup);

    // Add scene-specific listeners
    dom.pizzeria.canvas.addEventListener('pointerdown', onPointerDown);
    dom.pizzeria.canvas.addEventListener('pointermove', onPointerMove);
    dom.pizzeria.canvas.addEventListener('pointerup', onPointerUp);
    dom.pizzeria.canvas.addEventListener('pointerleave', onPointerUp);
    dom.pizzeria.canvas.addEventListener('wheel', onMouseWheel, { passive: false });
    
    dom.pizzeria.zoomSlider.min = MIN_ZOOM_Z;
    dom.pizzeria.zoomSlider.max = MAX_ZOOM_Z;
    dom.pizzeria.zoomSlider.value = currentCameraZ;
    dom.pizzeria.zoomSlider.step = 0.1;
    dom.pizzeria.zoomSlider.oninput = () => {
        if (!isThreeJSInitialized) return;
        const newZ = parseFloat(dom.pizzeria.zoomSlider.value);
        camera.position.z = newZ;
        camera.updateProjectionMatrix();
        currentCameraZ = newZ;
    };

    window.addEventListener('resize', () => onResize(dom));

    isThreeJSInitialized = true; 
}

/**
 * The main animation loop.
 */
export function animate() {
    requestAnimationFrame(animate);
    
    if (pizzaGroup && renderer) {
        pizzaGroup.rotation.z += pizzaSpinSpeed; // Spin on Z axis
        
        if (pizzaSpinSpeed > 0.005) {
            pizzaSpinSpeed *= 0.95;
            if (pizzaSpinSpeed < 0.006) {
                pizzaSpinSpeed = 0.005;
            }
        }
        
        try {
            if (composer && composer.enabled) {
                inversionPass.uniforms[ 'time' ].value = clock.getElapsedTime();
                composer.render();
            } else {
                renderer.render(scene, camera);
            }
        } catch (e) {
            console.error('[WASM Render Crash] Animation frame failed:', e.message);
        }
    }
}

/**
 * Changes the color of the pizza's sauce.
 */
export function changeSauceColor() {
    if (sauceMaterial) {
        currentSauceColorIndex = (currentSauceColorIndex + 1) % sauceColors.length;
        sauceMaterial.color.set(sauceColors[currentSauceColorIndex]);
    }
}

/**
 * Changes the color/wireframe of the pizza crust.
 */
export function changeCrustColor() {
    if (crustMaterial) {
        currentCrustColorIndex = (currentCrustColorIndex + 1) % crustColors.length;
        const newColorOrMode = crustColors[currentCrustColorIndex];

        if (newColorOrMode === null) {
            crustMaterial.wireframe = true;
            crustMaterial.color.set(0xF5E6C1); 
            cheeseMaterial.wireframe = true;
        } else {
            crustMaterial.wireframe = false;
            cheeseMaterial.wireframe = false;
            crustMaterial.color.set(newColorOrMode);
        }
    }
}

/**
 * Re-generates the toppings with a new color set.
 */
export function changeToppingColor() {
    currentToppingColorSetIndex = (currentToppingColorSetIndex + 1) % toppingColorSets.length;
    createToppings();
}

/**
 * Sets the spin speed of the pizza.
 * @param {number} speed - The new spin speed.
 */
export function setPizzaSpinSpeed(speed) {
    pizzaSpinSpeed = speed;
}

/**
 * Returns the post-processing composer object.
 * @returns {THREE.EffectComposer} The composer.
 */
export function getComposer() {
    return composer;
}
