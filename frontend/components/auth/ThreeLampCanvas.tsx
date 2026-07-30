"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface ThreeLampCanvasProps {
  focusedField: string | null;
  isPasswordFocused?: boolean;
  hasError?: boolean;
  isOn: boolean;
  onToggleLight: (isOn: boolean) => void;
}

export default function ThreeLampCanvas({
  focusedField,
  isPasswordFocused = false,
  hasError = false,
  isOn,
  onToggleLight,
}: ThreeLampCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to 3D objects for real-time manipulation
  const headGroupRef = useRef<THREE.Group | null>(null);
  const spotlightRef = useRef<THREE.SpotLight | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const bulbMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const lightConeMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const cordHandleRef = useRef<THREE.Mesh | null>(null);
  const cordMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Target angles for lerp interpolation
  const targetRotY = useRef(0);
  const targetRotX = useRef(0);
  const targetLightIntensity = useRef(isOn ? 2.0 : 0);
  const cordPullOffset = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || 400;
    const height = 360;

    // ── 1. THREE.JS SCENE, CAMERA, RENDERER ───────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.replaceChildren(renderer.domElement);

    // ── 2. LIGHTING ───────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Lamp Bulb PointLight
    const pointLight = new THREE.PointLight(0xffdf7a, isOn ? 2.5 : 0, 15);
    pointLight.position.set(0, 1.2, 0);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    // Lamp Volumetric SpotLight
    const spotLight = new THREE.SpotLight(0xffdf7a, isOn ? 4 : 0, 20, Math.PI / 4, 0.5, 1);
    spotLight.position.set(0, 1.2, 0);
    spotLight.target.position.set(0, -6, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);
    spotlightRef.current = spotLight;

    // ── 3. 3D MESH GEOMETRIES & MATERIALS ─────────────────────────────────
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.2,
    });

    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.25,
    });
    cordMaterialRef.current = brassMaterial;

    const lampRootGroup = new THREE.Group();
    lampRootGroup.position.set(0, 3.2, 0);
    scene.add(lampRootGroup);

    // Mount Plate
    const mountGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.3, 32);
    const mountMesh = new THREE.Mesh(mountGeo, metalMaterial);
    lampRootGroup.add(mountMesh);

    // Upper Arm Rod
    const rodGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 16);
    const upperArm = new THREE.Mesh(rodGeo, metalMaterial);
    upperArm.position.set(0, -1.2, 0);
    lampRootGroup.add(upperArm);

    // Elbow Joint
    const elbowGeo = new THREE.SphereGeometry(0.3, 24, 24);
    const elbow = new THREE.Mesh(elbowGeo, brassMaterial);
    elbow.position.set(0, -2.3, 0);
    lampRootGroup.add(elbow);

    // Lower Arm Rod (angled forward)
    const lowerArm = new THREE.Mesh(rodGeo, metalMaterial);
    lowerArm.position.set(0, -3.4, 0.3);
    lowerArm.rotation.x = 0.2;
    lampRootGroup.add(lowerArm);

    // Head Group (Rotatable joint)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, -4.4, 0.6);
    lampRootGroup.add(headGroup);
    headGroupRef.current = headGroup;

    // Brass Shade Socket
    const socketGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.4, 24);
    const socketMesh = new THREE.Mesh(socketGeo, brassMaterial);
    socketMesh.position.set(0, 0.2, 0);
    headGroup.add(socketMesh);

    // Pixar Dome Shade
    const shadeGeo = new THREE.ConeGeometry(1.6, 1.4, 32, 1, true);
    const shadeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.5,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    const shadeMesh = new THREE.Mesh(shadeGeo, shadeMaterial);
    shadeMesh.rotation.x = Math.PI;
    shadeMesh.position.set(0, -0.5, 0);
    headGroup.add(shadeMesh);

    // Glowing LED Bulb Sphere
    const bulbGeo = new THREE.SphereGeometry(0.45, 24, 24);
    const bulbMaterial = new THREE.MeshBasicMaterial({ color: isOn ? 0xfffbeb : 0x334155 });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMaterial);
    bulbMesh.position.set(0, -0.7, 0);
    headGroup.add(bulbMesh);
    bulbMaterialRef.current = bulbMaterial;

    // 3D Volumetric Light Cone Mesh
    const coneGeo = new THREE.ConeGeometry(3.5, 8, 32, 1, true);
    const lightConeMaterial = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: isOn ? 0.25 : 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const lightConeMesh = new THREE.Mesh(coneGeo, lightConeMaterial);
    lightConeMesh.position.set(0, -4.6, 0);
    lightConeMesh.rotation.x = Math.PI;
    headGroup.add(lightConeMesh);
    lightConeMaterialRef.current = lightConeMaterial;

    // ── PULL STRING CORD & BALL HANDLE ────────────────────────────────────
    const cordLineGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8);
    const cordLineMesh = new THREE.Mesh(cordLineGeo, brassMaterial);
    cordLineMesh.position.set(0.95, -0.9, 0);
    headGroup.add(cordLineMesh);

    const handleGeo = new THREE.SphereGeometry(0.24, 20, 20);
    const handleMesh = new THREE.Mesh(handleGeo, brassMaterial);
    handleMesh.position.set(0.95, -1.6, 0);
    headGroup.add(handleMesh);
    cordHandleRef.current = handleMesh;

    // Attach spot/point lights to 3D head
    headGroup.add(pointLight);
    pointLight.position.set(0, -0.7, 0);

    // ── 4. MOUSE MOVE TRACKING ───────────────────────────────────────────
    const handleMouseMove = (e: MouseEvent) => {
      if (focusedField) return; // Focused state takes priority
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;

      targetRotY.current = normX * 0.4;
      targetRotX.current = -normY * 0.25;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // ── 5. CLICK HANDLER (Raycast cord pull) ─────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObjects([handleMesh, cordLineMesh, shadeMesh]);

      if (intersects.length > 0) {
        // Toggle Light On/Off
        cordPullOffset.current = -0.5; // Pull recoil animation
        onToggleLight(!isOn);
      }
    };

    renderer.domElement.addEventListener("click", handleClick);

    // ── 6. ANIMATION RENDER LOOP ─────────────────────────────────────────
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (headGroupRef.current) {
        // Smooth Lerp Rotations
        headGroupRef.current.rotation.y += (targetRotY.current - headGroupRef.current.rotation.y) * 0.08;
        headGroupRef.current.rotation.x += (targetRotX.current - headGroupRef.current.rotation.x) * 0.08;
      }

      // Spring recoil animation for pull cord handle
      if (cordHandleRef.current) {
        cordPullOffset.current += (0 - cordPullOffset.current) * 0.15;
        cordHandleRef.current.position.y = -1.6 + cordPullOffset.current;
      }

      // Smooth Light Intensity Lerping
      if (pointLightRef.current && spotlightRef.current) {
        pointLightRef.current.intensity += (targetLightIntensity.current - pointLightRef.current.intensity) * 0.1;
        spotlightRef.current.intensity = pointLightRef.current.intensity * 1.5;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth || 400;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.dispose();
    };
  }, [isOn, onToggleLight]);

  // ── UPDATE TARGET ROTATIONS & COLORS DEPENDING ON INPUT FOCUS ──────────
  useEffect(() => {
    if (!isOn) {
      targetLightIntensity.current = 0;
      if (bulbMaterialRef.current) bulbMaterialRef.current.color.setHex(0x334155);
      if (lightConeMaterialRef.current) lightConeMaterialRef.current.opacity = 0;
      return;
    }

    if (hasError) {
      targetLightIntensity.current = 3.0;
      if (bulbMaterialRef.current) bulbMaterialRef.current.color.setHex(0xef4444);
      if (lightConeMaterialRef.current) {
        lightConeMaterialRef.current.color.setHex(0xef4444);
        lightConeMaterialRef.current.opacity = 0.35;
      }
    } else if (isPasswordFocused) {
      // Shy privacy tilt: turns 3D head upward and lowers intensity
      targetRotY.current = -0.4;
      targetRotX.current = -0.5;
      targetLightIntensity.current = 0.8;
      if (bulbMaterialRef.current) bulbMaterialRef.current.color.setHex(0xa855f7);
      if (lightConeMaterialRef.current) {
        lightConeMaterialRef.current.color.setHex(0xa855f7);
        lightConeMaterialRef.current.opacity = 0.15;
      }
    } else if (focusedField === "email") {
      targetRotY.current = -0.3;
      targetRotX.current = 0.2;
      targetLightIntensity.current = 2.5;
      if (bulbMaterialRef.current) bulbMaterialRef.current.color.setHex(0xfde047);
      if (lightConeMaterialRef.current) {
        lightConeMaterialRef.current.color.setHex(0xfde047);
        lightConeMaterialRef.current.opacity = 0.28;
      }
    } else if (focusedField === "username" || focusedField === "fullName") {
      targetRotY.current = 0;
      targetRotX.current = 0.25;
      targetLightIntensity.current = 2.5;
      if (bulbMaterialRef.current) bulbMaterialRef.current.color.setHex(0x38bdf8);
      if (lightConeMaterialRef.current) {
        lightConeMaterialRef.current.color.setHex(0x38bdf8);
        lightConeMaterialRef.current.opacity = 0.28;
      }
    } else if (focusedField === "consent") {
      targetRotY.current = 0.3;
      targetRotX.current = 0.3;
      targetLightIntensity.current = 2.5;
      if (bulbMaterialRef.current) bulbMaterialRef.current.color.setHex(0x34d399);
      if (lightConeMaterialRef.current) {
        lightConeMaterialRef.current.color.setHex(0x34d399);
        lightConeMaterialRef.current.opacity = 0.28;
      }
    } else {
      targetRotY.current = 0;
      targetRotX.current = 0;
      targetLightIntensity.current = 2.0;
      if (bulbMaterialRef.current) bulbMaterialRef.current.color.setHex(0xfffbeb);
      if (lightConeMaterialRef.current) {
        lightConeMaterialRef.current.color.setHex(0xfde047);
        lightConeMaterialRef.current.opacity = 0.22;
      }
    }
  }, [focusedField, isPasswordFocused, hasError, isOn]);

  return (
    <div className="relative w-full flex flex-col items-center select-none z-20">
      {/* Three.js WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className="w-full h-80 cursor-pointer"
        title="Click cord or lamp to pull string"
      />
    </div>
  );
}
