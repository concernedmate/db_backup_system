const child_process = require('child_process');

/**
 * 
 * @param {string} script example "echo :bak" -> "echo curr_dir/backup/system_name/bak_datetime.sql"
 * @returns {Function}
 */
const executeScript = (script) => {
    return async (bak) => {
        console.log(`Running executeScript for ${bak}...`)
        const dump = child_process.spawn(script.replaceAll(":bak", bak))

        await new Promise((resolve, reject) => {
            dump.stdout.on('data', (data) => {
                console.log("executeScript stdout: ", data.toString())
            })
            dump.stderr.on('data', (data) => {
                console.log("executeScript stderr: ", data.toString())
            });
            dump.on('close', (code) => {
                if (code != 0) { reject(`Errorred with exit code ${code}`) }
                resolve(`Done with exit code ${code}`)
            });
        })
    }
}

module.exports = { executeScript }