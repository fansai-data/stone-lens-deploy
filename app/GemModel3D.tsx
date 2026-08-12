"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Cut = "emerald" | "brilliant" | "cabochon" | "rough";

export default function GemModel3D({
  compact = false,
  initialCut = "emerald",
  color = "#7b3faf",
  crystalSystem = "",
  stoneName = "",
  stoneDomain = "gemstone",
  showCutSwitch = true,
  onInspect,
}: {
  compact?: boolean;
  initialCut?: Cut;
  color?: string;
  crystalSystem?: string;
  stoneName?: string;
  stoneDomain?: "gemstone" | "jade_raw" | "common_rock";
  showCutSwitch?: boolean;
  onInspect?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const cutRef = useRef<Cut>(initialCut);
  const [cut, setCut] = useState<Cut>(initialCut);

  useEffect(() => {
    cutRef.current = cut;
  }, [cut]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0.05, compact ? 5.7 : 5.25);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.rotation.set(-0.16, 0.52, 0.04);
    scene.add(group);

    const gemMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      metalness: 0.03,
      roughness: 0.16,
      transmission: 0.2,
      thickness: 1.25,
      ior: 1.72,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      transparent: false,
      opacity: 1,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
    });

    const createEmeraldCut = () => {
      const shape = new THREE.Shape();
      const points = [
        [-0.94, -1.25],
        [0.94, -1.25],
        [1.18, -1.01],
        [1.18, 1.01],
        [0.94, 1.25],
        [-0.94, 1.25],
        [-1.18, 1.01],
        [-1.18, -1.01],
      ];
      shape.moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
      shape.closePath();

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.64,
        steps: 1,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.2,
        bevelThickness: 0.18,
        curveSegments: 1,
      });
      geometry.center();
      geometry.computeVertexNormals();

      const mesh = new THREE.Mesh(geometry, gemMaterial);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 18),
        edgeMaterial,
      );
      mesh.add(edges);

      return mesh;
    };

    const createBrilliantCut = () => {
      const segments = 16;
      const vertices: number[] = [0, 0, 0.5];
      const indices: number[] = [];
      const pushRing = (radius: number, z: number, phase = 0) => {
        const start = vertices.length / 3;
        for (let index = 0; index < segments; index += 1) {
          const angle = phase + (index / segments) * Math.PI * 2;
          vertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
        }
        return start;
      };

      const tableRing = pushRing(0.47, 0.5, Math.PI / segments);
      const crownRing = pushRing(1.08, 0.05);
      const girdleRing = pushRing(1.08, -0.08);
      const pavilionPoint = vertices.length / 3;
      vertices.push(0, 0, -1.18);

      for (let index = 0; index < segments; index += 1) {
        const next = (index + 1) % segments;
        indices.push(0, tableRing + index, tableRing + next);
        indices.push(tableRing + index, crownRing + index, crownRing + next);
        indices.push(tableRing + index, crownRing + next, tableRing + next);
        indices.push(crownRing + index, girdleRing + index, girdleRing + next);
        indices.push(crownRing + index, girdleRing + next, crownRing + next);
        indices.push(girdleRing + index, pavilionPoint, girdleRing + next);
      }

      const indexed = new THREE.BufferGeometry();
      indexed.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      indexed.setIndex(indices);
      const geometry = indexed.toNonIndexed();
      indexed.dispose();
      geometry.computeVertexNormals();
      const material = gemMaterial.clone();
      material.transmission = 0.28;
      material.roughness = 0.1;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry, 18),
          edgeMaterial,
        ),
      );
      mesh.scale.setScalar(1.12);
      return mesh;
    };

    const createCabochon = () => {
      const profile = [
        new THREE.Vector2(0, -0.18),
        new THREE.Vector2(0.92, -0.18),
        new THREE.Vector2(1.02, 0.02),
        new THREE.Vector2(0.86, 0.38),
        new THREE.Vector2(0.54, 0.68),
        new THREE.Vector2(0, 0.8),
      ];
      const geometry = new THREE.LatheGeometry(profile, 48);
      geometry.rotateX(Math.PI / 2);
      geometry.scale(1.15, 1.34, 1.15);
      geometry.computeVertexNormals();
      const material = gemMaterial.clone();
      material.roughness = 0.2;
      material.transmission = 0.18;
      material.flatShading = false;
      const mesh = new THREE.Mesh(geometry, material);
      return mesh;
    };

    /* 优化：原石依据晶系选择完整晶体几何体。 */
    const createRoughStone = () => {
      const system = crystalSystem.toLowerCase();
      let geometry: THREE.BufferGeometry;
      if (/立方|cubic|等轴/.test(system)) {
        geometry = new THREE.BoxGeometry(1.72, 1.72, 1.72, 2, 2, 2);
        geometry.rotateY(Math.PI / 4);
      } else if (/六方|hexagonal/.test(system)) {
        geometry = new THREE.CylinderGeometry(0.92, 0.92, 2.15, 6, 2, false);
      } else if (/三方|trigonal/.test(system)) {
        geometry = new THREE.CylinderGeometry(0.98, 0.88, 2.12, 3, 2, false);
      } else if (/四方|tetragonal/.test(system)) {
        geometry = new THREE.BoxGeometry(1.48, 2.12, 1.48, 2, 2, 2);
      } else if (/斜方|orthorhombic/.test(system)) {
        geometry = new THREE.BoxGeometry(1.42, 2.02, 1.08, 2, 2, 2);
      } else if (/单斜|monoclinic/.test(system)) {
        geometry = new THREE.BoxGeometry(1.54, 2.02, 1.12, 2, 2, 2);
        geometry.applyMatrix4(new THREE.Matrix4().set(1, 0.22, 0, 0, 0, 1, 0, 0, 0, 0.08, 1, 0, 0, 0, 0, 1));
      } else if (/三斜|triclinic/.test(system)) {
        geometry = new THREE.BoxGeometry(1.5, 1.9, 1.16, 2, 2, 2);
        geometry.applyMatrix4(new THREE.Matrix4().set(1, 0.24, 0.12, 0, 0.08, 1, 0.16, 0, 0, 0.1, 1, 0, 0, 0, 0, 1));
      } else if (/非晶|隐晶|多晶|集合体|amorphous/.test(system)) {
        geometry = new THREE.IcosahedronGeometry(1.2, 2);
        geometry.scale(1.16, 0.92, 0.82);
      } else {
        geometry = new THREE.OctahedronGeometry(1.2, 1);
        geometry.scale(1.12, 0.98, 0.84);
      }
      geometry.computeVertexNormals();
      const material = gemMaterial.clone();
      material.roughness = /非晶|隐晶|多晶|集合体/.test(system) ? 0.58 : 0.42;
      material.transmission = /非晶|多晶|集合体/.test(system) ? 0 : 0.035;
      material.clearcoat = 0.32;
      material.clearcoatRoughness = 0.34;
      material.transparent = false;
      material.side = THREE.FrontSide;
      const mesh = new THREE.Mesh(geometry, material);
      if (!/非晶|隐晶|多晶|集合体/.test(system)) {
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 24), edgeMaterial));
      }
      return mesh;
    };

    /* 优化：彩色宝石依据实际晶系生成有完整封闭切面的晶体几何体。 */
    const createCrystalGem = () => {
      const system = crystalSystem.toLowerCase();
      let geometry: THREE.BufferGeometry;
      if (/立方|cubic|等轴/.test(system)) {
        geometry = new THREE.OctahedronGeometry(1.28, 0);
      } else if (/六方|hexagonal/.test(system)) {
        geometry = new THREE.CylinderGeometry(0.9, 0.78, 2.2, 6, 1, false);
      } else if (/三方|trigonal/.test(system)) {
        geometry = new THREE.CylinderGeometry(0.96, 0.76, 2.12, 6, 1, false);
        geometry.rotateY(Math.PI / 6);
      } else if (/四方|tetragonal/.test(system)) {
        geometry = new THREE.CylinderGeometry(0.92, 0.72, 2.08, 4, 1, false);
        geometry.rotateY(Math.PI / 4);
      } else if (/斜方|orthorhombic/.test(system)) {
        geometry = new THREE.OctahedronGeometry(1.22, 0);
        geometry.scale(0.82, 1.18, 0.68);
      } else if (/单斜|monoclinic/.test(system)) {
        geometry = new THREE.OctahedronGeometry(1.2, 0);
        geometry.scale(0.88, 1.15, 0.72);
        geometry.applyMatrix4(new THREE.Matrix4().set(1, 0.2, 0, 0, 0, 1, 0, 0, 0, 0.05, 1, 0, 0, 0, 0, 1));
      } else if (/三斜|triclinic/.test(system)) {
        geometry = new THREE.BoxGeometry(1.5, 1.9, 1.15);
        geometry.applyMatrix4(new THREE.Matrix4().set(1, 0.22, 0.1, 0, 0.08, 1, 0.14, 0, 0, 0.08, 1, 0, 0, 0, 0, 1));
      } else if (/非晶|生物质|隐晶/.test(system)) {
        return createCabochon();
      } else {
        geometry = new THREE.DodecahedronGeometry(1.16, 0);
      }
      geometry.computeVertexNormals();
      const material = gemMaterial.clone();
      material.roughness = 0.075;
      material.transmission = /钻石|diamond|水晶|石英|quartz|蓝宝石|红宝石|sapphire|ruby|绿柱石|beryl|topaz|zircon|spinel/.test(`${system} ${stoneName.toLowerCase()}`)
        ? 0.58
        : 0.36;
      material.transparent = true;
      material.opacity = 0.94;
      material.thickness = 1.65;
      material.side = THREE.FrontSide;
      material.flatShading = true;
      material.clearcoat = 1;
      material.clearcoatRoughness = 0.025;
      material.attenuationColor = new THREE.Color(color);
      material.attenuationDistance = 2.8;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 12), edgeMaterial));
      return mesh;
    };

    /* 优化：玉石使用由上下两个三角锥闭合组成的双三角锥模型。 */
    const createJadeBipyramid = () => {
      const vertices: number[] = [0, 1.32, 0, 0, -1.32, 0];
      for (let index = 0; index < 3; index += 1) {
        const angle = Math.PI / 2 + (index / 3) * Math.PI * 2;
        vertices.push(Math.cos(angle) * 1.12, 0, Math.sin(angle) * 1.12);
      }
      const indices: number[] = [];
      for (let index = 0; index < 3; index += 1) {
        const current = 2 + index;
        const next = 2 + ((index + 1) % 3);
        indices.push(0, current, next, 1, next, current);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const material = gemMaterial.clone();
      material.color = new THREE.Color("#3f8f64");
      material.roughness = 0.34;
      material.transmission = 0.08;
      material.transparent = false;
      material.clearcoat = 0.42;
      material.clearcoatRoughness = 0.28;
      material.side = THREE.FrontSide;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 16), edgeMaterial));
      return mesh;
    };

    const createModel = (nextCut: Cut) => {
      /* 优化：彩色宝石使用初版圆形明亮式钻石模型；玉石使用绿色双三角锥。 */
      if (stoneDomain === "gemstone") return createBrilliantCut();
      if (stoneDomain === "jade_raw") return createJadeBipyramid();
      if (nextCut === "rough") return createRoughStone();
      if (nextCut === "cabochon") return createCabochon();
      if (crystalSystem) return createCrystalGem();
      if (nextCut === "brilliant") return createBrilliantCut();
      return createEmeraldCut();
    };

    let model = createModel(initialCut);
    group.add(model);

    const swapModel = (nextCut: Cut) => {
      group.remove(model);
      model.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
          child.geometry.dispose();
        }
      });
      model = createModel(nextCut);
      group.add(model);
    };

    const ambient = new THREE.HemisphereLight(0xffffff, 0xc9b9ff, 2.4);
    const key = new THREE.DirectionalLight(0xffffff, 6.2);
    key.position.set(4, 5, 7);
    const cyan = new THREE.PointLight(0x51ead7, 18, 12);
    cyan.position.set(-3, 1.5, 4);
    const violet = new THREE.PointLight(0x9b82ff, 14, 10);
    violet.position.set(3, -2, 2);
    scene.add(ambient, key, cyan, violet);

    let width = 0;
    let height = 0;
    const resize = () => {
      const nextWidth = mount.clientWidth;
      const nextHeight = mount.clientHeight;
      if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return;
      width = nextWidth;
      height = nextHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    let lastCut = cutRef.current;

    const pointerDown = (event: PointerEvent) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const pointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      group.rotation.y += (event.clientX - previousX) * 0.009;
      group.rotation.x += (event.clientY - previousY) * 0.007;
      previousX = event.clientX;
      previousY = event.clientY;
    };
    const pointerUp = () => {
      dragging = false;
    };

    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", pointerUp);

    let frame = 0;
    const animate = () => {
      if (lastCut !== cutRef.current) {
        lastCut = cutRef.current;
        swapModel(lastCut);
      }
      if (!dragging) group.rotation.y += 0.0035;
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointercancel", pointerUp);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach((item) => item.dispose());
          else child.material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [color, compact, crystalSystem, initialCut, stoneDomain, stoneName]);

  return (
    <div className={`three-gem ${compact ? "compact" : ""}`}>
      <div ref={mountRef} className="three-gem-canvas" aria-label="可旋转的立体切割宝石模型" />
      {showCutSwitch && (
        <div className="cut-switch" aria-label="切割模型选择">
          <button
            className={cut === "emerald" ? "active" : ""}
            onClick={() => setCut("emerald")}
          >
            切角长方形
          </button>
          <button
            className={cut === "brilliant" ? "active" : ""}
            onClick={() => setCut("brilliant")}
          >
            圆形明亮式
          </button>
        </div>
      )}
      {onInspect && (
        <button className="inspect-gem" onClick={onInspect}>
          查看该宝石信息
        </button>
      )}
      {!compact && <span className="drag-hint">拖动模型旋转 · 真实三维几何</span>}
    </div>
  );
}
