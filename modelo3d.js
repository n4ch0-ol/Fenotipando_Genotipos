// modelo3d.js - (Lógica "EN" el modelo)
// Carga human.glb y modifica sus partes internas.

window.iniciarVisualizador3D = initThreeJS;
window.actualizarModelo3D = actualizarModelo;

let scene, camera, renderer, humanModel;
let modelParts = {}; // Un objeto para guardar las partes del modelo

// Mapas de colores (igual que antes)
const coloresPiel = { 
    'muy-clara': 0xf8e5d0, 'clara': 0xe8c9a9, 'media': 0xd4a574, 
    'oscura': 0xa86d4a, 'muy-oscura': 0x633a2d, 'bronceada': 0xc68642
};
const coloresOjos = { 
    'azul': 0x5a9bd5, 'verde': 0x6bb55e, 'cafe': 0x8b4513, 'negro': 0x1a1a1a 
};
const coloresCabello = { 
    'negro': 0x2c2c2c, 'cafe': 0x654321, 'rubio': 0xe6c79c, 'rojo': 0xd2691e,
    'teñido_rosa': 0xFC0FC0
};


function initThreeJS() {
    const container = document.getElementById('modelo-3d');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1, 3); // Ajusta la cámara como necesites
    camera.lookAt(0, 1, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Luces
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Cargar TU modelo human.glb
    const loader = new THREE.GLTFLoader();
    loader.load(
        'human.glb', // <-- ¡Cargando el archivo local!
        (gltf) => {
            humanModel = gltf.scene;
            
            // Ajusta la escala y posición si es necesario
            humanModel.scale.set(1.0, 1.0, 1.0); 
            humanModel.position.y = 0; 
            scene.add(humanModel);

            // *** AQUÍ ESTÁ LA MAGIA ***
            // Recorremos el modelo y guardamos sus partes por nombre
            modelParts = {};
            humanModel.traverse((child) => {
                if (child.isMesh) {
                    console.log("Malla encontrada en human.glb:", child.name);
                    modelParts[child.name] = child;
                    
                    // Asegurarse de que el material se pueda cambiar
                    if (child.material) {
                         child.material = child.material.clone();
                    }
                }
            });

            // Imprime en la consola las partes que encontró, para que puedas debuggear
            console.log("Partes del modelo identificadas:", modelParts);

            // Llama a la función de app.js para aplicar el fenotipo inicial
            if (window.procesarFenotipo) {
                window.procesarFenotipo();
            } else {
                // Fallback si app.js aún no está listo
                actualizarModelo({});
            }
        },
        undefined,
        (error) => {
            console.error('❌ Error al cargar human.glb:', error);
            container.innerHTML = "<p>Error al cargar 'human.glb'. Asegúrate de que el archivo esté en la misma carpeta.</p>";
        }
    );

    // Controles de rotación simples
    let isDragging = false;
    let prevX = 0;
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        prevX = e.clientX;
    });
    window.addEventListener('mousemove', (e) => {
        if (isDragging && humanModel) {
            const delta = e.clientX - prevX;
            humanModel.rotation.y += delta * 0.01;
            prevX = e.clientX;
        }
    });
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('resize', () => {
        if (!container.clientWidth || !container.clientHeight) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();
}

/**
 * Esta es la función principal.
 * Asume que 'modelParts' tiene mallas con estos nombres:
 * - Piel_Base
 * - Ojos_Izquierdo
 * - Ojos_Derecho
 * - Cabello_Lacio
 * - Cabello_Rizado
 * - Nariz_Pequena
 * - Nariz_Grande
 */
function actualizarModelo(perfil) {
    if (!humanModel || Object.keys(modelParts).length === 0) {
        // Aún no se carga el modelo
        return;
    }

    // === 1. Aplicar Colores (Materiales) ===

    // PIEL:
    const colorPiel = coloresPiel[perfil.colorPiel] || 0xd4a574;
    if (modelParts.Piel_Base) {
        modelParts.Piel_Base.material.color.setHex(colorPiel);
    }

    // OJOS:
    const colorOjosIzq = coloresOjos[perfil.colorOjosIzq] || 0x8b4513;
    const colorOjosDer = coloresOjos[perfil.colorOjosDer] || 0x8b4513;
    if (modelParts.Ojos_Izquierdo) {
        modelParts.Ojos_Izquierdo.material.color.setHex(colorOjosIzq);
    }
    if (modelParts.Ojos_Derecho) {
        modelParts.Ojos_Derecho.material.color.setHex(colorOjosDer);
    }
    // Fallback si solo hay una malla "Ojos"
     if (modelParts.Ojos && !modelParts.Ojos_Izquierdo) {
        modelParts.Ojos.material.color.setHex(colorOjosIzq); 
    }

    // CABELLO (Color):
    const colorCabello = coloresCabello[perfil.colorCabello] || 0x2c2c2c;

    // === 2. Aplicar Formas (Visibilidad) ===

    // TIPO DE CABELLO:
    const esLacio = (perfil.tipoCabello === 'lacio');
    if (modelParts.Cabello_Lacio) {
        modelParts.Cabello_Lacio.visible = esLacio;
        if (esLacio) modelParts.Cabello_Lacio.material.color.setHex(colorCabello);
    }
    if (modelParts.Cabello_Rizado) {
        modelParts.Cabello_Rizado.visible = !esLacio;
        if (!esLacio) modelParts.Cabello_Rizado.material.color.setHex(colorCabello);
    }

    // TAMAÑO DE NARIZ:
    const esPequena = (perfil.tamanoNariz === 'pequena');
    if (modelParts.Nariz_Pequena) {
        modelParts.Nariz_Pequena.visible = esPequena;
    }
    if (modelParts.Nariz_Grande) {
        modelParts.Nariz_Grande.visible = !esPequena;
    }
}