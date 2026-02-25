export const DOTS = 'dots';

export function getPaginationItems(currentPage, totalPages, siblingCount = 1) {
  if (totalPages <= 1) return [1];

  const maxVisible = 2 * siblingCount + 5;
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 2);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;
  const items = [1];

  if (showLeftDots) items.push(DOTS);
  for (let page = leftSibling; page <= rightSibling; page += 1) items.push(page);
  if (showRightDots) items.push(DOTS);
  items.push(totalPages);

  return items;
}
