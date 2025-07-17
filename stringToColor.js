export const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
};
export const stringToColorWithAlpha = (str, alpha = 1) => {
  const color = stringToColor(str);
  return `${color}${Math.floor(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
};
