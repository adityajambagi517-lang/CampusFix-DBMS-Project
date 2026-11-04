'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Complaint, LocationHotspot } from '@/types';
import { RotateCcw, Eye, Compass, AlertTriangle, Layers } from 'lucide-react';

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
  description: string;
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
  const [cameraMode, setCameraMode] = useState<'drone' | 'top' | 'facade'>('drone');

  // References to three objects for interaction
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const buildingMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  // Aggregate complaints per building from real database
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
    const height = container.clientHeight || 580;

    // 1. SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.009);

    // 2. CAMERA (Positioned to match aerial drone view from uploaded college photo)
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(38, 34, 46);

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
    renderer.toneMappingExposure = 1.15;

    // 4. CONTROLS
    const controls = new OrbitControls(camera, canvas);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 18;
    controls.maxDistance = 140;
    controls.target.set(2, 6, -2);

    // 5. LIGHTING (Warm sunlight mimicking the real aerial photograph)
    const ambientLight = new THREE.AmbientLight(0xfff1e6, 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0xd97706, 0.4);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
    sunLight.position.set(55, 65, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 180;
    const d = 60;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Warm subtle fill light
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-45, 30, -40);
    scene.add(fillLight);

    // 6. MATERIALS PALETTE (Faithful to PES University Terracotta & Architectural Finishes)
    const terracottaMat = new THREE.MeshStandardMaterial({
      color: 0xbf5535, // Iconic PES terracotta clay brick
      roughness: 0.68,
      metalness: 0.1,
    });

    const terracottaDarkMat = new THREE.MeshStandardMaterial({
      color: 0x983d23, // Deep terracotta recesses & shadows
      roughness: 0.75,
      metalness: 0.08,
    });

    const whiteTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Architectural white parapet coping & cornice trims
      roughness: 0.35,
      metalness: 0.15,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x111c2e, // Tinted reflective architectural glazing
      emissive: 0x091424,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.9,
    });

    const solarPanelMat = new THREE.MeshStandardMaterial({
      color: 0x172554, // Photovoltaic silicon blue-black panels
      roughness: 0.18,
      metalness: 0.85,
    });

    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xfbf7ed, // Tensile fabric shade sail
      roughness: 0.55,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Curving campus access driveway
      roughness: 0.85,
      metalness: 0.1,
    });

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Manicured campus lawns
      roughness: 0.9,
      metalness: 0.02,
    });

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x075985, // Front reflective pool
      roughness: 0.08,
      metalness: 0.95,
    });

    // 7. GROUND & CAMPUS ENVIRONMENT
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0b1120,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Campus Main Lawn Area
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(160, 150), grassMat);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(0, 0.02, 0);
    lawn.receiveShadow = true;
    scene.add(lawn);

    // Curving Campus Ring Road (sweeping around the front rotunda)
    const roadGroup = new THREE.Group();
    const roadRingGeo = new THREE.RingGeometry(25, 34, 48, 1, Math.PI * 0.75, Math.PI * 1.1);
    const roadRing = new THREE.Mesh(roadRingGeo, asphaltMat);
    roadRing.rotation.x = -Math.PI / 2;
    roadRing.position.set(-6, 0.04, 2);
    roadRing.receiveShadow = true;
    roadGroup.add(roadRing);

    // Straight entry avenue
    const entryRoad = new THREE.Mesh(new THREE.PlaneGeometry(9, 70), asphaltMat);
    entryRoad.rotation.x = -Math.PI / 2;
    entryRoad.position.set(-32, 0.04, 18);
    entryRoad.rotation.z = Math.PI * 0.18;
    entryRoad.receiveShadow = true;
    roadGroup.add(entryRoad);

    // Right service road
    const serviceRoad = new THREE.Mesh(new THREE.PlaneGeometry(8, 90), asphaltMat);
    serviceRoad.rotation.x = -Math.PI / 2;
    serviceRoad.position.set(34, 0.04, 6);
    serviceRoad.receiveShadow = true;
    roadGroup.add(serviceRoad);
    scene.add(roadGroup);

    // Front Reflective Blue Pool (visible in photo along bottom of rotunda)
    const pool = new THREE.Mesh(new THREE.RingGeometry(13.8, 17.5, 32, 1, Math.PI * 1.25, Math.PI * 0.45), waterMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(-8, 0.06, 8);
    scene.add(pool);

    // Low-poly Palm Trees & Tropical Landscaping
    const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6, side: THREE.DoubleSide });

    const createPalmTree = (x: number, z: number, scale = 1) => {
      const tree = new THREE.Group();
      
      const trunkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.3 * scale, 2.5 * scale, 0.2 * scale),
        new THREE.Vector3(0.5 * scale, 5.0 * scale, 0.1 * scale),
      ]);
      const trunkGeo = new THREE.TubeGeometry(trunkCurve, 8, 0.22 * scale, 6, false);
      const trunkMesh = new THREE.Mesh(trunkGeo, palmTrunkMat);
      trunkMesh.castShadow = true;
      tree.add(trunkMesh);

      const fronds = 7;
      for (let i = 0; i < fronds; i++) {
        const angle = (i / fronds) * Math.PI * 2;
        const frondGeo = new THREE.ConeGeometry(0.7 * scale, 3.2 * scale, 4);
        const frond = new THREE.Mesh(frondGeo, palmFrondMat);
        frond.position.set(Math.cos(angle) * 1.4 * scale + 0.5 * scale, 4.8 * scale, Math.sin(angle) * 1.4 * scale + 0.1 * scale);
        frond.rotation.z = Math.PI / 2.8;
        frond.rotation.y = angle;
        frond.castShadow = true;
        tree.add(frond);
      }

      tree.position.set(x, 0, z);
      scene.add(tree);
    };

    // Plant palm trees along the curved road and lawn borders (as in photo)
    const treePositions: [number, number, number][] = [
      [-36, 12, 1.1], [-34, 20, 0.95], [-31, 28, 1.05],
      [-22, 18, 1.0], [-18, 22, 0.9], [-12, 24, 1.15],
      [-4, 25, 1.0], [4, 23, 0.95], [14, 18, 1.1],
      [22, 16, 1.0], [28, 18, 0.9], [32, 26, 1.05],
      [18, 2, 0.85], [16, -4, 0.9], [19, -10, 1.0]
    ];
    treePositions.forEach(([tx, tz, ts]) => createPalmTree(tx, tz, ts));

    // Helper: Build Rooftop Solar Panel Cluster
    const createSolarArray = (parent: THREE.Group, w: number, l: number, y: number, zOff: number, xOff = 0) => {
      const panelGroup = new THREE.Group();
      const rows = Math.max(2, Math.floor(l / 2.2));
      const cols = Math.max(2, Math.floor(w / 3.0));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 1.6), solarPanelMat);
          panel.position.set(
            (c - cols / 2 + 0.5) * 2.7 + xOff,
            y + 0.15,
            (r - rows / 2 + 0.5) * 1.9 + zOff
          );
          panel.rotation.x = -0.15;
          panel.castShadow = true;
          panelGroup.add(panel);
        }
      }
      parent.add(panelGroup);
    };

    // 8. THE ICONIC PES UNIVERSITY COMPLEX ARCHITECTURE
    buildingMeshesRef.current.clear();
    const beaconRings: { mesh: THREE.Mesh; speed: number }[] = [];

    // =========================================================================
    // BLOCK 1: ACADEMIC BLOCK A (The iconic front curved rotunda & crescent facade)
    // =========================================================================
    const academicBlockGroup = new THREE.Group();
    academicBlockGroup.name = 'Academic Block A';

    // A. Front Curved Rotunda Facade (Semi-circular 3-tier curved tier)
    const rotundaRadius = 14;
    const rotundaHeight = 12;
    const rotundaGeo = new THREE.CylinderGeometry(
      rotundaRadius,
      rotundaRadius,
      rotundaHeight,
      32,
      1,
      false,
      -Math.PI * 0.42,
      Math.PI * 0.84
    );
    const rotundaMesh = new THREE.Mesh(rotundaGeo, terracottaMat);
    rotundaMesh.position.set(-8, rotundaHeight / 2, 4);
    rotundaMesh.castShadow = true;
    rotundaMesh.receiveShadow = true;
    academicBlockGroup.add(rotundaMesh);

    // B. White coping line running along the curved top edge (as in photo)
    const topTrimGeo = new THREE.TorusGeometry(rotundaRadius + 0.1, 0.35, 8, 32, Math.PI * 0.84);
    const topTrim = new THREE.Mesh(topTrimGeo, whiteTrimMat);
    topTrim.rotation.x = Math.PI / 2;
    topTrim.position.set(-8, rotundaHeight, 4);
    academicBlockGroup.add(topTrim);

    // C. Vertical Ribbon Slit Windows along the curved rotunda
    const windowAngles = [-0.34, -0.22, -0.1, 0.02, 0.14, 0.26, 0.38];
    windowAngles.forEach((ang) => {
      const a = ang * Math.PI;
      const wx = -8 + Math.cos(a) * (rotundaRadius + 0.08);
      const wz = 4 + Math.sin(a) * (rotundaRadius + 0.08);

      const slitGeo = new THREE.BoxGeometry(0.8, 8.5, 0.2);
      const slit = new THREE.Mesh(slitGeo, glassMat);
      slit.position.set(wx, rotundaHeight / 2, wz);
      slit.rotation.y = -a + Math.PI / 2;
      academicBlockGroup.add(slit);

      const surroundGeo = new THREE.BoxGeometry(1.0, 8.9, 0.1);
      const surround = new THREE.Mesh(surroundGeo, whiteTrimMat);
      surround.position.set(wx, rotundaHeight / 2, wz);
      surround.rotation.y = -a + Math.PI / 2;
      academicBlockGroup.add(surround);
    });

    // D. Lower Curved Rotunda Tier (Terrace level 1)
    const lowerRotundaGeo = new THREE.CylinderGeometry(
      rotundaRadius + 2.5,
      rotundaRadius + 2.5,
      5.5,
      28,
      1,
      false,
      -Math.PI * 0.45,
      Math.PI * 0.9
    );
    const lowerRotundaMesh = new THREE.Mesh(lowerRotundaGeo, terracottaMat);
    lowerRotundaMesh.position.set(-8, 5.5 / 2, 4);
    lowerRotundaMesh.castShadow = true;
    lowerRotundaMesh.receiveShadow = true;
    academicBlockGroup.add(lowerRotundaMesh);

    // E. Foreground Hexagonal Pavilion (visible bottom-left of photo)
    const pavilionGeo = new THREE.CylinderGeometry(3.5, 3.8, 3.2, 6);
    const pavilion = new THREE.Mesh(pavilionGeo, terracottaMat);
    pavilion.position.set(-18, 1.6, 16);
    pavilion.castShadow = true;
    academicBlockGroup.add(pavilion);

    const pavilionRoofGeo = new THREE.ConeGeometry(4.2, 1.8, 6);
    const pavilionRoof = new THREE.Mesh(pavilionRoofGeo, terracottaDarkMat);
    pavilionRoof.position.set(-18, 4.1, 16);
    pavilionRoof.castShadow = true;
    academicBlockGroup.add(pavilionRoof);

    const pavilionTrim = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.25, 6), whiteTrimMat);
    pavilionTrim.position.set(-18, 3.2, 16);
    academicBlockGroup.add(pavilionTrim);

    const academicInfo: BuildingMeshInfo = {
      name: 'Academic Block A',
      code: 'ABA',
      position: [-8, 0, 4],
      size: [24, 14, 20],
      color: 0xbf5535,
      activeCount: buildingStats['Academic Block A']?.active || 0,
      criticalCount: buildingStats['Academic Block A']?.critical || 0,
      description: 'Iconic curved crescent lecture halls, amphitheater tier, and seminar complexes.',
    };
    (rotundaMesh as any).userData = academicInfo;
    (lowerRotundaMesh as any).userData = academicInfo;

    scene.add(academicBlockGroup);
    buildingMeshesRef.current.set('Academic Block A', academicBlockGroup);

    // =========================================================================
    // BLOCK 2: TECH PARK (The massive multi-story East & North Wings with Cafeteria Terrace)
    // =========================================================================
    const techParkGroup = new THREE.Group();
    techParkGroup.name = 'Tech Park';

    // A. Main East Multi-Story Wing (6-story rectangular academic spine)
    const eastWingGeo = new THREE.BoxGeometry(16, 18, 22);
    const eastWing = new THREE.Mesh(eastWingGeo, terracottaMat);
    eastWing.position.set(16, 9, -2);
    eastWing.castShadow = true;
    eastWing.receiveShadow = true;
    techParkGroup.add(eastWing);

    // White horizontal coping strip along roof
    const eastWingTrim = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.5, 22.4), whiteTrimMat);
    eastWingTrim.position.set(16, 18.25, -2);
    techParkGroup.add(eastWingTrim);

    // Tall vertical ribbon window slots on East Wing (distinctive PES design)
    for (let f = 0; f < 4; f++) {
      for (let col = 0; col < 4; col++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 1.8), glassMat);
        win.position.set(24.1, 3.5 + f * 4.0, -9 + col * 4.8);
        techParkGroup.add(win);

        const winBorder = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 2.0), whiteTrimMat);
        winBorder.position.set(24.05, 3.5 + f * 4.0, -9 + col * 4.8);
        techParkGroup.add(winBorder);
      }
    }

    // B. Tensile Canopy Dining Terrace (Cafeteria outdoor deck on Level 2/3)
    const terraceDeck = new THREE.Mesh(new THREE.BoxGeometry(13, 1.2, 10), terracottaMat);
    terraceDeck.position.set(-1, 8.5, 5);
    terraceDeck.castShadow = true;
    techParkGroup.add(terraceDeck);

    // Pillars supporting the dining terrace
    [-6, 4].forEach((px) => {
      [1, 9].forEach((pz) => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8.5, 8), terracottaMat);
        pillar.position.set(px, 4.25, pz);
        pillar.castShadow = true;
        techParkGroup.add(pillar);
      });
    });

    // The iconic Tensile Shade Canopy Sails (cream fabric sails seen in photo!)
    const canopyShape1 = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 5.5), canopyMat);
    canopyShape1.position.set(-4, 11.5, 4.5);
    canopyShape1.rotation.x = -Math.PI / 2.3;
    canopyShape1.rotation.z = 0.15;
    canopyShape1.castShadow = true;
    techParkGroup.add(canopyShape1);

    const canopyShape2 = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 5.5), canopyMat);
    canopyShape2.position.set(2, 11.8, 4.8);
    canopyShape2.rotation.x = -Math.PI / 2.2;
    canopyShape2.rotation.z = -0.12;
    canopyShape2.castShadow = true;
    techParkGroup.add(canopyShape2);

    // C. Rooftop Elevator Penthouse & Mechanical Service Room
    const eastPenthouse = new THREE.Mesh(new THREE.BoxGeometry(6, 3.5, 7), terracottaDarkMat);
    eastPenthouse.position.set(15, 20, -3);
    eastPenthouse.castShadow = true;
    techParkGroup.add(eastPenthouse);

    // D. Rooftop Solar Panel Arrays on East Wing
    createSolarArray(techParkGroup, 12, 16, 18.3, -2, 16);

    const techParkInfo: BuildingMeshInfo = {
      name: 'Tech Park',
      code: 'TP',
      position: [16, 0, -2],
      size: [16, 18, 22],
      color: 0x1e3a8a,
      activeCount: buildingStats['Tech Park']?.active || 0,
      criticalCount: buildingStats['Tech Park']?.critical || 0,
      description: 'Advanced computing labs, server nodes, research centers, and ground cafeteria.',
    };
    (eastWing as any).userData = techParkInfo;
    (terraceDeck as any).userData = techParkInfo;

    scene.add(techParkGroup);
    buildingMeshesRef.current.set('Tech Park', techParkGroup);

    // =========================================================================
    // BLOCK 3: CENTRAL LIBRARY & INNER AMPHITHEATER ATRIUM
    // =========================================================================
    const libraryGroup = new THREE.Group();
    libraryGroup.name = 'Central Library';

    // A. Rear Curved Gallery Atrium (connecting crescent to rear wings)
    const atriumGeo = new THREE.CylinderGeometry(
      15,
      15,
      17,
      32,
      1,
      false,
      Math.PI * 0.45,
      Math.PI * 0.7
    );
    const atriumMesh = new THREE.Mesh(atriumGeo, terracottaDarkMat);
    atriumMesh.position.set(-6, 8.5, -4);
    atriumMesh.castShadow = true;
    atriumMesh.receiveShadow = true;
    libraryGroup.add(atriumMesh);

    // Tiered Balcony Galleries facing inner courtyard
    for (let b = 1; b <= 5; b++) {
      const balconyRailGeo = new THREE.TorusGeometry(14.8, 0.15, 6, 24, Math.PI * 0.7);
      const rail = new THREE.Mesh(balconyRailGeo, whiteTrimMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(-6, b * 3.2, -4);
      libraryGroup.add(rail);
    }

    // B. Central Spine / Library Reading Core
    const librarySpine = new THREE.Mesh(new THREE.BoxGeometry(14, 16, 12), terracottaMat);
    librarySpine.position.set(1, 8, -12);
    librarySpine.castShadow = true;
    librarySpine.receiveShadow = true;
    libraryGroup.add(librarySpine);

    createSolarArray(libraryGroup, 10, 8, 16.2, -12, 1);

    const libraryInfo: BuildingMeshInfo = {
      name: 'Central Library',
      code: 'LIB',
      position: [1, 0, -12],
      size: [14, 16, 14],
      color: 0x047857,
      activeCount: buildingStats['Central Library']?.active || 0,
      criticalCount: buildingStats['Central Library']?.critical || 0,
      description: 'Multi-tier digital learning center, silent study chambers, and knowledge stacks.',
    };
    (librarySpine as any).userData = libraryInfo;
    (atriumMesh as any).userData = libraryInfo;

    scene.add(libraryGroup);
    buildingMeshesRef.current.set('Central Library', libraryGroup);

    // =========================================================================
    // BLOCK 4 & 5: RESIDENTIAL PRECINCT (Boys Hostel Block 1 & Girls Hostel Block 2)
    // =========================================================================
    const createHostelBlock = (name: string, code: string, x: number, z: number, w: number, h: number, l: number) => {
      const hGroup = new THREE.Group();
      hGroup.name = name;

      const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), terracottaMat);
      mainBlock.position.set(x, h / 2, z);
      mainBlock.castShadow = true;
      mainBlock.receiveShadow = true;
      hGroup.add(mainBlock);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.4, l + 0.4), whiteTrimMat);
      trim.position.set(x, h + 0.2, z);
      hGroup.add(trim);

      const floors = Math.floor(h / 3.2);
      for (let f = 1; f <= floors; f++) {
        for (let s = -w / 2 + 2; s < w / 2 - 1; s += 3.2) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.2), glassMat);
          win.position.set(x + s, f * 3.0, z + l / 2 + 0.1);
          hGroup.add(win);
        }
      }

      createSolarArray(hGroup, w - 4, l - 4, h + 0.3, z, x);

      const info: BuildingMeshInfo = {
        name,
        code,
        position: [x, 0, z],
        size: [w, h, l],
        color: 0x475569,
        activeCount: buildingStats[name]?.active || 0,
        criticalCount: buildingStats[name]?.critical || 0,
        description: `${name} residential quarters and campus student living facilities.`,
      };
      (mainBlock as any).userData = info;

      scene.add(hGroup);
      buildingMeshesRef.current.set(name, hGroup);
      return hGroup;
    };

    createHostelBlock('Boys Hostel Block 1', 'BH1', -32, -18, 14, 13, 18);
    createHostelBlock('Girls Hostel Block 2', 'GH2', 36, -20, 15, 14, 16);

    // =========================================================================
    // STATUS BEACONS & HOLOGRAPHIC HOTSPOT INDICATORS
    // =========================================================================
    const allBuildings = [
      { name: 'Academic Block A', x: -8, y: 14, z: 4, count: buildingStats['Academic Block A'] },
      { name: 'Tech Park', x: 16, y: 20, z: -2, count: buildingStats['Tech Park'] },
      { name: 'Central Library', x: 1, y: 18, z: -12, count: buildingStats['Central Library'] },
      { name: 'Boys Hostel Block 1', x: -32, y: 15, z: -18, count: buildingStats['Boys Hostel Block 1'] },
      { name: 'Girls Hostel Block 2', x: 36, y: 16, z: -20, count: buildingStats['Girls Hostel Block 2'] },
    ];

    allBuildings.forEach((b) => {
      let beaconColor = 0x10b981; // Operational green
      if (b.count?.critical > 0) beaconColor = 0xf43f5e; // Critical red
      else if (b.count?.active > 0) beaconColor = 0xf59e0b; // Active amber

      const ringMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        wireframe: true,
        transparent: true,
        opacity: 0.75,
      });
      const ringMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.0, 16), ringMat);
      ringMesh.position.set(b.x, b.y + 1.8, b.z);
      scene.add(ringMesh);
      beaconRings.push({ mesh: ringMesh, speed: 1.4 });

      const pinMat = new THREE.MeshStandardMaterial({
        color: beaconColor,
        emissive: beaconColor,
        emissiveIntensity: 0.7,
      });
      const pin = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), pinMat);
      pin.position.set(b.x, b.y + 3.8, b.z);
      scene.add(pin);
    });

    // 9. RAYCASTING INTERACTION
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
          const group = buildingMeshesRef.current.get(info.name);
          if (group) {
            controls.target.set(info.position[0], 8, info.position[2]);
          }
          break;
        }
      }
    };

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('click', handleClick);

    // 10. ANIMATION LOOP
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      beaconRings.forEach(({ mesh, speed }) => {
        mesh.rotation.y += delta * 0.9 * speed;
        const scale = 1 + Math.sin(time * 3 * speed) * 0.18;
        mesh.scale.set(scale, 1, scale);
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 11. RESIZE LISTENER
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 580;
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
  const droneView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(38, 34, 46);
    controlsRef.current.target.set(2, 6, -2);
    setCameraMode('drone');
  };

  const topView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 85, 0.1);
    controlsRef.current.target.set(0, 0, 0);
    setCameraMode('top');
  };

  const facadeView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(-8, 12, 38);
    controlsRef.current.target.set(-8, 6, 4);
    setCameraMode('facade');
  };

  return (
    <div ref={containerRef} className="relative w-full h-[600px] rounded-3xl overflow-hidden saas-card border border-white/10 bg-[#0a0f1d] shadow-2xl select-none">
      
      {/* Three.js WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating 3D Navigation Controls Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-[#0a0e17]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
        <div className="flex items-center gap-2 pr-3 border-r border-white/10 text-xs font-semibold text-white">
          <Compass className="w-4 h-4 text-brand-400" />
          <span>PES University Campus Twin</span>
        </div>

        <button
          onClick={droneView}
          title="Aerial Drone View"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            cameraMode === 'drone' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Aerial View</span>
        </button>

        <button
          onClick={facadeView}
          title="Curved Rotunda Front Facade"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            cameraMode === 'facade' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Rotunda Facade</span>
        </button>

        <button
          onClick={topView}
          title="Top Down Master Plan"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            cameraMode === 'top' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Master Plan</span>
        </button>
      </div>

      {/* Live Instructions Pill */}
      <div className="absolute bottom-4 left-4 z-20 text-[11px] font-mono text-slate-300 bg-[#0a0e17]/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 flex flex-wrap items-center gap-3">
        <span className="text-brand-300 font-semibold">Terracotta Digital Twin</span>
        <span className="text-slate-600">·</span>
        <span>Click wing to focus</span>
        <span className="text-slate-600">·</span>
        <span>Left Drag: Orbit 360°</span>
        <span className="text-slate-600">·</span>
        <span>Scroll: Zoom</span>
      </div>

      {/* Real-time Hover HUD Tooltip */}
      {hoveredBuilding && (
        <div
          className="pointer-events-none fixed z-50 saas-card p-3.5 rounded-xl border border-brand-500/40 shadow-2xl space-y-1.5 transform -translate-x-1/2 -translate-y-full -mt-4 transition-all duration-75 max-w-xs"
          style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
            <span className="font-bold text-xs text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-400" />
              {hoveredBuilding.name}
            </span>
            <span className="font-mono text-[10px] text-brand-300 bg-brand-500/20 px-1.5 py-0.5 rounded font-semibold">
              {hoveredBuilding.code}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            {hoveredBuilding.description}
          </p>
          <div className="text-[11px] text-slate-300 flex items-center justify-between pt-0.5">
            <span>Active Orders: <strong className={hoveredBuilding.activeCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>{hoveredBuilding.activeCount}</strong></span>
            {hoveredBuilding.criticalCount > 0 && (
              <span className="text-rose-400 font-bold flex items-center gap-1 text-[10px]">
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
          <span className="text-slate-300">Operational</span>
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
