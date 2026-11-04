'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Complaint, LocationHotspot } from '@/types';
import { RotateCcw, Eye, Compass, ZoomIn, ZoomOut, Sparkles, Building2, AlertTriangle, Layers } from 'lucide-react';

interface Campus3DViewerProps {
  locations: any[];
  complaints: Complaint[];
  hotspots?: LocationHotspot[];
  onSelectBuilding?: (buildingName: string) => void;
  selectedBuildingName?: string | null;
}

interface BuildingMeshInfo {
  name: string;
  code: string;
  position: [number, number, number];
  size: [number, number, number];
  color: number;
  activeCount: number;
  criticalCount: number;
}

export default function Campus3DViewer({
  locations,
  complaints,
  hotspots,
  onSelectBuilding,
  selectedBuildingName,
}: Campus3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingMeshInfo | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cameraMode, setCameraMode] = useState<'orbit' | 'top' | 'isometric'>('isometric');

  // References to three objects for interaction
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const buildingMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  // Aggregate complaints per building
  const buildingStats = React.useMemo(() => {
    const stats: Record<string, { active: number; critical: number }> = {
      'Tech Park': { active: 0, critical: 0 },
      'Academic Block A': { active: 0, critical: 0 },
      'Central Library': { active: 0, critical: 0 },
      'Boys Hostel Block 1': { active: 0, critical: 0 },
      'Girls Hostel Block 2': { active: 0, critical: 0 },
    };

    complaints.forEach((c) => {
      const bld = c.building;
      if (stats[bld]) {
        if (c.status !== 'RESOLVED' && c.status !== 'CLOSED') {
          stats[bld].active++;
          if (c.priority === 'CRITICAL' || c.status === 'ESCALATED') {
            stats[bld].critical++;
          }
        }
      }
    });

    return stats;
  }, [complaints]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 560;

    // 1. SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.012);

    // 2. CAMERA
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(45, 38, 55);

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // 4. CONTROLS
    const controls = new OrbitControls(camera, canvas);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
    controls.minDistance = 15;
    controls.maxDistance = 120;
    controls.target.set(0, 4, 0);

    // 5. LIGHTING
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(50, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 160;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Cyber accent lights
    const bluePoint = new THREE.PointLight(0x0c87eb, 3, 40);
    bluePoint.position.set(-15, 8, -10);
    scene.add(bluePoint);

    const emeraldPoint = new THREE.PointLight(0x10b981, 2.5, 35);
    emeraldPoint.position.set(20, 8, 15);
    scene.add(emeraldPoint);

    // 6. GROUND & LANDSCAPING
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ground subtle grid lines
    const grid = new THREE.GridHelper(160, 40, 0x1e293b, 0x172033);
    grid.position.y = 0.02;
    scene.add(grid);

    // Roads & Pathways
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const createRoad = (w: number, l: number, x: number, z: number, rY: number = 0) => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(w, l), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.rotation.z = rY;
      road.position.set(x, 0.05, z);
      road.receiveShadow = true;
      scene.add(road);
    };
    createRoad(6, 120, 0, 0); // Main central boulevard
    createRoad(6, 120, 0, 0, Math.PI / 2); // Cross campus avenue
    createRoad(4, 50, -18, -18, Math.PI / 4); // Tech park loop
    createRoad(4, 50, 22, 22, -Math.PI / 4); // Hostel loop

    // Low-poly stylized trees
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.6 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const createTree = (x: number, z: number, scale: number = 1) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 1.8 * scale, 6), trunkMat);
      trunk.position.set(x, (0.9 * scale), z);
      trunk.castShadow = true;
      scene.add(trunk);

      const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.6 * scale, 3.2 * scale, 6), treeMat);
      foliage.position.set(x, (2.6 * scale), z);
      foliage.castShadow = true;
      scene.add(foliage);
    };

    // Plant trees along pathways
    const treeCoords = [
      [-6, -10], [-6, 10], [-6, 30], [-6, -30],
      [6, -10], [6, 10], [6, 30], [6, -30],
      [-15, 12], [-18, 15], [15, -12], [20, -15],
      [-32, -22], [-28, 28], [28, -28], [32, 22]
    ];
    treeCoords.forEach(([tx, tz]) => createTree(tx, tz, 0.8 + Math.random() * 0.4));

    // 7. BUILDINGS ARCHITECTURE (Mapped to real database campus locations)
    const buildingsData: BuildingMeshInfo[] = [
      {
        name: 'Tech Park',
        code: 'TP',
        position: [-22, 0, -20],
        size: [18, 14, 18],
        color: 0x1e3a8a, // Corporate high-tech blue
        activeCount: buildingStats['Tech Park']?.active || 0,
        criticalCount: buildingStats['Tech Park']?.critical || 0,
      },
      {
        name: 'Academic Block A',
        code: 'ABA',
        position: [22, 0, -18],
        size: [22, 10, 16],
        color: 0x312e81, // Indigo faculty hall
        activeCount: buildingStats['Academic Block A']?.active || 0,
        criticalCount: buildingStats['Academic Block A']?.critical || 0,
      },
      {
        name: 'Central Library',
        code: 'LIB',
        position: [0, 0, -32],
        size: [16, 9, 16],
        color: 0x047857, // Emerald knowledge dome
        activeCount: buildingStats['Central Library']?.active || 0,
        criticalCount: buildingStats['Central Library']?.critical || 0,
      },
      {
        name: 'Boys Hostel Block 1',
        code: 'BH1',
        position: [-20, 0, 22],
        size: [16, 11, 20],
        color: 0x475569, // Slate hostel
        activeCount: buildingStats['Boys Hostel Block 1']?.active || 0,
        criticalCount: buildingStats['Boys Hostel Block 1']?.critical || 0,
      },
      {
        name: 'Girls Hostel Block 2',
        code: 'GH2',
        position: [20, 0, 22],
        size: [18, 11, 18],
        color: 0x475569, // Slate hostel
        activeCount: buildingStats['Girls Hostel Block 2']?.active || 0,
        criticalCount: buildingStats['Girls Hostel Block 2']?.critical || 0,
      },
    ];

    buildingMeshesRef.current.clear();

    const beaconRings: { mesh: THREE.Mesh; speed: number }[] = [];

    buildingsData.forEach((bld) => {
      const group = new THREE.Group();
      group.name = bld.name;

      const [w, h, d] = bld.size;
      const [bx, , bz] = bld.position;

      // Main structural block
      const bMat = new THREE.MeshStandardMaterial({
        color: bld.color,
        roughness: 0.35,
        metalness: 0.6,
      });
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bMat);
      bMesh.position.set(0, h / 2, 0);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      (bMesh as any).userData = bld;
      group.add(bMesh);

      // Glass windows facade stripes
      const winMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
        roughness: 0.1,
        metalness: 0.9,
      });
      const floors = Math.floor(h / 2.5);
      for (let i = 1; i <= floors; i++) {
        const winGeo = new THREE.BoxGeometry(w + 0.1, 0.8, d + 0.1);
        const winMesh = new THREE.Mesh(winGeo, winMat);
        winMesh.position.set(0, i * 2.3, 0);
        group.add(winMesh);
      }

      // Roof terrace & HVAC box
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
      const hvac = new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 1.8, d * 0.4), roofMat);
      hvac.position.set(0, h + 0.9, 0);
      hvac.castShadow = true;
      group.add(hvac);

      // Hotspot Status Beacon Ring (Pulsing holographic cylinder on roof)
      let beaconColor = 0x10b981; // Green for operational
      if (bld.criticalCount > 0) beaconColor = 0xf43f5e; // Crimson critical
      else if (bld.activeCount > 0) beaconColor = 0xf59e0b; // Amber active

      const ringMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      });
      const ringMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 1.2, 16), ringMat);
      ringMesh.position.set(0, h + 3.5, 0);
      group.add(ringMesh);
      beaconRings.push({ mesh: ringMesh, speed: 1.5 + Math.random() });

      // Holographic marker pin above building
      const pinMat = new THREE.MeshStandardMaterial({
        color: beaconColor,
        emissive: beaconColor,
        emissiveIntensity: 0.6,
      });
      const pin = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), pinMat);
      pin.position.set(0, h + 6, 0);
      group.add(pin);

      group.position.set(bx, 0, bz);
      scene.add(group);
      buildingMeshesRef.current.set(bld.name, group);
    });

    // 8. RAYCASTING INTERACTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      setMousePos({ x: e.clientX, y: e.clientY });

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let found: BuildingMeshInfo | null = null;
      for (const hit of intersects) {
        if ((hit.object as any).userData?.name) {
          found = (hit.object as any).userData as BuildingMeshInfo;
          break;
        }
      }
      setHoveredBuilding(found);
      canvas.style.cursor = found ? 'pointer' : 'grab';
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      for (const hit of intersects) {
        const info = (hit.object as any).userData as BuildingMeshInfo;
        if (info?.name) {
          if (onSelectBuilding) onSelectBuilding(info.name);
          // Smooth camera focus
          const group = buildingMeshesRef.current.get(info.name);
          if (group) {
            controls.target.set(group.position.x, 6, group.position.z);
          }
          break;
        }
      }
    };

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('click', handleClick);

    // 9. ANIMATION LOOP
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Pulse beacon rings
      beaconRings.forEach(({ mesh, speed }) => {
        mesh.rotation.y += delta * 0.8 * speed;
        const scale = 1 + Math.sin(time * 3 * speed) * 0.15;
        mesh.scale.set(scale, 1, scale);
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 10. RESIZE LISTENER
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, [buildingStats, onSelectBuilding]);

  // Camera presets
  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(45, 38, 55);
    controlsRef.current.target.set(0, 4, 0);
    setCameraMode('isometric');
  };

  const topView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 80, 0.1);
    controlsRef.current.target.set(0, 0, 0);
    setCameraMode('top');
  };

  return (
    <div ref={containerRef} className="relative w-full h-[580px] rounded-3xl overflow-hidden saas-card border border-white/10 bg-[#0a0e17] shadow-2xl select-none">
      
      {/* Three.js WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating 3D Navigation Controls Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#0a0e17]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
        <div className="flex items-center gap-2 pr-3 border-r border-white/10 text-xs font-semibold text-white">
          <Compass className="w-4 h-4 text-brand-400" />
          <span>Campus 3D Digital Twin</span>
        </div>

        <button
          onClick={resetCamera}
          title="Isometric View"
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            cameraMode === 'isometric' ? 'bg-brand-500/20 text-brand-300' : 'text-slate-400 hover:text-white'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={topView}
          title="Top Down Satellite View"
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            cameraMode === 'top' ? 'bg-brand-500/20 text-brand-300' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Live Instructions Pill */}
      <div className="absolute bottom-4 left-4 z-20 text-[11px] font-mono text-slate-400 bg-[#0a0e17]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-3">
        <span>Click any building to inspect facility tickets</span>
        <span className="text-slate-600">·</span>
        <span>Left Drag: Orbit</span>
        <span className="text-slate-600">·</span>
        <span>Scroll: Zoom</span>
        <span className="text-slate-600">·</span>
        <span>Right Drag: Pan</span>
      </div>

      {/* Real-time Hover HUD Tooltip */}
      {hoveredBuilding && (
        <div
          className="pointer-events-none fixed z-50 saas-card p-3 rounded-xl border border-brand-500/40 shadow-2xl space-y-1 transform -translate-x-1/2 -translate-y-full -mt-4 transition-all duration-75"
          style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-brand-300 bg-brand-500/20 px-1.5 py-0.5 rounded">
              {hoveredBuilding.code}
            </span>
            <span className="font-bold text-xs text-white">{hoveredBuilding.name}</span>
          </div>
          <div className="text-[11px] text-slate-300 flex items-center gap-3 pt-0.5">
            <span>Active Orders: <strong className={hoveredBuilding.activeCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>{hoveredBuilding.activeCount}</strong></span>
            {hoveredBuilding.criticalCount > 0 && (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {hoveredBuilding.criticalCount} Critical
              </span>
            )}
          </div>
        </div>
      )}

      {/* Legend Badge in Top Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3 text-[11px] bg-[#0a0e17]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-300">Clear</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-slate-300">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-slate-300">Critical</span>
        </div>
      </div>
    </div>
  );
}
