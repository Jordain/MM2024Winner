import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';

function Trophy() {
  const { scene } = useGLTF('/untitled.glb');
  const trophyRef = useRef();
  
  return (
    <primitive
      ref={trophyRef}
      object={scene}
      scale={1.5}
      rotation={[0, Math.PI / 4, 0]}
      castShadow
      receiveShadow
    />
  );
}

function AnimatedCamera() {
  const { camera } = useThree();
  const gltf = useGLTF('/untitled.glb');
  const animations = gltf.animations;
  const mixer = useRef(null);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);

  useEffect(() => {

    const { scene } = gltf;
    console.log('GLTF Scene:', scene);
    // Log all available animations for debugging
    console.log('Available Animations:', animations.map(anim => anim.name));

    if (!animations || animations.length === 0) {
      console.warn('No camera animations found in the GLTF file.');
      return;
    }

    // Find camera animations specifically
    const cameraAnimations = animations.filter((clip) => 
      clip.tracks.some((track) => track.name.startsWith('Cam')) // Check for camera-related tracks
    );

    if (!cameraAnimations || cameraAnimations.length === 0) {
      console.warn('No specific camera animations found in the GLTF file.');
      console.log('All tracks:', animations.flatMap(anim => anim.tracks.map(track => track.name)));
      return;
    }

    console.log('Camera Animations:', cameraAnimations);

    // Access the camera object from the GLTF scene (Assuming it's named Cam1, Cam2, etc.)
    const cameraObject = gltf.scene.getObjectByName('Camera');  // Update with the correct camera name if necessary

    if (!cameraObject) {
      console.error('Camera object not found in the GLTF scene!');
      return;
    }

    // Create mixer for the camera object
    mixer.current = new THREE.AnimationMixer(cameraObject);

    const playNextAnimation = () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }

      const nextIndex = 
        (currentAnimationIndex + Math.floor(Math.random() * (cameraAnimations.length - 1)) + 1) % 
        cameraAnimations.length;
      
      const clip = cameraAnimations[nextIndex];
      setCurrentAnimationIndex(nextIndex);

      if (clip) {
        try {
          // Try to create an action for the camera
          const action = mixer.current.clipAction(clip);
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
          action.play();

          console.log('Playing animation:', clip.name);
        } catch (error) {
          console.error('Error playing animation:', error);
        }
      }
    };

    // Start first animation
    playNextAnimation();

    // Set up event listener for animation completion
    const onAnimationComplete = () => {
      playNextAnimation();
    };

    mixer.current.addEventListener('finished', onAnimationComplete);

    // Cleanup function
    return () => {
      if (mixer.current) {
        mixer.current.removeEventListener('finished', onAnimationComplete);
        mixer.current.stopAllAction();
        mixer.current.uncacheRoot(cameraObject);
      }
    };
  }, [animations, camera, currentAnimationIndex, gltf]);

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
      
      <AnimatedCamera />
      
      <EffectComposer>
        <DepthOfField focusDistance={0.02} focalLength={0.1} bokehScale={2} />
      </EffectComposer>
    </>
  );
}

export default TrophyScene;