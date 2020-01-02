const gulp = require("gulp");
const exec = require("child_process").exec;
const path = require("path");
const shell = require("shelljs");
var GulpSSH = require('gulp-ssh');
// const runSequence = require('gulp-sequence')

// 创建远程服务器
let ip_179 = '192.168.22.179'
let ip_137 = '192.168.0.137'
let remotServer = {
  config: {
    // host: ip_179,
    // port: 22,
    // username: 'root',
    // password: '123456'
    host: ip_137,
    port: 22,
    username: 'root',
    password: 'test-123'
  },
  dir: '/ops',
  rm: [
    `rm -rf /ops/export`
  ],
  tar: [
    'cd /ops/',
    'tar zxvf export-ssh.tar.gz'
  ],
  shell: [
    // 'cd /ops/export/node_modules/.bin',
    // 'chmod 777 egg-scripts',
    'cd /ops/export/',
    `sed '3d' .env -i`,
    `sed '3i HOST_NAME=${ip_137}' .env -i`
    // 'npm stop',
    // 'npm start'
  ]
}
var gulpSSH = new GulpSSH({
  ignoreErrors: false,
  sshConfig: remotServer.config
})

const tarName = path.join(__dirname, `devops-${new Date().getTime()}.tar.gz`);
let clientPackageJson = require("../client/package.json").dependencies;
let serverPackageJson = require("../server/package.json").dependencies;
let dependencies = [];
for (const k in clientPackageJson) {
  dependencies.push(`${k}@${clientPackageJson[k]}`);
}
for (const k in serverPackageJson) {
  dependencies.push(`${k}@${serverPackageJson[k]}`);
}
// 清除和创建相关文件夹
gulp.task("cleanup", function(cb) {
  console.log(process.env.NODE_ENV)
  if (process.env.NODE_ENV !== 'production') {
    shell.rm("-rf", "../client/node_modules")
  }
  shell.rm("-rf", "./export/*");
  shell.rm("-rf", "./devops-*");
  shell.rm("-rf", "./export-ssh*");
  shell.mkdir('-p', './export');
  cb();
});
// 安装 client 和 server 的生产依赖
gulp.task("install-production-dependencies", ["cleanup"], function(cb) {
  exec(`npm install -S ${dependencies.join(" ")}`, function(err) {
    if (err) {
      console.log("install-production-dependencies\n" + err);
      return cb(err);
    }
    cb();
  });
});
// 安装 client 的整体依赖
gulp.task(
  "install-client-dependencies",
  ["install-production-dependencies"],
  function(cb) {
    exec(`cd ../client && npm install`, function(err) {
      if (err) {
        console.log("install-client-dependencies\n" + err);
        return cb(err);
      }
      cb();
    });
  }
);
// build client
gulp.task("build-client", ["install-client-dependencies"], function(cb) {
  exec(`cd ../client && npm run build`, function(err) {
    if (err) {
      console.log("build-client\n" + err);
      return cb(err);
    }
    cb();
  });
});
// 打包
gulp.task("tar", ["build-client"], function(cb) {
  shell.cp("-fR", "../server/app", "./export/app");
  shell.cp("-fR", "../server/config", "./export/config");
  shell.cp("-fR", "../server/.env", "./export/.env");
  shell.cp("-fR", "../server/app.js", "./export/app.js");
  shell.cp("-fR", "../server/package.json", "./export/package.json");
  shell.cp("-fR", "../client/dist/*", "./export/app/public");
  shell.cp("-fR", "./node_modules", "./export/node_modules");
  shell.exec(`tar -czf ${tarName} export/* .[!.]* --exclude export/.svn`);
  // shell.exec(`tar -czf export-ssh export/* .[!.]* --exclude export/.svn`);
  cb();
});


// 部署到远程服务器
gulp.task('rmSSH', function (cb) {
  gulpSSH.shell(remotServer.rm)
  cb();
})
gulp.task('uploadSSH', function (cb) {
  gulp.src('./export-ssh.tar.gz')
  .pipe(gulpSSH.dest(remotServer.dir))
})

// 目前tarSSH存在问题
gulp.task('tarSSH', function (cb) {
  gulpSSH.shell(remotServer.tar)
  cb();
})
gulp.task('operaSSH', function (cb) {
  gulpSSH.shell(remotServer.shell)
  cb();
})

// 默认命令
gulp.task("default", ["tar"], () => {
  console.log("end");
});
