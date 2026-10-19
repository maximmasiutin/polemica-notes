/**
 * Роли за столом скрыты: сайтом (своя роль заменена спрайтом «#stop» — пункт
 * меню «Скрыть роли») или нами (CSS-скрытие auto-start для стрима). Только
 * чтение DOM: подсказки, называющие роль, в этом режиме не показываются.
 */
import { OWN, SITE } from "@core/selectors";

export function rolesHidden(): boolean {
  if (document.getElementById(OWN.roleHideStyle)) return true;
  const use = document.querySelector(`${SITE.myRole} use`);
  const href = use?.getAttribute("href") || use?.getAttribute("xlink:href") || "";
  return href.includes("#stop");
}
