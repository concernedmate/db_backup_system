const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const { system_configs } = require('./config.js');
const readline = require('readline')
const { SystemEntity } = require('./entities')

const clearLastLine = () => {
    readline.moveCursor(process.stdout, 0, -1)  // up one line
    readline.clearLine(process.stdout, 1)       // from cursor to end
}

const read_args = () => {
    /**
     * @type {SystemEntity[]}
     */
    console.log(`\x1B[2J\x1B[H`) // clear console
    const process_db = []
    const read = process.argv;
    if (read[2].length > 0 && read[2][0] == '-') {
        const sliced = read[2].slice(1)
        switch (sliced) {
            case 'all': {
                return {arg: sliced, systems: system_configs}
            }
            case 'only': {
                for (let i = 3; i < read.length; i++) {
                    process_db.push(system_configs.find((val) => { return val.system_name == read[i] }))
                }
                return {arg: sliced, systems: process_db}
            }
            case 'except': {
                for (let i = 3; i < read.length; i++) {
                    if (system_configs.find((val) => { return val.system_name == read[i] }) == undefined) {
                        process_db.push(read[i])
                    }
                }
                return {arg: sliced, systems: process_db}
            }
            case 'ls': {
                console.log('Systems List:')
                for (let i = 0; i < system_configs.length; i++) {
                    console.log(`${i + 1}. ${system_configs[i].system_name}`)
                }
                return {arg: sliced, systems: []}
            }
            default:
                console.log("Arguments unknown!")
                process.exit()
        }
    } else {
        console.log("Arguments needed!")
        process.exit()
    }
}

/**
 * 
 * @param {SystemEntity} system 
 * @param {string} dir
 * @returns {Promise<string>}
 */
const backup = async (system, dir) => {
    const ssh_config = system.ssh_config
    const mysql_config = system.mysql_config

    const date = new Date();
    const datetime = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    date.setDate(date.getDate() - 1)
    const yesterday = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

    let cmd = ``
    cmd += `ssh -i ${ssh_config.ssh_key_path} ${ssh_config.ssh_host} ${ssh_config.port == null ? '' : `-p ${ssh_config.port}`} `
    cmd += `"${mysql_config.mysqldump} -P ${mysql_config.port} -u ${mysql_config.user} -p${mysql_config.password} ${mysql_config.database}`
    cmd += `--no-tablespaces --single-transaction > bak_${system.system_name}_${datetime}.sql"`

    const dump = child_process.exec(cmd)
    await new Promise((resolve, reject) => {
        dump.stdout.on('error', (error) => {
            reject(error);
        });
        dump.stdout.on('finish', () => {
            console.log(`Backup ${mysql_config.database} on ${ssh_config.ssh_host} done`)
            resolve()
        });
    })


    let pipecmd = ``
    pipecmd += `scp -i ${ssh_config.ssh_key_path} ${ssh_config.port == null ? '' : `-P ${ssh_config.port}`} ${ssh_config.ssh_host}:bak_${system.system_name}_${datetime}.sql ${path.join(dir, `bak_${system.system_name}_${datetime}.sql`)}`
    const pipe = child_process.exec(pipecmd)

    console.log(`Piping bak_${system.system_name}_${datetime}.sql to local server...`)
    await new Promise((resolve, reject) => {
        pipe.stdout.on('error', (error) => {
            reject(error);
        });
        pipe.stdout.on('finish', () => {
            clearLastLine()
            console.log(`Backup ${mysql_config.database} finished piping to ${path.join(dir, `bak_${system.system_name}_${datetime}.sql`)}`)
            resolve()
        });
    })

    let cleanupcmd = ``
    cleanupcmd += `ssh -i ${ssh_config.ssh_key_path} ${ssh_config.ssh_host} ${ssh_config.port == null ? '' : `-p ${ssh_config.port}`} `
    cleanupcmd += `"rm bak_${system.system_name}_${yesterday}.sql"`
    const cleanup = child_process.exec(cleanupcmd)
    await new Promise((resolve, reject) => {
        cleanup.stdout.on('error', (error) => { reject(error); });
        cleanup.stdout.on('finish', () => { resolve() });
    })

    return path.join(dir, `bak_${system.system_name}_${datetime}.sql`);
}

/**
 * 
 * @param {SystemEntity[]} systems 
 * @returns {Promise<void>}
 */
const start_backup = async (systems) => {
    console.log(`Processing configs:`)
    for (let i = 0; i < systems.length; i++) {
        console.log(`${i}.`, systems[i].system_name)
    }

    const generated = []
    for (let idx = 0; idx < systems.length; idx++) {
        const system = systems[idx]

        switch (system.type) {
            case 'SSH': {
                if (!fs.existsSync(path.join(__dirname, 'backup', system.system_name))) {
                    fs.mkdirSync(path.join(__dirname, 'backup', system.system_name), { recursive: true })
                }

                try {
                    const bak_path = await backup(system, path.join(__dirname, 'backup', system.system_name));

                    if (system.callback != null) {
                        try { await system.callback(bak_path) } catch (err) { console.log(err) }
                    }

                    generated.push(system.system_name);
                } catch (error) {
                    console.log(`Failed to generate backup for: ${system.system_name}`, error);
                }
                break;
            }

            case 'CONN': {
                // TODO
                console.log('Not implemented!')
                break;
            }

            default:
                console.log('Invalid system type')
                break;
        }
    }

    console.log(generated)
    process.exit();
}

// START TOOL
const result = read_args()
if (result.arg != 'ls'){
    start_backup(result.systems)
}