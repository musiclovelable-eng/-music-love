import { useEffect } from 'react';

/**
 * Hook для отправки heartbeat сигналов на сервер
 * Обновляет lastActiveAt каждые 30 секунд для отслеживания онлайн статуса
 */
export function useHeartbeat() {
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const token = localStorage.getItem('bearer_token');
        if (!token) return;

        await fetch('/api/heartbeat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
      } catch (error) {
        // Игнорируем ошибки heartbeat, чтобы не мешать работе приложения
        console.debug('Heartbeat failed:', error);
      }
    };

    // Отправляем первый heartbeat сразу
    sendHeartbeat();

    // Затем каждые 30 секунд
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, []);
}
