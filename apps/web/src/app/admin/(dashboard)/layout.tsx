import AdminSidebar from '@/components/admin-sidebar'
import AdminNavbar from '@/components/admin-navbar'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <AdminNavbar />
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="md:hidden h-14" />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}