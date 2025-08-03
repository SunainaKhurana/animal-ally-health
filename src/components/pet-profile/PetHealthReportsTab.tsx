
import HealthReportsHub from "@/components/health/HealthReportsHub";

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  breed?: string;
}

interface PetHealthReportsTabProps {
  petId: string;
  petInfo: Pet;
}

const PetHealthReportsTab = ({ petId, petInfo }: PetHealthReportsTabProps) => {
  return (
    <HealthReportsHub
      petId={petId}
      petInfo={{
        name: petInfo.name,
        type: petInfo.type,
        breed: petInfo.breed
      }}
    />
  );
};

export default PetHealthReportsTab;
