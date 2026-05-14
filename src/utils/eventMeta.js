const normalize = (value = "") => value.trim();

export const parseEventMeta = (meta = "") => {
  const tokens = String(meta)
    .split(/[|•]/)
    .map(normalize)
    .filter(Boolean);

  return {
    date: tokens[0] || "",
    time: tokens[1] || "",
    location: tokens[2] || "",
    price: tokens[3] || "",
    slots: tokens[4] || "",
  };
};
