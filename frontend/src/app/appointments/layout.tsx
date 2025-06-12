export default function AppointmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Appointment System</h1>
        </div>
      </header>
      {children}
    </div>
  );
}
