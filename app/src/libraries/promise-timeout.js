Promise.prototype.timeout = function (ms) {
    var timeoutId = null;
    var timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            timeoutId = null;
            reject(new Error('Timeout'));
        }, ms);
    });

    function stopTimeout() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }

    var pRace = Promise.race([this, timeoutPromise]);
    pRace.then(stopTimeout).catch(stopTimeout);
    return pRace;
}
