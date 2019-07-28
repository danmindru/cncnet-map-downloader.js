/**
 * This could be an alternative to using the search input that returns all maps.
 * It creates all possible string combinations from min ('100') to max ('zzz`) and try to guess map names.
 *
 * However, since now there is a proper list endpoint, this is not used.
 * It might be relevant again in the future.
 */
const minQuery = parseInt('100', 36);
const maxQuery = parseInt('zzz', 36);

module.exports = {
  queryMap: Array(maxQuery - minQuery + 1)
    .fill(null)
    .map((_u, index) => (index + minQuery).toString(36))
};
