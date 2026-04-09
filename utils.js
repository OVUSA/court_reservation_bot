/**
 * Utility Functions
 */
export const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};

export const formatDate = (d) => {
  return (
    String(d.getMonth() + 1).padStart(2, "0") + "/" +
    String(d.getDate()).padStart(2, "0") + "/" +
    d.getFullYear()
  );
};

export const isWeekday = (date) => {
  const parsedDate = date instanceof Date ? date : new Date(date);
  const day = parsedDate.getDay();
  return day >= 1 && day <= 5;
};

export const addDays = (d, days) => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};
