'use client';

interface FrontLoaderProps {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  forkLifted: boolean;
  cellSize: number;
}

export default function FrontLoader({ x, y, direction, forkLifted, cellSize }: FrontLoaderProps) {
  // Calculate rotation based on direction
  // The bucket is at the LEFT side (left: -5%), so in unrotated state it faces LEFT
  // We need to rotate so bucket points in the direction of travel
  const rotationMap = {
    left: 0,     // Bucket naturally points left (no rotation)
    down: -90,   // Rotate 90° counter-clockwise to point down
    right: 180,  // Rotate 180° to point right
    up: 90,      // Rotate 90° clockwise to point up
  };

  const rotation = rotationMap[direction];

  // Size of the loader (spans multiple cells) - made larger and more realistic
  const loaderWidth = cellSize * 5;
  const loaderHeight = cellSize * 4;

  return (
    <div
      className="absolute transition-all duration-100 ease-linear"
      style={{
        left: `${x * cellSize}px`,
        top: `${y * cellSize}px`,
        width: `${loaderWidth}px`,
        height: `${loaderHeight}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
      }}
    >
      {/* Front Loader Body */}
      <div className="relative w-full h-full">
        {/* Loader Arm (hydraulic arm connecting bucket to body) */}
        <div
          className="absolute transition-all duration-300 bg-gradient-to-b from-gray-600 to-gray-700 rounded-sm z-10"
          style={{
            left: '15%',
            top: forkLifted ? '15%' : '35%',
            width: '8%',
            height: forkLifted ? '25%' : '15%',
            transformOrigin: 'bottom center',
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-800 rounded-full border border-gray-400"></div>
        </div>

        {/* Bucket/Fork (front part) - more realistic bucket shape */}
        <div
          className="absolute transition-all duration-300 z-20"
          style={{
            left: '-5%',
            top: forkLifted ? '8%' : '38%',
            width: '40%',
            height: '22%',
          }}
        >
          {/* Bucket body */}
          <div className="relative w-full h-full">
            {/* Bucket main part */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-tl-lg rounded-bl-sm border-2 border-gray-700"
                 style={{ clipPath: 'polygon(0 30%, 15% 20%, 100% 20%, 100% 100%, 0 100%)' }}>
            </div>
            {/* Bucket teeth */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-around" style={{ height: '20%' }}>
              <div className="w-1 bg-gray-700 rounded-b"></div>
              <div className="w-1 bg-gray-700 rounded-b"></div>
              <div className="w-1 bg-gray-700 rounded-b"></div>
              <div className="w-1 bg-gray-700 rounded-b"></div>
            </div>
            {/* Hydraulic connection point */}
            <div className="absolute right-0 top-1/3 w-2 h-2 bg-gray-800 rounded-full border border-yellow-400"></div>
          </div>
        </div>

        {/* Main Body/Chassis */}
        <div
          className="absolute bg-gradient-to-br from-sky-300 via-blue-400 to-blue-500 border-2 border-blue-600 rounded-lg shadow-lg"
          style={{
            left: '20%',
            top: '25%',
            width: '50%',
            height: '50%',
          }}
        >
          {/* Body panels detailing */}
          <div className="absolute inset-1 border border-blue-300/30 rounded"></div>
          {/* Radiator grill */}
          <div className="absolute left-0 top-1/3 w-1 h-1/3 bg-gray-700 flex flex-col justify-around">
            <div className="w-full h-px bg-gray-500"></div>
            <div className="w-full h-px bg-gray-500"></div>
            <div className="w-full h-px bg-gray-500"></div>
          </div>
        </div>

        {/* Cab (driver compartment) */}
        <div
          className="absolute bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 border-2 border-blue-700 rounded-md shadow-inner z-10"
          style={{
            left: '35%',
            top: '8%',
            width: '30%',
            height: '45%',
          }}
        >
          {/* Windshield */}
          <div className="absolute top-1 left-1 right-1 h-2/5 bg-gradient-to-b from-cyan-100 to-blue-200 rounded-sm border border-blue-400/50"></div>
          {/* Side window */}
          <div className="absolute top-1 right-1 w-1/4 h-3/5 bg-gradient-to-br from-cyan-100 to-blue-200 rounded-sm border-l border-blue-400/50"></div>
          {/* Door line */}
          <div className="absolute left-1/3 top-2 bottom-1 w-px bg-blue-700"></div>
          {/* Side mirror */}
          <div className="absolute left-0 top-1/3 -translate-x-full w-1 h-1 bg-gray-700 rounded-full"></div>
        </div>

        {/* Engine Hood */}
        <div
          className="absolute bg-gradient-to-br from-sky-300 via-blue-400 to-blue-500 border-2 border-blue-600 rounded-md"
          style={{
            right: '5%',
            top: '28%',
            width: '25%',
            height: '45%',
          }}
        >
          {/* Hood vents */}
          <div className="absolute top-1 left-1 right-1 space-y-px">
            <div className="w-full h-px bg-blue-700/50"></div>
            <div className="w-full h-px bg-blue-700/50"></div>
          </div>
          {/* Exhaust pipe */}
          <div className="absolute -top-1 right-1 w-1 h-3 bg-gradient-to-t from-gray-800 to-gray-600 rounded-t-full"></div>
        </div>

        {/* Front Wheel (larger, more realistic) */}
        <div
          className="absolute z-0"
          style={{
            left: '22%',
            bottom: '-8%',
            width: `${cellSize * 1.8}px`,
            height: `${cellSize * 1.8}px`,
          }}
        >
          {/* Tire */}
          <div className="w-full h-full bg-gray-900 rounded-full border-4 border-gray-700 relative">
            {/* Rim */}
            <div className="absolute inset-2 bg-gray-600 rounded-full border-2 border-gray-500"></div>
            {/* Center cap */}
            <div className="absolute inset-1/3 bg-gray-400 rounded-full"></div>
            {/* Tire treads */}
            <div className="absolute inset-0 rounded-full" style={{
              background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.3) 65%, transparent 65%)',
            }}></div>
          </div>
        </div>

        {/* Rear Wheel (larger, more realistic) */}
        <div
          className="absolute z-0"
          style={{
            right: '8%',
            bottom: '-8%',
            width: `${cellSize * 1.8}px`,
            height: `${cellSize * 1.8}px`,
          }}
        >
          {/* Tire */}
          <div className="w-full h-full bg-gray-900 rounded-full border-4 border-gray-700 relative">
            {/* Rim */}
            <div className="absolute inset-2 bg-gray-600 rounded-full border-2 border-gray-500"></div>
            {/* Center cap */}
            <div className="absolute inset-1/3 bg-gray-400 rounded-full"></div>
            {/* Tire treads */}
            <div className="absolute inset-0 rounded-full" style={{
              background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.3) 65%, transparent 65%)',
            }}></div>
          </div>
        </div>


        {/* Headlight */}
        <div className="absolute left-0 top-1/2 w-1 h-1 bg-yellow-300 rounded-full" style={{ boxShadow: '0 0 4px rgba(255,255,100,0.8)' }}></div>
      </div>
    </div>
  );
}
