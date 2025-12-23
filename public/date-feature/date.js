export function CurrentDate() {
  const currentDate = new Date();
  const time =
    String(currentDate.getHours()).padStart(2, "0") +
    ":" +
    String(currentDate.getMinutes()).padStart(2, "0");

  return time;
}
