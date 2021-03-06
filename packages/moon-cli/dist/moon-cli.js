/**
 * Moon CLI v1.0.0-beta.2
 * Copyright 2016-2019 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */
(function () {
	'use strict';

	var fs = require("fs");

	var path = require("path");

	var https = require("https");

	var exec = require("child_process").exec;

	var name = process.argv[2];
	var repo = process.argv[3] || "kbrsh/moon-template";
	var archive = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/" + repo + "/tarball/master",
		headers: {
			"User-Agent": "Node.js"
		}
	};
	var MoonNameRE = /{# MoonName #}/g;

	var log = function log(type, message) {
		console.log("\x1B[34m" + type + "\x1B[0m " + message);
	};

	var download = function download(res) {
		var archivePath = path.join(__dirname, "moon-template.tar.gz");
		var stream = fs.createWriteStream(archivePath);
		res.on("data", function (chunk) {
			stream.write(chunk);
		});
		res.on("end", function () {
			stream.end();
			log("download", "template");
			install(archivePath);
		});
	};

	var install = function install(archivePath) {
		var targetPath = path.join(process.cwd(), name);
		exec("mkdir " + targetPath, function (err) {
			if (err) throw err;
		});
		exec("tar -xzf " + archivePath + " -C " + targetPath + " --strip=1", function (err) {
			if (err) throw err;
			log("install", "template");
			clean(archivePath, targetPath);
		});
	};

	var clean = function clean(archivePath, targetPath) {
		fs.unlink(archivePath, function (err) {
			if (err) throw err;
			log("clean", "template");
			create(targetPath, targetPath);
			log("success", "Generated project \"" + name + "\"");
			console.log("To start, run:\n\tcd " + name + "\n\tnpm install\n\tnpm run dev");
		});
	};

	var create = function create(currentPath, targetPath) {
		var files = fs.readdirSync(currentPath);

		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var nextPath = path.join(currentPath, file);

			if (fs.statSync(nextPath).isDirectory()) {
				create(nextPath, targetPath);
			} else {
				fs.writeFileSync(nextPath, fs.readFileSync(nextPath).toString().replace(MoonNameRE, name));
				log("create", path.relative(targetPath, nextPath));
			}
		}
	};

	https.get(archive, function (res) {
		if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location !== undefined) {
			https.get(res.headers.location, function (redirectRes) {
				download(redirectRes);
			});
		} else {
			download(res);
		}
	});

}());
