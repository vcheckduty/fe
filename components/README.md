# V-Check UI Components

Modern, reusable React components for the V-Check Police GPS Attendance System.

## 🎨 Available Components

### Core Components

#### **Logo**
SVG-based animated logo with GPS pin and checkmark design.
```tsx
import { Logo } from '@/components';

<Logo size="sm" | "md" | "lg" | "xl" />
```

#### **UserCard**
Display user information with avatar, name, subtitle, and optional badge.
```tsx
import { UserCard } from '@/components';

<UserCard 
  name="Nguyễn Văn A"
  subtitle="Officer since Jan, 2021"
  time="8:30"
  badge="verified"
  imageUrl="/avatar.jpg"
  onClick={() => {}}
/>
```

#### **QueueList**
Show a list of users in queue with status indicators.
```tsx
import { QueueList } from '@/components';

<QueueList
  title="Check-in Queue"
  items={[
    { id: '1', name: 'User', time: '8AM', status: 'active' }
  ]}
  maxVisible={5}
/>
```

#### **ChartCard**
Bar chart component for visualizing data.
```tsx
import { ChartCard } from '@/components';

<ChartCard
  title="Monthly Stats"
  data={[
    { label: 'Jan', value: 45, color: '#3b82f6' }
  ]}
  legend={true}
/>
```

#### **DateCard**
Display current date with custom message and count.
```tsx
import { DateCard } from '@/components';

<DateCard
  dayName="Monday"
  date={12}
  message="You have"
  count={13}
  countLabel="meetings today"
/>
```

#### **ShareLinkCard**
Share link component with copy functionality.
```tsx
import { ShareLinkCard } from '@/components';

<ShareLinkCard
  link="https://vcheck.app/invite/abc"
  title="Invite officers"
  description="share the link below"
/>
```

#### **OTPInput**
6-digit OTP input with auto-focus and paste support.
```tsx
import { OTPInput } from '@/components';

<OTPInput
  length={6}
  onComplete={(otp) => console.log(otp)}
  disabled={false}
/>
```

## 🎯 Usage

Import components individually:
```tsx
import { Logo, UserCard, QueueList } from '@/components';
```

Or import specific component:
```tsx
import Logo from '@/components/Logo';
import UserCard from '@/components/UserCard';
```

## 🎨 Design System

All components follow the V-Check design system:
- **Primary Color**: Blue (#1e40af to #3b82f6)
- **Accent Color**: Gold (#FFD700 to #FFA500)
- **Typography**: System fonts with custom sizing
- **Spacing**: Consistent padding and margins
- **Animations**: Smooth transitions and hover effects

## 📱 Demo

Visit `/components-demo` to see all components in action.

## 🔧 Customization

All components accept a `className` prop for custom styling:
```tsx
<UserCard className="my-custom-class" />
```

## 📄 TypeScript

All components are fully typed with TypeScript for better developer experience.
