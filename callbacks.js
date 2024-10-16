const child_process = require('child_process');

/**
 * 
 * @param {string} script example "echo :bak" -> "echo curr_dir/backup/system_name/bak_datetime.sql"
 * @returns {Function}
 */
const executeScript = (script) => {
    return async (bak) => {
        console.log(`Running executeScript for ${bak}...`)

        const arr = script.replaceAll(":bak", bak).split(" ")
        if (arr.length == 0) { throw new Error("Invalid script") }

        const params = []
        let temp = []
        for (let i = 1; i < arr.length; i++) {
            if (arr[i].at(0) == `"`) {
                temp.push(arr[i])
            } else {
                if (temp.length != 0) {
                    temp.push(arr[i])
                    if (arr[i].at(-1) == `"`) {
                        params.push(temp.join(" "))
                        temp = []
                    }
                } else {
                    params.push(arr[i])
                }
            }
        }
        if (temp.length > 0) { throw new Error("Invalid script") }

        const dump = child_process.spawn(arr[0], params)

        await new Promise((resolve, reject) => {
            dump.stdout.on('data', (data) => {
                console.log(data.toString())
            })
            dump.stderr.on('data', (data) => {
                console.log(data.toString())
            });
            dump.on('error', (err) => {
                reject(`Errorred: ${err}`)
            })
            dump.on('close', (code) => {
                if (code != 0) { reject(`Errorred with exit code ${code}`) }
                resolve(`Done with exit code ${code}`)
            });
        })
    }
}

module.exports = { executeScript }