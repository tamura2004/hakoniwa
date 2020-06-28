const Computer = function(hostname) {
  this.hostname = hostname;

  this.files = {
    "/": {},
    "/proc": { owner: "root" },
    "/usr": {},
    "/usr/bin": {},
    "/etc": {},
    "/etc/init.d": { owner: "root" },
    "/var": {},
    "/var/log": {},
    "/var/log/messages": { text: ["one", "two", "three"] },
  };
  
  this.files["/proc/ports"] = {
    ownter: "root",
    text: [
      "ftpd 21",
      "telnetd 23",
      "httpd 80",
    ],
  };
  
  this.files["/etc/init.d/services"] = {
    ownter: "root",
    text: [
      "ftpd down",
      "telnetd up",
      "httpd down",
    ],
  };
  
  this.files["/proc/ps"] = {
    ownter: "root",
    text: [
      "1001 telnetd",
    ],
  };
  
  this.files["/etc/hosts"] = {
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
  
  this.files["/etc/flags"] = {
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
  
  this.files["/etc/passwd"] = {
    owner: "root",
    text: [
      "root:drowssap",
      "guest:guest",
      "alice:terces",
      "bob:neddih",
    ],
  };
}

Computer.prototype.readlines = function(filename, sep = false) {
  const buf = [];
  if (!this.files[filename]) return buf;
  for (const line of this.files[filename].text) {
    if (sep) buf.push(line.split(sep));
    else buf.push(line);
  }
  return buf;
}

Computer.prototype.readToHash = function(filename, sep = /\s+/) {
  const buf = {};
  if (!this.files[filename]) return buf;
  for (const [key, value] of this.readlines(filename, sep)) buf[key] = value;
  return buf;
}

Computer.prototype.readToHashReverse = function(filename, sep = /\s+/) {
  const buf = {};
  if (!this.files[filename]) return buf;
  for (const [key, value] of this.readlines(filename, sep)) buf[value] = key;
  return buf;
}

Computer.prototype.touch = function(filename) {
  this.files[filename] = this.files[filename] || { text: [] };
}

Computer.prototype.write = function(filename, text) {
  this.touch(filename);
  this.files[filename].text = text;
}

Computer.prototype.writeAppend = function(filename, line) {
  this.touch(filename);
  this.files[filename].text.push(line);
}

Computer.prototype.writeFromHash = function(filename, hash) {
  for (const key in hash) this.writeAppend(filename, `${key} ${hash[key]}`);
}

Computer.prototype.getIP = function(name) {
  const hosts = this.readToHashReverse("/etc/hosts");
  return hosts[name];
}

Computer.prototype.getHost = function(ip) {
  const hosts = this.readToHash("/etc/hosts");
  return hosts[ip];
}

Computer.prototype.baseName = (path) => path.split("/").pop();
Computer.prototype.dirName = (path) => path.split("/").slice(0, -1).join("/") || "/";
Computer.prototype.isFile = function(path) {
  return this.files[path] && this.files[path].text;
}
Computer.prototype.isDir = function(path) {
  return !this.isFile(path);
}

Computer.prototype.absoluteName = function (path) {
  if (!path) return null;
  if (path === "..") return this.dirName(pwd);
  if (path.charAt() === "/") return path;
  if (pwd == "/") return pwd + path;
  return pwd + "/" + path;
}