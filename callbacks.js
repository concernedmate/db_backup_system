const child_process = require('child_process');

/**
 * 
 * @param {string} script example "echo :bak" -> "echo curr_dir/backup/system_name/bak_datetime.sql"
 * @returns {Function}
 */
const executeScript = (script) => {
    return async (bak) => {
        const dump = child_process.spawn(script.replaceAll(":bak", bak))

        await new Promise((resolve, reject) => {
            dump.stdout.on('error', (error) => {
                reject(error);
            });
            dump.stdout.on('finish', () => {
                console.log(`Done callback for ${bak}`)
                resolve()
            });
        })
    }
}

module.exports = { executeScript }