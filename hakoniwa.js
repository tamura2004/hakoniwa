const t1 = new Terminal();
t1.setHeight("100%");
t1.setWidth("100%");
document.getElementById("terminal").appendChild(t1.html);

let client = new Computer("localhost");
let user = "guest";
let pwd = "/";
let mask = "255.255.255.0";
let gataway = "192.168.0.100";

const hello = () => `Hello ${user} from ${client.hostname}`;
const lines = [hello(), "　"];
const println = (line) => lines.push(line);
const randomId = () => Math.floor(Math.random() * 9000 + 1000);

const commands = {
  service: {
    usage: "service [DAEMON NAME] [start|stop|status]",
    run: function({it, that}) {
      const ports = client.readToHash("/proc/ports");
      if (!ports[it]) return `No such service '${it}'`;

      const exec = {
        start: function() {
          const services = client.readToHash("/etc/init.d/services");
          if (services[it] === "up") return "Service already started";
          
          services[it] = "up";
          client.writeFromHash("/etc/init.d/services", services);
          client.writeAppend("/proc/ps", `${randomId()} ${it}`);
          return `${it} is start`;
        },
        stop: function() {
          const services = client.readToHash("/etc/init.d/services");
          if (services[it] === "down") return "Service already stoped";
          
          services[it] = "down";
          client.writeFromHash("/etc/init.d/services", services);
          
          const text = client.readlines("/proc/ps").filter(line => !line.includes(it));
          client.write("/proc/ps", text);
          return `${it} is stop`;
        },
        status: function() {
          for (const line of client.readlines("/etc/init.d/services")) println(line);
        },
      };

      return exec[that]();
    },
  },
  netstat: {
    run: function() {
      const ports = client.readToHash("/proc/ports");
      println("PROTOCOL LOCALADDRESS:PORT FOREIGNADDRESS STATUS PROCESS");
      for (const [pid, name] of client.readlines("/proc/ps", /\s+/)) {
        println(`TCP ${client.getIP(client)}:${ports[name]} 0.0.0.0:0 LISTENING ${name}`);
      }
    }
  },
  kill: {
    run: function({ it }) {
      const ps = client.readToHash("/proc/ps");
      if (!ps[it]) return `No such process id '${it}'`;

      delete ps[it];
      client.writeFromHash("/proc/ps", ps);
      return `Kill process '${it}'`;
    },
  },
  ps: {
    run: function() {
      println("PID COMMAND");
      for (const [pid, name] of client.readlines("/proc/ps", /\s+/)) println(`${pid} /usr/bin/${name}`);
    },
  },
  adduser: {
    usage: "adduser [USERNAME] [PASSWORD]",
    description: "Add a user to the system.",
    run: function({ it, that }) {
      if (!that) return "Missing params.";

      client.writeAppend("/etc/passwd",`${it}:${that}`);
      return `Create user: ${it}`;
    }
  },
  dig: {
    usage: "dig [HOSTNAME]",
    description: "Print DNS lookup.",
    run: function({ it }) {
      println(";; QUESTION SECTION");
      println(`;${it} IN A`);
      const ip = client.getIP(it);
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

      const host = client.getHost(it);
      if (!host) return `Invalid IP ADDRESS '${it}'`;

      const users = client.readToHash("/etc/passwd", /:+/);
      if (!users[that]) retuen `Invalid user '${that}'`;
      if (users[that] !== them) `Invalid password`;

      client = new Computer(host);
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
      const host = client.getHost(it);
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
      const ip = client.getIP(client);
      println("eth0: flags=<UP,BRORSCAST,RUNNING,MULTICAST> mtu 1500");
      println(`inet ${ip} mask ${mask} gateway ${gataway}`);
    }
  },
  hostname: {
    run: function() {
      println(client.hostname);
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
      const users = client.readToHash("/etc/passwd", /:/);
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
      if (!client.isDir(path)) return `No such file or directory '${path}'`;
      
      pwd = path;
      println(path);
    }
  },
  rm: {
    usage: "rm [PATH]",
    description: "Remove file or directory.",
    run: function ({ path }) {
      const file = client.files[path];
      if (!file) return `No such file or directory '${path}'`;
      
      const { owner } = file;
      if (owner && owner !== user) return "Permission denied";

      delete client.files[path];
      return `${path} was removed`;
    }  
  },  
  cp: {
    usage: "cp [SOURCE] [DEST]",
    description: "Copy file or directory from source to dest.",
    run: function ({ path, dest }) {
      const file = client.files[path];
      if (!file) return `No such file or directory '${path}'`;
      
      const { owner } = file;
      if (owner && owner !== user) return "Permission denied";

      client.files[dest] = file;;
      return `${dest} was copyed from ${path}`;
    }  
  },  
  mv: {
    usage: "mv [SOURCE] [DEST]",
    description: "Move file or directory from source to dest.",
    run: function ({ path, dest }) {
      const file = client.files[path];
      if (!file) return `No such file or directory '${path}'`;
      
      const { owner } = file;
      if (owner && owner !== user) return "Permission denied";

      client.files[dest] = file;
      delete client.files[path];
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
      for (const key in client.files) {
        if (pwd === client.dirName(key)) {
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
      const file = client.files[path];
      if (!file) return `No such file or directory '${path}'`;

      const { owner } = file;
      if (owner && owner !== user) return "Permission denied";

      for (const line of client.readlines(path)) println(line);
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
  client.files["/usr/bin/" + cmd] = {};
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
    println("$ " + input);

    let args = input.split(" ");
    let cmd = args[0];
    let it = args[1];
    let that = args[2];
    let them = args[3];
    let path = client.absoluteName(args[1]);
    let dest = client.absoluteName(args[2]);

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