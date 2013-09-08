/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 9/4/13
 * Time: 7:06 PM
 */

console.log('-- INIT --');
window.onerror = function (e, url, line) {
    console.log('-- ERROR --');
    console.warn(e, url, ':', line);
    window.e = e;
    return true;
};
