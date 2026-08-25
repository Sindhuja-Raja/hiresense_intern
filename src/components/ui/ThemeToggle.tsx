import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-secondary rounded-xl">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
          theme === 'light' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Light mode"
      >
        <Sun className="w-4 h-4" />
        <span className="text-sm font-medium">Light</span>
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
          theme === 'dark' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Dark mode"
      >
        <Moon className="w-4 h-4" />
        <span className="text-sm font-medium">Dark</span>
      </button>
    </div>
  );
};
