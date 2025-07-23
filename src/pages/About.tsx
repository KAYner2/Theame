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

  const team = [
    {
      name: "Анна Петрова",
      role: "Флорист-дизайнер",
      experience: "8 лет опыта",
      description: "Специализируется на свадебных букетах и композициях"
    },
    {
      name: "Елена Смирнова",
      role: "Менеджер по работе с клиентами",
      experience: "5 лет опыта",
      description: "Поможет выбрать идеальный букет для любого случая"
    },
    {
      name: "Дмитрий Иванов",
      role: "Логист",
      experience: "3 года опыта",
      description: "Обеспечивает быструю и безопасную доставку"
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
            The Áme - это не просто доставка цветов. Это искусство создавать моменты счастья.
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
                Цветы говорят за нас, создают настроение и делают моменты особенными. В The Áme мы ценим естественную красоту, стиль и гармонию. Каждая композиция — это продуманный образ, где важна каждая деталь. Мы выбираем только лучшие цветы, чтобы ваши букеты не просто украшали, а рассказывали историю.
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
                <h3 className="text-2xl font-bold text-primary mb-2">5000+</h3>
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

      {/* Команда */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Наша команда
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Профессиональные флористы и менеджеры, которые делают каждый заказ особенным
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="bg-gradient-card border-0 shadow-soft hover:shadow-elegant transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <CardTitle className="text-xl text-foreground">
                    {member.name}
                  </CardTitle>
                  <Badge variant="secondary" className="w-fit mx-auto">
                    {member.role}
                  </Badge>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-primary font-medium mb-2">
                    {member.experience}
                  </p>
                  <p className="text-muted-foreground">
                    {member.description}
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

const User = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);