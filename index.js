const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const { system_configs } = require('./config.js');
const { SystemEntity, MySQLConfig, SSHConfig } = require('./entities')

const read_args = () => {
    /**
     * @type {SystemEntity[]}
     */
    console.log(`\x1B[2J\x1B[H`) // clear console
    let process_db = []
    const read = process.argv;
    if (read[2].length > 0 && read[2][0] == '-') {
        const sliced = read[2].slice(1)
        switch (sliced) {
            case 'all': {
                process_db = system_configs
                console.log(`Processing all configs:`)
                for (let i = 0; i < process_db.length; i++) {
                    console.log(`${i}.`, process_db[i].system_name)
                }
                break;
            }
            case 'only': {
                for (let i = 3; i < read.length; i++) {
                    process_db.push(system_configs.find((val) => {
                        return val.system_name == read[i]
                    }))
                }
                break;
            }
            default:
                console.log("Arguments unknown!")
                process.exit()
        }
    } else {
        console.log("Arguments needed!")
        process.exit()
    }

    return process_db
}

/**
 * 
 * @param {SSHConfig} ssh_config 
 * @param {MySQLConfig} mysql_config 
 * @param {string} dir
 * @returns {Promise<void>}
 */
const backup = async (ssh_config, mysql_config, dir) => {
    const date = new Date();
    const datetime = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

    let cmd = ``
    cmd += `ssh -i ${ssh_config.ssh_key_path} ${ssh_config.ssh_host} ${ssh_config.port == null ? '' : `-p ${ssh_config.port}`} `
    cmd += `"mysqldump -P ${mysql_config.port} -u ${mysql_config.user} -p${mysql_config.password} ${mysql_config.database} --no-tablespaces --single-transaction" `

    const dump = child_process.exec(cmd)
    const wstream = fs.createWriteStream(path.join(dir, `bak_${datetime}.sql`));

    return new Promise((resolve, reject) => {
        // we pipe manual
        let written = 0;
        dump.stdout.on('data', (data) => {
            wstream.write(data, () => {
                written += data.length;
                console.log(`Schema ${mysql_config.database} processed: ${written}`);
            });
        })
        dump.stdout.on('error', (error) => {
            reject(`Error!: ${error}`);
        });
        dump.stdout.on('finish', () => {
            resolve();
        });
    })
}

/**
 * 
 * @param {SystemEntity[]} systems 
 * @returns {Promise<void>}
 */
const start_backup = async (systems) => {
    const generated = []
    for (let idx = 0; idx < systems.length; idx++) {
        const system = systems[idx]

        if (system.type == 'SSH') {
            if (!fs.existsSync(path.join(__dirname, 'backup', system.system_name))) {
                fs.mkdirSync(path.join(__dirname, 'backup', system.system_name), { recursive: true })
            }

            try {
                await backup(
                    system.ssh_config,
                    system.mysql_config,
                    path.join(__dirname, 'backup', system.system_name)
                );
                generated.push(system.system_name);
            } catch (error) {
                console.log(`Failed to generate backup for: ${system.system_name}`, error);
            }
        }
    }

    console.log(generated)
    process.exit();
}

start_backup(read_args())