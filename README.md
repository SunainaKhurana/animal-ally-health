
# PetHealth - Mobile-First Pet Health Tracker

A comprehensive mobile-first application for dog and cat parents to track their pets' health records, vaccinations, and wellness data.

## Features

### MVP Features ✅
- **Multi-Pet Management**: Add and manage multiple pets (dogs and cats)
- **Pet Profiles**: Store pet type, breed, gender, age, weight, and photos
- **Vaccination Tracking**: Upload vaccination records with OCR extraction
- **Automatic Due Dates**: Calculate next vaccination dates based on standard schedules
- **Secure Authentication**: Supabase Auth integration (email, phone, Google, Apple)
- **Private Data**: Each user can only access their own pet data

### Planned Features 🚧
- Diagnostic test uploads and tracking
- Medication reminders and schedules
- Vet appointment management
- Health analytics and trends
- Multi-user family access
- Veterinarian portal integration
- Push notifications for reminders

## Technical Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Database + Authentication + Storage)
- **OCR**: Tesseract.js (client-side text extraction)
- **Mobile**: Responsive design with PWA capabilities

## Project Structure

```
src/
├── components/
│   ├── pets/
│   │   ├── PetCard.tsx              # Pet display card
│   │   ├── AddPetDialog.tsx         # Add new pet form
│   │   └── PetProfile.tsx           # Detailed pet view
│   ├── vaccinations/
│   │   ├── VaccinationUpload.tsx    # OCR upload component
│   │   ├── VaccinationList.tsx      # Vaccination history
│   │   └── VaccinationCard.tsx      # Individual vaccination record
│   ├── auth/
│   │   ├── AuthProvider.tsx         # Authentication context
│   │   ├── LoginForm.tsx            # Login/signup forms
│   │   └── ProtectedRoute.tsx       # Route protection
│   └── ui/                          # shadcn/ui components
├── lib/
│   ├── supabase.ts                  # Supabase client setup
│   ├── supabaseTypes.ts             # Database type definitions
│   ├── ocrService.ts                # OCR processing logic
│   ├── petData.ts                   # Pet breed data and schedules
│   └── utils.ts                     # Utility functions
├── hooks/
│   ├── usePets.ts                   # Pet management hooks
│   ├── useVaccinations.ts           # Vaccination hooks
│   └── useAuth.ts                   # Authentication hooks
└── pages/
    ├── Index.tsx                    # Main dashboard
    ├── PetDetail.tsx                # Individual pet page
    └── Profile.tsx                  # User profile settings
```

## Database Schema

### Core Tables
- **pets**: Pet information and ownership
- **vaccination_records**: Vaccination history with OCR data
- **health_records**: General health records (future expansion)

### Security
- Row Level Security (RLS) ensures data privacy
- Users can only access their own pets and records
- All tables reference authenticated user IDs

## User Flows

### 1. Onboarding Flow
1. User signs up/logs in via Supabase Auth
2. Welcome screen with app introduction
3. Add first pet with guided form
4. Upload first vaccination record
5. Dashboard with quick actions

### 2. Pet Management Flow
1. View all pets on dashboard
2. Click pet card to view detailed profile
3. Edit pet information or add new records
4. Upload photos and documents

### 3. Vaccination Tracking Flow
1. Take photo or upload vaccination document
2. OCR extracts vaccine type and date
3. System calculates next due date
4. Record saved to pet's health history
5. Dashboard shows upcoming vaccinations

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Setup Instructions

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd pet-health-tracker
   npm install
   ```

2. **Supabase Setup**
   - Create new Supabase project
   - Copy environment variables
   - Run database migrations (see supabaseTypes.ts)
   - Enable authentication providers

3. **Environment Variables**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Development**
   ```bash
   npm run dev
   ```

## Extending the App

The app is designed for easy feature expansion:

### Adding New Health Record Types
1. Update `HealthRecord` interface in `supabaseTypes.ts`
2. Create new component in `components/health/`
3. Add processing logic in `lib/`
4. Update navigation and routing

### Integrating New OCR Services
1. Implement new service in `lib/ocrService.ts`
2. Add API configuration
3. Update extraction logic for specific document types

### Adding Reminders/Notifications
1. Create notification service
2. Add reminder preferences to user profile
3. Implement background job scheduling
4. Add push notification support

## Contributing

1. Follow the existing component structure
2. Use TypeScript for all new code
3. Maintain mobile-first responsive design
4. Add proper error handling and loading states
5. Update this README with new features

## License

MIT License - see LICENSE file for details
