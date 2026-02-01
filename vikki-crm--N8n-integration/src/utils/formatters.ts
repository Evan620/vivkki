export const formatClientName = (
  firstName: string,
  middleName: string,
  lastName: string
): string => {
  if (middleName && middleName.trim() !== '') {
    const middleInitial = middleName.charAt(0).toUpperCase();
    return `${firstName} ${middleInitial}. ${lastName}`;
  }
  return `${firstName} ${lastName}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};
