import { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle
} from 'lucide-react';

export default function Contact() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const contactInfo = [
    {
      icon: <MapPin className="w-6 h-6 text-primary" />,
      title: "Адрес",
      details: ["Г. Сочи, Донская, 10а", "ост. Заводская"]
    },
    {
      icon: <Phone className="w-6 h-6 text-nature-green" />,
      title: "Телефон",
      details: ["+7 (993) 932-60-95"]
    },
    {
      icon: <Mail className="w-6 h-6 text-nature-coral" />,
      title: "Email",
      details: ["theame123@mail.ru"]
    },
    {
      icon: <Clock className="w-6 h-6 text-nature-lavender" />,
      title: "Часы работы",
      details: ["Пн-Вс: 9:00 - 21:00"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero text-hero-green">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 text-hero-green">
            Контакты
          </h1>
          <p className="text-xl text-hero-green/80 max-w-3xl mx-auto">
            Мы всегда готовы помочь вам выбрать идеальный букет или ответить на любые вопросы. 
            Свяжитесь с нами удобным для вас способом.
          </p>
        </div>
      </section>

      {/* Контактная информация */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {contactInfo.map((item, index) => (
              <Card key={index} className="bg-gradient-card border-0 shadow-soft hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {item.title}
                  </h3>
                  <div className="space-y-2">
                    {item.details.map((detail, detailIndex) => (
                      <p key={detailIndex} className="text-muted-foreground">
                        {detail}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Две колонки: слева — Написать нам, справа — Карта. Без блока доставки */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            {/* Написать нам */}
            <Card className="bg-gradient-card border-0 shadow-soft h-full">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground flex items-center">
                  <MessageCircle className="w-6 h-6 mr-2 text-primary" />
                  Написать нам
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    asChild
                    className="w-full h-20 bg-blue-500 hover:bg-blue-600 text-white border-0 flex items-center justify-center px-6 py-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    <a
                      href="https://t.me/the_ame_flowers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full"
                    >
                      <svg className="w-10 h-10 mr-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.568 8.16c-.18 1.896-.96 6.504-1.356 8.628-.168.9-.504 1.2-.816 1.236-.696.06-1.224-.456-1.896-.9-1.056-.696-1.656-1.128-2.676-1.8-1.188-.78-.42-1.212.264-1.908.18-.18 3.252-2.976 3.312-3.228a.24.24 0 0 0-.06-.216c-.072-.06-.168-.036-.24-.024-.096.024-1.62 1.032-4.576 3.036-.432.3-.828.444-1.188.432-.396-.012-1.152-.228-1.716-.408-.696-.24-1.248-.372-1.2-.792.024-.216.324-.432.888-.66 3.504-1.524 5.832-2.532 6.996-3.012 3.336-1.392 4.02-1.632 4.476-1.632.096 0 .324.024.468.144.12.096.156.228.168.324-.012.072-.012.288-.024.36z"/>
                      </svg>
                      <span className="text-xl font-semibold">Telegram</span>
                    </a>
                  </Button>

                  <Button
                    asChild
                    className="w-full h-20 bg-green-500 hover:bg-green-600 text-white border-0 flex items-center justify-center px-6 py-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    <a
                      href="https://wa.me/message/XQDDWGSEL35LP1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full"
                    >
                      <svg className="w-10 h-10 mr-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                      </svg>
                      <span className="text-xl font-semibold">WhatsApp</span>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Карта и дополнительная информация */}
            <Card className="bg-gradient-card border-0 shadow-soft h-full">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground flex items-center">
                  <MapPin className="w-6 h-6 mr-2 text-primary" />
                  Как нас найти
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 h-full">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src="https://yandex.ru/map-widget/v1/?z=12&ol=biz&oid=242667025310"
                      width="100%"
                      height="100%"
                      style={{ border: 'none' }}
                      className="w-full h-full"
                      title="Яндекс карта - Наше местоположение"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Адрес</p>
                        <p className="text-muted-foreground">
                          Г. Сочи, Донская, 10а<br />
                          ост. Заводская
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Режим работы</p>
                        <p className="text-muted-foreground">
                          Пн-Вс: 9:00 - 21:00<br />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
