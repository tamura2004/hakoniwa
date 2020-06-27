const t1 = new Terminal();
t1.setHeight("470px");
t1.setWidth("100%");
document.getElementById("terminal").appendChild(t1.html);

const baseName = function (path) {
  return path.split("/").pop();
}

const dirName = function (path) {
  return path.split("/").slice(0, -1).join("/") || "/";
}

const absoluteName = function (path) {
  if (!path) return null;
  if (path === "..") return dirName(pwd);
  if (path.charAt() === "/") return path;
  if (pwd == "/") return pwd + path;
  return pwd + "/" + path;
}

const isFile = function (path) {
  return files[path] && files[path]["body"];
}

const isDir = function (path) {
  return !isFile(path);
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

let pwd = "/";
let host = "localhost";
let user = "user";
const lines = [`Hello ${user} from ${host}`, "　"];
const println = function (line) {
  lines.push(line);
}

const commands = {
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