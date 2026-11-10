#!/bin/bash
PLIST="$HOME/Library/LaunchAgents/com.zenparfums.actualizar.plist"
LOG="$HOME/ZenParfumsCatalogue/logs/cron.log"
LABEL="com.zenparfums.actualizar"

# ── Colores ────────────────────────────────────────────────────────────────────
GRN="\033[0;32m"; RED="\033[0;31m"; YLW="\033[0;33m"; BLD="\033[1m"; RST="\033[0m"

estado() {
  launchctl list | grep -q "$LABEL" && echo -e "${GRN}● Activo${RST}" || echo -e "${RED}○ Pausado${RST}"
}

hora_actual() {
  python3 -c "
import plistlib
with open('$PLIST','rb') as f: p=plistlib.load(f)
s=p['StartCalendarInterval']
entries=s if isinstance(s,list) else [s]
print(' y '.join(f\"{e['Hour']:02d}:{e['Minute']:02d}\" for e in entries))
"
}

menu() {
  clear
  echo -e "${BLD}╔══════════════════════════════╗${RST}"
  echo -e "${BLD}║     ZenParfums — Cron        ║${RST}"
  echo -e "${BLD}╚══════════════════════════════╝${RST}"
  echo ""
  echo -e "  Estado : $(estado)"
  echo -e "  Hora   : $(hora_actual) hs"
  echo ""
  echo -e "  ${BLD}1.${RST} Cambiar hora"
  echo -e "  ${BLD}2.${RST} Pausar cron"
  echo -e "  ${BLD}3.${RST} Reactivar cron"
  echo -e "  ${BLD}4.${RST} Correr ahora"
  echo -e "  ${BLD}5.${RST} Ver último log"
  echo -e "  ${BLD}6.${RST} Salir"
  echo ""
  echo -n "  Elegí una opción: "
}

cambiar_hora() {
  echo ""
  echo -n "  Nueva hora (ej: 08:30): "
  read input
  h=$(echo "$input" | cut -d: -f1 | sed 's/^0*//')
  m=$(echo "$input" | cut -d: -f2 | sed 's/^0*//')
  h=${h:-0}; m=${m:-0}
  if ! [[ "$h" =~ ^[0-9]+$ ]] || ! [[ "$m" =~ ^[0-9]+$ ]] || [ "$h" -gt 23 ] || [ "$m" -gt 59 ]; then
    echo -e "  ${RED}Hora inválida.${RST}"
    sleep 2; return
  fi
  python3 -c "
import plistlib
with open('$PLIST','rb') as f: p=plistlib.load(f)
s=p['StartCalendarInterval']
entries=s if isinstance(s,list) else [s]
for e in entries: e['Hour']=$h; e['Minute']=$m
p['StartCalendarInterval']=entries
with open('$PLIST','wb') as f: plistlib.dump(p,f)
"
  launchctl unload "$PLIST" 2>/dev/null
  launchctl load "$PLIST"
  echo -e "  ${GRN}✓ Hora cambiada a $(printf '%02d:%02d' $h $m) hs${RST}"
  sleep 2
}

pausar() {
  launchctl unload "$PLIST" 2>/dev/null
  echo -e "  ${YLW}✓ Cron pausado${RST}"
  sleep 2
}

reactivar() {
  launchctl load "$PLIST" 2>/dev/null
  echo -e "  ${GRN}✓ Cron reactivado${RST}"
  sleep 2
}

correr_ahora() {
  echo ""
  echo -e "  ${YLW}Iniciando actualización...${RST}"
  > "$LOG"
  launchctl start "$LABEL"
  echo -e "  Esperando resultado"
  dots=0
  while ! grep -q "Finalizado\|Error (código" "$LOG" 2>/dev/null; do
    echo -n "."; dots=$((dots+1))
    sleep 3
    [ $dots -gt 100 ] && break
  done
  echo ""
  if grep -q "Finalizado OK" "$LOG" 2>/dev/null; then
    echo -e "  ${GRN}✓ Actualización completada${RST}"
  else
    echo -e "  ${RED}✗ Hubo un error — revisá el log${RST}"
  fi
  sleep 3
}

ver_log() {
  clear
  echo -e "${BLD}── Último log ──────────────────────────────${RST}"
  if [ -f "$LOG" ]; then
    tail -40 "$LOG"
  else
    echo "  Sin log todavía."
  fi
  echo ""
  echo -e "${BLD}────────────────────────────────────────────${RST}"
  echo -n "  Enter para volver..."
  read
}

# ── Loop principal ─────────────────────────────────────────────────────────────
while true; do
  menu
  read opcion
  case $opcion in
    1) cambiar_hora ;;
    2) pausar ;;
    3) reactivar ;;
    4) correr_ahora ;;
    5) ver_log ;;
    6) clear; exit 0 ;;
    *) ;;
  esac
done
