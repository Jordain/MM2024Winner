import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
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
  const cameraAnimations = useMemo(
    () => [
      // Circular orbit around trophy
      // Circular orbit around trophy (slow)
      (cam) => {
        return new THREE.AnimationClip("CircularOrbit", 6, [
          new THREE.VectorKeyframeTrack(
            ".position",
            [0, 6], //0 is zero seconds in, 5 is 5 seconds in, 10 is 10 seconds in
            [
              2,
              1,
              8, //x, y, z(really y) at 0 zero seconds
              5,
              2.5,
              -1, //x, y, z at 10 seconds
            ]
          ),
          new THREE.QuaternionKeyframeTrack(
            ".quaternion",
            [0, 6], //(time rotation)
            [
              0,
              0.055,
              0,
              1, //x, y, z, w
              0,
              0.7771,
              0,
              0.7071,
            ]
          ),
        ]);
      },

      // Side sweep
      (cam) => {
        return new THREE.AnimationClip("CrazyAngle", 6, [
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
      },

      // Low angle dramatic
      (cam) => {
        return new THREE.AnimationClip("DownSweepSlow", 6, [
          new THREE.VectorKeyframeTrack(
            ".position",
            [0, 6], //0 is zero seconds in, 5 is 5 seconds in, 10 is 10 seconds in
            [
              -.2,
              2.5,
              5, //x, y, z(really y) at 0 zero seconds
              3.8,
              1.2,
              2, //x, y, z at 10 seconds
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
              .45,
              0,
              1,
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
              3, //x, y, z(really y) at 0 zero seconds
              2.4,
              0.75,
              2, //x, y, z at 10 seconds
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
              2.2, //x, y, z(really y) at 0 zero seconds
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
              0.55,
              0.25,
              1.55,
            ]
          ),
        ]);
      },
    ],
    []
  );

  // Wrap the animation logic in a stable callback
  const playRandomAnimation = useCallback(
    (prevIndex) => {
      if (!mixer.current) return null;

      mixer.current.stopAllAction();

      // If we've used all animations, reset the order
      if (animationOrderRef.current.length === 0) {
        animationOrderRef.current = cameraAnimations.map((_, index) => index);
      }

      // Remove the current animation index from available options
      const availableIndices = animationOrderRef.current.filter(
        (index) => index !== prevIndex
      );

      // Ensure we have available indices
      if (availableIndices.length === 0) {
        console.error("No available animations");
        return null;
      }

      // Randomly select an index from available indices
      const randomIndexPosition = Math.floor(
        Math.random() * availableIndices.length
      );
      const newAnimationIndex = availableIndices[randomIndexPosition];

      // Validate the animation selection
      const randomAnimation = cameraAnimations[newAnimationIndex];
      if (typeof randomAnimation !== "function") {
        console.error("Invalid animation selected", {
          newAnimationIndex,
          randomAnimation,
          availableIndices,
          prevIndex,
        });
        return null;
      }

      // Remove the selected index from the order
      animationOrderRef.current = animationOrderRef.current.filter(
        (index) => index !== newAnimationIndex
      );

      // Play the selected animation
      const clip = randomAnimation(camera);
      const action = mixer.current.clipAction(clip);

      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.play();

      return newAnimationIndex;
    },
    [camera, cameraAnimations]
  );

  useEffect(() => {
    // Create mixer only once
    mixer.current = new THREE.AnimationMixer(camera);

    // Start first animation
    const initialIndex = playRandomAnimation(null);
    setCurrentAnimationIndex(initialIndex);

    // Setup animation finished event
    const onAnimationFinished = (e) => {
      const newIndex = playRandomAnimation(currentAnimationIndex);
      if (newIndex !== null) {
        setCurrentAnimationIndex(newIndex);
      }
    };

    mixer.current.addEventListener("finished", onAnimationFinished);

    // Cleanup
    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
        mixer.current.removeEventListener("finished", onAnimationFinished);
      }
    };
  }, [playRandomAnimation, currentAnimationIndex, camera]);

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
