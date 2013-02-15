function formatDateString(d) {
    function pad(n) { return n < 10 ? '0' + n : n }
    return pad(d.getUTCDate()) + '/'
        + pad(d.getUTCMonth() + 1) + '/'
        + d.getUTCFullYear() + ' '
        + pad(d.getUTCHours()) + ':'
        + pad(d.getUTCMinutes()) + ':'
        + pad(d.getUTCSeconds());
}

function formatTimeString(d) {
    function pad(n) { return n < 10 ? '0' + n : n }
    return pad(d.getUTCHours()) + ':'
        + pad(d.getUTCMinutes()) + ':'
        + pad(d.getUTCSeconds());
}