
export const mockPets = [
  {
    id: "1",
    name: "Max",
    type: "dog" as const,
    breed: "Golden Retriever",
    age: 3,
    weight: 65,
    gender: "male" as const,
    nextVaccination: "2024-08-15"
  },
  {
    id: "2",
    name: "Luna",
    type: "cat" as const,
    age: 2,
    weight: 8.5,
    gender: "female" as const,
    nextVaccination: "2024-09-22"
  }
];
