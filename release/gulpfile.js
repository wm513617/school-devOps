const gulp = require("gulp");
const exec = require("child_process").exec;
const path = require("path");
const shell = require("shelljs");

const tarName = path.join(__dirname, `devops-${new Date().getTime()}.tar.gz`);

// 清除和创建相关文件夹
gulp.task("clean:server", function(cb) {
  shell.rm("-rf", "server");
  shell.rm("-rf", "./devops-*");
  shell.mkdir('-p', './server');
  cb();
});
// build client
gulp.task("build:client", ["clean:server"], function(cb) {
  exec(`cd ../client && yarn build`, function(err) {
    if (err) {
      console.log("build-client\n" + err);
      return cb(err);
    }
    cb();
  });
});
// 打包
gulp.task("tar:server", ["build:client"], function(cb) {
  shell.cp("-fR", "../server/app", "./server/app");
  shell.cp("-fR", "../server/config", "./server/config");
  shell.cp("-fR", "../server/.env", "./server/.env");
  shell.cp("-fR", "../server/app.js", "./server/app.js");
  shell.cp("-fR", "../server/package.json", "./server/package.json");
  shell.cp("-fR", "../server/node_modules", "./server/node_modules");
  shell.cp("-fR", "../client/dist/*", "./server/app/public");
  shell.exec(`tar -czf ${tarName} server/* .[!.]* --exclude server/.svn`);
  cb();
});

// 默认命令
gulp.task("default", ["tar:server"], () => {
  console.log("end");
});
