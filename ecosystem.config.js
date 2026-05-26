const { Server } = require('./Global/Settings/System');
module.exports = {
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    min_uptime: 1000,
    max_restarts: 10,
    
    apps: [
      {
        name: `${Server} Voucher`,
        namespace: `Server Registery Bot`,
        script: "Main.js",
        watch: false,
        exec_mode: "cluster",
        max_memory_restart: "2G",
        cwd: "./Server/J2pon-Main/Registery",
      },
      {
        name: `${Server} GuardOne`,
        namespace: `Server Guard Bot`,
        script: "main.js",
        watch: false,
        exec_mode: "cluster",
        max_memory_restart: "2G",
        cwd: "./Server/J2pon-Guard/Guard",
      },
      {
        name: `${Server} GuardTwo`,
        namespace: `Server Guard Bot`,
        script: "main.js",
        watch: false,
        exec_mode: "cluster",
        max_memory_restart: "2G",
        cwd: "./Server/J2pon-Guard/GuardTwo",
      },
      {
        name: `${Server} GuardThree`,
        namespace: `Server Guard Bot`,
        script: "main.js",
        watch: false,
        exec_mode: "cluster",
        max_memory_restart: "2G",
        cwd: "./Server/J2pon-Guard/GuardThree",
      },
      {
        name: `${Server} Moderation`,
        namespace: `Server Main Bot`,
        script: "Main.js",
        watch: false,
        exec_mode: "cluster",
        max_memory_restart: "2G",
        cwd: "./Server/J2pon-Main/Supervisor",
      },
      {
        name: `${Server} Welcomes`,
        namespace: `Server Welcome Bot`,
        script: "byc3g.js",
        watch: false,
        exec_mode: "cluster",
        max_memory_restart: "2G",
        cwd: "./Server/J2pon-Welcome/",
      },
    ]
  };




