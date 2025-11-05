export type SpaceStatus = 'available' | 'occupied' | 'maintenance';
export type AccessStatus = 'granted' | 'denied';
export type MaterialOrderStatus = 'pending' | 'approved' | 'delivered';

export interface Space {
  id: string;
  name: string;
  type: string;
  status: SpaceStatus;
  capacity: number;
  lastUpdate: Date;
  position?: { x: number; y: number };
}

export type BuildingShape = 'rectangular' | 'l-shaped' | 'u-shaped' | 't-shaped' | 'open-plan';

export interface FloorPlan {
  id: string;
  name: string;
  buildingShape: BuildingShape;
  spaces: Space[];
}

export interface AccessEvent {
  userId: string;
  userName: string;
  status: AccessStatus;
  area: string;
}

export interface MaterialOrder {
  id: string;
  material: string;
  quantity: number;
  requestedBy: string;
  status: MaterialOrderStatus;
}

export interface Makerspace {
  id: string;
  name: string;
  location: string;
  floorPlan: FloorPlan;
  userRequests: number;
  pendingOrders: number;
}

export interface Event {
  id: string;
  makerspaceId: string;
  makerspaceName: string;
  spaceId?: string;
  spaceName?: string;
  type: 'space_status_change' | 'automation_triggered' | 'alert' | 'access_granted' | 'access_denied' | 'material_ordered' | 'material_approved' | 'material_delivered' | 'user_request';
  message: string;
  timestamp: Date;
  status?: SpaceStatus;
  userName?: string;
  material?: string;
}
