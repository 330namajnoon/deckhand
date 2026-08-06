/**
 * Notificaciones push del navegador (Notification API), para avisar del
 * resultado de un deploy aunque la pestaña no esté en primer plano.
 */

/** Pide permiso de notificaciones si aún no se ha concedido ni denegado.
 * Debe llamarse desde un gesto del usuario (p. ej. el submit del deploy). */
export const requestNotificationPermission = () => {
	if (!('Notification' in window) || Notification.permission !== 'default') return;
	Notification.requestPermission().catch(() => {
		// sin permiso simplemente no se notifica
	});
};

/** Muestra una notificación si el permiso está concedido; si no, no hace nada. */
export const sendNotification = (title: string, body?: string) => {
	if (!('Notification' in window) || Notification.permission !== 'granted') return;
	try {
		new Notification(title, { body });
	} catch {
		// algunos navegadores (p. ej. Chrome en Android) solo permiten
		// notificar desde un service worker; no rompemos el polling por eso
	}
};
