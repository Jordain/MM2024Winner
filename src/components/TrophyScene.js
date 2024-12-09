import React, { useRef, useEffect, useState } from "react";
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

function CameraAnimations() {
  const { camera } = useThree();
  const mixer = useRef(null);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(null);
  const animationOrderRef = useRef([]);
  
  // Predefined camera animations
  const cameraAnimations = [
    // Circular orbit around trophy
    // Circular orbit around trophy (slow)
    (cam) => {
      return new THREE.AnimationClip("CircularOrbit", 6, [
        new THREE.VectorKeyframeTrack(
          ".position",
          [0, 6], //0 is zero seconds in, 5 is 5 seconds in, 10 is 10 seconds in
          [
            1,
            -0.5,
            8, //x, y, z(really y) at 0 zero seconds
            5,
            3.5,
            -1, //x, y, z at 10 seconds
          ]
        ),
        new THREE.QuaternionKeyframeTrack(
          ".quaternion",
          [0, 6], //(time rotation)
          [
            0,
            0,
            0,
            1, //x, y, z, w
            0,
            0.7071,
            0,
            0.7071,
          ]
        ),
      ]);
    },

    // Side sweep
    (cam) => {
      return new THREE.AnimationClip("DownSweepSlow", 6, [
        new THREE.VectorKeyframeTrack(
          ".position",
          [0, 6], //0 is zero seconds in, 5 is 5 seconds in, 10 is 10 seconds in
          [
            5,
            3,
            10, //x, y, z(really y) at 0 zero seconds
            4,
            2,
            8, //x, y, z at 10 seconds
          ]
        ),
        new THREE.QuaternionKeyframeTrack(
          ".quaternion",
          [0, 6], //(time rotation)
          [
            0,
            0,
            0,
            0, //x, y, z, w
            0,
            0,
            0,
            0.8,
          ]
        ),
      ]);
    },

    // Low angle dramatic
    (cam) => {
      return new THREE.AnimationClip("CrazyAngle", 6, [
        new THREE.VectorKeyframeTrack(
          ".position",
          [0, 6], //0 is zero seconds in, 5 is 5 seconds in, 10 is 10 seconds in
          [
            1,
            0.5,
            4, //x, y, z(really y) at 0 zero seconds
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
            -0.0002,
            0.5,
            0.7071,
          ]
        ),
      ]);
    },

    // High angle overview
    (cam) => {
      return new THREE.AnimationClip("SideName", 6, [
        new THREE.VectorKeyframeTrack(
          ".position",
          [0, 6], //0 is zero seconds in, 5 is 5 seconds in, 10 is 10 seconds in
          [
            1.5,
            0.75,
            1.75, //x, y, z(really y) at 0 zero seconds
            1.5,
            0.75,
            1, //x, y, z at 10 seconds
          ]
        ),
        new THREE.QuaternionKeyframeTrack(
          ".quaternion",
          [0, 6], //(time rotation)
          [
            0,
            0.21,
            0,
            1, //x, y, z, w
            0,
            0.5,
            0,
            1,
          ]
        ),
      ]);
    },

    // Close-up dynamic
    (cam) => {
      return new THREE.AnimationClip("GoingUP", 6, [
        new THREE.VectorKeyframeTrack(
          ".position",
          [0, 6], //0 is zero seconds in, 5 is 5 seconds in, 10 is 10 seconds in
          [
            0.25,
            0.8,
            1.2, //x, y, z(really y) at 0 zero seconds
            0.9,
            2.2,
            1, //x, y, z at 10 seconds
          ]
        ),
        new THREE.QuaternionKeyframeTrack(
          ".quaternion",
          [0, 6], //(time rotation)
          [
            0,
            0,
            0,
            1, //x, y, z, w
            0.9,
            0.25,
            0.25,
            1,
          ]
        ),
      ]);
    },
  ];

  
  useEffect(() => {
    mixer.current = new THREE.AnimationMixer(camera);

    const playRandomAnimation = () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }

      // If we've used all animations, reset the order
      if (animationOrderRef.current.length === 0) {
        animationOrderRef.current = cameraAnimations.map((_, index) => index);
      }

      // Remove the current animation index from available options
      const availableIndices = animationOrderRef.current.filter(
        index => index !== currentAnimationIndex
      );

      // Ensure we have available indices
      if (availableIndices.length === 0) {
        console.error('No available animations');
        return;
      }

      console.log(availableIndices.length);
      // Randomly select an index from available indices
      const randomIndexPosition = Math.floor(Math.random() * availableIndices.length);
      const newAnimationIndex = availableIndices[randomIndexPosition];

      // Validate the animation selection
      const randomAnimation = cameraAnimations[newAnimationIndex];
      if (typeof randomAnimation !== 'function') {
        console.error('Invalid animation selected', {
          newAnimationIndex,
          randomAnimation,
          availableIndices,
          currentAnimationIndex
        });
        return;
      }

      // Remove the selected index from the order
      animationOrderRef.current = animationOrderRef.current.filter(
        index => index !== newAnimationIndex
      );

      // Play the selected animation
      const clip = randomAnimation(camera);
      const action = mixer.current.clipAction(clip);

      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.play();

      // Update the current animation index
      setCurrentAnimationIndex(newAnimationIndex);

      // Use mixer's 'finished' event
      const onAnimationFinished = () => {
        mixer.current.removeEventListener("finished", onAnimationFinished);
        playRandomAnimation();
      };

      mixer.current.addEventListener("finished", onAnimationFinished);

      // Cleanup for this specific animation
      return () => {
        if (mixer.current) {
          mixer.current.removeEventListener("finished", onAnimationFinished);
        }
      };
    };

    // Start first animation
    const cleanup = playRandomAnimation();

    // Cleanup
    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }
      if (cleanup) cleanup();
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


      <Environment files="/ballroom_1k.hdr" background />

      <Trophy />

      <CameraAnimations />

      <EffectComposer>
        <DepthOfField focusDistance={0.03} focalLength={0.1} bokehScale={5} />
      </EffectComposer>
    </>
  );
}

export default TrophyScene;
