import { Makerspace, Space, SpaceStatus, FloorPlan } from '@/types/makerspace';

const MACHINE_TYPES = [
  '3D Printer',
  'Laser Cutter',
  'CNC Mill',
  'Vinyl Cutter',
  'Soldering Station',
  'PCB Mill',
  'Resin Printer',
  'Wood Router',
  'Heat Press',
  'Embroidery Machine'
];

const BUILDING_SHAPES = ['rectangular', 'l-shaped', 'u-shaped', 't-shaped', 'open-plan'] as const;

const FLOOR_PLAN_LAYOUTS = [
  'Open Layout',
  'Modular Design',
  'Industrial Setup',
  'Collaborative Space',
  'Hybrid Configuration'
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
  'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston',
  'Portland', 'Las Vegas', 'Detroit', 'Memphis', 'Louisville',
  'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Nashville',
  'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta',
  'Omaha', 'Colorado Springs', 'Raleigh', 'Miami', 'Oakland',
  'Minneapolis', 'Tulsa', 'Wichita', 'New Orleans', 'Arlington',
  'Cleveland', 'Bakersfield', 'Tampa', 'Aurora', 'Honolulu'
];

function generateFloorPlan(makerspaceId: string, layoutIndex: number): FloorPlan {
  const layoutType = FLOOR_PLAN_LAYOUTS[layoutIndex % FLOOR_PLAN_LAYOUTS.length];
  const buildingShape = BUILDING_SHAPES[layoutIndex % BUILDING_SHAPES.length];

  // Always exactly 10 machines
  const spaces: Space[] = Array.from({ length: 10 }, (_, i) => {
    const machineType = MACHINE_TYPES[i];
    return {
      id: `${makerspaceId}-machine-${i + 1}`,
      name: `${machineType} ${i + 1}`,
      type: machineType,
      status: 'available' as SpaceStatus,
      capacity: Math.floor(Math.random() * 4) + 1, // 1-4 capacity
      lastUpdate: new Date(),
      position: {
        x: (i % 5) * 20,
        y: Math.floor(i / 5) * 20
      }
    };
  });

  return {
    id: `${makerspaceId}-floorplan`,
    name: layoutType,
    buildingShape,
    spaces
  };
}

export function generateMakerspaces(): Makerspace[] {
  const makerspaces: Makerspace[] = [];

  for (let i = 1; i <= 400; i++) {
    const cityIndex = Math.floor((i - 1) / 8) % CITIES.length;
    const locationNumber = Math.floor((i - 1) / 8 / CITIES.length) + 1;
    const branchLetter = String.fromCharCode(65 + ((i - 1) % 8)); // A, B, C, etc.

    makerspaces.push({
      id: `makerspace-${i}`,
      name: `${CITIES[cityIndex]} Makerspace ${branchLetter}`,
      location: `${CITIES[cityIndex]}, Location ${locationNumber}`,
      floorPlan: generateFloorPlan(`makerspace-${i}`, i),
      userRequests: Math.floor(Math.random() * 50),
      pendingOrders: Math.floor(Math.random() * 10)
    });
  }

  return makerspaces;
}

const FIRST_NAMES = [
  'John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Chris', 'Amanda',
  'James', 'Lisa', 'Robert', 'Jennifer', 'William', 'Karen', 'Richard', 'Nancy'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'
];

const MATERIALS = [
  'PLA Filament', 'ABS Filament', 'Acrylic Sheet', 'Plywood', 'Solder Wire',
  'PCB Board', 'Resin', 'Wood Glue', 'Vinyl Roll', 'Thread Spools',
  'Brass Rod', 'Aluminum Sheet', 'Sandpaper Pack', 'Safety Glasses', 'Spray Paint'
];

const ACCESS_AREAS = [
  'Main Workshop', 'Electronics Lab', '3D Printing Room', 'Woodshop',
  'Metal Shop', 'Textile Lab', 'Storage Room', 'Conference Room'
];

export function getRandomSpaceStatus(): SpaceStatus {
  const rand = Math.random();
  if (rand < 0.6) return 'available'; // 60% available
  if (rand < 0.9) return 'occupied'; // 30% occupied
  return 'maintenance'; // 10% maintenance
}

export function getRandomUserName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

export function getRandomMaterial(): string {
  return MATERIALS[Math.floor(Math.random() * MATERIALS.length)];
}

export function getRandomAccessArea(): string {
  return ACCESS_AREAS[Math.floor(Math.random() * ACCESS_AREAS.length)];
}
