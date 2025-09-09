import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { OptimizedMedicationCard } from '@/components/medications/OptimizedMedicationCard';
import type { Prescription } from '@/hooks/useOptimizedPrescriptions';

describe('OptimizedMedicationCard', () => {
  const mockPrescription: Prescription = {
    id: '1',
    pet_id: 'pet1',
    user_id: 'user1',
    title: 'Test Medication',
    prescribed_date: '2025-01-01',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockOnMarkAsTaken = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders medication card with correct information', () => {
    render(
      <OptimizedMedicationCard 
        prescription={mockPrescription}
        onMarkAsTaken={mockOnMarkAsTaken}
      />
    );

    expect(screen.getByText('Test Medication')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('Mark as Taken')).toBeInTheDocument();
  });

  it('shows overdue badge when medication is overdue', () => {
    render(
      <OptimizedMedicationCard 
        prescription={mockPrescription}
        isOverdue={true}
        onMarkAsTaken={mockOnMarkAsTaken}
      />
    );

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('calls onMarkAsTaken when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <OptimizedMedicationCard 
        prescription={mockPrescription}
        onMarkAsTaken={mockOnMarkAsTaken}
      />
    );

    const markAsTakenButton = screen.getByText('Mark as Taken');
    await user.click(markAsTakenButton);

    expect(mockOnMarkAsTaken).toHaveBeenCalledWith('1', 'Test Medication');
  });

  it('displays last taken information when provided', () => {
    const lastTaken = '2025-01-02T10:00:00Z';
    
    render(
      <OptimizedMedicationCard 
        prescription={mockPrescription}
        lastTaken={lastTaken}
        onMarkAsTaken={mockOnMarkAsTaken}
      />
    );

    expect(screen.getByText(/Last taken:/)).toBeInTheDocument();
  });

  it('displays next due information when provided', () => {
    const nextDue = new Date('2025-01-03T10:00:00Z');
    
    render(
      <OptimizedMedicationCard 
        prescription={mockPrescription}
        nextDue={nextDue}
        onMarkAsTaken={mockOnMarkAsTaken}
      />
    );

    expect(screen.getByText(/Next due:/)).toBeInTheDocument();
  });

  it('applies correct status colors', () => {
    const { rerender } = render(
      <OptimizedMedicationCard 
        prescription={{ ...mockPrescription, status: 'completed' }}
        onMarkAsTaken={mockOnMarkAsTaken}
      />
    );

    let statusBadge = screen.getByText('completed');
    expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');

    rerender(
      <OptimizedMedicationCard 
        prescription={{ ...mockPrescription, status: 'active' }}
        onMarkAsTaken={mockOnMarkAsTaken}
      />
    );

    statusBadge = screen.getByText('active');
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
  });
});