const t1 = new Terminal();
t1.setHeight("470px");
t1.setWidth("100%");
document.getElementById("terminal").appendChild(t1.html);

const baseName = (path) => path.split("/").pop();
const dirName = (path) => path.split("/").slice(0, -1).join("/") || "/";
const isFile = (path) => files[path] && files[path]["body"];
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
  "/etc": {},
  "/var": {},
  "/var/log": {},
  "/var/log/messages": {
    "body": ["one", "two", "three"]
  },
  "/etc/password": {
    "body": ["# Don't look me!", "Flag{e1a2eag2ag2ag22h2d22hg}"]
  },
};

const flags = [
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
];

const hosts = {
  "192.168.21.1" : { name: "sfsv2101", telnet: true },
  "192.168.21.2" : { name: "sfsv2102", telnet: true },
  "192.168.21.3" : { name: "sfsv2103", telnet: true },
  "192.168.21.4" : { name: "sfsv2104", telnet: true },
  "192.168.11.1" : { name: "sfsv1101", telnet: true },
  "192.168.11.2" : { name: "sfsv1102", telnet: true },
  "192.168.11.3" : { name: "sfsv1103", telnet: true },
  "192.168.21.151" : { name: "sfrt0021" },
  "192.168.11.151" : { name: "sfrt0011" },
}

let pwd = "/";
let ip = "192.168.21.3";
let mask = "255.255.255.0";
let gataway = "192.168.21.151";
let user = "user";

const println = (line) => lines.push(line);
const hostname = () => hosts[ip].name;
const hello = () => `Hello ${user} from ${hostname()}`;
const lines = [hello(), "　"];

const commands = {
  dig: {
    run: function({ args }) {
      const name = args[2];
      println(";; QUESTION SECTION");
      println(`;${name} IN A`);
      for (const addr in hosts) {
        if (hosts[addr].name == name) {
          println(`${name} 2917 IN A ${addr}`);
          return;
        }
      }
      println("Nothing found.");
    }
  },
  telnet: {
    run: function({ args }) {
      const key = args[2];
      if (servers[key] && servers[key].telnet) {
        ip = key;
        hostname = servers[key].hostname;
        println("USER:");
        println("PASSWORD:");
        println(hello());
      } else {
        println("Request timed out.");
      }
    }
  },
  ping: {
    run: function({ args }) {
      println(`PING ${args[2]} 56(84) bytes of data.`);
      if (servers[args[2]]) {
        for (let i = 0; i < 4; i++) println(`64 bytes from ${args[2]}: icmp_seq=${i+1} ttl=128 time=0.124 ms`);
        println(`3 packets transmitted, 3 received, 0% packet loss, time 0.372 ms`);
      } else {
        for (let i = 0; i < 4; i++) println(`Request timed out`);
        println(`3 packets transmitted, 0 received, 100% packet loss.`);
      }
    }
  },
  ifconfig: {
    run: function() {
      println("eth0: flags=<UP,BRORSCAST,RUNNING,MULTICAST> mtu 1500");
      println(`inet ${net.ip} mask ${net.mask} gateway ${net.gataway}`);
    }
  },
  hostname: {
    run: function() {
      println(hostname);
    }
  },
  whoami: {
    run: function() {
      println(user);
    }
  },
  gettheflag: {
    run: function({ args }) {
      println(flags[++args[2]]);
    }
  },
  su: {
    usage: "su [USER]",
    description: "Change user.",
    run: function({args}) {
      user = args[2];
      println(`change user to ${user}`);
    },
  },
  help: {
    usage: "help [no option]",
    description: "Print command summary.",
    run: function () {
      for (const key in commands) {
        lines.push(`${key}: ${commands[key]["description"]}`);
      }
    }
  },
  man: {
    usage: "man [CMD]",
    description: "Print command usage.",
    run: function ({ args }) {
      const ref = commands[args[2]];
      if (ref) {
        lines.push(ref["usage"]);
        lines.push(ref["description"]);
      } else {
        lines.push(`No such command: ${args[2]}`);
      }
    }
  },
  cd: {
    usage: "cd [PATH]",
    description: "Change current directory.",
    run: function ({ path }) {
      if (isDir(path)) {
        pwd = path;
        lines.push(path);
      } else {
        lines.push(`${path}: No such directory`);
      }
    }
  },
  rm: {
    usage: "rm [PATH]",
    description: "Remove file or directory.",
    run: function ({ path }) {
      if (files[path]) {
        delete files[path];
        lines.push(`${path} was removed`);
      } else {
        lines.push(`${path}: No such file or directory`);
      }
    }
  },
  cp: {
    usage: "cp [SOURCE] [DEST]",
    description: "Copy file or directory from source to dest.",
    run: function ({ path, dest }) {
      if (files[path]) {
        files[dest] = files[path];
        lines.push(`${dest} was copyed from ${path}`);
      } else {
        lines.push(`${path}: No such file or directory`);
      }
    }
  },
  mv: {
    usage: "mv [SOURCE] [DEST]",
    description: "Move file or directory from source to dest.",
    run: function ({ path, dest }) {
      if (files[path]) {
        files[dest] = files[path];
        delete files[path];
        lines.push(`${dest} was moved from ${path}`);
      } else {
        lines.push(`${path}: No such file or directory`);
      }
    }
  },
  pwd: {
    usage: "pwd [no option]",
    description: "Print currenct working directory.",
    run: function () {
      lines.push(pwd);
    }
  },
  ls: {
    usage: "ls [no option]",
    description: "List files of current directory.",
    run: function () {
      let count = 0;
      for (const key in files) {
        if (pwd === dirName(key)) {
          lines.push(key);
          count++;
        }
      }
      lines.push(`total ${count}`);
    }
  },
  cat: {
    usage: "cat [FILE]",
    description: "Print file content.",
    run: function ({ path }) {
      if (files[path] && files[path]["body"]) {
        for (const line of files[path]["body"]) {
          lines.push(line);
        }
      } else {
        lines.push(`${path}: No such file or directory`)
      }
    }
  }
};

// alias
commands.nslookup = commands.dig;
commands.ipconfig = commands.ifconfig;
commands.dir = commands.ls;

const repl = function () {
  t1.clear();
  while (lines.length > 24) lines.shift();
  for (let i = 0; i < lines.length; i++) t1.print(lines[i]);

  t1.input("", function (input) {
    lines.push(input);

    let args = input.split(" ");
    let cmd = args[1] || "help";
    let path = absoluteName(args[2]);
    let dest = absoluteName(args[3]);

    if (commands[cmd]) {
      commands[cmd]["run"]({ args, cmd, path, dest });
    } else {
      lines.push(`Command '${cmd}' not found`);
    }
    lines.push("　");
    repl();
  });
};
repl();