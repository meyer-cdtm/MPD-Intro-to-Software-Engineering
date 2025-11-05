# Front Loader Control API

This document describes how to programmatically control the front loader on the farm grid.

## Current Features

- **100x100 Farm Grid**: The front loader operates on a grid with coordinates from (0,0) to (99,99)
- **Automatic Animation**: The loader currently drives in a rectangular pattern automatically
- **Fork Control**: The fork automatically lifts and lowers during operation
- **Real-time Display**: Position, direction, and fork status are displayed in real-time

## Future API Control (Programmable Interface)

### REST API Endpoints

#### Get Loader Status
```bash
GET /api/loader
```

Response:
```json
{
  "position": { "x": 10, "y": 10 },
  "direction": "right",
  "forkLifted": false,
  "status": "ready",
  "timestamp": "2025-11-05T20:00:00.000Z"
}
```

#### Control Loader
```bash
POST /api/loader
Content-Type: application/json

{
  "action": "move",
  "direction": "right",
  "steps": 5
}
```

Available actions:
- `move` - Move the loader in a direction
- `lift` - Lift the fork
- `lower` - Lower the fork
- `status` - Get current status

### Using the React Hook (for custom UI controls)

```typescript
import { useLoaderController } from './app/components/LoaderController';

function CustomControls() {
  const { loaderState, moveLoader, setForkLifted } = useLoaderController();

  return (
    <div>
      <button onClick={() => moveLoader('up', 1)}>Move Up</button>
      <button onClick={() => moveLoader('down', 1)}>Move Down</button>
      <button onClick={() => moveLoader('left', 1)}>Move Left</button>
      <button onClick={() => moveLoader('right', 1)}>Move Right</button>
      <button onClick={() => setForkLifted(true)}>Lift Fork</button>
      <button onClick={() => setForkLifted(false)}>Lower Fork</button>

      <div>
        Position: ({loaderState.x}, {loaderState.y})
        Fork: {loaderState.forkLifted ? 'Lifted' : 'Down'}
      </div>
    </div>
  );
}
```

### Programmatic Control Examples

#### Example 1: Move in a Square Pattern
```typescript
const controller = useLoaderController();

// Move right 20 steps
for (let i = 0; i < 20; i++) {
  controller.moveLoader('right', 1);
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Move down 20 steps
for (let i = 0; i < 20; i++) {
  controller.moveLoader('down', 1);
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Move left 20 steps
for (let i = 0; i < 20; i++) {
  controller.moveLoader('left', 1);
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Move up 20 steps
for (let i = 0; i < 20; i++) {
  controller.moveLoader('up', 1);
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

#### Example 2: Pick Up and Move Items
```typescript
const controller = useLoaderController();

// Move to item location
controller.setPosition(30, 40);

// Lower fork
controller.setForkLifted(false);
await new Promise(resolve => setTimeout(resolve, 500));

// Lift fork (picking up item)
controller.setForkLifted(true);
await new Promise(resolve => setTimeout(resolve, 500));

// Move to destination
controller.setPosition(60, 80);

// Lower fork (dropping item)
controller.setForkLifted(false);
```

## Grid Coordinate System

- Origin (0,0) is at the top-left corner
- X increases to the right (0-99)
- Y increases downward (0-99)
- The loader occupies approximately 4x3 cells

## Future Enhancements

- [ ] WebSocket connection for real-time control
- [ ] Command queuing system
- [ ] Collision detection
- [ ] Multiple loaders
- [ ] Path planning algorithms
- [ ] Obstacle avoidance
- [ ] Load/unload simulation with items
- [ ] Performance metrics and analytics
- [ ] Historical movement data
- [ ] Python/JavaScript SDK for easier integration

## Integration with External Systems

The API is designed to be integrated with:
- IoT devices
- Machine learning models
- Scheduling systems
- Warehouse management systems
- Custom automation scripts
