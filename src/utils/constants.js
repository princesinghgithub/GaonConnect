export const SERVICES = [
  { id: 1, name: 'Auto Rickshaw', icon: '🛺', basePrice: 50, perKm: 10, category: 'transport' },
  { id: 2, name: 'Bike Taxi', icon: '🏍️', basePrice: 30, perKm: 7, category: 'transport' },
  { id: 3, name: 'Car', icon: '🚗', basePrice: 100, perKm: 15, category: 'transport' },
  { id: 4, name: 'Tractor (Jutai)', icon: '🚜', basePrice: 500, perHour: 300, category: 'farming' },
  { id: 5, name: 'Wedding Car', icon: '💒', basePrice: 2000, perDay: 5000, category: 'events' },
  { id: 6, name: 'Goods Transport', icon: '🚚', basePrice: 200, perKm: 20, category: 'delivery' },
  { id: 7, name: 'Tempo', icon: '🚐', basePrice: 150, perKm: 12, category: 'transport' },
  { id: 8, name: 'JCB/Excavator', icon: '🏗️', basePrice: 1000, perHour: 800, category: 'construction' }
];

export const SAMPLE_PROVIDERS = [
  { 
    id: 1, 
    name: 'Ramesh Kumar', 
    vehicle: 'Auto (MP09 AB 1234)', 
    rating: 4.8, 
    trips: 450, 
    distance: 2.5, 
    status: 'available', 
    phone: '9876543210',
    earnings: 45000 
  },
  { 
    id: 2, 
    name: 'Suresh Patel', 
    vehicle: 'Bike (MP09 CD 5678)', 
    rating: 4.9, 
    trips: 320, 
    distance: 1.2, 
    status: 'available', 
    phone: '9876543211',
    earnings: 38000 
  },
  { 
    id: 3, 
    name: 'Mohan Singh', 
    vehicle: 'Tractor (John Deere)', 
    rating: 4.7, 
    trips: 180, 
    distance: 5.0, 
    status: 'busy', 
    phone: '9876543212',
    earnings: 67000 
  },
  { 
    id: 4, 
    name: 'Vijay Sharma', 
    vehicle: 'Car (MP09 EF 9012)', 
    rating: 4.6, 
    trips: 280, 
    distance: 3.8, 
    status: 'available', 
    phone: '9876543213',
    earnings: 52000 
  }
];

// export const TABS = [
//   { id: 'customer', label: 'Book Service', icon: '🎯' },
//   { id: 'tracking', label: 'Track', icon: '📍' },
//   { id: 'provider', label: 'Provider', icon: '🚗' },
//   { id: 'admin', label: 'Admin', icon: '📊' }
// ];

export const PROGRESS_STEPS = [
  { label: 'Booking Confirmed', time: '2 mins ago', done: true },
  { label: 'Driver Assigned', time: '1 min ago', done: true },
  { label: 'Driver Arriving', time: 'In progress', done: true },
  { label: 'Trip Started', time: 'Pending', done: false },
  { label: 'Reached Destination', time: 'Pending', done: false }
];