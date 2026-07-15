// Toast simple con auto-dismiss (FR-014). No se persiste.
export const useNotificationsStore = defineStore("notifications", () => {
  const text = ref("");
  const visible = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function notify(message: string) {
    text.value = message;
    visible.value = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { visible.value = false; }, 3000);
  }

  return { text, visible, notify };
});
