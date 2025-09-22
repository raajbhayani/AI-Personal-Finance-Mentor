# Authentication Components

Modern, accessible login and signup pages with comprehensive form validation, loading states, and success feedback.

## Features

### 🔒 **Security & Validation**
- Real-time form validation with proper error handling
- Password strength indicator with visual feedback
- Email format validation
- Name validation (letters and spaces only)
- Confirm password validation

### 🎨 **Design**
- Modern card-based layout with glassmorphism effects
- Responsive design that works on all screen sizes
- Professional finance color scheme (blues and greens)
- Smooth animations and hover effects
- Loading states with spinners and disabled states

### ♿ **Accessibility**
- ARIA labels and roles for screen readers
- Keyboard navigation support
- Focus management and indicators
- High contrast colors for better visibility
- Semantic HTML structure

### 📱 **User Experience**
- Progressive form validation (errors clear as user types)
- Password visibility toggle
- Social login buttons (Google, Facebook)
- Remember me option on login
- Newsletter subscription option on signup
- Terms of service agreement
- Success feedback with smooth transitions

## Components

### LoginPage
- Email and password login
- Remember me checkbox
- Forgot password link
- Social login options
- Link to signup page

### SignupPage
- Full name, email, password, and confirm password fields
- Real-time password strength indicator
- Terms of service agreement
- Newsletter subscription option
- Success state with email verification notice
- Social signup options
- Link to login page

## Usage

```tsx
import { LoginPage, SignupPage } from '@/components/auth';

// Login page
<LoginPage />

// Signup page
<SignupPage />
```

## Form Validation

The forms use comprehensive validation:

### Email Validation
- Required field validation
- Email format validation with regex
- Real-time feedback

### Password Validation
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Name Validation
- Required field
- 2-50 characters
- Letters and spaces only

### Password Strength Indicator
- Visual strength meter (0-4 scale)
- Real-time feedback
- Specific suggestions for improvement
- Requirements checklist with checkmarks

## Styling

Uses TailwindCSS with:
- Custom gradient backgrounds
- Rounded borders and shadows
- Hover and focus effects
- Responsive breakpoints
- Professional typography

## Testing Credentials

For the login demo:
- Email: `test@example.com`
- Password: `password`

## Accessibility Features

- **Screen Reader Support**: All inputs have proper labels and ARIA attributes
- **Keyboard Navigation**: Full keyboard support with proper tab order
- **Focus Management**: Clear focus indicators and proper focus trapping
- **Color Contrast**: Meets WCAG AA standards
- **Error Announcements**: Errors are announced to screen readers
- **Loading States**: Loading states are properly announced

## Integration

The components are designed to work with:
- Next.js App Router
- React Hook Form (optional)
- Authentication providers (NextAuth, Auth0, etc.)
- Backend APIs for user registration and login

## Responsive Design

- **Mobile**: Optimized for touch interactions
- **Tablet**: Adaptive layout for medium screens
- **Desktop**: Full feature set with hover effects
- **Large Screens**: Proper max-width constraints

## Customization

Easy to customize:
- Colors via Tailwind CSS variables
- Validation rules in `validation.ts`
- Form fields and layout
- Success/error messages
- Social login providers