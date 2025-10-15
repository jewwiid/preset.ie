# Frontend Components - Preset Platform

## 🎨 Component Architecture

Preset's frontend is built with **React 18.2.0** and **Next.js 14+** using a component-based architecture that promotes reusability, maintainability, and cross-platform compatibility. The design system ensures consistency across web and mobile platforms.

## 🏗️ Component Structure

### **Component Hierarchy**
```
components/
├── ui/                    # Reusable UI components
│   ├── Button.tsx         # Button variants
│   ├── Input.tsx          # Form inputs
│   ├── Card.tsx           # Card layouts
│   ├── Modal.tsx          # Modal dialogs
│   └── ...
├── forms/                 # Form components
│   ├── GigCreationForm.tsx
│   ├── ProfileForm.tsx
│   ├── ApplicationForm.tsx
│   └── ...
├── layout/                # Layout components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Footer.tsx
│   └── ...
├── features/              # Feature-specific components
│   ├── gigs/
│   ├── applications/
│   ├── showcases/
│   └── ...
└── pages/                 # Page components
    ├── HomePage.tsx
    ├── Dashboard.tsx
    ├── ProfilePage.tsx
    └── ...
```

## 🎯 Core UI Components

### **Button Component**
Versatile button component with multiple variants and states.

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = ''
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  };
  
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
}
```

### **Input Component**
Form input with validation and error states.

```typescript
interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Input({
  label,
  error,
  helperText,
  required = false,
  type = 'text',
  placeholder,
  value,
  onChange,
  className = ''
}: InputProps) {
  const inputId = useId();
  
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive' : ''} ${className}`}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
```

### **Card Component**
Flexible card layout for content organization.

```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const baseClasses = 'rounded-lg border bg-card text-card-foreground shadow-sm';
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow cursor-pointer' : '';
  
  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
}
```

## 🎬 Feature Components

### **GigCard Component**
Displays gig information in a card format.

```typescript
interface GigCardProps {
  gig: Gig;
  onApply?: (gigId: string) => void;
  onView?: (gigId: string) => void;
  showActions?: boolean;
  variant?: 'grid' | 'list';
}

export function GigCard({ gig, onApply, onView, showActions = true, variant = 'grid' }: GigCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === gig.owner_user_id;
  const canApply = user?.role === 'talent' && !isOwner && gig.status === 'published';
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const getCompTypeColor = (type: string) => {
    switch (type) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'tfp': return 'bg-blue-100 text-blue-800';
      case 'expenses': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (variant === 'list') {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{gig.title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{gig.description}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompTypeColor(gig.comp_type)}`}>
                {gig.comp_type.toUpperCase()}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatDate(gig.start_time)}
              </span>
              <span className="text-sm text-muted-foreground">
                {gig.location_text}
              </span>
            </div>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onView?.(gig.id)}>
                View
              </Button>
              {canApply && (
                <Button onClick={() => onApply?.(gig.id)}>
                  Apply
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  return (
    <Card hover onClick={() => onView?.(gig.id)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-2">{gig.title}</h3>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{gig.description}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompTypeColor(gig.comp_type)}`}>
            {gig.comp_type.toUpperCase()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(gig.start_time)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{gig.location_text}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{gig.applications_count || 0} applications</span>
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="flex-1">
              View Details
            </Button>
            {canApply && (
              <Button size="sm" className="flex-1">
                Apply Now
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### **ApplicationCard Component**
Displays application information for contributors.

```typescript
interface ApplicationCardProps {
  application: Application;
  onShortlist?: (applicationId: string) => void;
  onAccept?: (applicationId: string) => void;
  onDecline?: (applicationId: string) => void;
  onMessage?: (userId: string) => void;
}

export function ApplicationCard({ 
  application, 
  onShortlist, 
  onAccept, 
  onDecline, 
  onMessage 
}: ApplicationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={application.applicant.avatar_url} />
              <AvatarFallback>{application.applicant.display_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{application.applicant.display_name}</h3>
              <p className="text-sm text-muted-foreground">@{application.applicant.handle}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
            {application.status}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {application.note && (
            <div>
              <p className="text-sm text-muted-foreground">Application Note:</p>
              <p className="text-sm">{application.note}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Experience</p>
              <p>{application.applicant.experience_years} years</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rating</p>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{application.applicant.rating || 'N/A'}</span>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Location</p>
              <p>{application.applicant.city}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Completed Gigs</p>
              <p>{application.applicant.completed_gigs || 0}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onMessage?.(application.applicant.id)}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Message
            </Button>
            {application.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleAction(() => onShortlist?.(application.id))}
                  disabled={isLoading}
                >
                  Shortlist
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleAction(() => onAccept?.(application.id))}
                  disabled={isLoading}
                >
                  Accept
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleAction(() => onDecline?.(application.id))}
                  disabled={isLoading}
                >
                  Decline
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### **ShowcaseCard Component**
Displays showcase information in a card format.

```typescript
interface ShowcaseCardProps {
  showcase: Showcase;
  onView?: (showcaseId: string) => void;
  onLike?: (showcaseId: string) => void;
  isLiked?: boolean;
  showActions?: boolean;
}

export function ShowcaseCard({ 
  showcase, 
  onView, 
  onLike, 
  isLiked = false, 
  showActions = true 
}: ShowcaseCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <Card hover onClick={() => onView?.(showcase.id)}>
      <div className="relative">
        <div className="aspect-square overflow-hidden rounded-t-lg">
          {!imageLoaded && (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
          <img
            src={showcase.media_ids[0]?.url}
            alt={showcase.caption}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
        {showcase.media_ids.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            +{showcase.media_ids.length - 1}
          </div>
        )}
      </div>
      
      <CardContent>
        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-2">{showcase.caption}</h3>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{showcase.likes_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{showcase.views_count}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={showcase.creator.avatar_url} />
              <AvatarFallback>{showcase.creator.display_name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              by {showcase.creator.display_name}
            </span>
          </div>
          
          {showcase.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {showcase.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                  {tag}
                </span>
              ))}
              {showcase.tags.length > 3 && (
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                  +{showcase.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {showActions && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                View
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onLike?.(showcase.id);
                }}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🎨 Design System Components

### **Avatar Component**
User avatar with fallback support.

```typescript
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full rounded-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className="hidden h-full w-full rounded-full bg-muted flex items-center justify-center text-sm font-medium">
        {fallback}
      </div>
    </div>
  );
}
```

### **Badge Component**
Status and category badges.

```typescript
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ 
  variant = 'default', 
  size = 'md', 
  children, 
  className = '' 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  
  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border border-input text-foreground'
  };
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-0.5 text-sm'
  };
  
  return (
    <span className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
```

### **Loading Components**
Loading states and skeletons.

```typescript
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-muted ${className}`} />
  );
}

export function GigCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-48 w-full rounded-t-lg" />
      <CardContent>
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-2/3 mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
```

## 📱 Mobile Components

### **Mobile Navigation**
Bottom navigation for mobile apps.

```typescript
interface MobileNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function MobileNavigation({ currentPath, onNavigate }: MobileNavigationProps) {
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/gigs', icon: Search, label: 'Gigs' },
    { path: '/applications', icon: FileText, label: 'Applications' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = currentPath.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### **Mobile Header**
Mobile-specific header component.

```typescript
interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  onMenu?: () => void;
  rightAction?: React.ReactNode;
}

export function MobileHeader({ title, onBack, onMenu, rightAction }: MobileHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-background border-b border-border">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        {onMenu && (
          <Button variant="ghost" size="sm" onClick={onMenu}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      {rightAction && (
        <div>{rightAction}</div>
      )}
    </div>
  );
}
```

## 🔧 Custom Hooks

### **useAuth Hook**
Authentication state management.

```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          setUser({ ...session.user, profile });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  
  return {
    user,
    loading,
    error,
    signIn,
    signOut
  };
}
```

### **useGigs Hook**
Gig data management.

```typescript
export function useGigs(filters?: GigFilters) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const fetchGigs = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/gigs?page=${pageNum}&limit=20&${new URLSearchParams(filters)}`);
      const data = await response.json();
      
      if (reset) {
        setGigs(data.gigs);
      } else {
        setGigs(prev => [...prev, ...data.gigs]);
      }
      
      setHasMore(data.gigs.length === 20);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchGigs(page + 1);
    }
  }, [loading, hasMore, page, fetchGigs]);
  
  const refresh = useCallback(() => {
    fetchGigs(1, true);
  }, [fetchGigs]);
  
  useEffect(() => {
    fetchGigs(1, true);
  }, [fetchGigs]);
  
  return {
    gigs,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}
```

## 🎨 Styling & Theming

### **Design Tokens**
Consistent design system tokens.

```typescript
// colors.ts
export const colors = {
  primary: {
    50: '#f0fdf4',
    500: '#00876f',
    900: '#14532d'
  },
  secondary: {
    50: '#f8fafc',
    500: '#64748b',
    900: '#0f172a'
  },
  // ... more colors
};

// spacing.ts
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem'
};

// typography.ts
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem'
  }
};
```

### **CSS-in-JS Styling**
Styled components with theme support.

```typescript
import styled from 'styled-components';

const StyledButton = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: ${props => props.theme.fontWeight.medium};
  transition: all 0.2s ease;
  
  ${props => props.variant === 'primary' && `
    background-color: ${props.theme.colors.primary[500]};
    color: white;
    
    &:hover {
      background-color: ${props.theme.colors.primary[600]};
    }
  `}
  
  ${props => props.variant === 'secondary' && `
    background-color: ${props.theme.colors.secondary[100]};
    color: ${props.theme.colors.secondary[900]};
    
    &:hover {
      background-color: ${props.theme.colors.secondary[200]};
    }
  `}
`;
```

## 📱 Responsive Design

### **Breakpoint System**
Consistent breakpoints across components.

```typescript
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Usage in components
const ResponsiveGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.md};
  
  @media (min-width: ${breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: ${breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;
```

### **Mobile-First Approach**
Mobile-first responsive design.

```typescript
export function ResponsiveCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-sm mx-auto sm:max-w-md lg:max-w-lg xl:max-w-xl">
        {children}
      </div>
    </div>
  );
}
```

---

This comprehensive component system provides a solid foundation for building consistent, maintainable, and scalable user interfaces across web and mobile platforms. The design system ensures visual consistency while the component architecture promotes code reusability and maintainability.
