const t1 = new Terminal();
t1.setHeight("100%");
t1.setWidth("100%");
document.getElementById("terminal").appendChild(t1.html);

const baseName = (path) => path.split("/").pop();
const dirName = (path) => path.split("/").slice(0, -1).join("/") || "/";
const isFile = (path) => files[path] && files[path].body;
const isDir = (path) => !isFile(path);

const absoluteName = function (path) {
  if (!path) return null;
  if (path === "..") return dirName(pwd);
  if (path.charAt() === "/") return path;
  if (pwd == "/") return pwd + path;
  return pwd + "/" + path;
}

const files = {
  "/": {},
  "/proc": { owner: "root" },
  "/usr": {},
  "/usr/bin": {},
  "/etc": {},
  "/etc/init.d": { owner: "root" },
  "/var": {},
  "/var/log": {},
  "/var/log/messages": { body: ["one", "two", "three"] },
};

files["/proc/ports"] = {
  ownter: "root",
  text: [
    "ftpd 21",
    "telnetd 23",
    "httpd 80",
  ],
};

files["/etc/init.d/services"] = {
  ownter: "root",
  text: [
    "ftpd down",
    "telnetd up",
    "httpd down",
  ],
};

files["/proc/ps"] = {
  ownter: "root",
  text: [
    "1001 telnetd",
  ],
};

files["/etc/hosts"] = {
  text: [
    "192.168.21.3   localhost",
    "192.168.21.1   server211",
    "192.168.21.2   server212",
    "192.168.21.3   server213",
    "192.168.21.100 router210",
    "192.168.0.1    server001",
    "192.168.0.2    server002",
    "192.168.0.3    server003",
    "192.168.0.100  router000",
  ],
};

files["/etc/flags"] = {
  owner: "root",
  text: [
    "22811dd94d65037ef86535740b98dec8",
    "0a840ef45467fb3932dbf2c2896c5cbf",
    "bcd31c714bca2c41ffca31bd03003311",
    "e7e94d9ef1edaf2c6c55e9966b551295",
    "axurolifczwtqnkhebyvspmjgdaxurol",
    "0d815852151a1a5a24965765c165742d",
    "97f014516561ef487ec368d6158eb3f4",
    "aqws",
    "51be5f1bee407854a1442ae9e1397d3b",
    "thequickbrownfoxjumpsoverthelazydog",
  ],
};

files["/etc/passwd"] = {
  owner: "root",
  text: [
    "root:drowssap",
    "guest:guest",
    "alice:terces",
    "bob:neddih",
  ],
};

let client = "localhost";
let user = "guest";
let pwd = "/";
let mask = "255.255.255.0";
let gataway = "192.168.0.100";

const readlines = function(filename, sep = false) {
  const buf = [];
  if (!files[filename]) return buf;
  for (const line of files[filename].text) {
    if (sep) buf.push(line.split(sep));
    else buf.push(line);
  }
  return buf;
}

const readToHash = function(filename, sep = /\s+/) {
  const buf = {};
  if (!files[filename]) return buf;
  for (const [key, value] of readlines(filename, sep)) buf[key] = value;
  return buf;
}

const readToHashReverse = function(filename, sep = /\s+/) {
  const buf = {};
  if (!files[filename]) return buf;
  for (const [key, value] of readlines(filename, sep)) buf[value] = key;
  return buf;
}

const touch = function(filename) {
  files[filename] = files[filename] || { text: [] };
}

const write = function(filename, text) {
  touch(filename);
  files[filename].text = text;
}

const writeAppend = function(filename, line) {
  touch(filename);
  files[filename].text.push(line);
}

const writeFromHash = function(filename, hash) {
  for (const key in hash) writeAppend(filename, `${key} ${hash[key]}`);
}

const getIP = function(name) {
  const hosts = readToHashReverse("/etc/hosts");
  return hosts[name];
}

const getHost = function(ip) {
  const hosts = readToHash("/etc/hosts");
  return hosts[ip];
}

const hello = () => `Hello ${user} from ${client}`;

const lines = [hello(), "　"];
const println = (line) => lines.push(line);
const randomId = () => Math.floor(Math.random() * 9000 + 1000);

const commands = {
  service: {
    usage: "service [DAEMON NAME] [start|stop|status]",
    run: function({it, that}) {
      const ports = readToHash("/proc/ports");
      if (!ports[it]) return `No such service '${it}'`;

      const exec = {
        start: function() {
          const services = readToHash("/etc/init.d/services");
          if (services[it] === "up") return "Service already started";
          
          services[it] = "up";
          writeFromHash("/etc/init.d/services", services);
          writeAppend("/proc/ps", `${randomId()} ${it}`);
          return `${it} is start`;
        },
        stop: function() {
          const services = readToHash("/etc/init.d/services");
          if (services[it] === "down") return "Service already stoped";
          
          services[it] = "down";
          writeFromHash("/etc/init.d/services", services);
          
          const text = readlines("/proc/ps").filter(line => !line.includes(it));
          write("/proc/ps", text);
          return `${it} is stop`;
        },
        status: function() {
          for (const line of readlines("/etc/init.d/services")) println(line);
        },
      };

      return exec[that]();
    },
  },
  netstat: {
    run: function() {
      const ports = readToHash("/proc/ports");
      println("PROTOCOL LOCALADDRESS:PORT FOREIGNADDRESS STATUS PROCESS");
      for (const [pid, name] of readlines("/proc/ps", /\s+/)) {
        println(`TCP ${getIP(client)}:${ports[name]} 0.0.0.0:0 LISTENING ${name}`);
      }
    }
  },
  kill: {
    run: function({ it }) {
      const ps = readToHash("/proc/ps");
      if (!ps[it]) return `No such process id '${it}'`;

      delete ps[it];
      writeFromHash("/proc/ps", ps);
      return `Kill process '${it}'`;
    },
  },
  ps: {
    run: function() {
      println("PID COMMAND");
      for (const [pid, name] of readlines("/proc/ps", /\s+/)) println(`${pid} /usr/bin/${name}`);
    },
  },
  adduser: {
    usage: "adduser [USERNAME] [PASSWORD]",
    description: "Add a user to the system.",
    run: function({ it, that }) {
      if (!that) return "Missing params.";

      writeAppend("/etc/passwd",`${it}:${that}`);
      return `Create user: ${it}`;
    }
  },
  dig: {
    usage: "dig [HOSTNAME]",
    description: "Print DNS lookup.",
    run: function({ it }) {
      println(";; QUESTION SECTION");
      println(`;${it} IN A`);
      const ip = getIP(it);
      if (ip) {
        println(`${it} 2917 IN A ${ip}`);
      } else {
        println("Nothing found.");
      }
    }
  },
  telnet: {
    usage: "telnet [IP ADDR] [USERNAME] [PASSWORD]",
    description: "User interface to the TELNET protocol.",
    run: function({ it, that, them }) {
      if (!them) return "Missing params.";

      const host = getHost(it);
      if (!host) return `Invalid IP ADDRESS '${it}'`;

      const users = readToHash("/etc/passwd", /:+/);
      if (!users[that]) retuen `Invalid user '${that}'`;
      if (users[that] !== them) `Invalid password`;

      client = host;
      user = that;
      println(`USER: ${that}`);
      println(`PASSWORD: *****`);
      return hello();
    }
  },
  ping: {
    usage: "ping [IP ADDR]",
    description: "Send ICMP ECHO_REQUEST to ip address.",
    run: function({ it }) {
      println(`PING ${it} 56(84) bytes of data.`);
      const host = getHost(it);
      if (host) {
        for (let i = 0; i < 4; i++) println(`64 bytes from ${it}: icmp_seq=${i+1} ttl=128 time=0.124 ms`);
        println(`3 packets transmitted, 3 received, 0% packet loss, time 0.372 ms`);
      } else {
        for (let i = 0; i < 4; i++) println(`Request timed out`);
        println(`3 packets transmitted, 0 received, 100% packet loss.`);
      }
    }
  },
  ifconfig: {
    usage: "ifconfig [NO OPTION]",
    description: "Print network configuration.",
    run: function() {
      const ip = getIP(client);
      println("eth0: flags=<UP,BRORSCAST,RUNNING,MULTICAST> mtu 1500");
      println(`inet ${ip} mask ${mask} gateway ${gataway}`);
    }
  },
  hostname: {
    run: function() {
      println(client);
    }
  },
  whoami: {
    run: function() {
      println(user);
    }
  },
  su: {
    usage: "su [USERNAME] [PASSWORD]",
    run: function({ it, that }) {
      const users = readToHash("/etc/passwd", /:/);
      if (!users[it]) return `No such user '${it}'`;
      if (users[it] !== that) return `Invalid password`;

      user = it;
      return hello();
    },
  },
  help: {
    run: function () {
      for (const key in commands) {
        const { description } = commands[key];
        if (description) println(`${key}: ${description}`);
      }
    }
  },
  man: {
    run: function ({ it }) {
      const { usage, description } = commands[it];
      if (!usage) return `No such command '${it}'`;

      println(usage);
      println(description);
    }
  },
  cd: {
    usage: "cd [PATH]",
    description: "Change current directory.",
    run: function ({ path }) {
      if (!isDir(path)) return `No such file or directory '${path}'`;
      
      pwd = path;
      println(path);
    }
  },
  rm: {
    usage: "rm [PATH]",
    description: "Remove file or directory.",
    run: function ({ path }) {
      const file = files[path];
      if (!file) return `No such file or directory '${path}'`;
      
      const { owner } = file;
      if (owner && owner !== user) return "Permission denied";

      delete files[path];
      return `${path} was removed`;
    }  
  },  
  cp: {
    usage: "cp [SOURCE] [DEST]",
    description: "Copy file or directory from source to dest.",
    run: function ({ path, dest }) {
      const file = files[path];
      if (!file) return `No such file or directory '${path}'`;
      
      const { owner } = file;
      if (owner && owner !== user) return "Permission denied";

      files[dest] = file;;
      return `${dest} was copyed from ${path}`;
    }  
  },  
  mv: {
    usage: "mv [SOURCE] [DEST]",
    description: "Move file or directory from source to dest.",
    run: function ({ path, dest }) {
      const file = files[path];
      if (!file) return `No such file or directory '${path}'`;
      
      const { owner } = file;
      if (owner && owner !== user) return "Permission denied";

      files[dest] = file;
      delete files[path];
      return `${dest} was moved from ${path}`;
    }  
  },  
  pwd: {
    usage: "pwd [no option]",
    description: "Print currenct working directory.",
    run: function () {
      println(pwd);
    }  
  },  
  ls: {
    usage: "ls [no option]",
    description: "List files of current directory.",
    run: function () {
      let count = 0;
      for (const key in files) {
        if (pwd === dirName(key)) {
          println(key);
          count++;
        }  
      }  
      println(`total ${count}`);
    }  
  },  
  cat: {
    usage: "cat [FILE]",
    description: "Print file content.",
    run: function ({ path }) {
      const file = files[path];
      if (!file) return `No such file or directory '${path}'`;

      const { owner } = file;
      if (owner && owner !== user) return "Permission denied";

      for (const line of readlines(path)) println(line);
    }
  },
  cls: {
    run: function() {
      while (lines.length > 0) lines.shift();
    }
  },
  which: {
    run: function({ it }) {
      if (!commands[it]) return "Nothing found.";
      println(`/usr/bin/${it}`);
    }
  }
};

// alias
commands.nslookup = commands.dig;
commands.ipconfig = commands.ifconfig;
commands.dir = commands.ls;
commands.ll = commands.ls;
commands.clear = commands.cls;
commands.where = commands.which;
commands.type = commands.cat;
commands.head = commands.cat;
commands.tail = commands.cat;
commands.less = commands.cat;
commands.vi = commands.cat;

// add exec file
for (const cmd in commands) {
  files["/usr/bin/" + cmd] = {};
}

const scrollOut = function() {
  const h = t1.html.clientHeight;
  while (lines.length > Number((h - 20) / 20) - 1) lines.shift();
};

const repl = function () {
  t1.clear();
  scrollOut();
  for (let i = 0; i < lines.length; i++) t1.print(lines[i]);

  t1.input("", function (input) {
    println(input);

    let args = input.split(" ");
    let cmd = args[1];
    let it = args[2];
    let that = args[3];
    let them = args[4];
    let path = absoluteName(args[2]);
    let dest = absoluteName(args[3]);

    if (commands[cmd]) {
      const line = commands[cmd]["run"]({ args, cmd, it, that, them, path, dest });
      if (line) println(line);
      println("　");
    } else if (cmd !== ""){
      println(`Command '${cmd}' not found`);
    }
    repl();
  });
};
repl();