
export const mockPets = [
  {
    id: "1",
    name: "Max",
    type: "dog" as const,
    breed: "Golden Retriever",
    dateOfBirth: new Date("2021-03-15"),
    weight: 65,
    gender: "male" as const,
    nextVaccination: "2024-08-15"
  },
  {
    id: "2",
    name: "Luna",
    type: "cat" as const,
    dateOfBirth: new Date("2022-01-10"),
    weight: 8.5,
    gender: "female" as const,
    nextVaccination: "2024-09-22"
  }
];
