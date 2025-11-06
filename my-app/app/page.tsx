'use client';

import { useState, useEffect } from 'react';
import MakerspaceSelector from '@/components/MakerspaceSelector';
import SpaceCard from '@/components/SpaceCard';
import EventFeed from '@/components/EventFeed';
import StatsCard from '@/components/StatsCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { generateMakerspaces, getRandomSpaceStatus, getRandomUserName, getRandomMaterial, getRandomAccessArea } from '@/lib/data-generator';
import { Makerspace, Event, SpaceStatus } from '@/types/makerspace';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [makerspaces, setMakerspaces] = useState<Makerspace[]>([]);
  const [selectedMakerspaceId, setSelectedMakerspaceId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 20000);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const handleTodo1 = () => {
    showToast('TODO 1: Implement authentication to protect this interface. Add login/signup functionality and route protection.');
  };

  const handleTodo2 = () => {
    showToast('TODO 2: Download Excel file showing system logs from object storage.');
  };

  const handleTodo3 = () => {
    showToast('TODO 3: Visualize system logs and use machine information from Excel to update the visualization. Parse Excel data and render dynamic charts.');
  };

  // Initialize makerspaces
  useEffect(() => {
    const spaces = generateMakerspaces();
    setMakerspaces(spaces);
    if (spaces.length > 0) {
      setSelectedMakerspaceId(spaces[0].id);
    }
  }, []);

  // Simulate all makerspace events
  useEffect(() => {
    if (!selectedMakerspaceId) return;

    const interval = setInterval(() => {
      setMakerspaces((prevSpaces) => {
        const selectedSpace = prevSpaces.find(s => s.id === selectedMakerspaceId);
        if (!selectedSpace) return prevSpaces;

        // Event distribution: 35% space status, 25% user request, 25% access, 15% material
        const eventTypeRoll = Math.random();

        if (eventTypeRoll < 0.35) {
          // SPACE STATUS CHANGE
          const randomSpaceIndex = Math.floor(Math.random() * selectedSpace.floorPlan.spaces.length);
          const space = selectedSpace.floorPlan.spaces[randomSpaceIndex];

          const newStatus = getRandomSpaceStatus();
          const oldStatus = space.status;

          if (newStatus !== oldStatus) {
            const event: Event = {
              id: `event-${Date.now()}-${Math.random()}`,
              makerspaceId: selectedSpace.id,
              makerspaceName: selectedSpace.name,
              spaceId: space.id,
              spaceName: space.name,
              type: 'space_status_change',
              message: `${space.name} status: ${oldStatus} → ${newStatus}`,
              timestamp: new Date(),
              status: newStatus,
            };

            setEvents((prev) => [event, ...prev].slice(0, 50));

            // Update space status
            return prevSpaces.map((ms) => {
              if (ms.id === selectedMakerspaceId) {
                return {
                  ...ms,
                  floorPlan: {
                    ...ms.floorPlan,
                    spaces: ms.floorPlan.spaces.map((s, idx) => {
                      if (idx === randomSpaceIndex) {
                        return {
                          ...s,
                          status: newStatus,
                          lastUpdate: new Date(),
                        };
                      }
                      return s;
                    }),
                  },
                };
              }
              return ms;
            });
          }
        } else if (eventTypeRoll < 0.60) {
          // USER REQUEST
          const userName = getRandomUserName();
          const requestTypes = ['Equipment Request', 'Space Booking', 'Technical Support', 'Training Session', 'Consultation'];
          const requestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];

          const requestEvent: Event = {
            id: `event-${Date.now()}-${Math.random()}`,
            makerspaceId: selectedSpace.id,
            makerspaceName: selectedSpace.name,
            type: 'user_request',
            message: `${requestType} submitted`,
            timestamp: new Date(),
            userName,
          };

          setEvents((prev) => [requestEvent, ...prev].slice(0, 50));

          return prevSpaces.map((ms) => {
            if (ms.id === selectedMakerspaceId) {
              return {
                ...ms,
                userRequests: ms.userRequests + 1,
              };
            }
            return ms;
          });
        } else if (eventTypeRoll < 0.85) {
          // ACCESS CONTROL
          const userName = getRandomUserName();
          const area = getRandomAccessArea();
          const accessGranted = Math.random() > 0.15;

          const accessEvent: Event = {
            id: `event-${Date.now()}-${Math.random()}`,
            makerspaceId: selectedSpace.id,
            makerspaceName: selectedSpace.name,
            type: accessGranted ? 'access_granted' : 'access_denied',
            message: accessGranted
              ? `Access granted: ${area}`
              : `Access denied: ${area} - Credentials required`,
            timestamp: new Date(),
            userName,
          };

          setEvents((prev) => [accessEvent, ...prev].slice(0, 50));
        } else {
          // MATERIAL ORDERING
          const material = getRandomMaterial();
          const userName = getRandomUserName();
          const quantity = Math.floor(Math.random() * 10) + 1;
          const orderTypeRoll = Math.random();

          let orderEvent: Event;

          if (orderTypeRoll < 0.4) {
            orderEvent = {
              id: `event-${Date.now()}-${Math.random()}`,
              makerspaceId: selectedSpace.id,
              makerspaceName: selectedSpace.name,
              type: 'material_ordered',
              message: `Order placed: ${quantity}x ${material}`,
              timestamp: new Date(),
              userName,
              material,
            };

            return prevSpaces.map((ms) => {
              if (ms.id === selectedMakerspaceId) {
                setEvents((prev) => [orderEvent, ...prev].slice(0, 50));
                return {
                  ...ms,
                  pendingOrders: ms.pendingOrders + 1,
                };
              }
              return ms;
            });
          } else if (orderTypeRoll < 0.7) {
            orderEvent = {
              id: `event-${Date.now()}-${Math.random()}`,
              makerspaceId: selectedSpace.id,
              makerspaceName: selectedSpace.name,
              type: 'material_approved',
              message: `Order approved: ${quantity}x ${material}`,
              timestamp: new Date(),
              material,
            };
            setEvents((prev) => [orderEvent, ...prev].slice(0, 50));
          } else {
            orderEvent = {
              id: `event-${Date.now()}-${Math.random()}`,
              makerspaceId: selectedSpace.id,
              makerspaceName: selectedSpace.name,
              type: 'material_delivered',
              message: `Delivered: ${quantity}x ${material}`,
              timestamp: new Date(),
              material,
            };

            return prevSpaces.map((ms) => {
              if (ms.id === selectedMakerspaceId) {
                setEvents((prev) => [orderEvent, ...prev].slice(0, 50));
                return {
                  ...ms,
                  pendingOrders: Math.max(ms.pendingOrders - 1, 0),
                };
              }
              return ms;
            });
          }
        }

        return prevSpaces;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedMakerspaceId]);

  const selectedMakerspace = makerspaces.find((m) => m.id === selectedMakerspaceId);

  const getStats = () => {
    if (!selectedMakerspace) return { available: 0, occupied: 0, maintenance: 0 };

    return selectedMakerspace.floorPlan.spaces.reduce(
      (acc, space) => {
        acc[space.status]++;
        return acc;
      },
      { available: 0, occupied: 0, maintenance: 0 } as Record<SpaceStatus, number>
    );
  };

  const stats = getStats();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Modern SaaS Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                <img
                  src="/SmartFab.png"
                  alt="SmartFab Logo"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  SmartFab
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Intelligent Makerspace Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTodo1}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-md transition-colors"
                >
                  Todo 1
                </button>
                <button
                  onClick={handleTodo2}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg shadow-md transition-colors"
                >
                  Todo 2
                </button>
                <button
                  onClick={handleTodo3}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold rounded-lg shadow-md transition-colors"
                >
                  Todo 3
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-lg shadow-emerald-500/30">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-white">
                    Live Monitoring
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
                    {user?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-semibold rounded-lg shadow-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location Selector */}
        <div className="mb-8">
          <MakerspaceSelector
            makerspaces={makerspaces}
            selectedId={selectedMakerspaceId}
            onSelect={setSelectedMakerspaceId}
          />
        </div>

        {selectedMakerspace ? (
          <>
            {/* Floor Plan Info Banner */}
            <div className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{selectedMakerspace.name}</h2>
                  <p className="text-blue-100 text-sm">
                    {selectedMakerspace.floorPlan.name} • {selectedMakerspace.location}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{selectedMakerspace.floorPlan.spaces.length}</div>
                  <div className="text-xs text-blue-100">Total Spaces</div>
                </div>
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <StatsCard
                title="Available"
                value={stats.available}
                icon="✅"
                color="text-emerald-600 dark:text-emerald-400"
              />
              <StatsCard
                title="In Use"
                value={stats.occupied}
                icon="🔵"
                color="text-blue-600 dark:text-blue-400"
              />
              <StatsCard
                title="Maintenance"
                value={stats.maintenance}
                icon="🔧"
                color="text-amber-600 dark:text-amber-400"
              />
              <StatsCard
                title="User Requests"
                value={selectedMakerspace.userRequests}
                icon="📋"
                color="text-purple-600 dark:text-purple-400"
              />
              <StatsCard
                title="Pending Orders"
                value={selectedMakerspace.pendingOrders}
                icon="📦"
                color="text-orange-600 dark:text-orange-400"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Floor Plan Grid */}
              <div className="lg:col-span-2">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <span className="text-2xl">🗺️</span>
                      Floor Plan
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                        {selectedMakerspace.floorPlan.name}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full capitalize">
                        {selectedMakerspace.floorPlan.buildingShape} Layout
                      </span>
                    </div>
                  </div>
                  {/* Floor Plan Background Container */}
                  <div className="relative p-6 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                    {/* Architectural Background based on building shape */}
                    {selectedMakerspace.floorPlan.buildingShape === 'rectangular' && (
                      <>
                        {/* Rectangular house with front yard */}
                        <div className="absolute inset-0 bg-green-100/30 dark:bg-green-900/10"></div>
                        <div className="absolute inset-x-8 top-1/4 bottom-8 bg-amber-50/40 dark:bg-amber-900/10 border-2 border-slate-300/40 dark:border-slate-600/40 rounded-sm"></div>
                        <div className="absolute left-1/3 right-1/3 bottom-8 h-12 bg-stone-200/30 dark:bg-stone-700/20 border border-slate-300/40 dark:border-slate-600/40"></div>
                        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-sky-100/20 to-transparent dark:from-sky-900/10"></div>
                        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="15%" cy="15%" r="15" fill="currentColor" className="text-green-600 dark:text-green-700" />
                          <circle cx="85%" cy="20%" r="18" fill="currentColor" className="text-green-600 dark:text-green-700" />
                        </svg>
                      </>
                    )}
                    {selectedMakerspace.floorPlan.buildingShape === 'l-shaped' && (
                      <>
                        {/* L-shaped house with side garden */}
                        <div className="absolute inset-0 bg-emerald-100/30 dark:bg-emerald-900/10"></div>
                        <div className="absolute left-8 top-8 w-2/3 h-1/2 bg-amber-50/40 dark:bg-amber-900/10 border-2 border-slate-300/40 dark:border-slate-600/40 rounded-sm"></div>
                        <div className="absolute left-8 top-1/2 w-1/3 bottom-8 bg-amber-50/40 dark:bg-amber-900/10 border-2 border-slate-300/40 dark:border-slate-600/40 rounded-sm"></div>
                        <div className="absolute right-8 bottom-8 w-1/3 h-1/3 bg-blue-100/20 dark:bg-blue-900/10 border border-dashed border-blue-400/30 dark:border-blue-600/20 rounded-sm"></div>
                        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="75%" cy="25%" r="12" fill="currentColor" className="text-emerald-600 dark:text-emerald-700" />
                          <circle cx="85%" cy="35%" r="14" fill="currentColor" className="text-emerald-600 dark:text-emerald-700" />
                          <circle cx="70%" cy="70%" r="10" fill="currentColor" className="text-emerald-600 dark:text-emerald-700" />
                        </svg>
                      </>
                    )}
                    {selectedMakerspace.floorPlan.buildingShape === 'u-shaped' && (
                      <>
                        {/* U-shaped house with courtyard */}
                        <div className="absolute inset-0 bg-teal-100/30 dark:bg-teal-900/10"></div>
                        <div className="absolute left-8 top-8 w-1/4 bottom-8 bg-amber-50/40 dark:bg-amber-900/10 border-2 border-slate-300/40 dark:border-slate-600/40 rounded-sm"></div>
                        <div className="absolute right-8 top-8 w-1/4 bottom-8 bg-amber-50/40 dark:bg-amber-900/10 border-2 border-slate-300/40 dark:border-slate-600/40 rounded-sm"></div>
                        <div className="absolute left-8 right-8 top-8 h-1/4 bg-amber-50/40 dark:bg-amber-900/10 border-2 border-slate-300/40 dark:border-slate-600/40 rounded-sm"></div>
                        <div className="absolute left-1/3 right-1/3 top-1/3 bottom-1/4 bg-green-200/30 dark:bg-green-900/20 border border-dashed border-green-500/30 dark:border-green-700/30 rounded-sm"></div>
                        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="50%" cy="55%" r="20" fill="currentColor" className="text-teal-600 dark:text-teal-700" />
                        </svg>
                      </>
                    )}
                    {selectedMakerspace.floorPlan.buildingShape === 't-shaped' && (
                      <>
                        {/* T-shaped house with front and back areas */}
                        <div className="absolute inset-0 bg-lime-100/30 dark:bg-lime-900/10"></div>
                        <div className="absolute left-1/4 right-1/4 top-8 h-2/5 bg-amber-50/40 dark:bg-amber-900/10 border-2 border-slate-300/40 dark:border-slate-600/40 rounded-sm"></div>
                        <div className="absolute left-8 right-8 top-2/5 bottom-8 bg-amber-50/40 dark:bg-amber-900/10 border-2 border-slate-300/40 dark:border-slate-600/40 rounded-sm"></div>
                        <div className="absolute left-0 right-0 bottom-0 h-16 bg-stone-200/30 dark:bg-stone-700/20 border-t border-slate-300/40 dark:border-slate-600/40"></div>
                        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="20%" cy="25%" r="14" fill="currentColor" className="text-lime-600 dark:text-lime-700" />
                          <circle cx="80%" cy="30%" r="16" fill="currentColor" className="text-lime-600 dark:text-lime-700" />
                          <rect x="45%" y="80%" width="40" height="8" fill="currentColor" className="text-stone-400 dark:text-stone-600" />
                        </svg>
                      </>
                    )}
                    {selectedMakerspace.floorPlan.buildingShape === 'open-plan' && (
                      <>
                        {/* Open-plan with garden surroundings */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-100/40 via-emerald-100/30 to-teal-100/30 dark:from-green-900/15 dark:via-emerald-900/10 dark:to-teal-900/10"></div>
                        <div className="absolute inset-12 bg-amber-50/30 dark:bg-amber-900/10 border-2 border-slate-300/40 dark:border-slate-600/40 rounded-sm shadow-inner"></div>
                        <div className="absolute inset-x-0 bottom-12 h-20 bg-stone-200/30 dark:bg-stone-700/20 border-t border-slate-300/40 dark:border-slate-600/40"></div>
                        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="15%" cy="20%" r="16" fill="currentColor" className="text-emerald-600 dark:text-emerald-700" />
                          <circle cx="85%" cy="25%" r="18" fill="currentColor" className="text-green-600 dark:text-green-700" />
                          <circle cx="90%" cy="70%" r="14" fill="currentColor" className="text-teal-600 dark:text-teal-700" />
                          <circle cx="12%" cy="75%" r="15" fill="currentColor" className="text-lime-600 dark:text-lime-700" />
                        </svg>
                      </>
                    )}

                    {/* Machine Grid - overlays the background */}
                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 z-10">
                      {selectedMakerspace.floorPlan.spaces.map((space) => (
                        <SpaceCard key={space.id} space={space} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="lg:col-span-1">
                <EventFeed events={events} />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Initializing SmartFab...
            </p>
          </div>
        )}
      </main>

      {/* Modern Footer */}
      <footer className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold">{makerspaces.length}</span> locations •
              <span className="font-semibold"> {makerspaces.reduce((acc, m) => acc + m.floorPlan.spaces.length, 0)}</span> machines monitored
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Powered by SmartFab Platform
            </p>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 max-w-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-2xl border border-blue-400/50 animate-slide-up z-50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">Assignment Details</h3>
              <p className="text-sm leading-relaxed text-blue-50">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}
