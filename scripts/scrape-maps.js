const minQuery = parseInt('100', 36);
const maxQuery = parseInt('zzz', 36);

/**
 * Create all possible string combinations from min ('100') to max ('zzz`).
 */
const queryMap = Array(maxQuery - minQuery + 1)
  .fill(null)
  .map((_u, index) => (index + minQuery).toString(36))

console.log(queryMap, queryMap.length)

