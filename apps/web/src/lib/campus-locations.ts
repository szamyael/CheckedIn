export interface CampusBuilding {
  id: string;
  name: string;
  venueName: string;
  latitude: number;
  longitude: number;
}

export interface Campus {
  id: string;
  name: string;
  buildings: CampusBuilding[];
}

/** Preset campus venues — extend or replace for your institution. */
export const CAMPUS_LOCATIONS: Campus[] = [
  {
    id: "main",
    name: "Main Campus",
    buildings: [
      {
        id: "admin",
        name: "Administration Building",
        venueName: "Administration Building",
        latitude: 14.5995,
        longitude: 120.9842,
      },
      {
        id: "gym",
        name: "University Gymnasium",
        venueName: "University Gymnasium",
        latitude: 14.6008,
        longitude: 120.9855,
      },
      {
        id: "library",
        name: "Main Library",
        venueName: "Main Library",
        latitude: 14.5982,
        longitude: 120.9831,
      },
      {
        id: "auditorium",
        name: "University Auditorium",
        venueName: "University Auditorium",
        latitude: 14.6012,
        longitude: 120.9828,
      },
      {
        id: "student-center",
        name: "Student Center",
        venueName: "Student Center",
        latitude: 14.5976,
        longitude: 120.9861,
      },
    ],
  },
  {
    id: "north",
    name: "North Campus",
    buildings: [
      {
        id: "engineering",
        name: "Engineering Building",
        venueName: "Engineering Building",
        latitude: 14.6051,
        longitude: 120.9884,
      },
      {
        id: "ict",
        name: "ICT Center",
        venueName: "ICT Center",
        latitude: 14.6043,
        longitude: 120.9872,
      },
      {
        id: "labs",
        name: "Science Laboratories",
        venueName: "Science Laboratories",
        latitude: 14.6035,
        longitude: 120.9891,
      },
    ],
  },
  {
    id: "south",
    name: "South Campus",
    buildings: [
      {
        id: "coliseum",
        name: "Sports Coliseum",
        venueName: "Sports Coliseum",
        latitude: 14.5942,
        longitude: 120.9815,
      },
      {
        id: "field",
        name: "Athletic Field",
        venueName: "Athletic Field",
        latitude: 14.5931,
        longitude: 120.9802,
      },
      {
        id: "dorm",
        name: "Dormitory Quadrangle",
        venueName: "Dormitory Quadrangle",
        latitude: 14.5924,
        longitude: 120.9826,
      },
    ],
  },
];

export const DEFAULT_MAP_CENTER = {
  lat: 14.5995,
  lng: 120.9842,
};

export function findBuilding(campusId: string, buildingId: string) {
  const campus = CAMPUS_LOCATIONS.find((c) => c.id === campusId);
  return campus?.buildings.find((b) => b.id === buildingId) ?? null;
}
