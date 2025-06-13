import { ThemeProvider } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      themes={['light', 'dark']}
    >
      {children}
    </ThemeProvider>
  );
}