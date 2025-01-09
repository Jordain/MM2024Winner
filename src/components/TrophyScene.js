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
      position={[0, 0, 0]}
      castShadow
      receiveShadow
    />
  );
}

function CameraAnimations() {
  const { camera, gl } = useThree();
  const mixer = useRef(null);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const currentAction = useRef(null);
  const isInitialized = useRef(false);
  
  const cameraAnimations = useMemo(
    () => [
      // Circular orbit
      (cam) => {
        return new THREE.AnimationClip("CircularOrbit", 6, [
          new THREE.VectorKeyframeTrack(
            ".position",
            [0, 6],
            [
              2, 1, 8,
              5, 2.5, -1,
            ]
          ),
          new THREE.QuaternionKeyframeTrack(
            ".quaternion",
            [0, 6],
            [
              0, 0.055, 0, 1,
              0, 0.7771, 0, 0.7071,
            ]
          ),
        ]);
      },
      // Side sweep
      (cam) => {
        return new THREE.AnimationClip("CrazyAngle", 6, [
          new THREE.VectorKeyframeTrack(
            ".position",
            [0, 6],
            [
              0, 0.5, 9,
              1.25, 0.55, 3.9,
            ]
          ),
          new THREE.QuaternionKeyframeTrack(
            ".quaternion",
            [0, 6],
            [
              0, 0, 0.5, 1,
              0.2, -0.01, 0.2, 0.9071,
            ]
          ),
        ]);
      },
      // Low angle dramatic
      (cam) => {
        return new THREE.AnimationClip("DownSweepSlow", 6, [
          new THREE.VectorKeyframeTrack(
            ".position",
            [0, 6],
            [
              -.2, 2.5, 5,
              3.8, 1.2, 2,
            ]
          ),
          new THREE.QuaternionKeyframeTrack(
            ".quaternion",
            [0, 6],
            [
              0, 0, 0, 0,
              0, .45, 0, 1,
            ]
          ),
        ]);
      },
      // High angle overview
      (cam) => {
        return new THREE.AnimationClip("SideName", 6, [
          new THREE.VectorKeyframeTrack(
            ".position",
            [0, 6],
            [
              1.5, 0.75, 3,
              2.4, 0.75, 2,
            ]
          ),
          new THREE.QuaternionKeyframeTrack(
            ".quaternion",
            [0, 6],
            [
              0, 0.21, 0, 1,
              0, 0.5, 0, 1,
            ]
          ),
        ]);
      },
      // Close-up dynamic
      (cam) => {
        return new THREE.AnimationClip("GoingUP", 6, [
          new THREE.VectorKeyframeTrack(
            ".position",
            [0, 6],
            [
              0.25, 0.8, 2.2,
              0.9, 2.2, 1,
            ]
          ),
          new THREE.QuaternionKeyframeTrack(
            ".quaternion",
            [0, 6],
            [
              0, 0, 0, 1,
              0.9, 0.55, 0.25, 1.55,
            ]
          ),
        ]);
      },
    ],
    []
  );

  // Initialize mixer once
  useEffect(() => {
    if (!isInitialized.current) {
      mixer.current = new THREE.AnimationMixer(camera);
      isInitialized.current = true;
    }
  }, [camera]);

  const playNextAnimation = useCallback(() => {
    if (!mixer.current) return;

    // Stop current action with a short fadeOut
    if (currentAction.current) {
      currentAction.current.fadeOut(0.2);
    }

    // Create and play new action
    const clip = cameraAnimations[currentAnimationIndex](camera);
    const action = mixer.current.clipAction(clip);
    
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = false;
    action.fadeIn(0.2);
    action.play();

    currentAction.current = action;

    // Immediately update the index for the next animation
    setCurrentAnimationIndex((prevIndex) => 
      (prevIndex + 1) % cameraAnimations.length
    );
  }, [camera, cameraAnimations, currentAnimationIndex]);

  // Setup event listeners
  useEffect(() => {
    const handleInteraction = () => {
      playNextAnimation();
    };

    const onFinished = (e) => {
      if (e.action === currentAction.current) {
        playNextAnimation();
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener('click', handleInteraction);
    canvas.addEventListener('touchend', handleInteraction);
    
    if (mixer.current) {
      mixer.current.addEventListener('finished', onFinished);
    }

    // Start first animation
    if (!currentAction.current && mixer.current) {
      playNextAnimation();
    }

    return () => {
      canvas.removeEventListener('click', handleInteraction);
      canvas.removeEventListener('touchend', handleInteraction);
      if (mixer.current) {
        mixer.current.removeEventListener('finished', onFinished);
      }
    };
  }, [gl, playNextAnimation]);

  // Animation update loop
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