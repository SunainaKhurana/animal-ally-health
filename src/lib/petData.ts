export const dogBreeds = [
  "Golden Retriever",
  "Labrador Retriever",
  "German Shepherd",
  "French Bulldog",
  "Bulldog",
  "Poodle",
  "Toy Poodle",
  "Beagle",
  "Rottweiler",
  "Yorkshire Terrier",
  "Dachshund",
  "Siberian Husky",
  "Border Collie",
  "Boston Terrier",
  "Shih Tzu",
  "Cocker Spaniel",
  "Mixed Breed",
  "Other"
];

export const catBreeds = [
  "Domestic Shorthair",
  "Domestic Longhair",
  "Persian",
  "Maine Coon",
  "Siamese",
  "Ragdoll",
  "British Shorthair",
  "Abyssinian",
  "Russian Blue",
  "Scottish Fold",
  "Sphynx",
  "Bengal",
  "Mixed Breed",
  "Other"
];

export const vaccinationSchedules = {
  dog: {
    "DHPP": { interval: 12, name: "Distemper, Hepatitis, Parvovirus, Parainfluenza" },
    "Rabies": { interval: 12, name: "Rabies" },
    "Bordetella": { interval: 12, name: "Kennel Cough" },
    "Lyme": { interval: 12, name: "Lyme Disease" }
  },
  cat: {
    "FVRCP": { interval: 12, name: "Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia" },
    "Rabies": { interval: 12, name: "Rabies" },
    "FeLV": { interval: 12, name: "Feline Leukemia" }
  }
};
