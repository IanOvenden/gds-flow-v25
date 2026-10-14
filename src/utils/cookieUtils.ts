export const setCameFromStartPageCookie = () => {
  document.cookie = "cameFromStartPage=true; path=/";
};

export const clearCameFromStartPageCookie = () => {
  document.cookie = "cameFromStartPage=false; path=/";
};

export const getCameFromStartPageCookie = (): boolean => {
  return document.cookie.includes('cameFromStartPage=true');
};
