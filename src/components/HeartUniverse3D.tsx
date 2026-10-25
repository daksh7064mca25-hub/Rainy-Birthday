'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MemoryItem } from '@/types/content';
import { Sparkles, Heart, Compass, Star } from 'lucide-react';

interface HeartUniverse3DProps {
  recipientName: string;
  partnerName: string;
  memories: MemoryItem[];
  activeMemoryId?: string | null;
  isModalOpen?: boolean;
  onSelectMemory: (memory: MemoryItem) => void;
}

export default function HeartUniverse3D({
  recipientName,
  partnerName,
  memories,
  activeMemoryId,
  isModalOpen = false,
  onSelectMemory,
}: HeartUniverse3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);

  // Filter to published memories
  const publishedMemories = memories.filter((m) => m.published !== false);

  // Keep refs for dynamic modal open state and callbacks in animation/event loop
  const isModalOpenRef = useRef(isModalOpen);
  isModalOpenRef.current = isModalOpen;

  const activeMemoryIdRef = useRef(activeMemoryId);
  activeMemoryIdRef.current = activeMemoryId;

  const onSelectMemoryRef = useRef(onSelectMemory);
  onSelectMemoryRef.current = onSelectMemory;

  const publishedMemoriesRef = useRef(publishedMemories);
  publishedMemoriesRef.current = publishedMemories;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Test WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch (e) {
      setWebGLSupported(false);
      return;
    }

    let width = container.clientWidth;
    let height = container.clientHeight;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090a14, 0.035);

    // Camera tuned for portrait mobile viewports
    const isPortrait = height > width;
    const fov = isPortrait ? 60 : 45;
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100);
    camera.position.z = isPortrait ? 9.5 : 7.5;
    camera.position.y = 0.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for entire universe rotation
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // 1. Procedural 3D Heart Geometry
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 0.25, y + 0.25);
    heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
    heartShape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
    heartShape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
    heartShape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
    heartShape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
    heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

    const extrudeSettings = {
      depth: 0.3,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 2,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    };

    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    heartGeo.center();

    const heartMat = new THREE.MeshPhongMaterial({
      color: 0xe2587f,
      emissive: 0x5a102a,
      specular: 0xf3cf7a,
      shininess: 80,
      transparent: true,
      opacity: 0.92,
    });

    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.scale.set(1.4, -1.4, 1.4);
    (heartMesh as any).userData = { isHeart: true };
    universeGroup.add(heartMesh);

    // 2. Glowing Stardust Ring around the heart
    const ringGeo = new THREE.BufferGeometry();
    const ringParticleCount = isPortrait ? 90 : 130;
    const ringPositions = new Float32Array(ringParticleCount * 3);
    const ringColors = new Float32Array(ringParticleCount * 3);

    for (let i = 0; i < ringParticleCount; i++) {
      const angle = (i / ringParticleCount) * Math.PI * 2;
      const radius = 2.4 + (Math.random() - 0.5) * 0.4;
      ringPositions[i * 3] = Math.cos(angle) * radius;
      ringPositions[i * 3 + 1] = Math.sin(angle) * (radius * 0.45);
      ringPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;

      if (i % 2 === 0) {
        ringColors[i * 3] = 0.95;
        ringColors[i * 3 + 1] = 0.81;
        ringColors[i * 3 + 2] = 0.48;
      } else {
        ringColors[i * 3] = 0.89;
        ringColors[i * 3 + 1] = 0.35;
        ringColors[i * 3 + 2] = 0.5;
      }
    }

    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    ringGeo.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));

    const ringMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const ringPoints = new THREE.Points(ringGeo, ringMat);
    universeGroup.add(ringPoints);

    // 3. Constellation Node Orbs for Memories
    const nodeMeshes: THREE.Mesh[] = [];
    const interactiveTargets: THREE.Object3D[] = [];
    const nodeCount = Math.min(publishedMemories.length, 8);

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const dist = 3.0;

      const nodeGeo = new THREE.SphereGeometry(0.26, 20, 20);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: 0xf6d683,
        emissive: 0xa87d26,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.85,
      });

      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.x = Math.cos(angle) * dist;
      node.position.y = Math.sin(angle) * (dist * 0.55);
      node.position.z = Math.sin(angle * 2) * 0.6;
      (node as any).userData = { index: i, memory: publishedMemories[i] };

      // Halo stardust glow around each star node
      const haloGeo = new THREE.SphereGeometry(0.44, 14, 14);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xf3cf7a,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      (haloMesh as any).userData = { index: i, memory: publishedMemories[i] };
      node.add(haloMesh);

      // Generous invisible hit target sphere (~75px wide for thumb-friendly mobile taps)
      const hitTargetGeo = new THREE.SphereGeometry(0.95, 10, 10);
      const hitTargetMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0001,
        depthWrite: false,
      });
      const hitTargetMesh = new THREE.Mesh(hitTargetGeo, hitTargetMat);
      (hitTargetMesh as any).userData = { index: i, memory: publishedMemories[i], isHitTarget: true };
      node.add(hitTargetMesh);

      universeGroup.add(node);
      nodeMeshes.push(node);
      interactiveTargets.push(node, haloMesh, hitTargetMesh);
    }

    // Add heart to interactive targets
    interactiveTargets.push(heartMesh);

    // 4. Romantic Lighting
    const ambientLight = new THREE.AmbientLight(0xfff0f5, 0.7);
    scene.add(ambientLight);

    const pointLightRose = new THREE.PointLight(0xe2587f, 2.5, 15);
    pointLightRose.position.set(2, 3, 3);
    scene.add(pointLightRose);

    const pointLightGold = new THREE.PointLight(0xf3cf7a, 2, 15);
    pointLightGold.position.set(-3, -2, 2);
    scene.add(pointLightGold);

    // Raycaster for Tap & Click Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const triggerRaycastAt = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveTargets, true);

      if (intersects.length > 0) {
        let foundMemory: MemoryItem | null = null;
        let foundIndex: number | null = null;
        let matchedMesh: THREE.Object3D | null = null;

        for (const hit of intersects) {
          const obj = hit.object;
          if ((obj as any).userData?.memory) {
            foundMemory = (obj as any).userData.memory;
            foundIndex = (obj as any).userData.index;
            matchedMesh = obj;
            break;
          } else if ((obj.parent as any)?.userData?.memory) {
            foundMemory = (obj.parent as any).userData.memory;
            foundIndex = (obj.parent as any).userData.index;
            matchedMesh = obj.parent;
            break;
          } else if ((obj as any).userData?.isHeart) {
            // Heart clicked: open first available memory!
            if (publishedMemoriesRef.current.length > 0) {
              foundMemory = publishedMemoriesRef.current[0];
              foundIndex = 0;
              matchedMesh = heartMesh;
              break;
            }
          }
        }

        if (foundMemory) {
          if (foundIndex !== null) {
            setActiveNodeIndex(foundIndex);
          }

          // Gentle visual pulse on click
          if (matchedMesh) {
            matchedMesh.scale.multiplyScalar(1.25);
            setTimeout(() => {
              matchedMesh?.scale.divideScalar(1.25);
            }, 300);
          }

          onSelectMemoryRef.current(foundMemory);
        }
      }
    };

    // Pointer event handling with drag-distance check
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      startTime = Date.now();
    };

    const onPointerUp = (e: PointerEvent) => {
      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);
      const deltaTime = Date.now() - startTime;

      // Only count as tap if finger didn't drag to scroll (less than 15px displacement)
      if (deltaX < 15 && deltaY < 15 && deltaTime < 700) {
        triggerRaycastAt(e.clientX, e.clientY);
      }
    };

    const onClick = (e: MouseEvent) => {
      triggerRaycastAt(e.clientX, e.clientY);
    };

    // Hover cursor feedback on desktop
    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveTargets, true);
      const hasInteractive = hits.some(
        (h) =>
          (h.object as any).userData?.memory ||
          (h.object.parent as any)?.userData?.memory ||
          (h.object as any).userData?.isHeart
      );
      renderer.domElement.style.cursor = hasInteractive ? 'pointer' : 'default';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    let currentRotationSpeed = 0.12;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smoothly slow down rotation when modal is open
      const targetSpeed = isModalOpenRef.current ? 0.02 : 0.12;
      currentRotationSpeed += (targetSpeed - currentRotationSpeed) * 0.05;

      // Gentle universe rotation
      universeGroup.rotation.y += currentRotationSpeed * delta;

      // Heart gentle heartbeat pulsing
      const beat = 1 + Math.sin(elapsedTime * 2.4) * 0.04 + Math.sin(elapsedTime * 4.8) * 0.02;
      heartMesh.scale.set(1.4 * beat, -1.4 * beat, 1.4 * beat);

      // Star nodes subtle pulsation and highlight active node
      nodeMeshes.forEach((nodeMesh, i) => {
        const mem = (nodeMesh as any).userData?.memory;
        const isActive = activeMemoryIdRef.current && mem?.id === activeMemoryIdRef.current;
        const nodeMat = nodeMesh.material as THREE.MeshStandardMaterial;

        if (isActive) {
          nodeMesh.scale.set(1.55, 1.55, 1.55);
          nodeMat.emissive.setHex(0xffdf80);
          nodeMat.emissiveIntensity = 1.6;
        } else {
          const nodePulse = 1 + Math.sin(elapsedTime * 3 + i) * 0.08;
          nodeMesh.scale.set(nodePulse, nodePulse, nodePulse);
          nodeMat.emissive.setHex(0xa87d26);
          nodeMat.emissiveIntensity = 0.7;
        }
      });

      // Orbiting particles slight drift
      ringPoints.rotation.z = -elapsedTime * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      const isPortraitNow = height > width;
      camera.fov = isPortraitNow ? 60 : 45;
      camera.position.z = isPortraitNow ? 9.5 : 7.5;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('click', onClick);
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
      heartGeo.dispose();
      heartMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      nodeMeshes.forEach((n) => {
        n.geometry.dispose();
        (n.material as THREE.Material).dispose();
      });
    };
  }, [publishedMemories]);

  return (
    <div style={{ width: '100%' }}>
      {/* 3D Cosmos Card Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          maxHeight: '60vh',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 50%, #200717 0%, #0c0d18 70%)',
          border: '1.5px solid rgba(243, 207, 122, 0.28)',
          boxShadow: '0 16px 44px rgba(0,0,0,0.65), 0 0 25px rgba(226, 88, 127, 0.18)',
        }}
      >
        {/* 3D Canvas Mount Point */}
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'pan-y', // Allows vertical page scrolling smoothly even when swiping over canvas
          }}
        />

        {/* Non-WebGL Fallback: Accessible Star Constellation Grid */}
        {!webGLSupported && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at 50% 40%, #3e0b24 0%, #090a14 85%)',
              padding: '20px',
              boxSizing: 'border-box',
            }}
          >
            <div
              className="animate-pulse-glow"
              onClick={() => publishedMemories.length > 0 && onSelectMemory(publishedMemories[0])}
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #e2587f 0%, #750e33 70%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 35px rgba(226, 88, 127, 0.6)',
                marginBottom: '16px',
                cursor: 'pointer',
              }}
            >
              <Heart size={44} color="#ffd5e2" fill="#ffd5e2" />
            </div>

            <p style={{ color: 'var(--color-champagne)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>
              {recipientName} &amp; {partnerName}
            </p>

            {/* Accessible Star Buttons Grid */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                justifyContent: 'center',
                maxWidth: '360px',
              }}
            >
              {publishedMemories.map((mem, i) => (
                <button
                  key={mem.id}
                  onClick={() => onSelectMemory(mem)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(25, 20, 36, 0.85)',
                    border: '1px solid rgba(243, 207, 122, 0.4)',
                    borderRadius: '9999px',
                    padding: '8px 14px',
                    color: 'var(--color-gold)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <Star size={13} fill="var(--color-gold)" />
                  <span>Star {i + 1}: {mem.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Overlay Couple Tag & Instructions */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 12, 25, 0.78)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(243, 207, 122, 0.3)',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              color: 'var(--color-gold)',
              fontWeight: 500,
            }}
          >
            <Sparkles size={13} color="var(--color-gold)" />
            {recipientName} &amp; {partnerName}
          </span>

          <span
            style={{
              background: 'rgba(15, 12, 25, 0.65)',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            Interactive Cosmos
          </span>
        </div>

        {/* Interactive memory preview pill at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '14px',
            left: '16px',
            right: '16px',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            onClick={() => publishedMemories.length > 0 && onSelectMemory(publishedMemories[0])}
            role="button"
            tabIndex={0}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              background: 'rgba(10, 11, 22, 0.88)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(226, 88, 127, 0.45)',
              borderRadius: '9999px',
              padding: '8px 18px',
              fontSize: '0.78rem',
              color: 'var(--color-blush)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textAlign: 'center',
              boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
          >
            <Compass size={14} color="var(--color-gold)" />
            <span>Tap any gold star to reveal our photograph</span>
          </div>
        </div>
      </div>

      {/* Interactive Star Buttons Strip directly beneath canvas */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '12px 4px 4px 4px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {publishedMemories.map((mem, i) => (
          <button
            key={mem.id}
            type="button"
            onClick={() => onSelectMemory(mem)}
            className="btn-outline"
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              borderRadius: '9999px',
              borderColor: activeMemoryId === mem.id ? 'var(--color-gold)' : 'rgba(243, 207, 122, 0.3)',
              background: activeMemoryId === mem.id ? 'rgba(226, 88, 127, 0.35)' : 'rgba(20, 16, 32, 0.8)',
              color: 'var(--color-champagne)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              touchAction: 'manipulation',
            }}
          >
            <Star size={13} fill="var(--color-gold)" color="var(--color-gold)" />
            <span>Star {i + 1}: {mem.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
