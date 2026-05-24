import { Target, Eye, Heart } from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 text-center mb-12">Quiénes Somos</h1>

      <div className="space-y-12">
        <section className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-primary/10 rounded-xl">
              <Eye className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Visión</h2>
              <p className="text-gray-600 leading-relaxed">
                Ser el medio de comunicación líder en el estado Nueva Esparta, consolidado como la fuente 
                informativa más confiable y cercana a la comunidad, promoviendo la participación 
                ciudadana y el fortalecimiento de los valores democráticos en la región.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-primary/10 rounded-xl">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Misión</h2>
              <p className="text-gray-600 leading-relaxed">
                Proporcionar información veraz, oportuna y relevante sobre los eventos y temas que 
                afectan a los ciudadanos de Nueva Esparta, fomentando el debate constructivo y 
                contribuyendo al desarrollo social, económico y cultural del estado.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-primary/10 rounded-xl">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Valores</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span><strong>Veracidad:</strong> Información comprobada y fuentes verificables</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span><strong>Transparencia:</strong> Proceso informativo abierto y honesto</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span><strong>Comunidad:</strong> Cercanía con nuestros lectores y fuentes</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span><strong>Responsabilidad:</strong> Consecuencia ética en cada publicación</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span><strong>Innovación:</strong> Adaptación constante a las nuevas tecnologías</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}