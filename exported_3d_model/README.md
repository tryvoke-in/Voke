# MacBook Pro 3D Model Extraction

This folder contains the extracted 3D models of the Apple MacBook Pro, ready to use in any 3D software, game engine, or web code.

---

## 📁 Files Included

| File / Folder | Description | Format | Size |
| :--- | :--- | :--- | :--- |
| **`macbook-16.glb`** | Complete self-contained 16-inch MacBook Pro 3D model (geometry + embedded materials & textures) | Binary glTF (`.glb`) | ~639 KB |
| **`macbook-14.glb`** | Complete self-contained 14-inch MacBook Pro 3D model | Binary glTF (`.glb`) | ~630 KB |
| **`screen.png`** | Display wallpaper texture used on the laptop screen mesh | PNG Image | ~2.3 MB |
| **`gltf_separated/`** | Fully unbundled model assets (`macbook-16.gltf` + `macbook-16.bin` + extracted `.webp`/`.jpg` textures) | Separate glTF + Assets | ~680 KB |

---

## 🚀 How to Use / Load

### 1. In Three.js (Vanilla JavaScript)

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

loader.load('./macbook-16.glb', (gltf) => {
  const model = gltf.scene;

  // Optional: Apply custom screen texture
  const screenTexture = textureLoader.load('./screen.png');
  screenTexture.flipY = false;

  model.traverse((child) => {
    if (child.isMesh && child.name === 'Object_123') { // Screen mesh
      child.material = new THREE.MeshBasicMaterial({ map: screenTexture });
    }
  });

  scene.add(model);
});
```

---

### 2. In React Three Fiber (`@react-three/drei`)

```jsx
import { useGLTF, useTexture } from '@react-three/drei';

export function MacBook(props) {
  const { scene } = useGLTF('./macbook-16.glb');
  const screenTexture = useTexture('./screen.png');

  return <primitive object={scene} {...props} />;
}

useGLTF.preload('./macbook-16.glb');
```

---

### 3. In Blender / Spline / Godot / Unity / 3D Software
- Open your 3D application.
- Select **File** > **Import** > **glTF 2.0 (`.glb` / `.gltf`)**.
- Choose `macbook-16.glb` (single file with everything bundled) or `gltf_separated/macbook-16.gltf` (if you want to inspect/edit individual texture files).

---

## ℹ️ Model Details & Attribution
- **Original Title:** MacBook Pro M3 16 inch 2024
- **Original Author:** jackbaeten (Sketchfab)
- **License:** CC-BY-4.0
