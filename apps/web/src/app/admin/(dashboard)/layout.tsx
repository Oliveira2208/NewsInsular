import AdminSidebar from '@/components/admin-sidebar'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-64">
        <div className="md:hidden h-12" />
        {children}
      </main>
    </div>
  )
}