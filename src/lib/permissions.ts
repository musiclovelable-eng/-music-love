import { User } from "@/hooks/useUser";

/**
 * Проверяет, имеет ли пользователь доступ к расширенным функциям
 * @param user - Объект пользователя
 * @returns true, если пользователь имеет доступ к расширенным функциям
 */
export function hasAdvancedFeatures(user: User | null): boolean {
  if (!user) return false;
  
  // Роль "label" и "advanced" дают доступ к расширенным функциям
  if (user.role === "label" || user.role === "advanced") return true;
  
  // Если роль не установлена (null), используем plan
  if (user.role === null && user.plan === "advanced") return true;
  
  return false;
}

/**
 * Проверяет, имеет ли пользователь доступ к базовым функциям
 * @param user - Объект пользователя
 * @returns true, если пользователь имеет доступ к базовым функциям
 */
export function hasBasicFeatures(user: User | null): boolean {
  if (!user) return false;
  
  // Роль "basic" дает доступ к базовым функциям
  if (user.role === "basic") return true;
  
  // Если роль не установлена (null), используем plan
  if (user.role === null && user.plan === "basic") return true;
  
  return false;
}

/**
 * Проверяет, может ли пользователь редактировать название лейбла
 * @param user - Объект пользователя
 * @returns true, если пользователь может редактировать лейбл
 */
export function canEditLabel(user: User | null): boolean {
  if (!user) return false;
  
  // Только роль "label" может редактировать название лейбла
  return user.role === "label";
}

/**
 * Получает название плана/роли пользователя для отображения
 * @param user - Объект пользователя
 * @returns Название плана/роли
 */
export function getUserPlanName(user: User | null): string {
  if (!user) return "Неизвестно";
  
  if (user.role === "label") return "Лейбл";
  if (user.role === "advanced") return "Продвинутый план";
  if (user.role === "basic") return "Базовый план";
  
  // Если роль не установлена, используем plan
  return user.plan === "advanced" ? "Продвинутый план" : "Базовый план";
}

/**
 * Получает описание возможностей плана/роли
 * @param user - Объект пользователя
 * @returns Массив строк с описанием возможностей
 */
export function getPlanFeatures(user: User | null): string[] {
  if (!user) return [];
  
  // Роль "label" получает все расширенные функции + редактирование лейбла
  if (user.role === "label") {
    return [
      "✓ Приоритетная модерация",
      "✓ Загрузка текстов на площадки",
      "✓ Промо от Music Love",
      "✓ Расширенная аналитика",
      "✓ Премиум поддержка",
      "✓ Редактирование названия лейбла",
    ];
  }
  
  // Роль "advanced" или plan "advanced"
  if (user.role === "advanced" || (user.role === null && user.plan === "advanced")) {
    return [
      "✓ Приоритетная модерация",
      "✓ Загрузка текстов на площадки",
      "✓ Промо от Music Love",
      "✓ Расширенная аналитика",
      "✓ Премиум поддержка",
    ];
  }
  
  // Роль "basic" или plan "basic"
  return [
    "✓ Стандартная модерация",
    "✓ Опция \"Как можно скорее\"",
    "✓ Базовая поддержка",
  ];
}
