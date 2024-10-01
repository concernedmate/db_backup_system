const http = require("http")
const fs = require("fs")
const path = require("path")
const { system_configs } = require('../config');

http.createServer(async (req, res) => {
    try {
        const file = await fs.promises.readFile(path.join(__dirname, '.', 'index.html'))
        const backups = await fs.promises.readdir(path.join(__dirname, '..', 'backup'))

        /**
         * @type {{system: string, last_file: string}[]}
         */
        const data = []
        for (let i = 0; i < backups.length; i++) {
            if (system_configs.find((val) => { return val.system_name == backups[i] }) != undefined) {
                const system_backup = await fs.promises.readdir(path.join(__dirname, '..', 'backup', backups[i]))
                if (system_backup.length == 0) {
                    data.push({ system: backups[i], last_file: 'Not Found!' })
                } else {
                    system_backup.sort((a, b) => {
                        if ((a.split('_')).length < 2) { return -1; }
                        if ((b.split('_')).length < 2) { return 1; }
                        return (new Date((a.split('_'))[1]) - new Date((b.split('_'))[1]))
                    })
                    data.push({ system: backups[i], last_file: system_backup[0] })
                }
            }
        }

        const html = (file.toString()).split('{--REPLACE--}')
        let data_string = ``
        for (let i = 0; i < data.length; i++) {
            data_string += `
            <div class="card">
                <h2>${data[i].system}</h2>
                <p>Last Backup: ${data[i].last_file}</p>
                <button class="btn" onclick="test('${data[i].system}')">Test Backup</button>
                <button class="btn" onclick="backup('${data[i].system}')">Backup Now</button>
            </div> \n`
        }

        res.writeHead(200)
        res.write(html[0] + data_string + html[1], "binary")
    } catch (error) {
        res.writeHead(404)
        res.write("Not Found!")
    }
    res.end()
}).listen(3500)