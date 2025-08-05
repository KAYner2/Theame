import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Flower, 
  Users, 
  Heart, 
  Award, 
  Clock, 
  Truck 
} from 'lucide-react';

export default function About() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const values = [
    {
      icon: <Heart className="w-8 h-8 text-nature-pink" />,
      title: "Любовь к цветам",
      description: "Каждый букет создается с любовью и вниманием к деталям"
    },
    {
      icon: <Award className="w-8 h-8 text-nature-green" />,
      title: "Качество",
      description: "Используем только свежие цветы от проверенных поставщиков"
    },
    {
      icon: <Users className="w-8 h-8 text-nature-coral" />,
      title: "Клиентоориентированность",
      description: "Всегда ставим потребности клиентов на первое место"
    },
    {
      icon: <Clock className="w-8 h-8 text-nature-lavender" />,
      title: "Пунктуальность",
      description: "Доставляем точно в срок, чтобы не испортить важный момент"
    }
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero text-hero-green">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 text-hero-green">
            The Áme
          </h1>
          <p className="text-xl text-hero-green/90 max-w-3xl mx-auto">
            Цветы говорят за нас. Мы создаём настроение и превращаем моменты в нечто большее.
          </p>
        </div>
      </section>

      {/* История компании */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                О нас
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                В The Áme мы вдохновляемся французской эстетикой и ценим в цветах не только красоту, но и смысл. Каждая композиция — это продуманный образ, где важна каждая деталь: форма, оттенок, подача.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Мы работаем с душой, подбираем только свежие, выразительные цветы и создаём букеты, которые не просто украшают — они говорят за вас.
              </p>
              <div className="flex flex-wrap gap-4">
                <Badge variant="secondary" className="px-4 py-2">
                  <Award className="w-4 h-4 mr-2" />
                  5 звезд оценка
                </Badge>
                <Badge variant="secondary" className="px-4 py-2">
                  <Clock className="w-4 h-4 mr-2" />
                  24/7 Поддержка клиентов
                </Badge>
                <Badge variant="secondary" className="px-4 py-2">
                  <Flower className="w-4 h-4 mr-2" />
                  50+ Видов цветов
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-card p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-primary mb-2">⭐⭐⭐⭐⭐</h3>
                <p className="text-muted-foreground">5 звезд оценка</p>
              </div>
              <div className="bg-gradient-card p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-primary mb-2">500+</h3>
                <p className="text-muted-foreground">Созданных букетов</p>
              </div>
              <div className="bg-gradient-card p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-primary mb-2">50+</h3>
                <p className="text-muted-foreground">Видов цветов</p>
              </div>
              <div className="bg-gradient-card p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-primary mb-2">24/7</h3>
                <p className="text-muted-foreground">Поддержка клиентов</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ценности */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Наши ценности
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Принципы, которые лежат в основе нашей работы и помогают создавать 
              незабываемые моменты для наших клиентов
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="bg-gradient-card border-0 shadow-soft hover:shadow-elegant transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
