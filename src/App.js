import { Canvas } from '@react-three/fiber';
import TrophyScene from './components/TrophyScene';
import './App.css';

function App() {
  return (
    <Canvas camera={{ position: [200, 50, 50], fov: 45 }}>
      <TrophyScene />
    </Canvas>
  );
}

export default App;

