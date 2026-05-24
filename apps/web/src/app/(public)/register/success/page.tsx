import Link from 'next/link'

export default function RegisterSuccessPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h1>
      <p className="text-gray-600 mb-8">
        Te has registrado correctamente. Recibirás un correo de bienvenida pronto.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark"
      >
        Ver noticias
      </Link>
    </div>
  )
}