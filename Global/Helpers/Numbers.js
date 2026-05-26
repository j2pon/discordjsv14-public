// Numbers helper functions
module.exports = {
    /**
     * Convert number to fancy format with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    toFancyNum: function (num) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        let parts = num.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    },

    /**
     * Convert number to short format (K, M)
     * @param {number} num - Number to format
     * @returns {string} Short formatted number
     */
    toShortNum: function (num) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        if (num >= 1000000) return Math.trunc(num / 1000000) + 'M';
        else if (num >= 1000) return Math.trunc(num / 1000) + 'K';
        else return num.toString();
    },

    /**
     * Format number with Turkish locale
     * @param {number} num - Number to format
     * @returns {string} Turkish formatted number
     */
    toTurkishNum: function (num) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        return num.toLocaleString('tr-TR');
    },

    /**
     * Check if value is a valid number
     * @param {any} value - Value to check
     * @returns {boolean} Is valid number
     */
    isValidNumber: function (value) {
        return !isNaN(value) && !isNaN(parseFloat(value)) && isFinite(value);
    },

    /**
     * Parse number safely
     * @param {any} value - Value to parse
     * @param {number} defaultValue - Default value if parsing fails
     * @returns {number} Parsed number or default
     */
    safeParse: function (value, defaultValue = 0) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }
};