import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";

function Trophy() {
  const { scene } = useGLTF("/trophy.gltf");

  return (
    <primitive
      object={scene}
      scale={1}
      rotation={[0, Math.PI / 4, 0]}
      position={[0, 0, 0]} // adjust the object's position to be in the center of the camera's view
      castShadow
      receiveShadow
    />
  );
}

function CameraAnimation() {
  const { camera } = useThree();
  const mixer = useRef(null);

  useEffect(() => {
    // Create mixer for camera
    mixer.current = new THREE.AnimationMixer(camera);

    // Create a single camera animation
    const cameraAnimation = new THREE.AnimationClip("CrazyAngle", 6, [
      new THREE.VectorKeyframeTrack(
        ".position",
        [0, 6], //0 is zero seconds in, 5 is 5 seconds in, 10 is 10 seconds in
        [
          0,
          0.5,
          9, //x, y, z(really y) at 0 zero seconds
          1.25,
          0.55,
          3.9, //x, y, z at 10 seconds
        ]
      ),
      new THREE.QuaternionKeyframeTrack(
        ".quaternion",
        [0, 6], //(time rotation)
        [
          0,
          0,
          0.5,
          1, //x, y, z, w
          0.2,
          -0.01,
          0.2,
          0.9071,
        ]
      ),
    ]);

    // Create and play the animation clip
    const action = mixer.current.clipAction(cameraAnimation);
    action.setLoop(THREE.LoopRepeat);
    action.play();

    // Cleanup
    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }
    };
  }, [camera]);

  // Update mixer on each frame
  useFrame((_, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  return null;
}

function TrophyScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <directionalLight position={[-10, -10, 10]} intensity={0.5} />
      
      <Environment files="/hdr_environment.hdr" background />
      
      <Trophy />
      
      <CameraAnimation />
      
      <EffectComposer>
        <DepthOfField focusDistance={0.02} focalLength={0.1} bokehScale={2} />
      </EffectComposer>
    </>
  );
}

export default TrophyScene;