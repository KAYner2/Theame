import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order } = await req.json();
    
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!telegramBotToken || !telegramChatId) {
      console.error('Missing Telegram credentials');
      return new Response(JSON.stringify({ 
        error: 'Telegram credentials not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format order items
    const itemsList = order.items.map((item: any) => 
      `• ${item.name} - ${item.quantity} шт. по ${item.price}₽`
    ).join('\n');

    // Create order message
    const message = `🌸 НОВЫЙ ЗАКАЗ #${order.id.slice(-8)}

👤 Клиент: ${order.customer_name || 'Не указано'}
📱 Телефон: ${order.customer_phone || 'Не указан'}

📦 Состав заказа:
${itemsList}

💰 Сумма: ${order.total_amount}₽
${order.discount_amount > 0 ? `🎟️ Скидка: ${order.discount_amount}₽` : ''}
${order.promo_code ? `🏷️ Промокод: ${order.promo_code}` : ''}

🚚 Доставка: ${order.delivery_type === 'delivery' ? 'Доставка' : 'Самовывоз'}
📅 Дата: ${order.delivery_date || 'Не указана'}
⏰ Время: ${order.delivery_time || 'Не указано'}
${order.district ? `🏘️ Район: ${order.district}` : ''}

${order.recipient_name ? `👤 Получатель: ${order.recipient_name}` : ''}
${order.recipient_phone ? `📱 Телефон получателя: ${order.recipient_phone}` : ''}
${order.recipient_address ? `📍 Адрес: ${order.recipient_address}` : ''}

${order.card_wishes ? `💌 Пожелания на открытке: ${order.card_wishes}` : ''}
${order.order_comment ? `📝 Комментарий: ${order.order_comment}` : ''}

💳 Способ оплаты: ${order.payment_method === 'card' ? 'Картой' : 'Наличными'}
📅 Создан: ${new Date(order.created_at).toLocaleString('ru-RU')}`;

    // Send message to Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!telegramResponse.ok) {
      const errorText = await telegramResponse.text();
      console.error('Telegram API error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to send message to Telegram',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Order sent to Telegram successfully');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Order sent to Telegram successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-order-to-telegram function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});