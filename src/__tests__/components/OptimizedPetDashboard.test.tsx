import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import OptimizedPetDashboard from '@/components/pet-zone/OptimizedPetDashboard';
import { usePetContext } from '@/contexts/PetContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useOptimizedActivityData } from '@/hooks/useOptimizedActivityData';

// Mock the hooks
jest.mock('@/contexts/PetContext');
jest.mock('@/hooks/useDashboardData');
jest.mock('@/hooks/useOptimizedActivityData');

const mockUsePetContext = usePetContext as jest.MockedFunction<typeof usePetContext>;
const mockUseDashboardData = useDashboardData as jest.MockedFunction<typeof useDashboardData>;
const mockUseOptimizedActivityData = useOptimizedActivityData as jest.MockedFunction<typeof useOptimizedActivityData>;

const MockedComponent = () => (
  <BrowserRouter>
    <OptimizedPetDashboard />
  </BrowserRouter>
);

describe('OptimizedPetDashboard', () => {
  beforeEach(() => {
    mockUseDashboardData.mockReturnValue({
      dashboardData: {
        healthStatus: 'good',
        recentActivities: [],
        weeklyActivity: [],
        hasActivity: true,
        healthReports: 0,
        lastCheckup: null,
        upcomingReminders: 0
      },
      loading: false
    });

    mockUseOptimizedActivityData.mockReturnValue({
      activities: [],
      loading: false,
      showWeekly: false,
      refresh: jest.fn()
    });
  });

  it('renders good health message correctly', () => {
    const mockPet = {
      id: 'pet1',
      name: 'Disney',
      type: 'dog' as const,
      dateOfBirth: new Date('2020-01-01'),
      weight: 25,
      gender: 'male' as const
    };

    mockUsePetContext.mockReturnValue({
      selectedPet: mockPet,
      pets: [mockPet],
      loading: false,
      error: null,
      addPet: jest.fn(),
      updatePet: jest.fn(),
      deletePet: jest.fn(),
      refetchPets: jest.fn(),
      retry: jest.fn(),
      setSelectedPet: jest.fn()
    });

    render(<MockedComponent />);

    expect(screen.getByText('Good afternoon!')).toBeInTheDocument();
    expect(screen.getByText('Disney is in excellent health with all vitals in normal range')).toBeInTheDocument();
  });

  it('renders unknown health status message correctly', () => {
    const mockPet = {
      id: 'pet1',
      name: 'Disney',
      type: 'dog' as const,
      dateOfBirth: new Date('2020-01-01'),
      weight: 25,
      gender: 'male' as const
    };

    mockUsePetContext.mockReturnValue({
      selectedPet: mockPet,
      pets: [mockPet],
      loading: false,
      error: null,
      addPet: jest.fn(),
      updatePet: jest.fn(),
      deletePet: jest.fn(),
      refetchPets: jest.fn(),
      retry: jest.fn(),
      setSelectedPet: jest.fn()
    });

    // Update dashboard data to have unknown health status
    mockUseDashboardData.mockReturnValue({
      dashboardData: {
        healthStatus: 'unknown',
        recentActivities: [],
        weeklyActivity: [],
        hasActivity: true,
        healthReports: 0,
        lastCheckup: null,
        upcomingReminders: 0
      },
      loading: false
    });

    render(<MockedComponent />);

    expect(screen.getByText('Disney is in good health')).toBeInTheDocument();
  });

  it('renders no pets state correctly', () => {
    mockUsePetContext.mockReturnValue({
      selectedPet: null,
      pets: [],
      loading: false,
      error: null,
      addPet: jest.fn(),
      updatePet: jest.fn(),
      deletePet: jest.fn(),
      refetchPets: jest.fn(),
      retry: jest.fn(),
      setSelectedPet: jest.fn()
    });

    render(<MockedComponent />);

    expect(screen.getByText('Welcome to Pet Zone!')).toBeInTheDocument();
    expect(screen.getByText('Add Your First Pet')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    mockUsePetContext.mockReturnValue({
      selectedPet: null,
      pets: [],
      loading: false,
      error: 'Failed to load pets',
      addPet: jest.fn(),
      updatePet: jest.fn(),
      deletePet: jest.fn(),
      refetchPets: jest.fn(),
      retry: jest.fn(),
      setSelectedPet: jest.fn()
    });

    render(<MockedComponent />);

    expect(screen.getByText('Failed to load pets')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});