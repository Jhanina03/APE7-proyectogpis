# Frontend Application

A modern React frontend application built with TypeScript, React Router, React Query, and shadcn/ui components.

## Features

- **Authentication Pages**: Login and Signup with form validation
- **React Router**: Client-side routing for seamless navigation
- **React Query**: Data fetching and state management
- **Form Validation**: Zod schema validation with React Hook Form
- **UI Components**: shadcn/ui with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Gender Selection**: Combobox for gender selection in signup form

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **TanStack React Query** - Data fetching and caching
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - High-quality UI components

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components
│   ├── login-form.tsx  # Login form component
│   └── signup-form.tsx # Signup form component
├── pages/              # Page components
│   ├── LoginPage.tsx   # Login page
│   ├── SignupPage.tsx  # Signup page
│   └── HomePage.tsx    # Home page
├── lib/
│   ├── api/            # API client
│   │   ├── client.ts   # Fetch wrapper
│   │   └── config.ts   # API configuration
│   ├── hooks/          # Custom hooks
│   │   └── useAuth.ts  # Authentication hooks
│   ├── validations/    # Zod schemas
│   │   └── auth.ts     # Auth validation schemas
│   └── utils.ts        # Utility functions
├── providers/          # Context providers
│   └── QueryProvider.tsx # React Query provider
├── App.tsx             # Router configuration
└── main.tsx            # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update the API URL in `.env`:
```env
VITE_API_URL=http://your-backend-url/api
```

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## API Integration

The application is ready to connect to your backend API. You only need to update the `VITE_API_URL` environment variable.

### API Endpoints Expected

The frontend expects the following API endpoints:

- **POST** `/auth/login` - User login
  - Body: `{ email: string, password: string }`

- **POST** `/auth/signup` - User registration
  - Body: `{ name: string, email: string, phone: string, address: string, gender: string, password: string }`

- **POST** `/auth/logout` - User logout

### Updating API Configuration

To change the API base URL:

1. **Development**: Update `.env` file:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

2. **Production**: Set environment variable in your deployment platform

3. **Direct Code**: Edit `src/lib/api/config.ts`:
   ```typescript
   export const API_BASE_URL = 'http://your-api-url/api';
   ```

## Form Validation

### Login Form
- Email: Valid email format required
- Password: Minimum 8 characters

### Signup Form
- Name: Minimum 2 characters
- Email: Valid email format
- Phone: 10-digit number
- Address: Minimum 5 characters
- Gender: Select from Male, Female, Other, or Prefer not to say
- Password:
  - Minimum 8 characters
  - Must contain uppercase letter
  - Must contain lowercase letter
  - Must contain a number
- Confirm Password: Must match password

## Routes

- `/` - Redirects to login
- `/login` - Login page
- `/signup` - Signup page
- `/home` - Home page (requires authentication)
- `*` - All other routes redirect to login

## Next Steps

1. **Update API URL**: Configure your backend API endpoint in `.env`
2. **Add Authentication State**: Implement auth context to manage user state
3. **Protected Routes**: Add route guards to protect authenticated pages
4. **Token Management**: Store and manage JWT tokens if using token-based auth
5. **Error Handling**: Enhance error messages and user feedback
6. **Add More Pages**: Expand the application with additional features

## Best Practices Followed

- **Type Safety**: Full TypeScript coverage
- **Form Validation**: Client-side validation with Zod
- **Code Organization**: Clean folder structure
- **Component Reusability**: Modular component design
- **API Abstraction**: Centralized API client
- **Error Handling**: Proper error boundaries and user feedback
- **Loading States**: Loading indicators for async operations
