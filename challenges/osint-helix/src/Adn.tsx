import { useEffect, useRef } from "react";
import * as THREE from "three";

type ADNBase = "A" | "T" | "G" | "C";

type ADNHelixProps = {
  sequenceADN: string;
  zoom: number;
};

const isADNBase = (char: string): char is ADNBase =>
  char === "A" || char === "T" || char === "G" || char === "C";

export default function ADNHelix({ sequenceADN, zoom }: ADNHelixProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const baseCouleurs: Record<ADNBase, number> = {
      A: 0xff7b7b,
      T: 0x7bffb0,
      G: 0x7bbcff,
      C: 0xfff27b,
    };

    const baseComplementaire: Record<ADNBase, ADNBase> = {
      A: "T",
      T: "A",
      G: "C",
      C: "G",
    };

    const sequence = sequenceADN
      .toUpperCase()
      .split("")
      .filter(isADNBase);

    if (sequence.length === 0) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    const camera = new THREE.PerspectiveCamera(10, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    const radius = 2;
    const pitch = 1;
    const rotationParBase = Math.PI / 5;
    const totalBases = sequence.length;

    const group = new THREE.Group();

    const brin1Pts: THREE.Vector3[] = [];
    const brin2Pts: THREE.Vector3[] = [];

    for (let i = 0; i < totalBases; i++) {
      const angle = i * rotationParBase;
      const y = (i - totalBases / 2) * pitch;
      const x1 = radius * Math.cos(angle);
      const z1 = radius * Math.sin(angle);
      const x2 = radius * Math.cos(angle + Math.PI);
      const z2 = radius * Math.sin(angle + Math.PI);
      brin1Pts.push(new THREE.Vector3(x1, y, z1));
      brin2Pts.push(new THREE.Vector3(x2, y, z2));
    }

    const matBrin1 = new THREE.LineBasicMaterial({ color: 0xfb1828 });
    const matBrin2 = new THREE.LineBasicMaterial({ color: 0xd6a4e7 });
    const brin1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(brin1Pts),
      matBrin1
    );
    const brin2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(brin2Pts),
      matBrin2
    );
    group.add(brin1, brin2);

    const sphereGeo = new THREE.SphereGeometry(0.25, 16, 16);
    for (let i = 0; i < totalBases; i++) {
      const base1 = sequence[i];
      const base2 = baseComplementaire[base1];
      const angle = i * rotationParBase;
      const y = (i - totalBases / 2) * pitch;
      const x1 = radius * Math.cos(angle);
      const z1 = radius * Math.sin(angle);
      const x2 = radius * Math.cos(angle + Math.PI);
      const z2 = radius * Math.sin(angle + Math.PI);

      const liaisonGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y, z1),
        new THREE.Vector3(x2, y, z2),
      ]);
      const liaisonMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.6,
        transparent: true,
      });
      const liaison = new THREE.Line(liaisonGeo, liaisonMat);
      group.add(liaison);

      const mat1 = new THREE.MeshStandardMaterial({
        color: baseCouleurs[base1],
        roughness: 0.3,
        metalness: 0.2,
      });
      const mat2 = new THREE.MeshStandardMaterial({
        color: baseCouleurs[base2],
        roughness: 0.3,
        metalness: 0.2,
      });

      const s1 = new THREE.Mesh(sphereGeo, mat1);
      const s2 = new THREE.Mesh(sphereGeo, mat2);
      s1.position.set(x1, y, z1);
      s2.position.set(x2, y, z2);
      group.add(s1, s2);
    }

    group.rotation.z = Math.PI / 2;
    scene.add(group);

    const scaleFactor = (width / 1000) * 2;
    group.scale.set(scaleFactor, scaleFactor, scaleFactor);

    const boundingBox = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
    camera.position.z = cameraZ * zoom;

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      group.rotation.x += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      const newScale = (w / 1000) * 2;
      group.scale.set(newScale, newScale, newScale);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [sequenceADN, zoom]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle at center, #ffffffff, #ffffffff)",
        overflow: "hidden",
      }}
    />
  );
}
