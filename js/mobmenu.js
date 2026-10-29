
/* ---- MOB MENU ---- */
function closeMob() {
  $("mobOv").classList.remove("on");
  $("mobMenu").classList.remove("on");
  unlockScroll();
  $("burBtn").setAttribute("aria-expanded","false");
}
$("burBtn").addEventListener("click", function() {
  $("mobOv").classList.add("on");
  $("mobMenu").classList.add("on");
  lockScroll();
  $("burBtn").setAttribute("aria-expanded","true");
});
$("mobCl").addEventListener("click", closeMob);
$("mobOv").addEventListener("click", closeMob);
